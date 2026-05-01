import { BadRequestException, ForbiddenException, HttpException, HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type {
  ToolCallStatus,
  ToolCallTriggerSource,
  ToolMethod,
} from '@aiaget/shared-types';

import { traceHeaders, type TraceContext } from '../common/tracing/trace-context';
import type { AuthenticatedUser } from '../common/types/request-context';
import { PrismaService } from '../prisma/prisma.service';
import { evaluateSecurityPolicies, type PolicyLike } from '../security-policies/security-policy-evaluator';
import { isPlainObject, validateValueAgainstSchema } from '../tools/tool-schema';

const TOOL_GATEWAY_RATE_LIMIT_PER_MINUTE = numberFromEnv('TOOL_GATEWAY_RATE_LIMIT_PER_MINUTE', 120);
const TOOL_GATEWAY_MAX_RETRIES = numberFromEnv('TOOL_GATEWAY_MAX_RETRIES', 1);
const TOOL_GATEWAY_MAX_RESPONSE_CHARS = numberFromEnv('TOOL_GATEWAY_MAX_RESPONSE_CHARS', 20000);

const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

type ToolGatewayToolRecord = Prisma.ToolGetPayload<object>;
export type ToolGatewayCallLogRecord = Prisma.ToolCallLogGetPayload<{
  include: {
    operator: true;
    approvalRequest: true;
  };
}>;

export interface ToolGatewayExecutionContext {
  triggerSource: ToolCallTriggerSource;
  agentId?: string | null;
  conversationId?: string | null;
  traceContext?: TraceContext | null;
  requireApproval?: boolean | null;
}

export interface ToolGatewayExecutionResult {
  tool: ToolGatewayToolRecord;
  callLog: ToolGatewayCallLogRecord;
  approvalRequired: boolean;
  gateway: {
    backend: 'CONTROL_API_GATEWAY';
    attempts: number;
    rate_limit_per_minute: number;
    retry_enabled: boolean;
  };
}

interface PreparedToolRequest {
  body: Record<string, unknown> | null;
  headers: Record<string, string>;
  method: ToolMethod;
  serializedBody?: string;
  url: string;
}

interface ToolGatewayAttemptResult {
  responseStatus: number | null;
  responseHeaders: Record<string, string> | null;
  responseBody: unknown;
  status: ToolCallStatus;
  errorMessage: string | null;
  retryable: boolean;
}

@Injectable()
export class ToolGatewayService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async execute(
    currentUser: AuthenticatedUser,
    toolId: string,
    input: Record<string, unknown>,
    context: ToolGatewayExecutionContext,
  ): Promise<ToolGatewayExecutionResult> {
    const tool = await this.findTool(currentUser.tenantId, toolId);

    if (tool.status !== 'ACTIVE') {
      throw new BadRequestException('Only active tools can be executed');
    }

    if (!isPlainObject(input)) {
      throw new BadRequestException('input must be a JSON object');
    }

    this.validateInput(tool, input);
    const preparedRequest = this.prepareRequest(tool, input);

    await this.enforceSecurityPolicies(currentUser, tool, preparedRequest, context);

    if (!consumeRateLimit(currentUser.tenantId, tool.id)) {
      await this.createFailedCallLog(
        currentUser,
        tool,
        preparedRequest,
        context,
        'Tool Gateway rate limit exceeded',
        HttpStatus.TOO_MANY_REQUESTS,
      );
      throw new HttpException('Tool Gateway rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
    }

    if (requiresApproval(tool, context)) {
      const callLog = await this.createApprovalPlaceholder(currentUser, tool, preparedRequest, context);
      return this.wrapResult(tool, callLog, true, 0);
    }

    const execution = await this.runPreparedRequest(currentUser, tool, preparedRequest, context);
    return this.wrapResult(tool, execution.callLog, false, execution.attempts);
  }

  async executeApprovalRequest(
    currentUser: AuthenticatedUser,
    approvalRequestId: string,
  ): Promise<ToolGatewayExecutionResult> {
    const approvalRequest = await this.prisma.toolApprovalRequest.findFirst({
      where: {
        tenantId: currentUser.tenantId,
        id: approvalRequestId,
      },
      include: {
        tool: true,
        toolCallLog: {
          include: {
            operator: true,
            approvalRequest: true,
          },
        },
      },
    });

    if (!approvalRequest) {
      throw new NotFoundException('Tool approval request not found');
    }

    if (approvalRequest.status !== 'PENDING') {
      throw new BadRequestException('Only pending approval requests can be executed');
    }

    if (approvalRequest.tool.status !== 'ACTIVE') {
      throw new BadRequestException('Only active tools can be executed after approval');
    }

    const preparedRequest = {
      body: (approvalRequest.toolCallLog.requestBody as Record<string, unknown> | null) ?? null,
      headers: normalizeStringRecord(approvalRequest.toolCallLog.requestHeaders, 'request_headers') ?? {},
      method: approvalRequest.toolCallLog.requestMethod as ToolMethod,
      serializedBody: approvalRequest.toolCallLog.requestBody
        ? JSON.stringify(approvalRequest.toolCallLog.requestBody)
        : undefined,
      url: approvalRequest.toolCallLog.requestUrl,
    };
    const context: ToolGatewayExecutionContext = {
      triggerSource: approvalRequest.triggerSource as ToolCallTriggerSource,
      agentId: approvalRequest.agentId,
      conversationId: approvalRequest.conversationId,
      traceContext: readTraceContextFromLoggedHeaders(preparedRequest.headers) ?? traceContextFromUser(currentUser),
      requireApproval: false,
    };

    await this.enforceSecurityPolicies(currentUser, approvalRequest.tool, preparedRequest, {
      ...context,
      requireApproval: false,
    });

    if (!consumeRateLimit(currentUser.tenantId, approvalRequest.tool.id)) {
      const callLog = await this.updateFailedCallLog(
        currentUser,
        approvalRequest.tool,
        preparedRequest,
        approvalRequest.toolCallLog.id,
        context,
        'Tool Gateway rate limit exceeded',
        HttpStatus.TOO_MANY_REQUESTS,
      );
      throw new HttpException(`Tool Gateway rate limit exceeded; call_log_id=${callLog.id}`, HttpStatus.TOO_MANY_REQUESTS);
    }

    const execution = await this.runPreparedRequest(
      currentUser,
      approvalRequest.tool,
      preparedRequest,
      context,
      approvalRequest.toolCallLog.id,
    );

    return this.wrapResult(approvalRequest.tool, execution.callLog, false, execution.attempts);
  }

  private async findTool(tenantId: string, id: string): Promise<ToolGatewayToolRecord> {
    const tool = await this.prisma.tool.findFirst({
      where: {
        tenantId,
        id,
        deletedAt: null,
      },
    });

    if (!tool) {
      throw new NotFoundException('Tool not found');
    }

    return tool;
  }

  private validateInput(tool: ToolGatewayToolRecord, input: Record<string, unknown>) {
    if (tool.inputSchema && isPlainObject(tool.inputSchema)) {
      const validationErrors = validateValueAgainstSchema(input, tool.inputSchema as Record<string, unknown>);
      if (validationErrors.length > 0) {
        throw new BadRequestException(validationErrors.join('; '));
      }
    }
  }

  private prepareRequest(tool: ToolGatewayToolRecord, input: Record<string, unknown>): PreparedToolRequest {
    const url = new URL(tool.url);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new BadRequestException('Only HTTP and HTTPS tools are supported');
    }

    const headers = normalizeStringRecord(tool.headers, 'headers') ?? {};
    let body: Record<string, unknown> | null = null;

    if (tool.method === 'GET' || tool.method === 'DELETE') {
      for (const [key, value] of Object.entries(input)) {
        if (value === undefined || value === null) continue;
        url.searchParams.set(key, stringifyQueryValue(value));
      }
    } else {
      body = input;
      if (!('content-type' in lowerCaseKeyMap(headers))) {
        headers['content-type'] = 'application/json';
      }
    }

    this.applyAuth(tool.authType, tool.authConfig, headers, url);

    return {
      body,
      headers,
      method: tool.method as ToolMethod,
      serializedBody: body ? JSON.stringify(body) : undefined,
      url: url.toString(),
    };
  }

  private async enforceSecurityPolicies(
    currentUser: AuthenticatedUser,
    tool: ToolGatewayToolRecord,
    preparedRequest: PreparedToolRequest,
    context: ToolGatewayExecutionContext,
  ) {
    const policies = await this.prisma.securityPolicy.findMany({
      where: {
        tenantId: currentUser.tenantId,
        status: 'ACTIVE',
        deletedAt: null,
      },
      orderBy: [
        {
          priority: 'desc',
        },
        {
          effect: 'desc',
        },
      ],
    });

    if (policies.length === 0) return;

    const url = new URL(preparedRequest.url);
    const subject = buildSubject(currentUser);
    const resource = {
      id: tool.id,
      type: 'tool',
      resource_type: 'TOOL',
      code: tool.code,
      name: tool.name,
      method: preparedRequest.method,
      risk_level: tool.riskLevel,
      require_approval: tool.requireApproval,
      url_host: url.host,
      url_protocol: url.protocol.replace(':', ''),
    };
    const contextPayload = {
      trigger_source: context.triggerSource,
      agent_id: context.agentId ?? null,
      conversation_id: context.conversationId ?? null,
      request_id: context.traceContext?.requestId ?? currentUser.requestId ?? null,
      trace_id: context.traceContext?.traceId ?? currentUser.traceId ?? null,
      approval_required: requiresApproval(tool, context),
      timeout_ms: tool.timeoutMs,
      rate_limit_per_minute: TOOL_GATEWAY_RATE_LIMIT_PER_MINUTE,
    };
    const action = 'tool:call:execute';
    const result = evaluateSecurityPolicies(policies.map(toPolicyLike), {
      subject,
      resource,
      action,
      actionAliases: [action, 'execute', 'tool:execute', 'tool:call'],
      context: contextPayload,
    });

    await this.prisma.securityPolicyEvaluation.create({
      data: {
        tenantId: currentUser.tenantId,
        requestId: context.traceContext?.requestId ?? currentUser.requestId ?? 'unknown',
        traceId: context.traceContext?.traceId ?? currentUser.traceId ?? null,
        subject: subject as Prisma.InputJsonObject,
        resource: resource as Prisma.InputJsonObject,
        action,
        decision: result.decision,
        matchedPolicyId: result.matchedPolicy?.id ?? null,
        matchedPolicyCode: result.matchedPolicy?.code ?? null,
        reason: result.reason,
        context: contextPayload as Prisma.InputJsonObject,
        createdBy: currentUser.id,
      },
    });

    if (result.decision === 'DENY') {
      await this.createFailedCallLog(
        currentUser,
        tool,
        preparedRequest,
        context,
        `Tool Gateway security policy denied: ${result.reason}`,
        HttpStatus.FORBIDDEN,
      );
      throw new ForbiddenException('Tool Gateway security policy denied');
    }
  }

  private async createApprovalPlaceholder(
    currentUser: AuthenticatedUser,
    tool: ToolGatewayToolRecord,
    preparedRequest: PreparedToolRequest,
    context: ToolGatewayExecutionContext,
  ): Promise<ToolGatewayCallLogRecord> {
    const requestHeaders = withTraceHeaders(preparedRequest.headers, context.traceContext);
    const callLog: ToolGatewayCallLogRecord = await this.prisma.toolCallLog.create({
      data: {
        tenantId: currentUser.tenantId,
        toolId: tool.id,
        triggerSource: context.triggerSource,
        status: 'APPROVAL_REQUIRED',
        requestUrl: preparedRequest.url,
        requestMethod: preparedRequest.method,
        requestHeaders: toJsonInput(requestHeaders),
        requestBody: toJsonInput(preparedRequest.body),
        latencyMs: 0,
        errorMessage: '工具调用已进入 Tool Gateway 审批队列，等待人工审批。',
        createdBy: currentUser.id,
      },
      include: {
        operator: true,
        approvalRequest: true,
      },
    });

    const approvalRequest = await this.prisma.toolApprovalRequest.create({
      data: {
        tenantId: currentUser.tenantId,
        toolId: tool.id,
        toolCallLogId: callLog.id,
        agentId: context.agentId ?? null,
        conversationId: context.conversationId ?? null,
        triggerSource: context.triggerSource,
        status: 'PENDING',
        reason: tool.riskLevel === 'HIGH'
          ? '高风险工具调用需要人工审批后才能执行。'
          : '工具绑定策略要求人工审批后才能执行。',
        requestedBy: currentUser.id,
      },
    });

    return {
      ...callLog,
      approvalRequest,
    };
  }

  private async runPreparedRequest(
    currentUser: AuthenticatedUser,
    tool: ToolGatewayToolRecord,
    preparedRequest: PreparedToolRequest,
    context: ToolGatewayExecutionContext,
    existingCallLogId?: string,
  ): Promise<{ callLog: ToolGatewayCallLogRecord; attempts: number }> {
    const startedAt = Date.now();
    const requestHeaders = withTraceHeaders(preparedRequest.headers, context.traceContext);
    const maxAttempts = maxAttemptsFor(preparedRequest.method);
    let attempts = 0;
    let lastResult: ToolGatewayAttemptResult | null = null;

    while (attempts < maxAttempts) {
      attempts += 1;
      lastResult = await this.runHttpAttempt(tool, preparedRequest, requestHeaders);

      if (!lastResult.retryable || attempts >= maxAttempts) {
        break;
      }
    }

    const result = lastResult ?? {
      responseStatus: null,
      responseHeaders: null,
      responseBody: Prisma.JsonNull,
      status: 'FAILED' as const,
      errorMessage: 'Tool Gateway did not execute an HTTP attempt',
      retryable: false,
    };
    const latencyMs = Date.now() - startedAt;
    const data = {
      status: result.status,
      requestUrl: preparedRequest.url,
      requestMethod: preparedRequest.method,
      requestHeaders: toJsonInput(requestHeaders),
      requestBody: toJsonInput(preparedRequest.body),
      responseStatus: result.responseStatus,
      responseHeaders: result.responseHeaders ? toJsonInput(result.responseHeaders) : Prisma.JsonNull,
      responseBody: toJsonInput(result.responseBody),
      latencyMs,
      errorMessage: result.errorMessage,
      createdBy: currentUser.id,
    };

    if (existingCallLogId) {
      const callLog = await this.prisma.toolCallLog.update({
        where: {
          id: existingCallLogId,
        },
        data,
        include: {
          operator: true,
          approvalRequest: true,
        },
      });
      return { callLog, attempts };
    }

    const callLog = await this.prisma.toolCallLog.create({
      data: {
        tenantId: currentUser.tenantId,
        toolId: tool.id,
        triggerSource: context.triggerSource,
        ...data,
      },
      include: {
        operator: true,
        approvalRequest: true,
      },
    });
    return { callLog, attempts };
  }

  private async runHttpAttempt(
    tool: ToolGatewayToolRecord,
    preparedRequest: PreparedToolRequest,
    requestHeaders: Record<string, string>,
  ): Promise<ToolGatewayAttemptResult> {
    try {
      const response = await fetch(preparedRequest.url, {
        method: preparedRequest.method,
        headers: requestHeaders,
        body: preparedRequest.serializedBody,
        signal: AbortSignal.timeout(tool.timeoutMs),
      });
      const responseHeaders = toHeaderRecord(response.headers);
      const responseBody = await parseResponseBody(response, TOOL_GATEWAY_MAX_RESPONSE_CHARS);
      let status: ToolCallStatus = response.ok ? 'SUCCESS' : 'FAILED';
      let errorMessage: string | null = response.ok ? null : `HTTP ${response.status}`;

      if (response.ok && tool.outputSchema && isPlainObject(tool.outputSchema)) {
        const outputErrors = validateValueAgainstSchema(
          responseBody,
          tool.outputSchema as Record<string, unknown>,
        );

        if (outputErrors.length > 0) {
          status = 'FAILED';
          errorMessage = outputErrors.join('; ');
        }
      }

      return {
        responseStatus: response.status,
        responseHeaders,
        responseBody,
        status,
        errorMessage,
        retryable: preparedRequest.method === 'GET' && response.status >= 500,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Tool request failed';
      return {
        responseStatus: null,
        responseHeaders: null,
        responseBody: Prisma.JsonNull,
        status: 'FAILED',
        errorMessage: message,
        retryable: preparedRequest.method === 'GET',
      };
    }
  }

  private async createFailedCallLog(
    currentUser: AuthenticatedUser,
    tool: ToolGatewayToolRecord,
    preparedRequest: PreparedToolRequest,
    context: ToolGatewayExecutionContext,
    errorMessage: string,
    responseStatus: number | null,
  ) {
    return this.prisma.toolCallLog.create({
      data: {
        tenantId: currentUser.tenantId,
        toolId: tool.id,
        triggerSource: context.triggerSource,
        status: 'FAILED',
        requestUrl: preparedRequest.url,
        requestMethod: preparedRequest.method,
        requestHeaders: toJsonInput(withTraceHeaders(preparedRequest.headers, context.traceContext)),
        requestBody: toJsonInput(preparedRequest.body),
        responseStatus,
        responseHeaders: Prisma.JsonNull,
        responseBody: Prisma.JsonNull,
        latencyMs: 0,
        errorMessage,
        createdBy: currentUser.id,
      },
    });
  }

  private async updateFailedCallLog(
    currentUser: AuthenticatedUser,
    tool: ToolGatewayToolRecord,
    preparedRequest: PreparedToolRequest,
    existingCallLogId: string,
    context: ToolGatewayExecutionContext,
    errorMessage: string,
    responseStatus: number | null,
  ) {
    return this.prisma.toolCallLog.update({
      where: {
        id: existingCallLogId,
      },
      data: {
        status: 'FAILED',
        requestUrl: preparedRequest.url,
        requestMethod: preparedRequest.method,
        requestHeaders: toJsonInput(withTraceHeaders(preparedRequest.headers, context.traceContext)),
        requestBody: toJsonInput(preparedRequest.body),
        responseStatus,
        responseHeaders: Prisma.JsonNull,
        responseBody: Prisma.JsonNull,
        latencyMs: 0,
        errorMessage,
        createdBy: currentUser.id,
      },
      include: {
        operator: true,
        approvalRequest: true,
      },
    });
  }

  private applyAuth(
    authType: string,
    authConfig: Prisma.JsonValue,
    headers: Record<string, string>,
    url: URL,
  ) {
    const config = isPlainObject(authConfig) ? authConfig : null;
    if (!config || authType === 'NONE') return;

    if (authType === 'BEARER') {
      const token = stringValue(config.token);
      if (!token) throw new BadRequestException('auth_config.token is required for BEARER tools');
      headers.authorization = `Bearer ${token}`;
      return;
    }

    if (authType === 'API_KEY_HEADER') {
      const headerName = stringValue(config.header_name);
      const key = stringValue(config.key);
      if (!headerName || !key) {
        throw new BadRequestException('auth_config.header_name and auth_config.key are required for API_KEY_HEADER tools');
      }
      headers[headerName] = key;
      return;
    }

    if (authType === 'API_KEY_QUERY') {
      const paramName = stringValue(config.param_name);
      const key = stringValue(config.key);
      if (!paramName || !key) {
        throw new BadRequestException('auth_config.param_name and auth_config.key are required for API_KEY_QUERY tools');
      }
      url.searchParams.set(paramName, key);
      return;
    }

    if (authType === 'BASIC') {
      const username = stringValue(config.username);
      const password = stringValue(config.password);
      if (!username || !password) {
        throw new BadRequestException('auth_config.username and auth_config.password are required for BASIC tools');
      }
      headers.authorization = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
    }
  }

  private wrapResult(
    tool: ToolGatewayToolRecord,
    callLog: ToolGatewayCallLogRecord,
    approvalRequired: boolean,
    attempts: number,
  ): ToolGatewayExecutionResult {
    return {
      tool,
      callLog,
      approvalRequired,
      gateway: {
        backend: 'CONTROL_API_GATEWAY',
        attempts,
        rate_limit_per_minute: TOOL_GATEWAY_RATE_LIMIT_PER_MINUTE,
        retry_enabled: TOOL_GATEWAY_MAX_RETRIES > 0,
      },
    };
  }
}

function requiresApproval(tool: ToolGatewayToolRecord, context: ToolGatewayExecutionContext) {
  return tool.riskLevel === 'HIGH' || tool.requireApproval || context.requireApproval === true;
}

function consumeRateLimit(tenantId: string, toolId: string) {
  if (TOOL_GATEWAY_RATE_LIMIT_PER_MINUTE <= 0) return true;

  const now = Date.now();
  const key = `${tenantId}:${toolId}`;
  const current = rateLimitBuckets.get(key);

  if (!current || current.resetAt <= now) {
    rateLimitBuckets.set(key, {
      count: 1,
      resetAt: now + 60_000,
    });
    return true;
  }

  if (current.count >= TOOL_GATEWAY_RATE_LIMIT_PER_MINUTE) {
    return false;
  }

  current.count += 1;
  return true;
}

function maxAttemptsFor(method: ToolMethod) {
  if (method !== 'GET') return 1;
  return Math.max(1, TOOL_GATEWAY_MAX_RETRIES + 1);
}

function numberFromEnv(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function normalizeStringRecord(value: unknown, fieldName: string): Record<string, string> | null {
  if (value === undefined || value === null) return null;
  if (!isPlainObject(value)) {
    throw new BadRequestException(`${fieldName} must be a JSON object`);
  }

  const output: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry !== 'string') {
      throw new BadRequestException(`${fieldName}.${key} must be a string`);
    }
    output[key] = entry;
  }

  return output;
}

function toJsonInput(value: unknown): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined {
  if (value === undefined) return undefined;
  if (value === null) return Prisma.JsonNull;
  return value as Prisma.InputJsonValue;
}

function stringValue(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function toHeaderRecord(headers: Headers) {
  const output: Record<string, string> = {};
  headers.forEach((value, key) => {
    output[key] = value;
  });
  return output;
}

function withTraceHeaders(headers: Record<string, string>, traceContext?: TraceContext | null) {
  return traceContext
    ? {
        ...headers,
        ...traceHeaders(traceContext),
      }
    : headers;
}

function traceContextFromUser(currentUser: AuthenticatedUser): TraceContext | null {
  if (!currentUser.traceId || !currentUser.spanId || !currentUser.traceparent) {
    return null;
  }

  return {
    traceId: currentUser.traceId,
    spanId: currentUser.spanId,
    parentSpanId: currentUser.parentSpanId ?? null,
    traceparent: currentUser.traceparent,
    requestId: currentUser.requestId ?? null,
  };
}

function readTraceContextFromLoggedHeaders(headers: Record<string, string>): TraceContext | null {
  const traceId = headers['x-trace-id'];
  const spanId = headers['x-span-id'];
  const traceparent = headers.traceparent;
  if (!traceId || !spanId || !traceparent) return null;

  return {
    traceId,
    spanId,
    parentSpanId: headers['x-parent-span-id'] ?? null,
    traceparent,
    requestId: headers['x-request-id'] ?? null,
  };
}

async function parseResponseBody(response: Response, maxChars: number): Promise<Prisma.InputJsonValue | Prisma.JsonNullValueInput> {
  const contentType = response.headers.get('content-type') ?? '';
  const text = await response.text();

  if (text.length > maxChars) {
    return {
      truncated: true,
      content_type: contentType,
      preview: text.slice(0, maxChars),
      original_length: text.length,
    };
  }

  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(text) as Prisma.InputJsonValue;
    } catch {
      return Prisma.JsonNull;
    }
  }

  return text;
}

function stringifyQueryValue(value: unknown) {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  return JSON.stringify(value);
}

function lowerCaseKeyMap(headers: Record<string, string>) {
  return Object.fromEntries(Object.keys(headers).map((key) => [key.toLowerCase(), headers[key]]));
}

function buildSubject(user: AuthenticatedUser) {
  return {
    id: user.id,
    tenant_id: user.tenantId,
    department_id: user.departmentId ?? null,
    role_codes: user.roles,
    role_ids: user.roleIds ?? [],
    email: user.email,
  };
}

function toPolicyLike(policy: Prisma.SecurityPolicyGetPayload<object>): PolicyLike {
  return {
    id: policy.id,
    code: policy.code,
    name: policy.name,
    effect: policy.effect,
    resourceType: policy.resourceType,
    action: policy.action,
    priority: policy.priority,
    conditions: policy.conditions,
  };
}

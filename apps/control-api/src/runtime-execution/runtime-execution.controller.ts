import { Body, Controller, Inject, Post, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { RuntimeAgentTeamRunDto } from './dto/runtime-agent-team-run.dto';
import { RuntimeChannelReleaseAutomationDto } from './dto/runtime-channel-release-automation.dto';
import { RuntimeChannelReleaseSelfHealingDto } from './dto/runtime-channel-release-self-healing.dto';
import { RuntimeKnowledgeTaskDto } from './dto/runtime-knowledge-task.dto';
import { RuntimePluginHookExecutionDto } from './dto/runtime-plugin-hook-execution.dto';
import { RuntimePluginRollbackDto } from './dto/runtime-plugin-rollback.dto';
import { RuntimeRetrieveDto } from './dto/runtime-retrieve.dto';
import { RuntimeToolCallDto } from './dto/runtime-tool-call.dto';
import { RuntimeExecutionService } from './runtime-execution.service';
import { RuntimeInternalGuard } from './runtime-internal.guard';

@ApiTags('runtime-execution')
@Controller('runtime/internal')
@UseGuards(RuntimeInternalGuard)
export class RuntimeExecutionController {
  constructor(@Inject(RuntimeExecutionService) private readonly runtimeExecutionService: RuntimeExecutionService) {}

  @Post('knowledge/retrieve')
  @ApiOkResponse({ description: 'Runtime internal knowledge retrieval adapter' })
  async retrieve(@Body() dto: RuntimeRetrieveDto) {
    return this.runtimeExecutionService.retrieve(dto);
  }

  @Post('tools/call')
  @ApiOkResponse({ description: 'Runtime internal tool call adapter' })
  async callTool(@Body() dto: RuntimeToolCallDto) {
    return this.runtimeExecutionService.callTool(dto);
  }

  @Post('knowledge-tasks/run')
  @ApiOkResponse({ description: 'Runtime internal knowledge task execution adapter' })
  async runKnowledgeTask(@Body() dto: RuntimeKnowledgeTaskDto) {
    return this.runtimeExecutionService.runKnowledgeTask(dto);
  }

  @Post('agent-team-runs/run')
  @ApiOkResponse({ description: 'Runtime internal agent team run execution adapter' })
  async runAgentTeamRun(@Body() dto: RuntimeAgentTeamRunDto) {
    return this.runtimeExecutionService.runAgentTeamRun(dto);
  }

  @Post('channel-release-automation/run')
  @ApiOkResponse({ description: 'Runtime internal channel release automation execution adapter' })
  async runChannelReleaseAutomation(@Body() dto: RuntimeChannelReleaseAutomationDto) {
    return this.runtimeExecutionService.runChannelReleaseAutomation(dto);
  }

  @Post('channel-release-self-healing/run')
  @ApiOkResponse({ description: 'Runtime internal channel release self-healing execution adapter' })
  async runChannelReleaseSelfHealing(@Body() dto: RuntimeChannelReleaseSelfHealingDto) {
    return this.runtimeExecutionService.runChannelReleaseSelfHealing(dto);
  }

  @Post('plugin-rollbacks/run')
  @ApiOkResponse({ description: 'Runtime internal plugin rollback execution adapter' })
  async runPluginRollback(@Body() dto: RuntimePluginRollbackDto) {
    return this.runtimeExecutionService.runPluginRollback(dto);
  }

  @Post('plugin-hooks/run')
  @ApiOkResponse({ description: 'Runtime internal plugin hook execution adapter' })
  async runPluginHookExecution(@Body() dto: RuntimePluginHookExecutionDto) {
    return this.runtimeExecutionService.runPluginHookExecution(dto);
  }
}

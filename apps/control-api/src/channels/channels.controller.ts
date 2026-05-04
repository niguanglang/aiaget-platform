import { Body, Controller, Get, Inject, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import type {
  ChannelReleaseSchedulerOverview,
  ChannelReleaseSchedulerRunResult,
  ChannelReleaseAutomationOverview,
  ChannelReleaseGateOverview,
  ChannelReleasePipeline,
  ChannelReleaseReport,
  ChannelReleaseReportSnapshotCompareResult,
  ChannelReleaseReportSnapshotDetail,
  ChannelReleaseReportSnapshotOverview,
  ChannelReleaseSelfHealingOverview,
  ChannelRolloutGateOverview,
  ChannelPublishControl,
  ChannelSenderDeliveryDetail,
  ChannelSenderPolicy,
  ChannelSenderTaskOverview,
  ChannelSenderTaskRunResult,
  ListChannelSenderDeliveriesResult,
  PublishChannelListItem,
  PublishChannelOverview,
  RetryChannelSenderDeliveryResult,
} from '@aiaget/shared-types';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequireDataScope } from '../common/decorators/data-scope.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { RequireResourceAcl } from '../common/decorators/resource-acl.decorator';
import { DataScopeGuard } from '../common/guards/data-scope.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { ResourceAclGuard } from '../common/guards/resource-acl.guard';
import { SecurityPolicyGuard } from '../common/guards/security-policy.guard';
import type { AuthenticatedUser } from '../common/types/request-context';
import { ExternalChannelSenderService, type ListChannelSenderDeliveriesQuery } from '../external-api/external-channel-sender.service';
import { ChannelReleaseAutomationWorkflowService } from './channel-release-automation-workflow.service';
import { ChannelReleaseSchedulerService } from './channel-release-scheduler.service';
import { ChannelReleaseSelfHealingWorkflowService } from './channel-release-self-healing-workflow.service';
import { ChannelSenderTaskService } from './channel-sender-task.service';
import { ChannelsService } from './channels.service';
import { ChannelReleaseBatchDto } from './dto/channel-release-batch.dto';
import { ChannelPublishApprovalDto } from './dto/channel-publish-approval.dto';
import { UpdateChannelSenderPolicyDto } from './dto/update-channel-sender-policy.dto';
import { UpdateChannelPublishControlDto } from './dto/update-channel-publish-control.dto';
import { UpdateChannelRolloutDto } from './dto/update-channel-rollout.dto';
import { UpdateChannelReleaseAutomationDto } from './dto/update-channel-release-automation.dto';
import { UpdateChannelReleaseGateDto } from './dto/update-channel-release-gate.dto';
import { UpdateChannelReleaseSelfHealingDto } from './dto/update-channel-release-self-healing.dto';
import { UpdatePublishChannelDto } from './dto/update-publish-channel.dto';
import { UpsertPublishChannelDto } from './dto/upsert-publish-channel.dto';

@ApiTags('channels')
@ApiBearerAuth()
@Controller('channels')
@UseGuards(JwtAuthGuard, PermissionsGuard, DataScopeGuard, ResourceAclGuard, SecurityPolicyGuard)
export class ChannelsController {
  constructor(
    @Inject(ChannelsService) private readonly channelsService: ChannelsService,
    @Inject(ExternalChannelSenderService) private readonly channelSender: ExternalChannelSenderService,
    @Inject(ChannelSenderTaskService) private readonly channelSenderTasks: ChannelSenderTaskService,
    @Inject(ChannelReleaseAutomationWorkflowService) private readonly releaseAutomationWorkflow: ChannelReleaseAutomationWorkflowService,
    @Inject(ChannelReleaseSelfHealingWorkflowService) private readonly releaseSelfHealingWorkflow: ChannelReleaseSelfHealingWorkflowService,
    @Inject(ChannelReleaseSchedulerService) private readonly releaseScheduler: ChannelReleaseSchedulerService,
  ) {}

  @Get('overview')
  @Permissions('channel:publish:view')
  @ApiOkResponse({ description: 'Publish channel overview for current tenant' })
  async getOverview(@CurrentUser() currentUser: AuthenticatedUser): Promise<PublishChannelOverview> {
    return this.channelsService.getOverview(currentUser);
  }

  @Get('sender-deliveries')
  @Permissions('channel:publish:view')
  @ApiOkResponse({ description: 'List channel sender deliveries for the current tenant' })
  async listSenderDeliveries(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListChannelSenderDeliveriesQuery,
  ): Promise<ListChannelSenderDeliveriesResult> {
    return this.channelSender.listDeliveries(currentUser, query);
  }

  @Get('sender-deliveries/:deliveryId')
  @Permissions('channel:publish:view')
  @ApiOkResponse({ description: 'Get channel sender delivery detail' })
  async getSenderDelivery(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('deliveryId') deliveryId: string,
  ): Promise<ChannelSenderDeliveryDetail> {
    return this.channelSender.getDeliveryDetail(currentUser, deliveryId);
  }

  @Post('sender-deliveries/:deliveryId/retry')
  @Permissions('channel:publish:manage')
  @ApiOkResponse({ description: 'Retry a failed channel sender delivery' })
  async retrySenderDelivery(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('deliveryId') deliveryId: string,
  ): Promise<RetryChannelSenderDeliveryResult> {
    return this.channelSender.retryDelivery(currentUser, deliveryId);
  }

  @Get('sender-tasks/overview')
  @Permissions('channel:publish:view')
  @ApiOkResponse({ description: 'Get channel sender task overview' })
  async getSenderTaskOverview(@CurrentUser() currentUser: AuthenticatedUser): Promise<ChannelSenderTaskOverview> {
    return this.channelSenderTasks.getOverview(currentUser);
  }

  @Post('sender-tasks/run-auto-retry')
  @Permissions('channel:publish:manage')
  @ApiOkResponse({ description: 'Run channel sender auto retry task once' })
  async runSenderAutoRetry(@CurrentUser() currentUser: AuthenticatedUser): Promise<ChannelSenderTaskRunResult> {
    return this.channelSenderTasks.runAutoRetry(currentUser);
  }

  @Post('sender-tasks/run-cleanup')
  @Permissions('channel:publish:manage')
  @ApiOkResponse({ description: 'Run channel sender cleanup task once' })
  async runSenderCleanup(@CurrentUser() currentUser: AuthenticatedUser): Promise<ChannelSenderTaskRunResult> {
    return this.channelSenderTasks.runCleanup(currentUser);
  }

  @Get('release-scheduler/overview')
  @Permissions('channel:publish:view')
  @ApiOkResponse({ description: 'Get channel release scheduler overview' })
  async getReleaseSchedulerOverview(@CurrentUser() currentUser: AuthenticatedUser): Promise<ChannelReleaseSchedulerOverview> {
    return this.releaseScheduler.getOverview(currentUser.tenantId);
  }

  @Post('release-scheduler/run-once')
  @Permissions('channel:publish:deploy')
  @ApiOkResponse({ description: 'Run channel release scheduler once' })
  async runReleaseSchedulerOnce(@CurrentUser() currentUser: AuthenticatedUser): Promise<ChannelReleaseSchedulerRunResult> {
    return this.releaseScheduler.runOnce(currentUser.tenantId, currentUser.id);
  }

  @Get(':channelId/sender-policy')
  @Permissions('channel:publish:view')
  @RequireDataScope({ resourceType: 'CHANNEL', idParam: 'channelId' })
  @RequireResourceAcl({ resourceType: 'CHANNEL', idParam: 'channelId', permissionCode: 'channel:publish:view' })
  @ApiOkResponse({ description: 'Get channel sender delivery policy' })
  async getSenderPolicy(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('channelId') channelId: string,
  ): Promise<ChannelSenderPolicy> {
    return this.channelsService.getSenderPolicy(currentUser, channelId);
  }

  @Put(':channelId/sender-policy')
  @Permissions('channel:publish:manage')
  @RequireDataScope({ resourceType: 'CHANNEL', idParam: 'channelId' })
  @RequireResourceAcl({ resourceType: 'CHANNEL', idParam: 'channelId', permissionCode: 'channel:publish:manage' })
  @ApiOkResponse({ description: 'Update channel sender delivery policy' })
  async updateSenderPolicy(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('channelId') channelId: string,
    @Body() dto: UpdateChannelSenderPolicyDto,
  ): Promise<ChannelSenderPolicy> {
    return this.channelsService.updateSenderPolicy(currentUser, channelId, dto);
  }

  @Get(':channelId/publish-control')
  @Permissions('channel:publish:view')
  @RequireDataScope({ resourceType: 'CHANNEL', idParam: 'channelId' })
  @RequireResourceAcl({ resourceType: 'CHANNEL', idParam: 'channelId', permissionCode: 'channel:publish:view' })
  @ApiOkResponse({ description: 'Get channel publish approval and rollout control' })
  async getPublishControl(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('channelId') channelId: string,
  ): Promise<ChannelPublishControl> {
    return this.channelsService.getPublishControl(currentUser, channelId);
  }

  @Get(':channelId/rollout-gate/overview')
  @Permissions('channel:publish:view')
  @RequireDataScope({ resourceType: 'CHANNEL', idParam: 'channelId' })
  @RequireResourceAcl({ resourceType: 'CHANNEL', idParam: 'channelId', permissionCode: 'channel:publish:view' })
  @ApiOkResponse({ description: 'Get channel rollout gate execution overview' })
  async getRolloutGateOverview(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('channelId') channelId: string,
  ): Promise<ChannelRolloutGateOverview> {
    return this.channelsService.getRolloutGateOverview(currentUser, channelId);
  }

  @Get(':channelId/release-pipeline')
  @Permissions('channel:publish:view')
  @RequireDataScope({ resourceType: 'CHANNEL', idParam: 'channelId' })
  @RequireResourceAcl({ resourceType: 'CHANNEL', idParam: 'channelId', permissionCode: 'channel:publish:view' })
  @ApiOkResponse({ description: 'Get channel release batch pipeline' })
  async getReleasePipeline(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('channelId') channelId: string,
  ): Promise<ChannelReleasePipeline> {
    return this.channelsService.getReleasePipeline(currentUser, channelId);
  }

  @Get(':channelId/release-report')
  @Permissions('channel:publish:view')
  @RequireDataScope({ resourceType: 'CHANNEL', idParam: 'channelId' })
  @RequireResourceAcl({ resourceType: 'CHANNEL', idParam: 'channelId', permissionCode: 'channel:publish:view' })
  @ApiOkResponse({ description: 'Get channel release postmortem and change report' })
  async getReleaseReport(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('channelId') channelId: string,
  ): Promise<ChannelReleaseReport> {
    return this.channelsService.getReleaseReport(currentUser, channelId);
  }

  @Get(':channelId/release-report/snapshots')
  @Permissions('channel:publish:view')
  @RequireDataScope({ resourceType: 'CHANNEL', idParam: 'channelId' })
  @RequireResourceAcl({ resourceType: 'CHANNEL', idParam: 'channelId', permissionCode: 'channel:publish:view' })
  @ApiOkResponse({ description: 'List channel release report snapshots' })
  async listReleaseReportSnapshots(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('channelId') channelId: string,
  ): Promise<ChannelReleaseReportSnapshotOverview> {
    return this.channelsService.listReleaseReportSnapshots(currentUser, channelId);
  }

  @Post(':channelId/release-report/snapshots')
  @Permissions('channel:publish:manage')
  @RequireDataScope({ resourceType: 'CHANNEL', idParam: 'channelId' })
  @RequireResourceAcl({ resourceType: 'CHANNEL', idParam: 'channelId', permissionCode: 'channel:publish:manage' })
  @ApiOkResponse({ description: 'Create a channel release report snapshot' })
  async createReleaseReportSnapshot(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('channelId') channelId: string,
  ): Promise<ChannelReleaseReportSnapshotDetail> {
    return this.channelsService.createReleaseReportSnapshot(currentUser, channelId);
  }

  @Get(':channelId/release-report/snapshots/:snapshotId')
  @Permissions('channel:publish:view')
  @RequireDataScope({ resourceType: 'CHANNEL', idParam: 'channelId' })
  @RequireResourceAcl({ resourceType: 'CHANNEL', idParam: 'channelId', permissionCode: 'channel:publish:view' })
  @ApiOkResponse({ description: 'Get a channel release report snapshot' })
  async getReleaseReportSnapshot(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('channelId') channelId: string,
    @Param('snapshotId') snapshotId: string,
  ): Promise<ChannelReleaseReportSnapshotDetail> {
    return this.channelsService.getReleaseReportSnapshot(currentUser, channelId, snapshotId);
  }

  @Get(':channelId/release-report/snapshots/:baseSnapshotId/compare/:targetSnapshotId')
  @Permissions('channel:publish:view')
  @RequireDataScope({ resourceType: 'CHANNEL', idParam: 'channelId' })
  @RequireResourceAcl({ resourceType: 'CHANNEL', idParam: 'channelId', permissionCode: 'channel:publish:view' })
  @ApiOkResponse({ description: 'Compare two channel release report snapshots' })
  async compareReleaseReportSnapshots(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('channelId') channelId: string,
    @Param('baseSnapshotId') baseSnapshotId: string,
    @Param('targetSnapshotId') targetSnapshotId: string,
  ): Promise<ChannelReleaseReportSnapshotCompareResult> {
    return this.channelsService.compareReleaseReportSnapshots(currentUser, channelId, baseSnapshotId, targetSnapshotId);
  }

  @Post(':channelId/release-pipeline/start')
  @Permissions('channel:publish:manage')
  @RequireDataScope({ resourceType: 'CHANNEL', idParam: 'channelId' })
  @RequireResourceAcl({ resourceType: 'CHANNEL', idParam: 'channelId', permissionCode: 'channel:publish:manage' })
  @ApiOkResponse({ description: 'Start a channel release batch' })
  async startReleaseBatch(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('channelId') channelId: string,
    @Body() dto: ChannelReleaseBatchDto,
  ): Promise<ChannelReleasePipeline> {
    return this.channelsService.startReleaseBatch(currentUser, channelId, dto);
  }

  @Post(':channelId/release-pipeline/mark-full')
  @Permissions('channel:publish:deploy')
  @RequireDataScope({ resourceType: 'CHANNEL', idParam: 'channelId' })
  @RequireResourceAcl({ resourceType: 'CHANNEL', idParam: 'channelId', permissionCode: 'channel:publish:deploy' })
  @ApiOkResponse({ description: 'Mark a channel release batch as full rollout' })
  async markReleaseFull(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('channelId') channelId: string,
    @Body() dto: ChannelReleaseBatchDto,
  ): Promise<ChannelReleasePipeline> {
    return this.channelsService.markReleaseFull(currentUser, channelId, dto);
  }

  @Post(':channelId/release-pipeline/abort')
  @Permissions('channel:publish:disable')
  @RequireDataScope({ resourceType: 'CHANNEL', idParam: 'channelId' })
  @RequireResourceAcl({ resourceType: 'CHANNEL', idParam: 'channelId', permissionCode: 'channel:publish:disable' })
  @ApiOkResponse({ description: 'Abort a channel release batch' })
  async abortReleaseBatch(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('channelId') channelId: string,
    @Body() dto: ChannelReleaseBatchDto,
  ): Promise<ChannelReleasePipeline> {
    return this.channelsService.abortReleaseBatch(currentUser, channelId, dto);
  }

  @Get(':channelId/release-gate')
  @Permissions('channel:publish:view')
  @RequireDataScope({ resourceType: 'CHANNEL', idParam: 'channelId' })
  @RequireResourceAcl({ resourceType: 'CHANNEL', idParam: 'channelId', permissionCode: 'channel:publish:view' })
  @ApiOkResponse({ description: 'Get channel release observation gate overview' })
  async getReleaseGate(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('channelId') channelId: string,
  ): Promise<ChannelReleaseGateOverview> {
    return this.channelsService.getReleaseGate(currentUser, channelId);
  }

  @Put(':channelId/release-gate')
  @Permissions('channel:publish:manage')
  @RequireDataScope({ resourceType: 'CHANNEL', idParam: 'channelId' })
  @RequireResourceAcl({ resourceType: 'CHANNEL', idParam: 'channelId', permissionCode: 'channel:publish:manage' })
  @ApiOkResponse({ description: 'Update channel release observation gate policy' })
  async updateReleaseGate(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('channelId') channelId: string,
    @Body() dto: UpdateChannelReleaseGateDto,
  ): Promise<ChannelReleaseGateOverview> {
    return this.channelsService.updateReleaseGate(currentUser, channelId, dto);
  }

  @Post(':channelId/release-gate/evaluate')
  @Permissions('channel:publish:view')
  @RequireDataScope({ resourceType: 'CHANNEL', idParam: 'channelId' })
  @RequireResourceAcl({ resourceType: 'CHANNEL', idParam: 'channelId', permissionCode: 'channel:publish:view' })
  @ApiOkResponse({ description: 'Evaluate channel release observation gate once' })
  async evaluateReleaseGate(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('channelId') channelId: string,
  ): Promise<ChannelReleaseGateOverview> {
    return this.channelsService.evaluateReleaseGate(currentUser, channelId);
  }

  @Get(':channelId/release-automation')
  @Permissions('channel:publish:view')
  @RequireDataScope({ resourceType: 'CHANNEL', idParam: 'channelId' })
  @RequireResourceAcl({ resourceType: 'CHANNEL', idParam: 'channelId', permissionCode: 'channel:publish:view' })
  @ApiOkResponse({ description: 'Get channel release automation executor overview' })
  async getReleaseAutomation(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('channelId') channelId: string,
  ): Promise<ChannelReleaseAutomationOverview> {
    return this.releaseAutomationWorkflow.getOverview(currentUser, channelId);
  }

  @Put(':channelId/release-automation')
  @Permissions('channel:publish:manage')
  @RequireDataScope({ resourceType: 'CHANNEL', idParam: 'channelId' })
  @RequireResourceAcl({ resourceType: 'CHANNEL', idParam: 'channelId', permissionCode: 'channel:publish:manage' })
  @ApiOkResponse({ description: 'Update channel release automation executor policy' })
  async updateReleaseAutomation(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('channelId') channelId: string,
    @Body() dto: UpdateChannelReleaseAutomationDto,
  ): Promise<ChannelReleaseAutomationOverview> {
    return this.channelsService.updateReleaseAutomation(currentUser, channelId, dto);
  }

  @Post(':channelId/release-automation/run')
  @Permissions('channel:publish:deploy')
  @RequireDataScope({ resourceType: 'CHANNEL', idParam: 'channelId' })
  @RequireResourceAcl({ resourceType: 'CHANNEL', idParam: 'channelId', permissionCode: 'channel:publish:deploy' })
  @ApiOkResponse({ description: 'Run channel release automation executor once' })
  async runReleaseAutomation(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('channelId') channelId: string,
  ): Promise<ChannelReleaseAutomationOverview> {
    return this.releaseAutomationWorkflow.dispatch(currentUser, channelId);
  }

  @Get(':channelId/release-self-healing')
  @Permissions('channel:publish:view')
  @RequireDataScope({ resourceType: 'CHANNEL', idParam: 'channelId' })
  @RequireResourceAcl({ resourceType: 'CHANNEL', idParam: 'channelId', permissionCode: 'channel:publish:view' })
  @ApiOkResponse({ description: 'Get channel release self-healing overview' })
  async getReleaseSelfHealing(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('channelId') channelId: string,
  ): Promise<ChannelReleaseSelfHealingOverview> {
    return this.releaseSelfHealingWorkflow.getOverview(currentUser, channelId);
  }

  @Put(':channelId/release-self-healing')
  @Permissions('channel:publish:manage')
  @RequireDataScope({ resourceType: 'CHANNEL', idParam: 'channelId' })
  @RequireResourceAcl({ resourceType: 'CHANNEL', idParam: 'channelId', permissionCode: 'channel:publish:manage' })
  @ApiOkResponse({ description: 'Update channel release self-healing policy' })
  async updateReleaseSelfHealing(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('channelId') channelId: string,
    @Body() dto: UpdateChannelReleaseSelfHealingDto,
  ): Promise<ChannelReleaseSelfHealingOverview> {
    return this.channelsService.updateReleaseSelfHealing(currentUser, channelId, dto);
  }

  @Post(':channelId/release-self-healing/run')
  @Permissions('channel:publish:deploy')
  @RequireDataScope({ resourceType: 'CHANNEL', idParam: 'channelId' })
  @RequireResourceAcl({ resourceType: 'CHANNEL', idParam: 'channelId', permissionCode: 'channel:publish:deploy' })
  @ApiOkResponse({ description: 'Run channel release self-healing once' })
  async runReleaseSelfHealing(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('channelId') channelId: string,
  ): Promise<ChannelReleaseSelfHealingOverview> {
    return this.releaseSelfHealingWorkflow.dispatch(currentUser, channelId);
  }

  @Put(':channelId/publish-control')
  @Permissions('channel:publish:manage')
  @RequireDataScope({ resourceType: 'CHANNEL', idParam: 'channelId' })
  @RequireResourceAcl({ resourceType: 'CHANNEL', idParam: 'channelId', permissionCode: 'channel:publish:manage' })
  @ApiOkResponse({ description: 'Update channel publish approval control' })
  async updatePublishControl(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('channelId') channelId: string,
    @Body() dto: UpdateChannelPublishControlDto,
  ): Promise<ChannelPublishControl> {
    return this.channelsService.updatePublishControl(currentUser, channelId, dto);
  }

  @Post(':channelId/publish-control/request-approval')
  @Permissions('channel:publish:manage')
  @RequireDataScope({ resourceType: 'CHANNEL', idParam: 'channelId' })
  @RequireResourceAcl({ resourceType: 'CHANNEL', idParam: 'channelId', permissionCode: 'channel:publish:manage' })
  @ApiOkResponse({ description: 'Request channel publish approval' })
  async requestPublishApproval(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('channelId') channelId: string,
    @Body() dto: ChannelPublishApprovalDto,
  ): Promise<ChannelPublishControl> {
    return this.channelsService.requestPublishApproval(currentUser, channelId, dto);
  }

  @Post(':channelId/publish-control/approve')
  @Permissions('channel:publish:deploy')
  @RequireDataScope({ resourceType: 'CHANNEL', idParam: 'channelId' })
  @RequireResourceAcl({ resourceType: 'CHANNEL', idParam: 'channelId', permissionCode: 'channel:publish:deploy' })
  @ApiOkResponse({ description: 'Approve channel publish request' })
  async approvePublish(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('channelId') channelId: string,
    @Body() dto: ChannelPublishApprovalDto,
  ): Promise<ChannelPublishControl> {
    return this.channelsService.approvePublish(currentUser, channelId, dto);
  }

  @Post(':channelId/publish-control/reject')
  @Permissions('channel:publish:disable')
  @RequireDataScope({ resourceType: 'CHANNEL', idParam: 'channelId' })
  @RequireResourceAcl({ resourceType: 'CHANNEL', idParam: 'channelId', permissionCode: 'channel:publish:disable' })
  @ApiOkResponse({ description: 'Reject channel publish request' })
  async rejectPublish(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('channelId') channelId: string,
    @Body() dto: ChannelPublishApprovalDto,
  ): Promise<ChannelPublishControl> {
    return this.channelsService.rejectPublish(currentUser, channelId, dto);
  }

  @Post(':channelId/publish-control/rollout')
  @Permissions('channel:publish:manage')
  @RequireDataScope({ resourceType: 'CHANNEL', idParam: 'channelId' })
  @RequireResourceAcl({ resourceType: 'CHANNEL', idParam: 'channelId', permissionCode: 'channel:publish:manage' })
  @ApiOkResponse({ description: 'Update channel rollout percentage' })
  async updateRollout(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('channelId') channelId: string,
    @Body() dto: UpdateChannelRolloutDto,
  ): Promise<ChannelPublishControl> {
    return this.channelsService.updateRollout(currentUser, channelId, dto);
  }

  @Post(':channelId/publish-control/rollback')
  @Permissions('channel:publish:manage')
  @RequireDataScope({ resourceType: 'CHANNEL', idParam: 'channelId' })
  @RequireResourceAcl({ resourceType: 'CHANNEL', idParam: 'channelId', permissionCode: 'channel:publish:manage' })
  @ApiOkResponse({ description: 'Rollback channel publish control to last stable config' })
  async rollbackPublish(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('channelId') channelId: string,
    @Body() dto: ChannelPublishApprovalDto,
  ): Promise<ChannelPublishControl> {
    return this.channelsService.rollbackPublish(currentUser, channelId, dto);
  }

  @Post()
  @Permissions('channel:publish:manage')
  @ApiOkResponse({ description: 'Create or update agent publish channel by agent and channel type' })
  async upsert(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: UpsertPublishChannelDto,
  ): Promise<PublishChannelListItem> {
    return this.channelsService.upsert(currentUser, dto);
  }

  @Patch(':channelId')
  @Permissions('channel:publish:manage')
  @RequireDataScope({ resourceType: 'CHANNEL', idParam: 'channelId' })
  @RequireResourceAcl({ resourceType: 'CHANNEL', idParam: 'channelId', permissionCode: 'channel:publish:manage' })
  @ApiOkResponse({ description: 'Update publish channel config' })
  async update(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('channelId') channelId: string,
    @Body() dto: UpdatePublishChannelDto,
  ): Promise<PublishChannelListItem> {
    return this.channelsService.update(currentUser, channelId, dto);
  }

  @Post(':channelId/enable')
  @Permissions('channel:publish:deploy')
  @RequireDataScope({ resourceType: 'CHANNEL', idParam: 'channelId' })
  @RequireResourceAcl({ resourceType: 'CHANNEL', idParam: 'channelId', permissionCode: 'channel:publish:deploy' })
  @ApiOkResponse({ description: 'Enable publish channel' })
  async enable(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('channelId') channelId: string,
  ): Promise<PublishChannelListItem> {
    return this.channelsService.enable(currentUser, channelId);
  }

  @Post(':channelId/disable')
  @Permissions('channel:publish:disable')
  @RequireDataScope({ resourceType: 'CHANNEL', idParam: 'channelId' })
  @RequireResourceAcl({ resourceType: 'CHANNEL', idParam: 'channelId', permissionCode: 'channel:publish:disable' })
  @ApiOkResponse({ description: 'Disable publish channel' })
  async disable(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('channelId') channelId: string,
  ): Promise<PublishChannelListItem> {
    return this.channelsService.disable(currentUser, channelId);
  }

  @Post(':channelId/check')
  @Permissions('channel:publish:view')
  @RequireDataScope({ resourceType: 'CHANNEL', idParam: 'channelId' })
  @RequireResourceAcl({ resourceType: 'CHANNEL', idParam: 'channelId', permissionCode: 'channel:publish:view' })
  @ApiOkResponse({ description: 'Run publish channel configuration health check' })
  async check(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('channelId') channelId: string,
  ): Promise<PublishChannelListItem> {
    return this.channelsService.check(currentUser, channelId);
  }
}

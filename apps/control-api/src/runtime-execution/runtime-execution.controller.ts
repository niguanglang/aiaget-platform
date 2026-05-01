import { Body, Controller, Inject, Post, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { RuntimeKnowledgeTaskDto } from './dto/runtime-knowledge-task.dto';
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
}

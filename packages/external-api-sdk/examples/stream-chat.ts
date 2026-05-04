import { createAiagetExternalApiClient } from '@aiaget/external-api-sdk';

const baseUrl = process.env.AIAGET_BASE_URL ?? 'http://localhost:3001/api/v1';
const apiKey = process.env.AIAGET_API_KEY;
const agentId = process.env.AIAGET_AGENT_ID;

if (!apiKey || !agentId) {
  throw new Error('请设置 AIAGET_API_KEY 和 AIAGET_AGENT_ID。');
}

const client = createAiagetExternalApiClient({
  baseUrl,
  apiKey,
});

const stream = await client.streamChat(agentId, {
  message: '请流式总结今天的运行异常',
  title: 'SDK 流式示例调用',
}, {
  onDelta: (delta) => process.stdout.write(delta),
  onDone: (result) => {
    console.log('\n会话：', result.conversation_id);
    console.log('Trace：', result.trace_id);
  },
});

if (!stream.result) {
  throw new Error('流式调用没有返回最终结果。');
}

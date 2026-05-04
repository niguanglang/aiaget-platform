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

const result = await client.chat(agentId, {
  message: '请总结今天的运行异常',
  title: 'SDK 示例调用',
});

console.log('回答：', result.answer);
console.log('会话：', result.conversation_id);
console.log('Trace：', result.trace_id);

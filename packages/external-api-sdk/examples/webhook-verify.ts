import { verifyAiagetWebhookSignature } from '@aiaget/external-api-sdk';

const secret = process.env.AIAGET_WEBHOOK_SECRET;
const timestamp = process.env.AIAGET_WEBHOOK_TIMESTAMP;
const signature = process.env.AIAGET_WEBHOOK_SIGNATURE;
const body = process.env.AIAGET_WEBHOOK_BODY ?? '{"event":"conversation.completed"}';

if (!secret || !timestamp || !signature) {
  throw new Error('请设置 AIAGET_WEBHOOK_SECRET、AIAGET_WEBHOOK_TIMESTAMP 和 AIAGET_WEBHOOK_SIGNATURE。');
}

const isValid = await verifyAiagetWebhookSignature({
  secret,
  timestamp,
  signature,
  body,
});

console.log(isValid ? 'Webhook 签名有效' : 'Webhook 签名无效');

import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

function getEncryptionKey() {
  return createHash('sha256')
    .update(process.env.MODEL_KEY_ENCRYPTION_SECRET ?? process.env.JWT_ACCESS_TOKEN_SECRET ?? 'dev-model-key-secret')
    .digest();
}

export function encryptSecret(secret: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

export function decryptSecret(payload: string) {
  const [ivBase64, tagBase64, encryptedBase64] = payload.split(':');

  if (!ivBase64 || !tagBase64 || !encryptedBase64) {
    throw new Error('Invalid encrypted secret payload');
  }

  const iv = Buffer.from(ivBase64, 'base64');
  const tag = Buffer.from(tagBase64, 'base64');
  const encrypted = Buffer.from(encryptedBase64, 'base64');
  const decipher = createDecipheriv('aes-256-gcm', getEncryptionKey(), iv);

  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

export function hashSecret(secret: string) {
  return createHash('sha256').update(secret).digest('hex');
}

export function getKeyPrefix(secret: string) {
  return secret.slice(0, Math.min(8, secret.length));
}

export function maskApiKey(secret: string) {
  if (secret.length <= 10) {
    return `${secret.slice(0, 2)}****${secret.slice(-2)}`;
  }

  return `${secret.slice(0, 6)}****${secret.slice(-4)}`;
}

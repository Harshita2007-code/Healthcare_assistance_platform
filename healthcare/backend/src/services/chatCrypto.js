import { randomBytes, createCipheriv, createDecipheriv } from 'node:crypto';
export function encryptChat(data, hexKey, userId) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', Buffer.from(hexKey,'hex'), iv);
  cipher.setAAD(Buffer.from(String(userId)));
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(data), 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), ciphertext].map(b=>b.toString('base64')).join('.');
}
export function decryptChat(payload, hexKey, userId) {
  const [iv, tag, data] = payload.split('.').map(s=>Buffer.from(s,'base64'));
  const decipher = createDecipheriv('aes-256-gcm', Buffer.from(hexKey,'hex'), iv);
  decipher.setAAD(Buffer.from(String(userId)));
  decipher.setAuthTag(tag);
  return JSON.parse(Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8'));
}

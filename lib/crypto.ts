import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

// Klucz szyfrowania haseł SMTP. Zmiana klucza = zapisane hasła trzeba wpisać ponownie.
function key() {
  const secret = process.env.MAIL_SECRET_KEY || process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("Brak MAIL_SECRET_KEY / NEXTAUTH_SECRET – nie można szyfrować haseł SMTP");
  return createHash("sha256").update(secret).digest();
}

/** AES-256-GCM → "iv.tag.ciphertext" (base64) */
export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), enc].map((b) => b.toString("base64")).join(".");
}

export function decryptSecret(payload: string): string {
  const [iv, tag, enc] = payload.split(".").map((p) => Buffer.from(p, "base64"));
  const decipher = createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}

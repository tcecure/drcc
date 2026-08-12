import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

import { readServerEnv } from "@/lib/validation/env";

export type EncryptedCredential = {
  encryptedPassword: string;
  initializationVector: string;
  authTag: string;
};

function getEncryptionKey() {
  const { LAB_CREDENTIAL_ENCRYPTION_KEY } = readServerEnv();

  if (!LAB_CREDENTIAL_ENCRYPTION_KEY) {
    throw new Error("LAB_CREDENTIAL_ENCRYPTION_KEY is not configured.");
  }

  const key = Buffer.from(LAB_CREDENTIAL_ENCRYPTION_KEY, "base64");

  if (key.length !== 32) {
    throw new Error("LAB_CREDENTIAL_ENCRYPTION_KEY must be a 32-byte base64 value.");
  }

  return key;
}

export function encryptLabPassword(password: string): EncryptedCredential {
  const initializationVector = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), initializationVector);
  const encrypted = Buffer.concat([
    cipher.update(password, "utf8"),
    cipher.final(),
  ]);

  return {
    encryptedPassword: encrypted.toString("base64"),
    initializationVector: initializationVector.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
  };
}

export function decryptLabPassword(credential: EncryptedCredential) {
  const decipher = createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(credential.initializationVector, "base64"),
  );
  decipher.setAuthTag(Buffer.from(credential.authTag, "base64"));

  return Buffer.concat([
    decipher.update(Buffer.from(credential.encryptedPassword, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

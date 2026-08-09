import "server-only";

import { createHash, createHmac } from "node:crypto";

import type { DigitalRccEnv } from "@/lib/validation/env";

type SesMessage = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export async function sendSesEmail(env: DigitalRccEnv, message: SesMessage) {
  if (!env.AWS_REGION || !env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY || !env.SES_FROM_ADDRESS) {
    throw new Error("AWS SES live delivery is missing AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, or SES_FROM_ADDRESS.");
  }

  const body = JSON.stringify({
    FromEmailAddress: env.SES_FROM_ADDRESS,
    Destination: {
      ToAddresses: [message.to],
    },
    ReplyToAddresses: env.SES_REPLY_TO_ADDRESS ? [env.SES_REPLY_TO_ADDRESS] : undefined,
    Content: {
      Simple: {
        Subject: {
          Data: message.subject,
          Charset: "UTF-8",
        },
        Body: {
          Text: {
            Data: message.text,
            Charset: "UTF-8",
          },
          Html: {
            Data: message.html,
            Charset: "UTF-8",
          },
        },
      },
    },
  });
  const endpoint = `https://email.${env.AWS_REGION}.amazonaws.com/v2/email/outbound-emails`;
  const headers = signedHeaders({
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    region: env.AWS_REGION,
    service: "ses",
    method: "POST",
    url: endpoint,
    body,
  });
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      ...headers,
      "content-type": "application/json",
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`AWS SES send failed with ${response.status}: ${await response.text()}`);
  }
}

function signedHeaders({
  accessKeyId,
  secretAccessKey,
  region,
  service,
  method,
  url,
  body,
}: {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  service: string;
  method: string;
  url: string;
  body: string;
}) {
  const parsedUrl = new URL(url);
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = sha256(body);
  const canonicalHeaders = `host:${parsedUrl.host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
  const signedHeaderNames = "host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = [
    method,
    parsedUrl.pathname,
    parsedUrl.searchParams.toString(),
    canonicalHeaders,
    signedHeaderNames,
    payloadHash,
  ].join("\n");
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256(canonicalRequest),
  ].join("\n");
  const signature = hmacHex(signingKey(secretAccessKey, dateStamp, region, service), stringToSign);

  return {
    authorization: `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaderNames}, Signature=${signature}`,
    host: parsedUrl.host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
  };
}

function sha256(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function hmac(key: string | Buffer, value: string) {
  return createHmac("sha256", key).update(value, "utf8").digest();
}

function hmacHex(key: string | Buffer, value: string) {
  return createHmac("sha256", key).update(value, "utf8").digest("hex");
}

function signingKey(secretAccessKey: string, dateStamp: string, region: string, service: string) {
  const dateKey = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const regionKey = hmac(dateKey, region);
  const serviceKey = hmac(regionKey, service);
  return hmac(serviceKey, "aws4_request");
}

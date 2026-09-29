// Generates a VAPID key pair for Web Push (P-256), printed as env lines.
import { webcrypto } from "node:crypto";

const b64url = (buf) =>
  Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const { publicKey, privateKey } = await webcrypto.subtle.generateKey(
  { name: "ECDSA", namedCurve: "P-256" },
  true,
  ["sign"],
);
const pub = await webcrypto.subtle.exportKey("raw", publicKey);
const jwk = await webcrypto.subtle.exportKey("jwk", privateKey);

console.log("# Next.js (.env.local / Vercel)");
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${b64url(pub)}`);
console.log("\n# Supabase Edge Function secrets (supabase secrets set ...)");
console.log(`VAPID_PUBLIC_KEY=${b64url(pub)}`);
console.log(`VAPID_PRIVATE_KEY=${jwk.d}`);
console.log("VAPID_SUBJECT=mailto:hello@motionwithin.me");

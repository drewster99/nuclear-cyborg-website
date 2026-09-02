/**
 * Parses and verifies a Meta `signed_request` value (`<base64url-sig>.<base64url-payload>`).
 *
 * Returns the decoded payload object, or `null` when the value is malformed or
 * the HMAC-SHA256 signature does not match `appSecret`. When `appSecret` is
 * empty the payload is returned unverified so callbacks keep answering Meta
 * while the secret is still being provisioned; callers are expected to log
 * that condition.
 */
export async function parseMetaSignedRequest(signedRequest, appSecret) {
  const dot = signedRequest.indexOf(".");
  if (dot < 1) return null;
  const signaturePart = signedRequest.slice(0, dot);
  const payloadPart = signedRequest.slice(dot + 1);

  let payload;
  try {
    payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(payloadPart)));
  } catch (_) {
    return null;
  }

  if (appSecret) {
    if (payload.algorithm && String(payload.algorithm).toUpperCase() !== "HMAC-SHA256") {
      return null;
    }
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(appSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const signatureIsValid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlDecode(signaturePart),
      new TextEncoder().encode(payloadPart),
    );
    if (!signatureIsValid) return null;
  }
  return payload;
}

function base64UrlDecode(value) {
  let normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  while (normalized.length % 4) normalized += "=";
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

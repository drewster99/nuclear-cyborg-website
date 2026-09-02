/**
 * Meta callbacks for the Scheduler's Threads app.
 *
 * Meta POSTs `signed_request=<base64url-sig>.<base64url-payload>` to these URLs
 * when a user removes the app ("uninstall") or asks for their data to be
 * erased ("delete"). The Scheduler is local-first and keeps every token on the
 * user's own machine, so there is nothing to revoke or erase server-side. We
 * verify the signature when THREADS_APP_SECRET is configured and answer in the
 * shape Meta requires. The local app discovers a revoked token on its next API
 * call and flags the credential as needing re-auth.
 *
 * Cloudflare setup: `npx wrangler secret put THREADS_APP_SECRET`.
 */

import { parseMetaSignedRequest } from "./meta-signed-request.js";

export const THREADS_UNINSTALL_PATH = "/apps/scheduler/callback-threads-uninstall";
export const THREADS_DELETE_PATH = "/apps/scheduler/callback-threads-delete";
const DELETION_STATUS_PATH = "/apps/scheduler/threads-deletion-status";

export async function handleThreadsUninstall(request, env) {
  if (request.method === "GET") {
    return diagnosticResponse("Threads uninstall callback", env);
  }
  if (request.method !== "POST") return methodNotAllowed();

  const userId = await userIdFromSignedRequest(request, env);
  if (userId) console.log("Threads uninstall callback for user", userId);
  return jsonResponse({ status: "ok" });
}

export async function handleThreadsDelete(request, env) {
  if (request.method === "GET") {
    const statusUrl = new URL(DELETION_STATUS_PATH, request.url).toString();
    return diagnosticResponse("Threads data-deletion callback", env, `User-facing status page: ${statusUrl}\n`);
  }
  if (request.method !== "POST") return methodNotAllowed();

  const userId = (await userIdFromSignedRequest(request, env)) || "unknown";
  const confirmationCode = crypto.randomUUID();
  const origin = new URL(request.url).origin;
  const statusUrl =
    `${origin}${DELETION_STATUS_PATH}?id=${encodeURIComponent(userId)}&code=${encodeURIComponent(confirmationCode)}`;
  console.log("Threads data-deletion callback for user", userId, "code", confirmationCode);
  return jsonResponse({ url: statusUrl, confirmation_code: confirmationCode });
}

/* Meta retries on non-2xx, so a malformed body still yields a null user rather
 * than an error response; there is nothing to act on either way. */
async function userIdFromSignedRequest(request, env) {
  if (!env.THREADS_APP_SECRET) {
    console.warn("THREADS_APP_SECRET is not configured; Meta signed_request signatures are not being verified");
  }
  try {
    const form = await request.formData();
    const signedRequest = form.get("signed_request");
    if (typeof signedRequest !== "string") return null;
    const payload = await parseMetaSignedRequest(signedRequest, env.THREADS_APP_SECRET);
    if (!payload) return null;
    const userId = payload.user_id || payload.user || null;
    return userId ? String(userId) : null;
  } catch (_) {
    return null;
  }
}

/* Browsable so a deploy can be confirmed and the secret's presence checked.
 * (It only checks the secret is present, not that it matches Meta.) */
function diagnosticResponse(title, env, extraLines = "") {
  const secretState = env.THREADS_APP_SECRET ? "configured" : "NOT configured";
  return new Response(
    `${title} — accepts POSTs from Meta only.\n`
      + `Signing secret (THREADS_APP_SECRET): ${secretState}.\n`
      + extraLines,
    { status: 200, headers: { "content-type": "text/plain; charset=utf-8" } },
  );
}

function jsonResponse(body) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

function methodNotAllowed() {
  return new Response("Method not allowed", { status: 405, headers: { allow: "GET, POST" } });
}

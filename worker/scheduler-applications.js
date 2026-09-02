/**
 * Stores "Get started" applications submitted from the Scheduler landing page.
 *
 * Submissions land in the D1 database bound as SCHEDULER_APPLICATIONS_DB
 * (schema in db/migrations). One application per email address; a repeat
 * submission is answered with 409 rather than stored twice.
 *
 * The endpoint is public and writes personal data, so it is gated twice before
 * it touches the database: a per-IP rate limit (APPLY_RATE_LIMITER) sheds
 * floods, and a Cloudflare Turnstile token proves a browser is behind the
 * request. Both are required — a missing binding or secret fails the request
 * rather than waving it through.
 *
 * Cloudflare setup: `npx wrangler secret put TURNSTILE_SECRET`.
 */

import {
  COUNTRIES,
  NOT_ON_PLATFORM,
  PLATFORMS,
  TEXT_LIMITS,
  isPlausibleEmailAddress,
  isPlausiblePhoneNumber,
} from "../apps/scheduler/application-form-options.js";

export const APPLY_PATH = "/apps/scheduler/apply";

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/* Rate-limit bucket for requests that arrive without a client IP. They share
 * one counter deliberately: unattributable traffic is throttled together
 * rather than each getting a fresh allowance. */
const UNATTRIBUTED_CLIENT_KEY = "no-client-ip";

const COUNTRY_CODES = new Set(COUNTRIES.map(([code]) => code));

export async function handleSchedulerApplication(request, env) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: { allow: "POST" } });
  }

  const database = env.SCHEDULER_APPLICATIONS_DB;
  if (!database) {
    console.error("SCHEDULER_APPLICATIONS_DB binding is missing; cannot store application");
    return jsonResponse(500, { error: "Application storage is not configured. Please email support@nuclearcyborg.com." });
  }

  const rateLimiter = env.APPLY_RATE_LIMITER;
  if (!rateLimiter) {
    console.error("APPLY_RATE_LIMITER binding is missing; refusing to accept applications unthrottled");
    return jsonResponse(500, { error: "Applications are temporarily unavailable. Please email support@nuclearcyborg.com." });
  }
  if (!env.TURNSTILE_SECRET) {
    console.error("TURNSTILE_SECRET is not configured; refusing to accept applications unverified");
    return jsonResponse(500, { error: "Applications are temporarily unavailable. Please email support@nuclearcyborg.com." });
  }

  const clientAddress = request.headers.get("cf-connecting-ip");
  const { success: withinRateLimit } = await rateLimiter.limit({ key: clientAddress || UNATTRIBUTED_CLIENT_KEY });
  if (!withinRateLimit) {
    return jsonResponse(429, { error: "Too many attempts. Please wait a minute and try again." });
  }

  let body;
  try {
    body = await request.json();
  } catch (_) {
    return jsonResponse(400, { error: "Request body must be JSON." });
  }

  const validation = validateApplication(body);
  if (!validation.ok) {
    return jsonResponse(400, { error: validation.error });
  }
  const application = validation.application;

  /* Last gate before the write: the token is single-use and short-lived, so it
   * is spent only once the answers themselves are known to be good. */
  const challengePassed = await turnstileTokenIsValid(application.turnstileToken, env.TURNSTILE_SECRET, clientAddress);
  if (!challengePassed) {
    return jsonResponse(403, { error: "We couldn't verify that you're human. Please try the challenge again." });
  }

  const id = crypto.randomUUID();
  const submittedAt = new Date().toISOString();
  const requestCountry = request.cf && request.cf.country ? String(request.cf.country) : null;

  const statements = [
    database
      .prepare(
        `INSERT INTO scheduler_applications
           (id, submitted_at, first_name, last_name, company, email, phone, country_code,
            comments, user_agent, request_country)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)`,
      )
      .bind(
        id,
        submittedAt,
        application.firstName,
        application.lastName,
        application.company,
        application.email,
        application.phone,
        application.countryCode,
        application.comments,
        request.headers.get("user-agent"),
        requestCountry,
      ),
    ...application.platforms.map((platform) =>
      database
        .prepare(
          `INSERT INTO scheduler_application_platforms (application_id, platform, followers, handle)
           VALUES (?1, ?2, ?3, ?4)`,
        )
        .bind(id, platform.id, platform.followers, platform.handle),
    ),
  ];

  try {
    await database.batch(statements);
  } catch (error) {
    if (String(error && error.message).includes("UNIQUE constraint failed")) {
      return jsonResponse(409, { error: "We already have an application for that email address." });
    }
    console.error("Failed to store scheduler application", error);
    return jsonResponse(500, { error: "We couldn't save your application. Please try again." });
  }

  /* The id is enough to find the row; the applicant's email stays out of the logs. */
  console.log("Stored scheduler application", id);
  return jsonResponse(201, { id });
}

/**
 * Checks a submitted body field by field and returns either the normalized
 * application or the first problem found, phrased for the person filling in
 * the form.
 */
function validateApplication(body) {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Request body must be a JSON object." };
  }

  const firstName = requiredText(body.firstName, "First name", TEXT_LIMITS.name);
  if (firstName.error) return { ok: false, error: firstName.error };
  const lastName = requiredText(body.lastName, "Last name", TEXT_LIMITS.name);
  if (lastName.error) return { ok: false, error: lastName.error };
  const company = optionalText(body.company, "Company", TEXT_LIMITS.company);
  if (company.error) return { ok: false, error: company.error };

  const email = requiredText(body.email, "Email address", TEXT_LIMITS.email);
  if (email.error) return { ok: false, error: email.error };
  if (!isPlausibleEmailAddress(email.value)) {
    return { ok: false, error: "Email address doesn't look valid." };
  }

  const phone = requiredText(body.phone, "Phone number", TEXT_LIMITS.phone);
  if (phone.error) return { ok: false, error: phone.error };
  if (!isPlausiblePhoneNumber(phone.value)) {
    return { ok: false, error: "Phone number doesn't look valid." };
  }

  if (typeof body.countryCode !== "string" || !COUNTRY_CODES.has(body.countryCode)) {
    return { ok: false, error: "Please choose a country." };
  }

  const comments = optionalText(body.comments, "Comments", TEXT_LIMITS.comments);
  if (comments.error) return { ok: false, error: comments.error };

  if (typeof body.turnstileToken !== "string" || body.turnstileToken === "") {
    return { ok: false, error: "Please complete the \"I'm not a robot\" challenge." };
  }

  const submittedPlatforms = body.platforms;
  if (!submittedPlatforms || typeof submittedPlatforms !== "object") {
    return { ok: false, error: "Follower counts are missing." };
  }
  const platforms = [];
  for (const platform of PLATFORMS) {
    const answer = submittedPlatforms[platform.id];
    if (!answer || typeof answer !== "object") {
      return { ok: false, error: `Please tell us about your ${platform.name} audience.` };
    }
    const allowedFollowers = platform.ranges.map((range) => range.value);
    if (answer.followers !== NOT_ON_PLATFORM && !allowedFollowers.includes(answer.followers)) {
      return { ok: false, error: `Please choose a follower count for ${platform.name}.` };
    }
    const handle = optionalText(answer.handle, `${platform.name} handle`, TEXT_LIMITS.handle);
    if (handle.error) return { ok: false, error: handle.error };
    platforms.push({
      id: platform.id,
      followers: answer.followers,
      handle: handle.value === null ? null : handle.value.replace(/^@+/, ""),
    });
  }

  return {
    ok: true,
    application: {
      firstName: firstName.value,
      lastName: lastName.value,
      company: company.value,
      email: email.value.toLowerCase(),
      phone: phone.value,
      countryCode: body.countryCode,
      comments: comments.value,
      turnstileToken: body.turnstileToken,
      platforms,
    },
  };
}

/**
 * Asks Cloudflare whether a Turnstile token is genuine, unexpired and unspent.
 * Anything other than an explicit success — including a siteverify outage —
 * fails the submission; this is the gate, so it does not fall open.
 */
async function turnstileTokenIsValid(token, secret, clientAddress) {
  /* siteverify documents form-urlencoded and JSON only, so don't hand it a
   * multipart body from FormData. */
  const form = new URLSearchParams();
  form.set("secret", secret);
  form.set("response", token);
  if (clientAddress) form.set("remoteip", clientAddress);

  let outcome;
  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: form,
    });
    if (!response.ok) {
      console.error("Turnstile siteverify returned HTTP", response.status);
      return false;
    }
    outcome = await response.json();
  } catch (error) {
    console.error("Turnstile siteverify could not be reached", error);
    return false;
  }

  if (outcome.success !== true) {
    console.warn("Turnstile rejected a submission", outcome["error-codes"]);
    return false;
  }
  return true;
}

function requiredText(value, label, maximumLength) {
  if (typeof value !== "string" || value.trim() === "") {
    return { error: `${label} is required.` };
  }
  const trimmed = value.trim();
  if (trimmed.length > maximumLength) {
    return { error: `${label} must be ${maximumLength} characters or fewer.` };
  }
  return { value: trimmed };
}

function optionalText(value, label, maximumLength) {
  if (value === undefined || value === null) return { value: null };
  if (typeof value !== "string") return { error: `${label} must be text.` };
  const trimmed = value.trim();
  if (trimmed === "") return { value: null };
  if (trimmed.length > maximumLength) {
    return { error: `${label} must be ${maximumLength} characters or fewer.` };
  }
  return { value: trimmed };
}

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

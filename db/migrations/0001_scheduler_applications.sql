-- "Get started" applications from the Scheduler landing page.
-- Applied with: npx wrangler d1 migrations apply scheduler-applications --remote

CREATE TABLE scheduler_applications (
    id              TEXT PRIMARY KEY,
    submitted_at    TEXT NOT NULL,
    first_name      TEXT NOT NULL,
    last_name       TEXT NOT NULL,
    company         TEXT,
    email           TEXT NOT NULL UNIQUE,
    phone           TEXT NOT NULL,
    country_code    TEXT NOT NULL,
    comments        TEXT,
    user_agent      TEXT,
    request_country TEXT,
    status          TEXT NOT NULL DEFAULT 'pending',
    reviewed_at     TEXT
);

CREATE TABLE scheduler_application_platforms (
    application_id  TEXT NOT NULL REFERENCES scheduler_applications(id) ON DELETE CASCADE,
    platform        TEXT NOT NULL,
    followers       TEXT NOT NULL,
    handle          TEXT,
    PRIMARY KEY (application_id, platform)
);

CREATE INDEX scheduler_applications_status_submitted
    ON scheduler_applications (status, submitted_at);

#!/bin/sh
# Prints every "Get started" application in the live database, newest first.
# Run from anywhere: db/list-applications.sh [--local]
set -e
cd "$(dirname "$0")/.."
location="--remote"
[ "$1" = "--local" ] && location="--local"
npx wrangler d1 execute scheduler-applications "$location" --command "
SELECT
    substr(a.submitted_at, 1, 16) AS submitted,
    a.first_name || ' ' || a.last_name AS name,
    a.email,
    a.company,
    a.phone,
    a.country_code AS country,
    a.status,
    (SELECT group_concat(platform || '=' || followers || CASE WHEN handle IS NULL THEN '' ELSE ' @' || handle END, ', ')
       FROM scheduler_application_platforms p WHERE p.application_id = a.id) AS platforms,
    a.comments
FROM scheduler_applications a
ORDER BY a.submitted_at DESC"

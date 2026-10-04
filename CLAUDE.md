# nuclearcyborg.com

Decisions made by Andrew (site owner). Follow them; change only with his explicit consent.

- **nuclearcyborgcorp.com redirects here:** the apex and www of nuclearcyborgcorp.com 301 to the same path and query on `https://nuclearcyborg.com`. Handled by `worker/corp-redirect.mjs` in its own Worker, `nuclear-cyborg-corp-redirect` (`wrangler.corp-redirect.jsonc`), not a dashboard rule. Deploy it by hand with `npx wrangler deploy --config wrangler.corp-redirect.jsonc`. Never list nuclearcyborgcorp.com hostnames in `wrangler.jsonc`, and keep any Workers Builds deploy command as plain `npx wrangler deploy`.

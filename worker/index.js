/**
 * Entry point for the nuclearcyborg.com Worker.
 *
 * The site is static; this script exists only for the handful of paths that
 * need code behind them. Everything else falls through to the asset bundle.
 * `run_worker_first` in wrangler.jsonc lists which paths reach this script
 * before the asset layer, so keep that list in step with the routes below.
 */

import { THREADS_DELETE_PATH, THREADS_UNINSTALL_PATH, handleThreadsDelete, handleThreadsUninstall } from "./threads-callbacks.js";
import { APPLY_PATH, handleSchedulerApplication } from "./scheduler-applications.js";

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    switch (pathname) {
      case THREADS_UNINSTALL_PATH:
        return handleThreadsUninstall(request, env);
      case THREADS_DELETE_PATH:
        return handleThreadsDelete(request, env);
      case APPLY_PATH:
        return handleSchedulerApplication(request, env);
      default:
        return env.ASSETS.fetch(request);
    }
  },
};

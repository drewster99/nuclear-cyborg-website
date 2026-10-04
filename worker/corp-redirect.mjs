const canonicalOrigin = 'https://nuclearcyborg.com';
const redirectedHostnames = new Set(['nuclearcyborgcorp.com', 'www.nuclearcyborgcorp.com']);

/**
 * Permanently redirects every request for nuclearcyborgcorp.com (apex and www) to the same path and
 * query on nuclearcyborg.com. This is its own Worker so the site Worker never has to match on host,
 * and so the alias domain can't serve anything except the redirect.
 */
export default {
  fetch(request) {
    const url = new URL(request.url);
    if (!redirectedHostnames.has(url.hostname)) {
      // Only the alias custom domains should reach this Worker; redirecting any other host could loop.
      return new Response(`Not served by this Worker: ${url.hostname}\n`, {status: 421});
    }
    return Response.redirect(`${canonicalOrigin}${url.pathname}${url.search}`, 301);
  },
};

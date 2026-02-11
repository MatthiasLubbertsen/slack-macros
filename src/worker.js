export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)

    // commands endpoint for frontend
    if (url.pathname === "/api/commands") {
      const data = await env.ASSETS.fetch(new URL("/commands.json", request.url));
      return data;
    }

    // frontend assets
    return env.ASSETS.fetch(request);
  }
}

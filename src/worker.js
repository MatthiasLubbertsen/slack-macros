import handleMacro from './macro.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)

    // commands endpoint for frontend
    if (url.pathname === "/api/json/commands") {
      const data = await env.ASSETS.fetch(new URL("/commands.json", request.url));
      return data;
    }

    // commands endpoint
    if (url.pathname === "/api/macro") {
      if (request.method !== "POST") {
        return new Response("Method not allowed", { status: 405 });
      }

      let response = await handleMacro(request, env, ctx);
      // Log useful details instead of an empty JSON object from Response
      const clone = response.clone();
      const body = await clone.text();
      return response;
    }

    // frontend assets
    return env.ASSETS.fetch(request);
  }
}

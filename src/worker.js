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
      return handleMacro(request, env, ctx);
    }

    // frontend assets
    return env.ASSETS.fetch(request);
  }
}

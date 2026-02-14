export default async function handleMacro(request, env, ctx) {
  // return new Response("Macro response");
  const body = await request.text(); // or request.formData()

  if (!env.GITHUB_TOKEN || !env.GITHUB_REPO) {
    return new Response("Missing GITHUB_TOKEN or GITHUB_REPO env vars", { status: 500 });
  }

  const filename = `macro-${Date.now()}.txt`;
  // Simple UTF-8 safe base64 encoding
  const content = btoa(unescape(encodeURIComponent(body)));

  const ghResponse = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/contents/${filename}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${env.GITHUB_TOKEN}`,
      "User-Agent": "Cloudflare-Worker",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: `New macro submission: ${filename}`,
      content: content,
    }),
  });

  if (!ghResponse.ok) {
    return new Response(`GitHub Error: ${await ghResponse.text()}`, { status: ghResponse.status });
  }

  return new Response(`Saved to ${env.GITHUB_REPO}/${filename}`);
}

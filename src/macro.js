import * as scripts from '../scripts/index.js';

export default async function handleMacro(request, env, ctx) {
  const text = await request.text();
  const formData = new URLSearchParams(text);
  const body = Object.fromEntries(formData);
  const macro = body.text;
  const macros = await env.ASSETS.fetch(new URL("/commands.json", request.url));
  console.log("Received macro:", body.text);

  async function sendResponseUserOnly(message) {
    await fetch(body.response_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        response_type: "ephemeral", text: `${message}`,
      }),
    });
  };

  async function sendResponseAsUser(message) {
    const userInfoResponse = await fetch(`https://slack.com/api/users.info?user=${body.user_id}`, {
      headers: {
        'Authorization': `Bearer ${env.SLACK_BOT_TOKEN}`,
      }
    });
    const userInfo = await userInfoResponse.json();
    const username = userInfo.user.profile.display_name || userInfo.user.name || body.user_name;
    const profileImage = userInfo.user.profile.image_72 || userInfo.user.profile.image_48 || userInfo.user.profile.image_192;

    await fetch("https://slack.com/api/chat.postMessage", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.SLACK_BOT_TOKEN}`,
      },
      body: JSON.stringify({
        channel: body.channel_id,
        text: `${message}`,
        icon_url: profileImage,
        username: username
      }),
    })
  };

  ctx.waitUntil((async () => {
    try {
      const macroJson = await macros.json();
      const matchedMacro = macroJson.commands.find(cmd => cmd.abbreviation === macro);
      
      if (!macro) {
        await sendResponseUserOnly(`Hey, see all macros on <https://slack-macros.matthiaslubbertsen.workers.dev|the website> and test one out! :smile-with-7-parenthesis-no-less-no-more:`);
      } else if (!matchedMacro) {
        await sendResponseUserOnly(`Unknown macro: ${macro}`);
        return;
      } 

      if (matchedMacro) {
        if (matchedMacro.script == null) {
          if (matchedMacro.respondAsUser) {
            await sendResponseAsUser(matchedMacro.respondAsUser);
          } else if (matchedMacro.respondUserOnly) {
            await sendResponseUserOnly(matchedMacro.respondUserOnly);
          }
        }
      }
    } catch (error) {
      await sendResponseUserOnly(`Unknown macro: ${macro}`);
      return;
    }
  })());

  return new Response("", { status: 200 });
};

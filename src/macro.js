import * as scripts from '../scripts/index.js';

export default async function handleMacro(request, env, ctx) {
  const text = await request.text();
  const formData = new URLSearchParams(text);
  const body = Object.fromEntries(formData);
  const macro = body.text;
  const macros = await env.ASSETS.fetch(new URL("/commands.json", request.url));
  console.log("Received macro:", (macro) ? body.text : "No macro received");

  async function sendResponseUserOnly(message) {
    await fetch(body.response_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        response_type: "ephemeral", text: `${message}`,
        mrkdwn: true
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
        username: username,
        mrkdwn: true
      }),
    })
  };

  ctx.waitUntil((async () => {
    try {
      const macroJson = await macros.json();
      const matchedMacro = macroJson.commands.find(cmd => cmd.abbreviation === macro);
      
      if (!macro) {
        const commandList = macroJson.commands
          .slice(0, 3)
          .map((cmd) => {
            const commandText = `\`/slam ${cmd.abbreviation}\``; // only this part in backticks
            const responseText = cmd.respondUserOnly || cmd.respondAsUser;
            return `* ${commandText}${responseText ? `: ${responseText}` : ''}`;
          })
          .join('\n');

        const message =
          `Hey, you did not enter a command, try one of these:\n` +
          `${commandList}\n` +
          `or others, see the full list <https://slack-macros.matthiaslubbertsen.workers.dev|here>!`;

        await sendResponseUserOnly(message);
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
        } else if (scripts[matchedMacro.script]) {
          const response = await scripts[matchedMacro.script](body, env);
          if (response.respondAsUser) {
            await sendResponseAsUser(response.respondAsUser);
          } else if (response.respondUserOnly) {
            await sendResponseUserOnly(response.respondUserOnly);
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

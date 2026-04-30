import * as functions from '../functions/index.js';

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
    // console.log(":51")
    const macroJson = await macros.json();
    const [macroKey, ...args] = (body.text || "").trim().split(/\s+/);
    try {
      // copilot: line 53, 56
      const matchedMacro = macroJson.commands.find(cmd => cmd.abbreviation === macroKey);
      const ackeeMacroName = matchedMacro ? matchedMacro.name : null;

        fetch("https://ackee.matthias.hackclub.app/api/record", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            siteId: env.ACKEE_SITE_ID,
            records: [
              {
                key: `macro_${ackeeMacroName || "unknown"}`,
                value: 1
              }
            ]
          })
        })
        .catch(error => console.error("Error sending Ackee analytics:", error));

        fetch("https://ackee.matthias.hackclub.app/api", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: `
              mutation createAction($eventId: ID!, $input: CreateActionInput!) {
                createAction(eventId: $eventId, input: $input) {
                  payload {
                    id
                  }
                }
              }
            `,
            variables: {
              eventId: env.ACKEE_EVENT_ID, // Use the specific Event ID here!
              input: {
                key: `${ackeeMacroName || "Macro Executed (unknown)"}`,
                value: 1
              }
            }
          })
        })
        .then(async (response) => {
          const text = await response.text();
          console.log(`Ackee Response Status: ${response.status}`, `Body: ${text}`);
        })
        .catch(error => console.error("Error sending Ackee analytics:", error));

      // console.log(":57", macroKey, args)
      const inputText = args.join(' ');
      // console.log(":69", inputText)
      // console.log("macroKey:", macroKey, "inputText:", inputText);

      if (!macroKey) { // no macro entered = list
        const commandList = macroJson.commands
          .slice(0, 3)
          .map((cmd) => {
            const commandText = `\`/slam ${cmd.abbreviation}\``; // only this part in backticks
            const responseText = cmd.respondUserOnly || cmd.respondAsUser;
            return `* ${commandText}${responseText ? `: ${responseText}` : ''}`;
          })
          .join('\n');

        const message =
          `Hey, you did not enter a macro, try one of these:\n` +
          `${commandList}\n` +
          `or others, see the full list <https://slack-macros.matthiaslubbertsen.workers.dev|here>!`;
        await sendResponseUserOnly(message);
      } else if (!matchedMacro) { // no macro found
        await sendResponseUserOnly(`Unknown macro: ${macroKey}`);
        return;
      }

      if (matchedMacro) {
        if (matchedMacro.function == null) {
          if (matchedMacro.respondAsUser) {
            await sendResponseAsUser(matchedMacro.respondAsUser);
          } else if (matchedMacro.respondUserOnly) {
            await sendResponseUserOnly(matchedMacro.respondUserOnly);
          }
        } else if (functions[matchedMacro.function]) {
          const response = await functions[matchedMacro.function](body, env, inputText);
          if (response.respondAsUser) {
            await sendResponseAsUser(response.respondAsUser);
          } else if (response.respondUserOnly) {
            await sendResponseUserOnly(response.respondUserOnly);
          }
        }
      }
    } catch (error) {
      await sendResponseUserOnly(`Unknown macro: ${macroKey}`);
      console.error("Error handling macro:", error);
      return;
    }
  })());

  return new Response("", { status: 200 });
};

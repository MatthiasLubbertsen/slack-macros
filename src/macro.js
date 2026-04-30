// copilot: switch from /commands to @mentions
import * as functions from '../functions/index.js';

export default async function handleMacro(request, env, ctx) {
  const contentType = request.headers.get("content-type") || "";
  let body = {};
  let macroText = "";
  let isSlashCommand = false;

  // 1. Handle JSON Payloads (Events API such as @handle)
  if (contentType.includes("application/json")) {
    body = await request.json();
    
    // Respond to Slack's URL verification challenge
    if (body.type === "url_verification") {
      return new Response(body.challenge, { status: 200 });
    }

    // Process app_mention events
    if (body.event && body.event.type === "app_mention") {
      // Clean up the @bot handle from the text
      macroText = body.event.text.replace(/<@U[a-zA-Z0-9]+>/g, '').trim();
    }
  } 
  // 2. Handle Form Data (Traditional Slash Commands)
  else {
    const text = await request.text();
    const formData = new URLSearchParams(text);
    body = Object.fromEntries(formData);
    macroText = body.text;
    isSlashCommand = true;
  }

  const macro = macroText;
  const macros = await env.ASSETS.fetch(new URL("/commands.json", request.url));
  console.log("Received macro:", macro || "No macro received");
  
  async function sendResponseUserOnly(message) {
    if (body.response_url) {
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
    } else if (body.event) {
      await fetch("https://slack.com/api/chat.postEphemeral", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.SLACK_BOT_TOKEN}`,
        },
        body: JSON.stringify({
          channel: body.event.channel,
          user: body.event.user,
          text: `${message}`,
          thread_ts: body.event.ts,
          mrkdwn: true
        }),
      });
    }
  };

  async function sendResponseAsUser(message) {
    const userId = body.user_id || (body.event && body.event.user);
    const channelId = body.channel_id || (body.event && body.event.channel);
    const threadTs = body.event && body.event.ts;
    const defaultName = body.user_name || "User";

    const userInfoResponse = await fetch(`https://slack.com/api/users.info?user=${userId}`, {
      headers: {
        'Authorization': `Bearer ${env.SLACK_BOT_TOKEN}`,
      }
    });
    const userInfo = await userInfoResponse.json();
    const username = userInfo.ok ? (userInfo.user.profile.display_name || userInfo.user.name) : defaultName;
    const profileImage = userInfo.ok ? (userInfo.user.profile.image_72 || userInfo.user.profile.image_48 || userInfo.user.profile.image_192) : "";

    const payload = {
      channel: channelId,
      text: `${message}`,
      icon_url: profileImage,
      username: username,
      mrkdwn: true
    };

    if (threadTs) {
      payload.thread_ts = threadTs;
    }

    await fetch("https://slack.com/api/chat.postMessage", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.SLACK_BOT_TOKEN}`,
      },
      body: JSON.stringify(payload),
    })
  };

  ctx.waitUntil((async () => {
    // console.log(":51")
    const macroJson = await macros.json();
    const [macroKey, ...args] = (macroText || "").trim().split(/\s+/);
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

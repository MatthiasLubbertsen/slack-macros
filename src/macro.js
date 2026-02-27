import * as scripts from '../scripts/index.js';

export default async function handleMacro(request, env, ctx) {
  const text = await request.text();
  const formData = new URLSearchParams(text);
  const body = Object.fromEntries(formData);
  const macro = body.text;
  const macros = await env.ASSETS.fetch(new URL("/commands.json", request.url));
  console.log("Received macro:", body.text);

  async function sendSlackResponseUserOnly(message) {
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

  async function sendSlackResponseAsUser(message) {
    const userInfoResponse = await fetch(`https://slack.com/api/users.info?user=${body.user_id}`, {
      headers: {
        'Authorization': `Bearer ${env.SLACK_BOT_TOKEN}`,
      }
    });
    const userInfo = await userInfoResponse.json();
    const username = userInfo.user.profile.display_name || userInfo.user.name || data.user_name;
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

  //Use ctx.waitUntil to keep the worker running after returning the response
  // ctx.waitUntil((async () => {
  //   if (!macro) {
  //     console.error("no macro")
  //     sendSlackResponseUO("You have not entered a macro you dumbass, please provide one.");
  //   } else {
  //     // copilot generated (but modified by me)
  //     const json = await macros.json();
  //     const command = json.commands.find(c => c.abbreviation === macro);
  //     if (command && command.script) {
  //       const script = scripts[command.abbreviation];
  //       if (script) {
  //         console.log(`Running script: ${command.script}`);
  //         await script(request, env, ctx);
  //         if (body.response_url) {
  //           sendSlackResponseUO(`Macro executed: ${macro}`);
  //         }
  //       } else {
  //         console.error(`Script not found: ${command.script}`);
  //         sendSlackResponseUO(`Script not found: ${command.script}`);
  //       }
  //     } else {
  //       console.log(`Command not found: ${macro}`);
  //       sendSlackResponseUO(`Command not found: ${macro}`);
  //     }
  //   }
  //   // end copilot generated
  // })());

  await sendSlackResponseAsUser("Macro processing complete. :) Macro: " + macro);
  await sendSlackResponseUserOnly("recieved macro: " + macro)

  return new Response("", { status: 200 });
};

// gives answer on the given input with HackAI
export default async function getAnswer(body, env, inputText) {

    if (!inputText) {
        return {
            respondAsUser: "please provide a message to get answer on. Usage: /slam ai [message]"
        };
    }

    try {
        const res = await fetch("https://ai.hackclub.com/proxy/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${env.AI_API_KEY}`
            },
            body: JSON.stringify({
                model: "bytedance-seed/seed-1.6-flash",
                messages: [
                {
                    role: "system", content: "You are a helpful assistant that answers questions and provides information on a wide range of topics. Provide clear and concise answers to the user's questions. If the question is ambiguous, ask for clarification. Always try to provide accurate and relevant information based on your training data up until September 2021. If you don't know the answer, say you don't know instead of making something up. You can't use normal Markdown, but use mrkdwn (Slack Markdown) for formatting."
                },
                {
                    role: "user", content: inputText
                }
            ]
            }),
        });
        const data = await res.json();
        // console.log("data", data)
        return {
            respondAsUser: `> ${inputText}\n\n ${data.choices[0].message.content}`
        };

    } catch (error) {
        console.error("Error calling AI API:", error);
        return {
            respondUserOnly: "Sorry, there was an error getting the answer. Please try again later."
        };
    }
}
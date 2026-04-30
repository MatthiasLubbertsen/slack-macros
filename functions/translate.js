// translates the message or word to English form every language with ai.hackclub.com
export default async function translate(body, env, inputText) {

    if (!inputText) {
        return {
            respondAsUser: "please provide a message to translate. Usage: /slam tl [message]"
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
                    role: "system", content: "You are a helpful assistant that translates any language to English. Only give back the translation, do not include any other text. If the message is already in English, just return the original message. If the message is a single word, just return the translated word without any additional text. Don't return explanations or apologies, just the translation. Always return the translation in English, no matter what language the input is in. If the message has informal punctation or slang, keep it that way in the translation. Don't change capital letters, keep them the same in the translation. Don't add punctuation if there is none in the original message, and if there is punctuation, keep it the same in the translation."
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
            respondAsUser: data.choices[0].message.content
        };

    } catch (error) {
        console.error("Error calling translation API:", error);
        return {
            respondUserOnly: "Sorry, there was an error translating your message. Please try again later."
        };
    }
}
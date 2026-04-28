// template for a function script
export default async function template(body, env, inputText) {

    if (!inputText) {
        return {
            respondUserOnly: "please provide arguments"
        };
    }

    try {
        return {
            respondAsUser: "input: " + "\"" + inputText + "\""
        };

    } catch (error) {
        console.error("Error:", error);
        return {
            respondUserOnly: "Sorry there was a error sending your input. Please try again later."
        };
    }
}
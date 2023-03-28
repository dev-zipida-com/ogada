function setConfiguration(message) {
    return {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: message,
            stream: true,
            temperature: 0.5,
        }),
    };
}

export async function talk(message) {
    const reader = await fetch(
        "https://api.openai.com/v1/chat/completions",
        setConfiguration(message)
    ).then((res) => res.body.getReader());

    if (reader === undefined) {
        throw new Error("reader is undefined");
    }

    let text = "";
    const decoder = new TextDecoder("utf-8");

    while (true) {
        const { done, value } = await reader.read();

        if (done) {
            text += "\n\n";
            break;
        }

        const decodedTextList = decoder.decode(value).split(`\n\n`);

        const data = decodedTextList.map((decodedText) => {
            if (decodedText.includes("data: ")) {
                const result = decodedText.split("data: ").at(1);
                if (
                    result !== undefined &&
                    !result.includes('"role":"assistant"')
                ) {
                    return result;
                }
            }
        });

        if (data === "[DONE]") {
            break;
        }

        data.map((v) => {
            if (v !== undefined && v !== "[DONE]") {
                const response = JSON.parse(v);
                const content = response.choices?.[0]?.delta?.content;
                if (content && content !== "\n\n") {
                    text += content;
                }
            }
        });
    }

    return text;
}

async function* repeater(reader, decoder) {
    let text = "";
    while (true) {
        const { done, value } = await reader.read();

        if (done) {
            text += "\n\n";
            yield text;
            break;
        }

        const decodedTextList = decoder.decode(value).split(`\n\n`);

        const data = decodedTextList.map((decodedText) => {
            if (decodedText.includes("data: ")) {
                const result = decodedText.split("data: ").at(1);
                if (
                    result !== undefined &&
                    !result.includes('"role":"assistant"')
                ) {
                    return result;
                }
            }
        });

        if (data === "[DONE]") {
            break;
        }

        data.flatMap((v) => {
            if (v !== undefined && v !== "[DONE]") {
                const response = JSON.parse(v);
                const content = response.choices?.[0]?.delta?.content;
                if (content && content !== "\n\n") {
                    text += content;
                }
            }
        });

        yield text;
    }
}
export async function talkWithGenerator(message) {
    const reader = await fetch(
        "https://api.openai.com/v1/chat/completions",
        setConfiguration(message)
    ).then((res) => res.body.getReader());

    if (reader === undefined) {
        throw new Error("reader is undefined");
    }

    const decoder = new TextDecoder("utf-8");

    return repeater(reader, decoder);
}

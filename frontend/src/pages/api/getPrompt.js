import dotenv from "dotenv";
dotenv.config();
import { ChatGPTAPI } from "chatgpt";
import axios from "axios";

export default async (req, res) => {
    const api = new ChatGPTAPI({
        apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    });

    const responseLanguage = "English";

    const defaultPrompt = `
    Describe the topic below "---"
    Adhere to the options below.
    Tone: Friendly
    Style: Detailed
    Reader level: Boyfriend / Girlfriend
    Length: 1000~1100 characters
    Perspective: Date planner
    Format : Output as a diagram
    Answer me in ${responseLanguage}
    ---

    `;

    const userInput = `Suggest three different date courses using the shops below and their respective budgets, and explain why you suggested them. Follow these conditions.
    1. A one date course must have 4 shops. no more, and no less.
    2. Write a diagram of the date courses at the bottom of the whole text. a diagram list must started with "Diagram:".
    3. Wrtie a explanation of why you suggested each of the date courses. and each of the date courses that you suggested starts with the number like 1, 2, 3, and diagram. Next to each number, put a 1-2 word summary of why you recommended that dating course. for example, "1. XXX : your suggestion of date course". Only ":" can be used to connect the summary and the explanation, not "-" or " ".
    4. each date course's paragraph must be seperated by three line break.
    5. the shops name in your response is always the same as the shop name below.
    6. Each of the shops can be duplicated in the date courses. but only the shops under here can be used.

    for example:
            1. XXX : your suggestion of date course
            2. YYY : your suggestion of date course
            3. ZZZ : your suggestion of date course

            Diagram:
                1. X1 -> X2 -> X3 -> X4
                2. Y1 -> Y2 -> Y3 -> Y4
                3. Z1 -> Z2 -> Z3 -> Z4

    and the shops are as follows:
        - 별마당 도서관 (Free)
        - 서울 식물원 (12,000 won per person)
        - 한강 공원 (5,000 won per person)
        - 광장 시장 육회 (20,000 won per person)
        - 코엑스 아쿠아리움 (18,000 won per person)
        - 서울 스카이 롯데월드 타워 전망대 (30,000 won per person)
        - 뚜레쥬르 제과점 (10,000 won per person)
        - 가로수길 쇼토 제과점 (12,000 won per person)
        - 성북동 빵 공장 (12,000 won per person)
        - 패션 5 베이커리 (15,000 won per person)
        - 익선동 온천집 레스토랑 (25,000 won per person)
        - 더 현대 서울 (20,000 won per person)
        `;

    let prompt = defaultPrompt + userInput;

    let responseFromChatGPT = await api.sendMessage(prompt, {
        // onProgress: (partialResponse) => {
        //     // setpartialText(partialResponse.text);
        //     console.log(partialResponse.text);
        // },
        timeoutMs: 2 * 60 * 1000,
    });

    const planeText = responseFromChatGPT.text;

    const explanation = planeText.split("Diagram:")[0];

    const ex1 = explanation.split(`1. `)[1].split(`2. `)[0];
    const title1 = ex1.split(`: `)[0];
    const ex2 = explanation.split(`2. `)[1].split(`3. `)[0];
    const title2 = ex2.split(`: `)[0];
    const ex3 = explanation.split(`2. `)[1].split(`3. `)[1];
    const title3 = ex3.split(`: `)[0];

    const diagram = planeText.split("Diagram:")[1];

    const dg1 = diagram.split(`1. `)[1].split(`2. `)[0];
    const dg2 = diagram.split(`2. `)[1].split(`3. `)[0];
    const dg3 = diagram.split(`2. `)[1].split(`3. `)[1];

    const dateCourse = [
        {
            title: title1,
            explanation: ex1,
            diagram: dg1,
        },
        {
            title: title2,
            explanation: ex2,
            diagram: dg2,
        },
        {
            title: title3,
            explanation: ex3,
            diagram: dg3,
        },
    ];
    res.status(200).json({ dateCourse });
};

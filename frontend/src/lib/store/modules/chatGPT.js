import { createSlice, current } from "@reduxjs/toolkit";
import { talk, talkWithGenerator } from "@/lib/talk";

const systemDefaultPrompt = (responseLanguage) => `
    Describe the topic below "---"
    Adhere to the options below.
    Tone: Friendly
    Style: Detailed
    Reader level: College student
    Length: 1200~1300 characters
    Perspective: Date planner
    Format : Output as a diagram
    Answer me in ${responseLanguage}
    ---
    Let's say you're my date course planner. I'll give you three date courses. I want you to write a recommendation on why each date course is good.
    Follow these conditions.
    1. Write a explanation of why you suggested each of the date courses. and each of the date courses that you suggested starts with the number like 1, 2, 3, and diagram. Next to each number, put a 1-2 word summary of why you recommended that dating course.
    2. the shops name must be written in the same way as the shop name in the list below. for example, "X1" is correct, but "x1 branch" is wrong.
    3. A Each date course that you suggest must have 5 shops. You should only use the shop informations that I gave you, and the order should be exactly as I suggested.
    4. the shop names must be written as that i gave to you, the Korean name of the shop.
    5. Anything above the sentence "and the shops are as follows:" should not be shown to me again.
    6. The very last line of text should end with "If there is anything else I can help you with, please enter it in the text box below".
    7. You must follow the format below.
        for example:
                1. Title
                    1. the shop name 1 (category)
                    2. the shop name 2 (category)
                    3. the shop name 3 (category)
                    4. the shop name 4 (category)
                    5. the shop name 5 (category)

                    explain about your suggestion of this date course.

                2. Title
                    1. the shop name 1 (category)
                    2. the shop name 2 (category)
                    3. the shop name 3 (category)
                    4. the shop name 4 (category)
                    5. the shop name 5 (category)

                    explain about your suggestion of this date course.

                3. Title
                    1. the shop name 1 (category)
                    2. the shop name 2 (category)
                    3. the shop name 3 (category)
                    4. the shop name 4 (category)
                    5. the shop name 5 (category)

                    explain about your suggestion of this date course.

                If there is anything else I can help you with, please enter it in the text box below.

    and the shops are as follows:

`;

const addRoutesDefaultMessage = `Recommend only one more new dating course with the data under "---", based on the format I've already provided. You should only use the 5 shop information that newly added at this time, and the sequence must be exactly as I suggested.  \n---\n `;

const initialState = {
    message: [],
    lastChunk: "",
    isLoading: false,
    isTalkingStart: false,
    isChatDone: true,
    isCrawlingDone: false,
    systemDefaultPrompt: systemDefaultPrompt("English"),
    addRoutesDefaultMessage: addRoutesDefaultMessage,
    followupQuestion: "",
    mod: "none",
};

const chatGPTSlice = createSlice({
    name: "chatGPT",
    initialState,
    reducers: {
        init: (state, _) => {
            state.message = [];
            state.lastChunk = "";
            state.isLoading = false;
            state.isTalkingStart = false;
            state.isChatDone = false;
        },

        saveChatGPTPartialResponses: (state, action) => {
            state.lastChunk = action.payload;
        },

        setIsTalkingStart: (state, action) => {
            state.isTalkingStart = action.payload;
        },

        setIsChatDone: (state, action) => {
            state.isChatDone = action.payload;
        },

        setMod: (state, action) => {
            state.mod = action.payload;
        },

        setFollowupQuestion: (state, action) => {
            state.followupQuestion = action.payload;
        },

        setMessage: (state, action) => {
            state.message = action.payload;
        },
    },
});

export const {
    init,
    saveChatGPTPartialResponses,
    setIsTalkingStart,
    setIsChatDone,
    setMod,
    setFollowupQuestion,
    setMessage,
} = chatGPTSlice.actions;
export default chatGPTSlice.reducer;

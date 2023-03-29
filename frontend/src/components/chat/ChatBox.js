import { useSelector, useDispatch } from "react-redux";
import React, { useEffect, useRef, useState } from "react";
import * as chatGPTActions from "@/lib/store/modules/chatGPT";
import { talkWithGenerator } from "@/lib/talk";
import * as mapActions from "@/lib/store/modules/map";

// The main logic of the component is contained within a conditional statement that checks whether the mod variable is set to "start", "addRoutes", or "askQuestion".
// If these conditions are met, the component uses the talkWithGenerator function to generate a response to the prompts using a GPT language model.
// The response is then added to the chat history and displayed in the chat box.
export default function ChatBox() {
    const { promptsList, isCrawlingDone } = useSelector((state) => state.map);

    const {
        systemDefaultPrompt,
        addRoutesDefaultMessage,
        message,
        isTalkingStart,
        isChatDone,
        mod,
        followupQuestion,
    } = useSelector((state) => state.chatGPT);

    const [lastChunk, setLastChunk] = useState(null);

    const containerRef = useRef();
    
    // This code defines the scrollToBottom function, which is used to scroll the chat box to the bottom when a new message is added.
    useEffect(() => {
        containerRef.current.scrollIntoView({
            block: "end",
            inline: "nearest",
        });
    }, [lastChunk]);

    const dispatch = useDispatch();
    
    // if some conditions are met, the component uses the talkWithGenerator function to generate a response to the prompts using a GPT language model.
    if (
        isTalkingStart &&
        !isChatDone &&
        isCrawlingDone &&
        promptsList.length > 0
    ) {
        if (mod === "start") {
            let prompts = "";
            promptsList.forEach((prompt, index) => {
                prompts += `Course ${index + 1}: \n` + prompt + `\n`;
            });

            dispatch(chatGPTActions.setIsTalkingStart(true));
            dispatch(chatGPTActions.setIsChatDone(false));

            (async () => {
                let myText = "";
                const generator = await talkWithGenerator([
                    {
                        role: "user",
                        content: systemDefaultPrompt + prompts,
                    },
                ]);

                for await (const text of generator) {
                    setLastChunk(text);
                    myText = text;
                }

                dispatch(mapActions.setShowInteractionPanel(true));

                const newMessage = [];
                newMessage.push(
                    {
                        role: "user",
                        content: systemDefaultPrompt + prompts,
                    },
                    {
                        role: "assistant",
                        content: myText,
                    }
                );
                dispatch(chatGPTActions.setMessage(newMessage));
                dispatch(chatGPTActions.setIsTalkingStart(false));
                dispatch(chatGPTActions.setIsChatDone(true));
            })();
            
            // initialize mod for stoping the loop
            dispatch(chatGPTActions.setMod("none"));
        } else if (mod === "addRoutes") {
            const prompts = promptsList[promptsList.length - 1];
            const priorChunk = lastChunk;

            (async () => {
                const generator = await talkWithGenerator([
                    ...message,
                    {
                        role: "user",
                        content: addRoutesDefaultMessage + prompts,
                    },
                ]);

                for await (const text of generator) {
                    setLastChunk(priorChunk + text);
                }

                const newMessage = [...message];
                newMessage.push(
                    {
                        role: "user",
                        content: systemDefaultPrompt + prompts,
                    },
                    {
                        role: "assistant",
                        content: lastChunk,
                    }
                );

                dispatch(chatGPTActions.setMessage(newMessage));
                dispatch(chatGPTActions.setIsTalkingStart(false));
                dispatch(chatGPTActions.setIsChatDone(true));
            })();

            dispatch(chatGPTActions.setMod("none"));
        } else if (mod === "askQuestion") {
            const priorChunk = lastChunk;

            (async () => {
                const generator = await talkWithGenerator([
                    ...message,
                    {
                        role: "user",
                        content: followupQuestion,
                    },
                ]);

                for await (const text of generator) {
                    setLastChunk(priorChunk + text);
                }

                const newMessage = [...message];
                newMessage.push(
                    {
                        role: "user",
                        content: followupQuestion,
                    },
                    {
                        role: "assistant",
                        content: lastChunk,
                    }
                );

                dispatch(chatGPTActions.setMessage(newMessage));
                dispatch(chatGPTActions.setIsTalkingStart(false));
                dispatch(chatGPTActions.setIsChatDone(true));
            })();

            dispatch(chatGPTActions.setMod("none"));
        }
    }
    // The component returns a div element that contains the chat box.
    // The component displays a loading icon while the GPT language model is generating a response. but if the response is not generated, the component displays a default image.
    return (
        <div className="wrapper" ref={containerRef}>
            <div
                className="resultBox"
                style={{
                    width: "450px",
                    whiteSpace: "pre-wrap",
                }}
            >
                {lastChunk === null && isCrawlingDone ? (
                    <img
                        src="assets/images/listeningimage.png"
                        alt="defaultImage"
                        style={{ width: "40px", height: "40px" }}
                    ></img>
                ) : !isCrawlingDone ? (
                    <img
                        src="assets/images/loading.gif"
                        alt="loading..."
                        style={{ width: "40px", height: "40px" }}
                    ></img>
                ) : (
                    lastChunk
                )}
            </div>
            <style jsx>
                {`
                    .resultBox {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;

                        border: 1px solid black;
                        margin: 10px;

                        background-color: #fff0f0;
                        border-radius: 10px;
                        box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);

                        padding: 12px;
                    }
                `}
            </style>
        </div>
    );
}

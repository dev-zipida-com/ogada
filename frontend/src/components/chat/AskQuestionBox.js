import React, { useState } from "react";
import * as chatGPTActions from "@/lib/store/modules/chatGPT";
import { useDispatch, useSelector } from "react-redux";

// This code defines the AskQuestion component which renders a text input field and a button for asking a follow-up question.
export default function AskQuestion() {
    const { showInteractionPanel } = useSelector((state) => state.map);
    // The component uses the useState hook to manage the state of the followupQuestion variable, which stores the text entered into the input field by the user.
    const [followupQuestion, setFollowupQuestion] = useState("");
    const dispatch = useDispatch();
    
    // The component returns a div containing an input field and a button. When the button is clicked, the followupQuestion variable is dispatched to the chatGPT store module.
    // The component also dispatches the setMod action to update the state of the content that the ChatBox component show.
    return (
        <div
            style={{
                display: showInteractionPanel ? "block" : "none",
            }}
        >
            <input
                type="text"
                onChange={(e) => {
                    setFollowupQuestion(e.target.value);
                }}
                value={followupQuestion}
                style={{
                    width: "370px",
                    height: "30px",
                    fontSize: "18px",
                    marginLeft: "5px",
                }}
            />
            <button
                onClick={() => {
                    dispatch(
                        chatGPTActions.setFollowupQuestion(followupQuestion)
                    );

                    dispatch(chatGPTActions.setMod("askQuestion"));
                    dispatch(chatGPTActions.setIsChatDone(false));
                    dispatch(chatGPTActions.setIsTalkingStart(true));
                    setFollowupQuestion("");
                }}
                style={{
                    width: "80px",
                    height: "35px",
                    backgroundColor: "white",
                    border: "1px solid black",
                    borderRadius: "5px",
                    cursor: "pointer",
                    fontSize: "14px",
                    marginLeft: "5px",
                }}
            >
                질문하기
            </button>
        </div>
    );
}

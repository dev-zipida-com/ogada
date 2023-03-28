import React, { useState } from "react";
import * as chatGPTActions from "@/lib/store/modules/chatGPT";
import { useDispatch, useSelector } from "react-redux";

export default function AskQuestion() {
    const { showInteractionPanel } = useSelector((state) => state.map);
    const [followupQuestion, setFollowupQuestion] = useState("");
    const dispatch = useDispatch();

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

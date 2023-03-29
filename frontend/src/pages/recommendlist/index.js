import React from "react";
import AnotherUsersList from "@/components/recommendlist/AnotherUsersList";
function Chat() {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <AnotherUsersList />
        </div>
    );
}

export default Chat;

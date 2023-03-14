import React from "react";
import HorizonLine from "../components/HorizonLine";

import HomeButton from "../components/HomeButton";
import AnotherUsersList from "../components/AnotherUsersList";

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
            <HorizonLine text={"."} />
            <AnotherUsersList />

            <HorizonLine text={"."} />
            <HomeButton />
        </div>
    );
}

export default Chat;

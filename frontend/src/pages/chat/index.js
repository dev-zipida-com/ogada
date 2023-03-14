// this is a page for rendering the map that located at my current place with a google map api
// and there is a "Date course recommandation" component that located at the bottom of the page.
// when the user click the "Date course recommandation" button, the result that the date course recommand date getting from the backend server will be shown at the bottom of the page.

import React from "react";
import Link from "next/link";
import HorizonLine from "../components/HorizonLine";
// import GetUsersAddress from "../components/address";
import GetUsersAddress from "../components/Address_PR";
import Results from "../components/results";
import HomeButton from "../components/HomeButton";

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
            <GetUsersAddress />

            <HorizonLine text={"."} />
            <HomeButton />
        </div>
    );
}

export default Chat;

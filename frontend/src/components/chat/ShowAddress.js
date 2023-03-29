import React from "react";
import { useSelector } from "react-redux";

// This component returns the address of the place selected by the user.
export default function ShowAddress() {
    const { address } = useSelector((state) => state.map);

    return (
        <div
            style={{
                marginTop: "10px",
                marginBottom: "10px",
            }}
        >
            {address ? `주소 : ${address}` : null}
        </div>
    );
}

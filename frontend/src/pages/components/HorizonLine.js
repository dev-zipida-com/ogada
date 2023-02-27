import React from "react";

const HorizonLine = ({ text }) => {
    return (
        <div
            style={{
                width: "30%",
                textAlign: "center",
                borderBottom: "1px solid #aaa",
                lineHeight: "0.1em",
                margin: "40px 0 40px 0",
            }}
        >
            <span style={{ background: "#fff", padding: "0 10px" }}>
                {text}
            </span>
        </div>
    );
};

export default HorizonLine;

import React from "react";

const HorizonLine = ({ text }) => {
    return (
        <div
            style={{
                width: "500px",
                textAlign: "center",
                borderBottom: "1px solid #aaa",
                lineHeight: "0.1em",
                margin: "40px auto 40px auto",
            }}
        >
            <span style={{ background: "#fff", padding: "0 10px" }}>
                {text}
            </span>
        </div>
    );
};

export default HorizonLine;

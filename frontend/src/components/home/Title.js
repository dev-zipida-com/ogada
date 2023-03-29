import React from "react";

// This component returns the title image of the main page.
const Title = () => {
    return (
        <div>
            <img
                src={"assets/images/mainTitle.png"}
                className="mainTitle"
                alt="mainTitleImage"
            />
            <style jsx>{`
                .mainTitle {
                    width: 20%;
                    display: block;
                    margin-left: auto;
                    margin-right: auto;
                }
            `}</style>
        </div>
    );
};

export default Title;

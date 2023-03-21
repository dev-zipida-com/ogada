import React from "react";

const Title = () => {
    return (
        <div>
            <img src={"assets/images/mainTitle.png"} className="mainTitle" />
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

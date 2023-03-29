// this component is a home button, it will redirect the user to the home page

import React from "react";
import Link from "next/link";

const HomeButton = () => {
    return (
        <div className="homeButton">
            <Link style={{ textDecoration: "none" }} href="/">
                <div className="homeButton__content">
                    <img
                        src={"assets/images/homeButton.png"}
                        className="homeButton__content__image"
                        alt="homeButtonImage"
                    />
                    <h3>Home</h3>
                </div>
            </Link>
            <style jsx>{`
                .homeButton {
                    width: 100%;
                    height: 63px;
                    left: 105px;
                    top: 290px;

                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                }
                .homeButton__content {
                    width: 67px;
                    height: 63px;
                    left: 105px;
                    top: 290px;

                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }
                .homeButton__content__image {
                    width: 67px;
                    height: 63px;
                    left: 105px;
                    top: 290px;
                }
            `}</style>
        </div>
    );
};

export default HomeButton;

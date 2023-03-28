// this is a component for the box that contains the text and the image
// if user clicked this box, it will redirect to the page that contains the detail of the event

import React from "react";
import Link from "next/link";

const Box = ({ title, image, link }) => {
    return (
        <div className="box">
            <Link style={{ textDecoration: "none" }} href={link}>
                <div className="box__content__title">
                    <h2>{title}</h2>
                </div>
                <div className="box__content__image">
                    <img src={image} alt="boxContentImage" />
                </div>
            </Link>
            <style jsx>{`
                .box {
                    width: 160px;
                    height: 160px;
                    left: 32px;
                    top: 222px;

                    background: #fbf4ff;
                    box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
                    border-radius: 20px;
                }
                .box__content__title {
                    width: 97px;
                    height: 52px;
                    left: 46px;
                    top: 238px;

                    font-family: "IBM Plex Sans Hebrew";
                    font-style: normal;
                    font-weight: 400;
                    font-size: 14px;
                    line-height: 26px;

                    color: #000000;

                    display: flex;
                    flex-direction: column;
                    justify-content: center;

                    margin: 20px 0 0 20px;
                }
                .box__content__image {
                    width: 67px;
                    height: 63px;
                    left: 105px;
                    top: 290px;

                    margin-left: auto;
                }
            `}</style>
        </div>
    );
};

export default Box;

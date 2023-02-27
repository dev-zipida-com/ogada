// this component is a box group, it will contain box components
// box components will be shown with grid layout in the box group component

import React from "react";
import Box from "./Box";

const BoxGroup = () => {
    const boxes = [
        {
            title: "데이트 코스 추천받기",
            image: "assets/images/aiRobot.png",
            link: "/chat",
        },
        {
            title: "유저 추천 코스",
            image: "assets/images/polaris.png",
            link: "/recommends",
        },
        {
            title: "테스트용 1234",
            image: "assets/images/polaris.png",
            link: "/",
        },
        {
            title: "테스트용 1234",
            image: "assets/images/polaris.png",
            link: "/",
        },
    ];

    return (
        <div className="boxGroup">
            {boxes.map((box) => (
                <Box title={box.title} image={box.image} link={box.link} />
            ))}
            <style jsx>{`
                .boxGroup {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    grid-template-rows: repeat(2, 1fr);
                    grid-gap: 20px;
                    width: 20%;
                    height: 100%;
                }
            `}</style>
        </div>
    );
};

export default BoxGroup;

// this component is a box group, it will contain box components
// box components will be shown with grid layout in the box group component

import React from "react";
import Box from "./Box";

const BoxGroup = () => {
    const boxes = [
        {
            id: 1,
            title: "데이트 코스 추천받기",
            image: "assets/images/aiRobot.png",
            link: "/chat",
        },
        {
            id: 2,
            title: "유저 추천 코스",
            image: "assets/images/polaris.png",
            link: "/recommendlist",
        },
    ];

    return (
        <div className="boxGroup">
            {boxes.map((box) => (
                <Box
                    title={box.title}
                    image={box.image}
                    link={box.link}
                    key={box.id}
                />
            ))}
            <style jsx>{`
                .boxGroup {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    grid-template-rows: repeat(1, 1fr);
                    grid-gap: 20px;
                }
            `}</style>
        </div>
    );
};

export default BoxGroup;

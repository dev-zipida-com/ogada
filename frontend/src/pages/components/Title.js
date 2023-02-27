import React from "react";
// Keeping your assets in public folder ensures that,
// you can access it from anywhere from the project,
// by just giving '/path_to_image' and no need for any path traversal '../../' like this

// show image from public folder
// the image will be located at the head of the page, and aligned with center, and width will be 100% of the page, and height will be 15% of the page
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

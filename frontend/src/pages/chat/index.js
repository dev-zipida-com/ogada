import React, { useRef } from "react";
import SearchAddress from "@/components/chat/SearchAddress";
import AddACourseBox from "@/components/chat/AddACourseBoxBtn";
import AskQuestion from "@/components/chat/AskQuestionBox";
import ChatBox from "@/components/chat/ChatBox";
import CourseBox from "@/components/chat/CourseBox";
import Mapper from "@/components/chat/Mapper";
import DateRecommendationBox from "@/components/chat/dateRecommendationBox";
import ShowAddress from "@/components/chat/ShowAddress";

const Chat = () => {
    const containerRef = useRef(null);

    return (
        <div
            ref={containerRef}
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <SearchAddress />
            <ShowAddress />
            <Mapper />
            <p></p>
            <DateRecommendationBox />
            <ChatBox />
            <CourseBox containerRef={containerRef} />
            <AddACourseBox />
            <p></p>
            <AskQuestion />
        </div>
    );
};

export default Chat;

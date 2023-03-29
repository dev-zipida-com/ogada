import * as chatGPTActions from "@/lib/store/modules/chatGPT";
import * as mapActions from "@/lib/store/modules/map";
import { useDispatch, useSelector } from "react-redux";
import React, { useEffect } from "react";
import getANewPlaces from "@/lib/getANewPlaces";

export default function DateRecommendationBox() {
    const dispatch = useDispatch();
    const { placeInfoList } = useSelector((state) => state.map);

    async function setPlaceInfoListOnStore() {
        let this_url = null;

        if (placeInfoList) {
            dispatch(mapActions.setPlaceInfoList(placeInfoList));

            dispatch(mapActions.setIsCrawlingDone(false));

            const { markers, urls, prompts, newCrawledData } =
                await getANewPlaces(placeInfoList, 3);

            this_url = urls;

            if (markers.length > 0) {
                markers.map((marker) => {
                    dispatch(mapActions.setMarkersList(marker));
                });
            }

            if (urls.length > 0) {
                urls.map((url) => {
                    dispatch(mapActions.setUrlsList(url));
                });
            }

            if (prompts.length > 0) {
                prompts.map((prompt) => {
                    dispatch(mapActions.setPromptsList(prompt));
                });
            }

            if (newCrawledData.length > 0) {
                newCrawledData.map((c) => {
                    dispatch(mapActions.setCrawledData(c));
                });
            }

            dispatch(mapActions.setIsCrawlingDone(true));
        }
    }

    return (
        <div
            style={{
                display: placeInfoList !== null ? "flex" : "none",
            }}
        >
            <button
                style={{
                    width: "180px",
                    height: "40px",
                    backgroundColor: "white",
                    border: "1px solid black",
                    borderRadius: "5px",
                    cursor: "pointer",
                    fontSize: "18px",
                }}
                onClick={async () => {
                    await setPlaceInfoListOnStore();
                    dispatch(chatGPTActions.setMod("start"));
                    dispatch(chatGPTActions.setIsChatDone(false));
                    dispatch(chatGPTActions.setIsTalkingStart(true));
                }}
            >
                데이트 코스 추천받기
            </button>
        </div>
    );
}

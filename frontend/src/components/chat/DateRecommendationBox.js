import * as chatGPTActions from "@/lib/store/modules/chatGPT";
import * as mapActions from "@/lib/store/modules/map";
import { useDispatch, useSelector } from "react-redux";
import React, { useEffect } from "react";
import getANewPlaces from "@/lib/getANewPlaces";

// this component return a button for adding the initial 3 routes to a map.
export default function DateRecommendationBox() {
    const dispatch = useDispatch();
    const { placeInfoList } = useSelector((state) => state.map);

    async function setPlaceInfoListOnStore() {
        let this_url = null;

        if (placeInfoList) {
            dispatch(mapActions.setPlaceInfoList(placeInfoList));
            dispatch(mapActions.setIsCrawlingDone(false));
    
            // getANewPlaces function is called with the placeInfoList variable and the number of routes to be added as arguments.
            const { markers, urls, prompts, newCrawledData } =
                await getANewPlaces(placeInfoList, 3);

            this_url = urls;
            
            // If the markers, urls, prompts, and newCrawledData variables are not empty, the function dispatches various actions to update the markers, urls, prompts, and crawledData state variables.
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

    // Call the setPlaceInfoListOnStore function and dispatch actions to set the mod, chat status, and talking status.
    // following the mod status, the ChatBox will render the appropriate text.
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

import React, { useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import * as chatGPTActions from "@/lib/store/modules/chatGPT";
import getANewPlaces from "@/lib/getANewPlaces";
import * as mapActions from "@/lib/store/modules/map";

const AddACourseBox = () => {
    const dispatch = useDispatch();

    const { placeInfoList, showInteractionPanel } = useSelector(
        (state) => state.map
    );

    async function setPlaceInfoListOnStore() {
        let this_url = null;

        if (placeInfoList) {
            dispatch(mapActions.setIsCrawlingDone(false));
            const { markers, urls, prompts, newCrawledData } =
                await getANewPlaces(placeInfoList, 1);

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
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
                width: "450px",
            }}
        >
            <button
                style={{
                    display: showInteractionPanel ? "block" : "none",
                    width: "120px",
                    height: "26px",
                    backgroundColor: "white",
                    border: "1px solid black",
                    borderRadius: "5px",
                    cursor: "pointer",
                    fontSize: "15px",
                    marginLeft: "15px",
                    marginTop: "10px",
                }}
                onClick={async () => {
                    await setPlaceInfoListOnStore();
                    dispatch(chatGPTActions.setMod("addRoutes"));
                    dispatch(chatGPTActions.setIsChatDone(false));
                    dispatch(chatGPTActions.setIsTalkingStart(true));
                }}
            >
                경로 추가
            </button>
        </div>
    );
};

export default AddACourseBox;

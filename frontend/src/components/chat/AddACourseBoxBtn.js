import React, { useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import * as chatGPTActions from "@/lib/store/modules/chatGPT";
import getANewPlaces from "@/lib/getANewPlaces";
import * as mapActions from "@/lib/store/modules/map";

// This code defines the AddACourseBox component which renders a button for adding a new route to a map.
const AddACourseBox = () => {
    const dispatch = useDispatch();

    const { placeInfoList, showInteractionPanel } = useSelector(
        (state) => state.map
    );
    
    // The setPlaceInfoListOnStore function is an asynchronous function that updates the state of the map with new data obtained by calling the getANewPlaces function.
    async function setPlaceInfoListOnStore() {
        let this_url = null;
        
        // If the placeInfoList variable is not null,
        // the function dispatches various actions to update the markers, urls, prompts, and crawledData state variables.
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
    
    // The component returns a div containing a button with a click handler that calls the setPlaceInfoListOnStore function,
    // as well as several dispatch calls to update the state of the chatGPT module.
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

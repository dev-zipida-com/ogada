import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    address: "",
    map: null,
    placeInfoList: null,
    promptsList: [],
    urlsList: [],
    markersList: [],
    centerPosition: { lat: 0, lng: 0 },
    showACenter: true,
    attentionIndex: 0,
    crawledData: [],
    mapData: [],
    isCrawlingDone: true,
    showInteractionPanel: false,
};

const mapSlice = createSlice({
    name: "map",
    initialState,
    reducers: {
        initMUP(state, _) {
            state.markersList = [];
            state.urlsList = [];
            state.promptsList = [];
            state.crawledData = [];
        },
        setMap(state, action) {
            state.map = action.payload;
        },
        setAddress(state, action) {
            state.address = action.payload;
        },
        setPromptsList(state, action) {
            state.promptsList = [...state.promptsList, action.payload];
        },
        setUrlsList(state, action) {
            state.urlsList = [...state.urlsList, action.payload];
        },
        setMarkersList(state, action) {
            state.markersList = [...state.markersList, action.payload];
        },
        setCrawledData(state, action) {
            state.crawledData = [...state.crawledData, action.payload];
        },
        setCenterPosition(state, action) {
            state.centerPosition = action.payload;
        },
        setPlaceInfoList(state, action) {
            state.placeInfoList = action.payload;
        },
        setShowACenter(state, _) {
            state.showACenter = state.showACenter ? false : true;
        },
        setIsCrawlingDone(state, action) {
            state.isCrawlingDone = action.payload;
        },
        setAttentionIndex(state, action) {
            state.attentionIndex = action.payload;
        },
        setMapData(state, action) {
            state.mapData = action.payload;
        },
        setShowInteractionPanel(state, action) {
            state.showInteractionPanel = action.payload;
        },
    },
});

export const {
    setMap,
    setAddress,
    setPromptsList,
    setUrlsList,
    setMarkersList,
    setCrawledData,
    setIsCrawlingDone,
    setAttentionIndex,
    setMapData,
    setCenterPosition,
    setPlaceInfoList,
    setShowACenter,
    initMUP,
    setShowInteractionPanel,
} = mapSlice.actions;

export default mapSlice.reducer;

import { combineReducers } from "@reduxjs/toolkit";
import { HYDRATE } from "next-redux-wrapper";
import chatGPT from "./chatGPT";
import map from "./map";

const rootReducer = (state, action) => {
    switch (action.type) {
        case HYDRATE:
            return {
                ...state,
                ...action.payload,
            };
        default: {
            return combineReducers({
                chatGPT,
                map,
            })(state, action);
        }
    }
};

export default rootReducer;

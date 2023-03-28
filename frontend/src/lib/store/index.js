import { configureStore } from "@reduxjs/toolkit";
import { createWrapper } from "next-redux-wrapper";

import rootReducer from "./modules";

const store = () =>
    configureStore({
        reducer: rootReducer,
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                serializableCheck: false,
            }),
        devTools: process.env.NEXT_PUBLIC_NODE_ENV !== "production",
    });

export const wrapper = createWrapper(store, {
    debug: process.env.NEXT_PUBLIC_NODE_ENV !== "production",
});

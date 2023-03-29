import Title from "@/components/home/Title";
import { wrapper } from "@/lib/store";
import { Provider } from "react-redux";
import Proptypes from "prop-types";
import React from "react";
import HomeButton from "@/components/home/HomeButton";
import HorizonLine from "@/components/home/HorizonLine";

const App = ({ Component, ...rest }) => {
    const { store, props } = wrapper.useWrappedStore(rest);
    return (
        <Provider store={store}>
            <Title />
            <HorizonLine text={"."} />
            <Component {...props.pageProps} />
            <HorizonLine text={"·"} />
            <HomeButton />
        </Provider>
    );
};

App.Proptypes = {
    Component: Proptypes.elementType,
    store: Proptypes.object,
};

export default App;

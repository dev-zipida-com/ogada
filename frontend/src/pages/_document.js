import { Html, Head, Main, NextScript } from "next/document";
import Script from "next/script";
import dotenv from "dotenv";
dotenv.config();

export default function Document() {
    const geocoderApiKey = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.KAKAOMAP_JAVASCRIPT_KEY}&libraries=services,clusterer&autoload=false`;

    return (
        <Html lang="en">
            <Head />
            <body>
                <Main />
                <NextScript />
                <Script src={geocoderApiKey} strategy="beforeInteractive" />
            </body>
        </Html>
    );
}

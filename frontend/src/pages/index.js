import Head from "next/head";
import BoxGroup from "./components/BoxGroup";
import HomeButton from "./components/HomeButton";
import TodayRecommends from "./components/TodayRecommends";
import HorizonLine from "./components/HorizonLine";
import { useRouter } from "next/router";

export default function Home() {
    return (
        <>
            <Head>
                <title>Ogada</title>
                <meta
                    name="description"
                    content="Ogada, the Date course recommendation web page."
                />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1"
                />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <HorizonLine text={"·"} />
                <BoxGroup />
                <HorizonLine text={"·"} />
                <TodayRecommends todayRecommends={[]} />
                <HorizonLine text={"·"} />
                <HomeButton />
            </div>
        </>
    );
}

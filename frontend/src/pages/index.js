import Head from "next/head";
import BoxGroup from "@/components/home/BoxGroup";
import Weather from "@/components/home/Weather";

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
                <Weather />
                <BoxGroup />
            </div>
        </>
    );
}

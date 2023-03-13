import "@/styles/globals.css";
import Title from "./components/Title";

export default function App({ Component, pageProps }) {
    return (
        <div>
            <Title></Title>
            <Component {...pageProps} />
        </div>
    );
}

// this is a nextjs api route to get users position from users hangeul adress getted from Kakao postcode api with a kakao local api
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

export default async (req, res) => {
    const { address } = req.body;
    const url = `https://dapi.kakao.com/v2/local/search/address.json?query=${address}`;
    const { data } = await axios.get(url, {
        headers: {
            Authorization: `KakaoAK ${process.env.KAKAOMAP_REST_API_KEY}`,
        },
    });
    const { x, y } = data.documents[0].address;
    const lat = y;
    const lng = x;
    res.status(200).json({ lat, lng });
};

import axios from "axios";
export default async function setCoordinationOnStore(address) {
    const { lat, lng } = await axios
        .post("/api/getUsersPosition", {
            address,
        })
        .then((res) => res.data);

    return { lat, lng };
}

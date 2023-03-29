import axios from "axios";
// This function returns the latitude and longitude of the address.
export default async function setCoordinationOnStore(address) {
    const { lat, lng } = await axios
        .post("/api/getUsersPosition", {
            address,
        })
        .then((res) => res.data);

    return { lat, lng };
}

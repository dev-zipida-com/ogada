import axios from "axios";

function shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
}

export default async function getANewPlaces(
    placeInfoList,
    numberOfRoutesWillBeAdded
) {
    let [culture, cafe, restaurant] = [[], [], []];

    placeInfoList.forEach((places) => {
        places.forEach((place) => {
            if (
                place.category_group_name.includes("문화시설") ||
                place.category_name.includes("여행")
            ) {
                culture.push(place);
            }
            if (
                place.category_name.includes("음식점") &&
                place.category_name.includes("카페") === false
            ) {
                restaurant.push(place);
            }
            if (place.category_name.includes("카페")) {
                cafe.push(place);
            }
        });
    });

    [culture, cafe, restaurant] = [culture, cafe, restaurant].map((places) => {
        return shuffle(places);
    });

    let shuffledPlaces = [];
    let counter = 0;
    for (let i = 0; i < numberOfRoutesWillBeAdded; i++) {
        let temp = [];

        temp.push(culture[counter]);
        temp.push(restaurant[counter]);
        temp.push(cafe[counter]);

        counter++;

        temp.push(culture[counter]);
        temp.push(restaurant[counter]);

        counter++;

        shuffledPlaces.push(temp);
    }

    const markers = [];
    const urls = [];

    const crawling = async (urls) => {
        return await axios
            .post(`${process.env.NEXT_PUBLIC_BACKEND_API}/crawling`, {
                data: urls,
            })
            .then((res) => {
                return res.data;
            });
    };

    shuffledPlaces.forEach((places) => {
        let tempMarker = [];
        let tempUrls = [];
        places.map((place, i) => {
            tempMarker.push({
                position: {
                    lat: place.y,
                    lng: place.x,
                },
                content: place.place_name,
                imageUrl: `assets/images/bluestar${i + 1}.png`,
                address_name: place.road_address_name,
                phone: place.phone,
            });

            tempUrls.push({ url: place.place_url });
        });
        markers.push(tempMarker);
        urls.push(tempUrls);
    });

    let flatUrls = [];
    urls.forEach((url) => {
        url.forEach((u) => {
            flatUrls.push(u);
        });
    });

    const cd = await crawling(flatUrls);

    let prompts = [];
    let newCrawledData = [];
    shuffledPlaces.forEach((places) => {
        let temp = "";
        let tempCrawledData = [];
        places.forEach((place) => {
            for (let i = 0; i < cd.length; i++) {
                if (cd[i].title === place.place_name) {
                    temp += `- shop name: ${cd[i].title}, category: ${
                        place.category_name
                    }, opening hours: ${
                        cd[i].opening_time ? cd[i].opening_time : "unknown"
                    }, menus & prices: ${JSON.stringify(cd[i].menu)}\n`;

                    tempCrawledData.push(cd[i]);
                }
            }
        });
        newCrawledData.push(tempCrawledData);
        prompts.push(temp);
    });

    return { markers, urls, prompts, newCrawledData };
}

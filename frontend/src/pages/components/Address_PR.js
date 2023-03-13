// this is a GET request to get the address of the user using Daum Postcode API

import React, { useRef, useState, useEffect } from "react";
import DaumPostcode from "react-daum-postcode";
import { Map, MapMarker, Polyline } from "react-kakao-maps-sdk";
import axios from "axios";
import Script from "next/script";

const callKaKaoApi = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAOMAP_APPKEY}&libraries=services,clusterer&autoload=false`;

const responseLanguage = "English";

const defaultPrompt = `
    Describe the topic below "---"
    Adhere to the options below.
    Tone: Friendly
    Style: Detailed
    Reader level: College student
    Length: 1200~1300 characters
    Perspective: Date planner
    Format : Output as a diagram
    Answer me in ${responseLanguage}
    ---
    Let's say you're my date course planner. I'll give you three date courses. I want you to write a recommendation on why each date course is good.
    Follow these conditions.
    1. Write a explanation of why you suggested each of the date courses. and each of the date courses that you suggested starts with the number like 1, 2, 3, and diagram. Next to each number, put a 1-2 word summary of why you recommended that dating course.
    2. the shops name must be written in the same way as the shop name in the list below. for example, "X1" is correct, but "x1 branch" is wrong.
    3. A Each date course that you suggest must have 5 shops. You should only use the shop informations that I gave you, and the order should be exactly as I suggested.
    4. the shop names must be written as that i gave to you, the Korean name of the shop.
    5. Anything above the sentence "and the shops are as follows:" should not be shown to me again.
    6. The very last line of text should end with "If there is anything else I can help you with, please enter it in the text box below".
    7. You must follow the format below.
        for example:
                1. Title
                    1. the shop name 1 (category)
                    2. the shop name 2 (category)
                    3. the shop name 3 (category)
                    4. the shop name 4 (category)
                    5. the shop name 5 (category)

                    explain about your suggestion of this date course.

                2. Title
                    1. the shop name 1 (category)
                    2. the shop name 2 (category)
                    3. the shop name 3 (category)
                    4. the shop name 4 (category)
                    5. the shop name 5 (category)

                    explain about your suggestion of this date course.

                3. Title
                    1. the shop name 1 (category)
                    2. the shop name 2 (category)
                    3. the shop name 3 (category)
                    4. the shop name 4 (category)
                    5. the shop name 5 (category)

                    explain about your suggestion of this date course.

                If there is anything else I can help you with, please enter it in the text box below.

    and the shops are as follows:

    `;

let userInput = ``;
let repeatCounter = 0;
let lastInput = "";
let urls = [];

function uniqueRandomNumberSelector(list, resultNum) {
    let result = [];
    while (result.length < resultNum) {
        let random = Math.floor(Math.random() * (list.length - 1));
        if (!result.includes(random)) {
            result.push(random);
        }
    }
    return result;
}

const GetUsersAddress = () => {
    const [openPostcode, setOpenPostcode] = useState(false);
    const [address, setAddress] = useState("서울 강남구 강남대로156길 16");
    const [lat, setLat] = useState(37.5181062174467);
    const [lng, setLng] = useState(127.020528914698);
    const [showACenterMarker, setShowACenterMarker] = useState(true);
    const [chatDone, setChatDone] = useState(false);
    const [chunks, setChunks] = useState("");
    const [lastChunks, setLastChunks] = useState("");

    const [followupQuestion, setFollowupQuestion] = useState("");
    const [myCourse, setMyCourse] = useState("");
    const [markersOfThisRoute, setMarkersOfThisRoute] = useState([]);

    const [isLoading, setIsLoading] = useState(false);
    const [isTalkingStart, setIsTalkingStart] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    const [info, setInfo] = useState("");
    const [infoState, setInfoState] = useState(false);

    const [markers, setMarkers] = useState([]);

    const [recommendedRoutes, setRecommendedRoutes] = useState([]);
    const [recommendedRoutesMarkers, setRecommendedRoutesMarkers] = useState(
        []
    );
    const [isCrawlDone, setIsCrawlDone] = useState(false);
    const [crawledData, setCrawledData] = useState([]);

    const [map, setMap] = useState("");
    const [isDataReady, setIsDataReady] = useState(false);
    const placeInfoList = useRef([]);

    const [onCourseBtn, setOnCourseBtn] = useState([]);

    const containerRef = useRef();

    let messages = useRef([
        {
            role: "user",
            content: userInput,
        },
    ]);

    useEffect(() => {
        containerRef.current.scrollIntoView({
            behavior: "smooth",
            block: "end",
            inline: "nearest",
        });
    }, [chunks]);

    useEffect(() => {
        if (crawledData === [] || null || undefined) return;

        setIsCrawlDone(true);
    }, [crawledData]);

    useEffect(() => {
        if (!isSearching) return;

        placeInfoList.current = [];

        const keywords = [
            address + " 주변 맛집",
            address + " 주변 카페",

            address + " 주변 영화관",
            address + " 주변 미술관",
            address + " 주변 박물관",
            address + " 주변 공원",
            address + " 주변 공연장",
        ];

        setIsDataReady(false);
        userInput = ``;
        const ps = new window.kakao.maps.services.Places();
        for (let i = 0; i < keywords.length; i++) {
            ps.keywordSearch(keywords[i], (data, status, pagination) => {
                if (status === window.kakao.maps.services.Status.OK) {
                    let eachDataLen =
                        data.length < (i < 2 ? 14 : 6)
                            ? data.length
                            : i < 2
                            ? 14
                            : 6;
                    for (let j = 0; j < eachDataLen; j++) {
                        if (data[j].place_name.includes("휴업")) {
                            continue;
                        }
                        placeInfoList.current.push(data[j]);
                    }
                }

                if (i === keywords.length - 1) {
                    setIsDataReady(true);
                }
            });
        }
    }, [isSearching]);

    const handler = {
        onClick: () => {
            setOpenPostcode(!openPostcode);
        },

        onDrawRoute: () => {
            if (!isDataReady) return;

            const markers = [...markersOfThisRoute];
            const bounds = new kakao.maps.LatLngBounds();
            for (let i = 0; i < markers.length; i++) {
                bounds.extend(
                    new kakao.maps.LatLng(markers[i].y, markers[i].x)
                );
            }

            setShowACenterMarker(false);
        },

        onComplete: async (data) => {
            setAddress(data?.address);

            const { lat, lng } = await axios
                .post("/api/user/map/getUsersPosition", {
                    address: data.address,
                })
                .then((res) => res.data);

            setLat(lat);
            setLng(lng);

            setOpenPostcode(false);
            setIsSearching(!isSearching);
            urls = [];
        },

        onChange: (e) => {
            setFollowupQuestion(e.target.value);
        },

        removeAOneCourse: (index) => {
            if (recommendedRoutes.length === 1) {
                alert("최소 한 개의 코스를 선택해주세요.");
                return;
            }
            const prevRoutes = [...recommendedRoutes];
            const prevMarkers = [...recommendedRoutesMarkers];
            const prebBtns = [...onCourseBtn];

            for (let i = 0; i < prevRoutes.length; i++) {
                if (i === index) {
                    prevRoutes.splice(i, 1);
                    prevMarkers.splice(i, 1);
                    prebBtns.splice(i, 1);
                }
            }

            setRecommendedRoutes(prevRoutes);
            setRecommendedRoutesMarkers(prevMarkers);
            setOnCourseBtn(prebBtns);
        },

        getAOneDateCourse: () => {
            if (isDataReady) {
                let [culture, cafe, restaurant] = [[], [], []];
                for (let i = 0; i < placeInfoList.current.length; i++) {
                    if (
                        placeInfoList.current[i].category_group_name ===
                        "문화시설"
                    ) {
                        culture.push(placeInfoList.current[i]);
                    } else if (
                        placeInfoList.current[i].category_group_name ===
                        "음식점"
                    ) {
                        restaurant.push(placeInfoList.current[i]);
                    } else if (
                        placeInfoList.current[i].category_group_name === "카페"
                    ) {
                        cafe.push(placeInfoList.current[i]);
                    }
                }

                const cultureSelectedNums = uniqueRandomNumberSelector(
                    culture,
                    2
                );
                const cafeSelectedNums = uniqueRandomNumberSelector(cafe, 1);
                const restaurantSelectedNums = uniqueRandomNumberSelector(
                    restaurant,
                    2
                );

                const newRoute = [
                    culture[cultureSelectedNums[0]].place_name,
                    restaurant[restaurantSelectedNums[0]].place_name,
                    cafe[cafeSelectedNums[0]].place_name,
                    culture[cultureSelectedNums[1]].place_name,
                    restaurant[restaurantSelectedNums[1]].place_name,
                ];

                const newUrls = [
                    culture[cultureSelectedNums[0]].place_url,
                    restaurant[restaurantSelectedNums[0]].place_url,
                    cafe[cafeSelectedNums[0]].place_url,
                    culture[cultureSelectedNums[1]].place_url,
                    restaurant[restaurantSelectedNums[1]].place_url,
                ];

                const newMarkers = [
                    {
                        position: {
                            lat: culture[cultureSelectedNums[0]].y,
                            lng: culture[cultureSelectedNums[0]].x,
                        },
                        content: culture[cultureSelectedNums[0]].place_name,
                        imageUrl: "assets/images/bluestar1.png",
                        address_name:
                            culture[cultureSelectedNums[0]].road_address_name,
                        phone: culture[cultureSelectedNums[0]].phone,
                    },
                    {
                        position: {
                            lat: restaurant[restaurantSelectedNums[0]].y,
                            lng: restaurant[restaurantSelectedNums[0]].x,
                        },
                        content:
                            restaurant[restaurantSelectedNums[0]].place_name,

                        imageUrl: "assets/images/bluestar2.png",
                        address_name:
                            culture[restaurantSelectedNums[0]]
                                .road_address_name,
                        phone: culture[restaurantSelectedNums[0]].phone,
                    },
                    {
                        position: {
                            lat: cafe[cafeSelectedNums[0]].y,
                            lng: cafe[cafeSelectedNums[0]].x,
                        },
                        content: cafe[cafeSelectedNums[0]].place_name,
                        imageUrl: "assets/images/bluestar3.png",
                        address_name:
                            culture[cafeSelectedNums[0]].road_address_name,
                        phone: culture[cafeSelectedNums[0]].phone,
                    },
                    {
                        position: {
                            lat: culture[cultureSelectedNums[1]].y,
                            lng: culture[cultureSelectedNums[1]].x,
                        },
                        content: culture[cultureSelectedNums[1]].place_name,
                        imageUrl: "assets/images/bluestar4.png",
                        address_name:
                            culture[cultureSelectedNums[1]].road_address_name,
                        phone: culture[cultureSelectedNums[1]].phone,
                    },
                    {
                        position: {
                            lat: restaurant[restaurantSelectedNums[1]].y,
                            lng: restaurant[restaurantSelectedNums[1]].x,
                        },
                        content:
                            restaurant[restaurantSelectedNums[1]].place_name,
                        imageUrl: "assets/images/bluestar5.png",
                        address_name:
                            culture[restaurantSelectedNums[1]]
                                .road_address_name,
                        phone: culture[restaurantSelectedNums[1]].phone,
                    },
                ];

                const tempoval = `
                        A course :\n
                            - shop name: ${
                                culture[cultureSelectedNums[0]].place_name
                            }, category: ${
                    culture[cultureSelectedNums[0]].category_name
                }.\n
                            - shop name: ${
                                restaurant[restaurantSelectedNums[0]].place_name
                            }, category: ${
                    restaurant[restaurantSelectedNums[0]].category_name
                }.\n
                            - shop name: ${
                                cafe[cafeSelectedNums[0]].place_name
                            }, category: ${
                    cafe[cafeSelectedNums[0]].category_name
                }.\n
                            - shop name: ${
                                culture[cultureSelectedNums[1]].place_name
                            }, category: ${
                    culture[cultureSelectedNums[1]].category_name
                }.\n
                            - shop name: ${
                                restaurant[restaurantSelectedNums[1]].place_name
                            }, category: ${
                    restaurant[restaurantSelectedNums[1]].category_name
                }.\n
                    `;

                userInput += tempoval;
                lastInput = tempoval;
                for (let i = 0; i < newUrls.length; i++) {
                    urls.push({
                        url: newUrls[i],
                    });
                }

                setRecommendedRoutes((prev) => [...prev, newRoute]);
                setRecommendedRoutesMarkers((prev) => [...prev, newMarkers]);
                setOnCourseBtn((prev) => [...prev, false]);
            }
        },

        getDateCoursesWithDefaultNums: (defaultNums) => {
            for (let i = 0; i < defaultNums; i++) {
                handler.getAOneDateCourse();
            }
        },

        talkToChatGPT: async (condition) => {
            if (isDataReady) {
                setIsLoading(true);
                if (condition === "newRoutes") {
                    urls = [];
                    handler.getDateCoursesWithDefaultNums(3);
                } else if (condition === "addRoute") {
                    urls = [];
                    handler.getAOneDateCourse();
                }

                axios
                    .post(
                        "https://brown-flies-flow-121-135-160-141.loca.lt/crawling",
                        {
                            data: urls,
                        }
                    )
                    .then((res) => {
                        setCrawledData([...crawledData, ...res.data]);
                        return;
                    });

                const config = {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
                    },
                    body: JSON.stringify({
                        model: "gpt-3.5-turbo",
                        messages:
                            messages.current.length === 1
                                ? [
                                      {
                                          role: "user",
                                          content: defaultPrompt + userInput,
                                      },
                                  ]
                                : messages.current,

                        stream: true,
                        temperature: 0.5,
                    }),
                };

                await fetch(
                    "https://api.openai.com/v1/chat/completions",
                    config
                )
                    .then((r) => {
                        const reader = r.body.getReader();
                        const decoder = new TextDecoder("utf-8");
                        setIsLoading(false);
                        setIsTalkingStart(true);
                        return reader
                            .read()
                            .then(function processText({ done, value }) {
                                if (done) {
                                    setChatDone(true);
                                    setChunks((prev) => prev + `\n\n`);
                                    return;
                                }

                                let decodedTextList = decoder
                                    .decode(value)
                                    .split(`\n\n`)
                                    .slice(0, -1);

                                for (
                                    let i = 0;
                                    i < decodedTextList.length;
                                    i++
                                ) {
                                    const content =
                                        decodedTextList[i].split("data: ")[1];
                                    if (content === "[DONE]") {
                                        continue;
                                    }

                                    const response = JSON.parse(content);

                                    if (response?.choices?.length) {
                                        const delta = response.choices[0].delta;
                                        if (
                                            delta?.content &&
                                            delta?.content !== "\n\n"
                                        ) {
                                            setChunks(
                                                (prev) => prev + delta.content
                                            );

                                            setLastChunks(
                                                (prev) => prev + delta.content
                                            );
                                        }
                                    }
                                }
                                return reader.read().then(processText);
                            });
                    })
                    .catch((err) => console.log(err));
            }
        },
    };

    return (
        <>
            <div className="addr" ref={containerRef}>
                <div>
                    <button
                        style={{
                            width: "130px",
                            height: "40px",
                            backgroundColor: "white",
                            border: "1px solid black",
                            borderRadius: "5px",
                            cursor: "pointer",
                            fontSize: "18px",
                        }}
                        onClick={() => handler.onClick()}
                    >
                        주소검색
                    </button>
                    {openPostcode && (
                        <DaumPostcode
                            onComplete={(data) => handler.onComplete(data)}
                            autoClose={false}
                            defaultQuery="강남구 강남대로 156길 16"
                        />
                    )}
                </div>
                {
                    <div>
                        <p>주소 : {address}</p>
                        <div>
                            <>
                                <Script
                                    src={callKaKaoApi}
                                    strategy="beforeInteractive"
                                />
                                <Map
                                    center={{ lat, lng }}
                                    style={{ width: "420px", height: "420px" }}
                                    level={3}
                                    onCreate={setMap}
                                >
                                    {!showACenterMarker &&
                                        markersOfThisRoute &&
                                        markersOfThisRoute.map(
                                            (marker, index) => (
                                                <>
                                                    <MapMarker
                                                        key={index}
                                                        position={
                                                            marker.position
                                                        }
                                                        content={marker.content}
                                                        image={{
                                                            src: marker.imageUrl,
                                                            size: {
                                                                width: 33,
                                                                height: 33,
                                                            },
                                                        }}
                                                        onClick={() => {
                                                            if (
                                                                // isCrawlDone &&
                                                                crawledData
                                                            ) {
                                                                let menuData;

                                                                menuData =
                                                                    crawledData.filter(
                                                                        (v) =>
                                                                            v.title ===
                                                                            marker.content
                                                                    );

                                                                if (menuData) {
                                                                    let temp = [
                                                                        {
                                                                            content:
                                                                                marker.content,
                                                                            address_name:
                                                                                marker.address_name,
                                                                            phone: marker.phone,
                                                                            menu: menuData[0]
                                                                                ? menuData[0]
                                                                                      .menu
                                                                                : "",
                                                                            open: menuData[0]
                                                                                ? menuData[0]
                                                                                      .opening_time
                                                                                : "",
                                                                        },
                                                                    ];
                                                                    setInfo(
                                                                        temp
                                                                    );

                                                                    setInfoState(
                                                                        !infoState
                                                                    );
                                                                }
                                                            }
                                                        }}
                                                    >
                                                        {info !== null &&
                                                            infoState &&
                                                            info[0].content ===
                                                                marker.content && (
                                                                <div
                                                                    style={{
                                                                        width: "auto",
                                                                        height: "auto",
                                                                    }}
                                                                >
                                                                    <div className="place_name">
                                                                        {
                                                                            info[0]
                                                                                .content
                                                                        }
                                                                    </div>
                                                                    <div className="address">
                                                                        {
                                                                            info[0]
                                                                                .address_name
                                                                        }
                                                                    </div>
                                                                    <div className="phone">
                                                                        {
                                                                            info[0]
                                                                                .phone
                                                                        }
                                                                    </div>
                                                                    <div>
                                                                        {Object.keys(
                                                                            info[0]
                                                                                .menu
                                                                        ).map(
                                                                            (
                                                                                menuName
                                                                            ) => {
                                                                                return (
                                                                                    <div>
                                                                                        {
                                                                                            menuName
                                                                                        }

                                                                                        ,{" "}
                                                                                        {
                                                                                            info[0]
                                                                                                .menu[
                                                                                                menuName
                                                                                            ]
                                                                                        }{" "}
                                                                                        ₩
                                                                                    </div>
                                                                                );
                                                                            }
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        {info[0]
                                                                            .open
                                                                            ? info[0]
                                                                                  .open
                                                                            : "영업시간 정보 없음"}
                                                                    </div>
                                                                </div>
                                                            )}
                                                    </MapMarker>
                                                    <Polyline
                                                        path={[
                                                            [
                                                                {
                                                                    lat: markersOfThisRoute[0]
                                                                        .position
                                                                        .lat,
                                                                    lng: markersOfThisRoute[0]
                                                                        .position
                                                                        .lng,
                                                                },
                                                                {
                                                                    lat: markersOfThisRoute[1]
                                                                        .position
                                                                        .lat,
                                                                    lng: markersOfThisRoute[1]
                                                                        .position
                                                                        .lng,
                                                                },
                                                                {
                                                                    lat: markersOfThisRoute[2]
                                                                        .position
                                                                        .lat,
                                                                    lng: markersOfThisRoute[2]
                                                                        .position
                                                                        .lng,
                                                                },
                                                                {
                                                                    lat: markersOfThisRoute[3]
                                                                        .position
                                                                        .lat,
                                                                    lng: markersOfThisRoute[3]
                                                                        .position
                                                                        .lng,
                                                                },
                                                                {
                                                                    lat: markersOfThisRoute[4]
                                                                        .position
                                                                        .lat,
                                                                    lng: markersOfThisRoute[4]
                                                                        .position
                                                                        .lng,
                                                                },
                                                            ],
                                                        ]}
                                                        strokeColor="#1E90FF"
                                                        strokeOpacity={0.1}
                                                        strokeWeight={3}
                                                    />
                                                </>
                                            )
                                        )}

                                    {showACenterMarker && (
                                        <MapMarker
                                            position={{ lat, lng }}
                                            image={{
                                                src: "assets/images/bluestar.png",
                                                size: {
                                                    width: 33,
                                                    height: 33,
                                                },
                                            }}
                                        ></MapMarker>
                                    )}
                                </Map>
                            </>
                        </div>
                    </div>
                }

                <p></p>
                {
                    <button
                        style={{
                            width: "180px",
                            height: "40px",
                            backgroundColor: "white",
                            border: "1px solid black",
                            borderRadius: "5px",
                            cursor: "pointer",
                            fontSize: "18px",
                        }}
                        onClick={() => {
                            setChunks("");
                            setChatDone(false);
                            setFollowupQuestion("");
                            setIsTalkingStart(false);
                            setMarkers([]);
                            setRecommendedRoutes([]);
                            setRecommendedRoutesMarkers([]);
                            setMarkersOfThisRoute([]);
                            setOnCourseBtn([]);
                            setLastChunks("");
                            setInfo(null);
                            setCrawledData(null);
                            setShowACenterMarker(true);
                            setInfoState(false);

                            repeatCounter = 0;
                            userInput = ``;

                            messages.current = [
                                {
                                    role: "user",
                                    content: defaultPrompt,
                                },
                            ];

                            handler.talkToChatGPT("newRoutes");
                        }}
                    >
                        데이트 코스 추천받기
                    </button>
                }
                <p></p>
                <div
                    className="resultBox"
                    style={{
                        width: "450px",
                        whiteSpace: "pre-wrap",
                    }}
                >
                    {isLoading ? (
                        <img
                            src="assets/images/loading.gif"
                            alt="loading..."
                            style={{ width: "40px", height: "40px" }}
                        ></img>
                    ) : isTalkingStart ? (
                        chunks
                    ) : (
                        <img
                            style={{ width: "40px", height: "40px" }}
                            src="assets/images/listeningimage.png"
                        ></img>
                    )}
                </div>
                {chatDone && (
                    <div>
                        <div>
                            {!isCrawlDone && (
                                <div
                                    style={{
                                        width: "458px",
                                        height: "30px",
                                        color: "gray",
                                        fontSize: "12px",
                                        textAlign: "center",
                                        marginLeft: "5px",
                                        marginTop: "10px",
                                    }}
                                >
                                    동적 크롤링 중...
                                </div>
                            )}
                            <div
                                style={{
                                    width: "458px",
                                    height: "30px",
                                    border: "none",
                                    fontSize: "18px",
                                    textAlign: "center",
                                    marginLeft: "5px",
                                    marginTop: "10px",
                                }}
                            >
                                추천 코스
                            </div>
                            <div>
                                {recommendedRoutes.map((route, index) => (
                                    <div key={index}>
                                        <input
                                            className="courseOptions"
                                            type={"text"}
                                            style={{ cursor: "pointer" }}
                                            readOnly
                                            value={
                                                route
                                                    ? `${route[0]} > ${route[1]} > ${route[2]} > ${route[3]} > ${route[4]}`
                                                    : null
                                            }
                                            onClick={() => {
                                                let temp = [...onCourseBtn];
                                                temp[index] = !temp[index];
                                                setOnCourseBtn(temp);
                                            }}
                                        />

                                        {onCourseBtn[index] && (
                                            <div
                                                style={{
                                                    display: "flex",
                                                    flexDirection: "row",
                                                    justifyContent: "center",
                                                    width: "450px",
                                                    marginLeft: "10px",
                                                }}
                                            >
                                                <button
                                                    className="courseOptionsBtn"
                                                    onClick={async () => {
                                                        setMyCourse(
                                                            recommendedRoutes[
                                                                index
                                                            ]
                                                        );

                                                        let dateCourse = {
                                                            course: `${recommendedRoutesMarkers[index][0].content} -> ${recommendedRoutesMarkers[index][1].content} -> ${recommendedRoutesMarkers[index][2].content} -> ${recommendedRoutesMarkers[index][3].content} -> ${recommendedRoutesMarkers[index][4].content}`,
                                                            information: [
                                                                {
                                                                    position: {
                                                                        lat: recommendedRoutesMarkers[
                                                                            index
                                                                        ][0]
                                                                            .position
                                                                            .lat,
                                                                        lng: recommendedRoutesMarkers[
                                                                            index
                                                                        ][0]
                                                                            .position
                                                                            .lng,
                                                                    },
                                                                    content:
                                                                        recommendedRoutesMarkers[
                                                                            index
                                                                        ][0]
                                                                            .content,
                                                                    address_name:
                                                                        recommendedRoutesMarkers[
                                                                            index
                                                                        ][0]
                                                                            .address_name,
                                                                    phone: recommendedRoutesMarkers[
                                                                        index
                                                                    ][0].phone,
                                                                },
                                                                {
                                                                    position: {
                                                                        lat: recommendedRoutesMarkers[
                                                                            index
                                                                        ][1]
                                                                            .position
                                                                            .lat,
                                                                        lng: recommendedRoutesMarkers[
                                                                            index
                                                                        ][1]
                                                                            .position
                                                                            .lng,
                                                                    },
                                                                    content:
                                                                        recommendedRoutesMarkers[
                                                                            index
                                                                        ][1]
                                                                            .content,
                                                                    address_name:
                                                                        recommendedRoutesMarkers[
                                                                            index
                                                                        ][1]
                                                                            .address_name,
                                                                    phone: recommendedRoutesMarkers[
                                                                        index
                                                                    ][1].phone,
                                                                },
                                                                {
                                                                    position: {
                                                                        lat: recommendedRoutesMarkers[
                                                                            index
                                                                        ][2]
                                                                            .position
                                                                            .lat,
                                                                        lng: recommendedRoutesMarkers[
                                                                            index
                                                                        ][2]
                                                                            .position
                                                                            .lng,
                                                                    },
                                                                    content:
                                                                        recommendedRoutesMarkers[
                                                                            index
                                                                        ][2]
                                                                            .content,
                                                                    address_name:
                                                                        recommendedRoutesMarkers[
                                                                            index
                                                                        ][2]
                                                                            .address_name,
                                                                    phone: recommendedRoutesMarkers[
                                                                        index
                                                                    ][2].phone,
                                                                },
                                                                {
                                                                    position: {
                                                                        lat: recommendedRoutesMarkers[
                                                                            index
                                                                        ][3]
                                                                            .position
                                                                            .lat,
                                                                        lng: recommendedRoutesMarkers[
                                                                            index
                                                                        ][3]
                                                                            .position
                                                                            .lng,
                                                                    },
                                                                    content:
                                                                        recommendedRoutesMarkers[
                                                                            index
                                                                        ][3]
                                                                            .content,
                                                                    address_name:
                                                                        recommendedRoutesMarkers[
                                                                            index
                                                                        ][3]
                                                                            .address_name,
                                                                    phone: recommendedRoutesMarkers[
                                                                        index
                                                                    ][3].phone,
                                                                },
                                                                {
                                                                    position: {
                                                                        lat: recommendedRoutesMarkers[
                                                                            index
                                                                        ][4]
                                                                            .position
                                                                            .lat,
                                                                        lng: recommendedRoutesMarkers[
                                                                            index
                                                                        ][4]
                                                                            .position
                                                                            .lng,
                                                                    },
                                                                    content:
                                                                        recommendedRoutesMarkers[
                                                                            index
                                                                        ][4]
                                                                            .content,
                                                                    address_name:
                                                                        recommendedRoutesMarkers[
                                                                            index
                                                                        ][4]
                                                                            .address_name,
                                                                    phone: recommendedRoutesMarkers[
                                                                        index
                                                                    ][4].phone,
                                                                },
                                                            ],
                                                        };

                                                        await axios.post(
                                                            "https://brown-flies-flow-121-135-160-141.loca.lt/course/save",
                                                            { dateCourse }
                                                        );

                                                        alert(
                                                            "코스가 저장되었습니다."
                                                        );
                                                    }}
                                                >
                                                    데이트 코스 저장
                                                </button>
                                                <button
                                                    className="courseOptionsBtn"
                                                    onClick={() => {
                                                        setMarkersOfThisRoute(
                                                            recommendedRoutesMarkers[
                                                                index
                                                            ]
                                                        );
                                                        handler.onDrawRoute();
                                                        containerRef.current.scrollIntoView(
                                                            {
                                                                behavior:
                                                                    "smooth",
                                                                block: "start",
                                                            }
                                                        );
                                                    }}
                                                >
                                                    지도로 경로 확인
                                                </button>
                                                <button
                                                    className="courseOptionsBtn"
                                                    onClick={() => {
                                                        if (
                                                            messages.current[
                                                                messages.current
                                                                    .length - 1
                                                            ].role ===
                                                                "assistant" &&
                                                            messages.current[
                                                                messages.current
                                                                    .length - 1
                                                            ].content !==
                                                                lastChunks
                                                        ) {
                                                            messages.current.push(
                                                                {
                                                                    role: "assistant",
                                                                    content:
                                                                        lastChunks,
                                                                }
                                                            );
                                                        }

                                                        handler.removeAOneCourse(
                                                            index
                                                        );
                                                    }}
                                                >
                                                    경로 제거
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "row",
                                        justifyContent: "center",
                                        width: "450px",
                                    }}
                                >
                                    <button
                                        style={{
                                            width: "120px",
                                            height: "26px",
                                            backgroundColor: "white",
                                            border: "1px solid black",
                                            borderRadius: "5px",
                                            cursor: "pointer",
                                            fontSize: "15px",
                                            marginLeft: "15px",
                                            marginTop: "10px",
                                        }}
                                        onClick={() => {
                                            messages.current.push(
                                                {
                                                    role: "assistant",
                                                    content: lastChunks,
                                                },
                                                {
                                                    role: "user",
                                                    content:
                                                        `Recommend only one more new dating course with the data under "---", based on the format I've already provided. You should only use the 5 shop information that newly added at this time, and the order should be exactly as I suggested.  \n---\n` +
                                                        lastInput,
                                                }
                                            );

                                            repeatCounter = 0;
                                            setFollowupQuestion("");
                                            setIsTalkingStart(false);
                                            setLastChunks("");
                                            urls = [];
                                            setChatDone(false);
                                            return handler.talkToChatGPT(
                                                "addRoute"
                                            );
                                        }}
                                    >
                                        경로 추가
                                    </button>
                                </div>
                            </div>
                        </div>
                        <p></p>
                        <input
                            type="text"
                            onChange={handler.onChange}
                            value={followupQuestion}
                            style={{
                                width: "370px",
                                height: "30px",
                                fontSize: "18px",
                                marginLeft: "5px",
                            }}
                        />
                        <button
                            onClick={() => {
                                messages.current.push(
                                    {
                                        role: "assistant",
                                        content: lastChunks,
                                    },
                                    {
                                        role: "user",
                                        content: followupQuestion,
                                    }
                                );
                                repeatCounter = 0;
                                setLastChunks("");
                                setFollowupQuestion("");
                                setIsTalkingStart(false);
                                setChatDone(false);
                                return handler.talkToChatGPT("askQuestion");
                            }}
                            style={{
                                width: "80px",
                                height: "35px",
                                backgroundColor: "white",
                                border: "1px solid black",
                                borderRadius: "5px",
                                cursor: "pointer",
                                fontSize: "14px",
                                marginLeft: "5px",
                            }}
                        >
                            질문하기
                        </button>
                    </div>
                )}
                <style jsx>
                    {`
                        .courseOptionsBtn {
                            width: 120px;
                            height: 30px;
                            font-size: 14px;
                            margin: 5px;
                            background-color: #fff0f0;
                            border: 1px solid black;
                            border-radius: 5px;
                            cursor: pointer;
                        }

                        .courseOptions {
                            width: 450px;
                            height: 30px;
                            font-size: 14px;
                            margin: 5px;
                        }

                        .addr {
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            width: 100%;
                        }
                        .resultBox {
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;

                            border: 1px solid black;
                            margin: 10px;

                            background-color: #fff0f0;
                            border-radius: 10px;
                            box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);

                            padding: 12px;
                        }
                    `}
                </style>
            </div>
        </>
    );
};

export default GetUsersAddress;

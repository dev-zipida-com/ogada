import React, { useState, useEffect } from "react";
import DaumPostcode from "react-daum-postcode";
import { Map, MapMarker, Polyline } from "react-kakao-maps-sdk";
import Script from "next/script";
import axios from "axios";

const callKaKaoApi = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAOMAP_APPKEY}&libraries=services,clusterer&autoload=false`;

export default function AnotherUsersList() {
    const [map, setMap] = useState(null);

    const [info, setInfo] = useState(null);
    const [infoState, setInfoState] = useState(false);
    const [recommendedCourseList, setRecommendedCourseList] = useState([]);

    useEffect(() => {
        (async () => {
            const response = await axios.get(
                "https://brown-flies-flow-121-135-160-141.loca.lt/course"
            );
            setRecommendedCourseList(response.data);
        })();
    }, []);

    if (recommendedCourseList.length === 0) {
        return <div>Loading...</div>;
    }
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            {recommendedCourseList.map((route) => {
                const dateCourse = route.dateCourse;
                const createdAt = route.CreatedAt;
                const initial_lat = dateCourse.information[0].position.lat;
                const initial_lng = dateCourse.information[0].position.lng;

                const course = dateCourse.course;
                const marks = dateCourse.information;

                return (
                    <div
                        key={`maps-${route.id}`}
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",

                            width: "420px",
                            height: "420px",
                        }}
                    >
                        <Script
                            src={callKaKaoApi}
                            strategy="beforeInteractive"
                        />
                        <Map
                            center={{ lat: initial_lat, lng: initial_lng }}
                            style={{ width: "420px", height: "420px" }}
                            level={3}
                            onCreate={setMap}
                        >
                            {marks.map((marker, index) => (
                                <div key={`mapmarkers-${index}`}>
                                    <MapMarker
                                        key={index}
                                        position={marker.position}
                                        content={marker.content}
                                        image={{
                                            src: `assets/images/bluestar${
                                                index + 1
                                            }.png`,
                                            size: {
                                                width: 33,
                                                height: 33,
                                            },
                                        }}
                                        onClick={() => {
                                            setInfo(marker);
                                            setInfoState(!infoState);
                                        }}
                                    >
                                        {info &&
                                            info.content === marker.content &&
                                            infoState && (
                                                <div
                                                    style={{
                                                        width: "200px",
                                                        height: "60px",
                                                    }}
                                                >
                                                    <div className="place_name">
                                                        {info.content}
                                                    </div>
                                                    <div className="address">
                                                        {info.address_name}
                                                    </div>
                                                    <div className="phone">
                                                        {info.phone}
                                                    </div>
                                                </div>
                                            )}
                                    </MapMarker>
                                    <Polyline
                                        path={[
                                            [
                                                {
                                                    lat: marks[0].position.lat,
                                                    lng: marks[0].position.lng,
                                                },
                                                {
                                                    lat: marks[1].position.lat,
                                                    lng: marks[1].position.lng,
                                                },
                                                {
                                                    lat: marks[2].position.lat,
                                                    lng: marks[2].position.lng,
                                                },
                                                {
                                                    lat: marks[3].position.lat,
                                                    lng: marks[3].position.lng,
                                                },
                                                {
                                                    lat: marks[4].position.lat,
                                                    lng: marks[4].position.lng,
                                                },
                                            ],
                                        ]}
                                        strokeColor="#1E90FF"
                                        strokeOpacity={0.1}
                                        strokeWeight={3}
                                    />
                                </div>
                            ))}
                        </Map>
                        <br />
                        코스: {course} <br />
                        <br />
                        생성 일자: {new Date(createdAt).toLocaleString()}
                        <br />
                        ------------------------------------------------------------
                    </div>
                );
            })}
        </div>
    );
}

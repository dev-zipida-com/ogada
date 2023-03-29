import React, { useState, useEffect } from "react";
import { Map, MapMarker, Polyline } from "react-kakao-maps-sdk";
import axios from "axios";

// This component returns the list of recommended courses created by the users.
export default function AnotherUsersList() {
    const [info, setInfo] = useState(null);
    const [infoState, setInfoState] = useState(false);
    const [recommendedCourseList, setRecommendedCourseList] = useState([]);
    
    // The useEffect hook is used to get the list of recommended courses from the backend.
    useEffect(() => {
        (async () => {
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_BACKEND_API}/course`
            );
            setRecommendedCourseList(response.data);
        })();
    }, []);

    if (recommendedCourseList.length === 0) {
        return <div>Loading...</div>;
    }
    // The component returns a div containing the Map component and the necessary markers and polyline components,
    // As well as the click event handler for displaying information about a selected marker.
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
                        <Map
                            center={{ lat: initial_lat, lng: initial_lng }}
                            style={{ width: "420px", height: "420px" }}
                            level={3}
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
                                        key={"polylines" + index}
                                        path={[
                                            marks.map((mark) => {
                                                return {
                                                    lat: mark.position.lat,
                                                    lng: mark.position.lng,
                                                };
                                            }),
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

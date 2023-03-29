import { Map, MapMarker, Polyline } from "react-kakao-maps-sdk";
import { useSelector, useDispatch } from "react-redux";
import { useEffect, useState, useRef } from "react";
import * as mapActions from "@/lib/store/modules/map";

export default function Mapper() {
    const dispatch = useDispatch();

    const {
        centerPosition,
        markersList,
        attentionIndex,
        map,
        showACenter,
        crawledData,
    } = useSelector((state) => state.map);

    const markers = markersList[attentionIndex];

    const lat = centerPosition.lat;
    const lng = centerPosition.lng;

    const [info, setInfo] = useState(false);
    const [infoState, setInfoState] = useState(false);

    useEffect(() => {
        if (map && showACenter) {
            dispatch(mapActions.setCenterPosition({ lat, lng }));
        }
    }, [lat, lng]);

    return (
        <div>
            <Map
                center={{ lat, lng }}
                style={{ width: "420px", height: "420px" }}
                level={3}
                onCreate={(map) => {
                    dispatch(mapActions.setMap(map));
                }}
            >
                {!showACenter &&
                    markers !== undefined &&
                    markers.map((marker, index) => (
                        <>
                            <MapMarker
                                key={index}
                                position={marker.position}
                                content={marker.content}
                                image={{
                                    src: marker.imageUrl,
                                    size: {
                                        width: 33,
                                        height: 33,
                                    },
                                }}
                                onClick={() => {
                                    const cd = crawledData[attentionIndex];
                                    if (cd) {
                                        let menuData = cd.filter(
                                            (v) => v.title === marker.content
                                        );

                                        if (menuData) {
                                            let temp = [
                                                {
                                                    content: marker.content,
                                                    address_name:
                                                        marker.address_name,
                                                    phone: marker.phone,
                                                    menu: menuData[0]
                                                        ? menuData[0].menu
                                                        : "",
                                                    open: menuData[0]
                                                        ? menuData[0]
                                                              .opening_time
                                                        : "",
                                                },
                                            ];

                                            setInfo(temp);
                                            setInfoState(!infoState);
                                        } else {
                                            throw new Error(
                                                "failed to get menu data. Check Crawling API."
                                            );
                                        }
                                    } else {
                                        throw new Error("Crawling failed.");
                                    }
                                }}
                            >
                                {info !== null &&
                                    infoState &&
                                    info[0].content === marker.content && (
                                        <div
                                            style={{
                                                width: "auto",
                                                height: "auto",
                                            }}
                                            key={marker.content + ".a." + index}
                                        >
                                            <div className="place_name">
                                                {info[0].content}
                                            </div>
                                            <div className="address">
                                                {info[0].address_name}
                                            </div>
                                            <div className="phone">
                                                {info[0].phone}
                                            </div>
                                            <div key={info[0].content}>
                                                {Object.keys(info[0].menu).map(
                                                    (menuName) => {
                                                        return (
                                                            <div
                                                                key={
                                                                    "info" +
                                                                    menuName
                                                                }
                                                            >
                                                                {menuName},{" "}
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
                                            <div
                                                key={info[0].open + "infoOpen"}
                                            >
                                                {info[0].open
                                                    ? info[0].open
                                                    : "영업시간 정보 없음"}
                                            </div>
                                        </div>
                                    )}
                            </MapMarker>
                            <Polyline
                                key={"polylines" + index}
                                path={[
                                    markers.map((marker) => {
                                        return {
                                            lat: marker.position.lat,
                                            lng: marker.position.lng,
                                        };
                                    }),
                                ]}
                                strokeColor="#1E90FF"
                                strokeOpacity={0.1}
                                strokeWeight={3}
                            />
                        </>
                    ))}

                {showACenter && (
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
        </div>
    );
}

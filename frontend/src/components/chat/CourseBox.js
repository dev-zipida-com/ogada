import { forwardRef, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import * as mapActions from "@/lib/store/modules/map";
import axios from "axios";

const CourseBox = forwardRef((props, ref) => {
    // 기본적으로, useSelector를 사용해서 리덕스 스토어의 상태를 조회 할 땐 만약 상태가 바뀌지 않았으면 리렌더링하지 않습니다. == 상태 바뀌면 리렌더링하므로, useEffect 안에 넣으면 무한 렌더링 발생 가능성 있음.
    const {
        promptsList,
        urlsList,
        markersList,
        crawledData,
        isCrawlingDone,
        attentionIndex,
        map,
        address,
        showACenter,
        showInteractionPanel,
    } = useSelector((state) => state.map);

    const { message, isChatDone, initMUP } = useSelector(
        (state) => state.chatGPT
    );

    const [onCourseBtn, setOnCourseBtn] = useState([]);

    const dispatch = useDispatch();

    useEffect(() => {
        if (onCourseBtn.length !== markersList.length) {
            setOnCourseBtn(
                Array.from(
                    {
                        length: markersList.length,
                    },
                    (v) => false
                )
            );
        }
    }, [markersList, onCourseBtn]);

    function drawMarks(index) {
        if (showACenter) {
            dispatch(mapActions.setShowACenter(false));
        }

        const markers = markersList[index];
        const bounds = new kakao.maps.LatLngBounds();
        for (let i = 0; i < markers.length; i++) {
            bounds.extend(
                new kakao.maps.LatLng(
                    markers[i].position.lat,
                    markers[i].position.lng
                )
            );
        }

        map.setBounds(bounds);
        dispatch(mapActions.setMap(map));

        props.containerRef.current.scrollIntoView({
            behavior: "smooth",
            block: "start",
            inline: "nearest",
        });
    }

    function removeACourse(index) {
        if (markersList.length === 1) {
            alert("최소 1개의 코스를 선택해주세요.");
            return;
        }

        dispatch(mapActions.initMUP());

        const prevPrompts = [...promptsList];
        const prevUrls = [...urlsList];
        const prevMarkers = [...markersList];
        const prevCrawledData = [...crawledData];

        prevPrompts.splice(index, 1);
        prevUrls.splice(index, 1);
        prevMarkers.splice(index, 1);
        prevCrawledData.splice(index, 1);

        prevPrompts.map((prompt) => {
            dispatch(mapActions.setPromptsList(prompt));
        });

        prevUrls.map((url) => {
            dispatch(mapActions.setUrlsList(url));
        });

        prevMarkers.map((marker) => {
            dispatch(mapActions.setMarkersList(marker));
        });

        prevCrawledData.map((data) => {
            dispatch(mapActions.setCrawledData(data));
        });

        setOnCourseBtn((prevState) => {
            let newState = [...prevState];
            newState.splice(index, 1);
            return newState;
        });
    }

    return (
        <div>
            {isChatDone && (
                <div>
                    <div>
                        {!isCrawlingDone && address && (
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
                        {showInteractionPanel && (
                            <>
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
                                    {markersList.map((markers, index) => (
                                        <div key={index}>
                                            <input
                                                className="courseOptions"
                                                type={"text"}
                                                style={{
                                                    width: "450px",
                                                    height: "30px",
                                                    fontSize: "16px",
                                                    marginLeft: "5px",
                                                    marginTop: "10px",

                                                    border: onCourseBtn[index]
                                                        ? "2px solid black"
                                                        : "1px solid lightgray",
                                                    borderRadius: "5px",
                                                    cursor: "pointer",
                                                }}
                                                readOnly
                                                value={`${markers[0].content} > ${markers[1].content} > ${markers[2].content} > ${markers[3].content} > ${markers[4].content}`}
                                                onClick={() => {
                                                    // In React, when you call the useState hook to create a state variable,
                                                    // you get back an array with two items: the current state value and a function that you can use to update the state value.
                                                    // When you call this function with a new value,
                                                    // React will compare the new value with the current value and trigger a re-render only if the two values are different.
                                                    setOnCourseBtn(
                                                        (prevState) => {
                                                            let newState = [
                                                                ...prevState,
                                                            ];
                                                            newState.forEach(
                                                                (v, i) =>
                                                                    i === index
                                                                        ? (newState[
                                                                              i
                                                                          ] =
                                                                              !newState[
                                                                                  i
                                                                              ])
                                                                        : (newState[
                                                                              i
                                                                          ] = false)
                                                            );
                                                            return newState;
                                                        }
                                                    );
                                                }}
                                            />

                                            {onCourseBtn[index] && (
                                                <div
                                                    key={"onCourseBtn" + index}
                                                    style={{
                                                        display: "flex",
                                                        flexDirection: "row",
                                                        justifyContent:
                                                            "space-between",
                                                        width: "450px",
                                                        marginLeft: "10px",
                                                    }}
                                                >
                                                    <button
                                                        className="courseOptionsBtn"
                                                        style={{
                                                            display: "flex",
                                                            flexDirection:
                                                                "row",
                                                            alignItems:
                                                                "center",
                                                            justifyContent:
                                                                "center",

                                                            width: "150px",
                                                            height: "30px",
                                                            fontSize: "14px",
                                                            marginLeft: "5px",
                                                            marginTop: "10px",
                                                            backgroundColor:
                                                                "#FEF0EF",
                                                            borderRadius: "5px",
                                                            cursor: "pointer",
                                                        }}
                                                        onClick={async () => {
                                                            dispatch(
                                                                mapActions.setAttentionIndex(
                                                                    index
                                                                )
                                                            );

                                                            let dateCourse = {
                                                                course: `${markers[0].content} > ${markers[1].content} > ${markers[2].content} > ${markers[3].content} > ${markers[4].content}`,
                                                                information: [
                                                                    markers.map(
                                                                        (
                                                                            marker
                                                                        ) => {
                                                                            return {
                                                                                position:
                                                                                    {
                                                                                        lat: marker
                                                                                            .position
                                                                                            .lat,
                                                                                        lng: marker
                                                                                            .position
                                                                                            .lng,
                                                                                    },
                                                                                content:
                                                                                    marker.content,
                                                                                address_name:
                                                                                    marker.address_name,
                                                                                phone: marker.phone,
                                                                            };
                                                                        }
                                                                    ),
                                                                ],
                                                            };

                                                            dateCourse.information =
                                                                dateCourse.information[0];

                                                            const res =
                                                                await axios.post(
                                                                    `${process.env.NEXT_PUBLIC_BACKEND_API}/course/save`,
                                                                    {
                                                                        dateCourse,
                                                                    }
                                                                );

                                                            if (
                                                                res.status < 400
                                                            ) {
                                                                alert(
                                                                    "코스가 저장되었습니다."
                                                                );
                                                            } else {
                                                                alert(
                                                                    "코스 저장에 실패했습니다."
                                                                );
                                                                console.log(
                                                                    res
                                                                );
                                                            }
                                                        }}
                                                    >
                                                        데이트 코스 저장
                                                    </button>
                                                    <button
                                                        style={{
                                                            display: "flex",
                                                            flexDirection:
                                                                "row",
                                                            alignItems:
                                                                "center",
                                                            justifyContent:
                                                                "center",

                                                            width: "150px",
                                                            height: "30px",
                                                            fontSize: "15px",
                                                            marginLeft: "5px",
                                                            marginTop: "10px",
                                                            backgroundColor:
                                                                "#FEF0EF",
                                                            borderRadius: "5px",
                                                            cursor: "pointer",
                                                        }}
                                                        className="courseOptionsBtn"
                                                        onClick={() => {
                                                            dispatch(
                                                                mapActions.setAttentionIndex(
                                                                    index
                                                                )
                                                            );
                                                            drawMarks(index);
                                                        }}
                                                    >
                                                        지도로 경로 확인
                                                    </button>
                                                    <button
                                                        style={{
                                                            display: "flex",
                                                            flexDirection:
                                                                "row",
                                                            alignItems:
                                                                "center",
                                                            justifyContent:
                                                                "center",

                                                            width: "150px",
                                                            height: "30px",
                                                            fontSize: "14px",
                                                            marginLeft: "5px",
                                                            marginTop: "10px",
                                                            backgroundColor:
                                                                "#FEF0EF",
                                                            borderRadius: "5px",
                                                            cursor: "pointer",
                                                        }}
                                                        className="courseOptionsBtn"
                                                        onClick={() => {
                                                            removeACourse(
                                                                index
                                                            );

                                                            if (!showACenter) {
                                                                dispatch(
                                                                    mapActions.setShowACenter(
                                                                        true
                                                                    )
                                                                );
                                                            }
                                                        }}
                                                    >
                                                        경로 제거
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                    <p></p>
                </div>
            )}
        </div>
    );
});
CourseBox.displayName = "CourseBox";
export default CourseBox;

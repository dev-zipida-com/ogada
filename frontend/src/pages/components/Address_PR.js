/* eslint-disable @next/next/no-img-element */
// this is a GET request to get the address of the user using Daum Postcode API

import React, { useRef, useState, useEffect } from "react";
import DaumPostcode from "react-daum-postcode";
import { Map, MapMarker, Polyline } from "react-kakao-maps-sdk";
import axios from "axios";

import ChatGpt from "@/libs/chat-gpt";
import { PlaceService } from "@/libs/kakao-maps";
import KakaoMap from "./KakaoMap";

function suffleArray(list) {
  return [...list].sort(() => Math.random() - 0.5);
}

const sufflePlaceInfoList = (placeInfoList) => {
  let { culture, cafe, restaurant } = placeInfoList.reduce(
    (acc, place) => {
      if (place.category_group_name === "문화시설") {
        acc.culture.push(place);
      } else if (place.category_group_name === "음식점") {
        acc.restaurant.push(place);
      } else if (place.category_group_name === "카페") {
        acc.cafe.push(place);
      }
      return acc;
    },
    { culture: [], cafe: [], restaurant: [] }
  );

  const suffledCulture = suffleArray(culture);
  const suffledRestaurant = suffleArray(restaurant);
  const suffledCafe = suffleArray(cafe);

  const suffledPlaceList = [
    suffledCulture[0],
    suffledRestaurant[0],
    suffledCafe[0],
    suffledCulture[1],
    suffledRestaurant[1],
  ];

  const markers = [];
  const urls = [];
  const prompts = [];

  suffledPlaceList.forEach((place, i) => {
    markers.push({
      position: {
        lat: place.y,
        lng: place.x,
      },
      content: place.place_name,
      imageUrl: `assets/images/bluestar${i + 1}.png`,
      address_name: place.road_address_name,
      phone: place.phone,
    });

    urls.push({ url: place.place_url });
    prompts.push(
      `- shop name: ${place.place_name}, category: ${place.category_name}.`
    );
  });

  return { markers, urls, prompts };
};

const GetUsersAddress = () => {
  const { current: chatGpt } = useRef(new ChatGpt());

  const [isDataReady, setIsDataReady] = useState(false);
  const [placeInfoList, setPlaceInfoList] = useState([]);

  const [openPostcode, setOpenPostcode] = useState(false);
  const [location, setLocation] = useState({
    address: "서울 강남구 강남대로 156길 16",
    lat: 37.5181062174467,
    lng: 127.020528914698,
  });

  const [map, setMap] = useState();

  const [isLoading, setIsLoading] = useState(false);
  const [chatDone, setChatDone] = useState(false);
  const [chunks, setChunks] = useState("");

  const [recommendedRoutesMarkers, setRecommendedRoutesMarkers] = useState([]);

  const [showACenterMarker, setShowACenterMarker] = useState(true);
  const [selectedMarker, setSelecterMarker] = useState(null);
  const [markersOfThisRoute, setMarkersOfThisRoute] = useState([]);

  const [myCourse, setMyCourse] = useState("");

  const [isCrawlDone, setIsCrawlDone] = useState(false);
  const [crawledData, setCrawledData] = useState([]);

  const [followupQuestion, setFollowupQuestion] = useState("");
  const [onCourseBtn, setOnCourseBtn] = useState([]);

  const containerRef = useRef();

  useEffect(() => {
    handler.handleCompletePostCode(location.address);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    containerRef.current.scrollIntoView({
      // behavior: "smooth",
      block: "end",
      inline: "nearest",
    });
  }, [chunks]);

  const handler = {
    handleDrawRoute: (routesMarkers) => {
      if (!isDataReady) return;

      const bounds = new kakao.maps.LatLngBounds();
      routesMarkers.forEach((marker) => {
        bounds.extend(new kakao.maps.LatLng(marker.y, marker.x));
      });

      setMarkersOfThisRoute(routesMarkers);

      setShowACenterMarker(false);

      containerRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    },
    handleCompletePostCode: async (address) => {
      setOpenPostcode(false);

      setIsDataReady(false);

      const { lat, lng } = await axios
        .post("/api/user/map/getUsersPosition", {
          address,
        })
        .then((res) => res.data);

      setLocation({ address, lat, lng });

      const placeInfoPlist = await fetchPlaceInfoList(address);
      setPlaceInfoList(placeInfoPlist.flat());

      setIsDataReady(true);
    },
    handleChangeFollowupQuestion: (e) => {
      setFollowupQuestion(e.target.value);
    },
    handleRemoveAOneCourse: (index) => {
      if (recommendedRoutesMarkers.length === 1) {
        alert("최소 한 개의 코스를 선택해주세요.");
        return;
      }

      setRecommendedRoutesMarkers((prev) => prev.filter((_, i) => i !== index));
    },
    handleSaveMyCourse: async (routesMarkers) => {
      setMyCourse(routesMarkers.content);

      await axios.post(
        "https://brown-flies-flow-121-135-160-141.loca.lt/course/save",
        {
          dateCourse: {
            course: routesMarkers.map((marker) => marker.content).join(" -> "),
            information: routesMarkers.map((marker) => {
              return {
                position: {
                  lat: marker.position.lat,
                  lng: marker.position.lng,
                },
                content: marker.content,
                address_name: marker.address_name,
                phone: marker.phone,
              };
            }),
          },
        }
      );

      alert("코스가 저장되었습니다.");
    },
  };

  const fetchPlaceInfoList = async (address) => {
    if (!address) {
      return Promise.resolve([]);
    }

    const KEYWORDS = [
      "맛집",
      "카페",
      "영화관",
      "미술관",
      "박물관",
      "공원",
      "공연장",
    ];

    try {
      const placeService = new PlaceService(map);

      return Promise.all(
        KEYWORDS.map(async (keyword, i) => {
          const placeList = await placeService.search(
            `${address} 주변 ${keyword}`
          );

          const limit = i < 2 ? 14 : 6;
          const eachDataLen = Math.min(placeList.length, limit);

          return placeList
            .slice(0, eachDataLen)
            .filter((item) => !item.place_name.includes("휴업"));
        })
      );
    } catch (e) {
      console.error(`${e}`);
      return Promise.resolve([]);
    }
  };

  const talkToChatGPT = async (condition) => {
    if (!isDataReady) {
      return;
    }

    let newMarkers = [];
    let placeUrls = [];
    let userInputs = [];

    if (condition === "newRoutes") {
      chatGpt.reset();
      setChunks("");

      for (let i = 0; i < 3; i += 1) {
        const place = sufflePlaceInfoList(placeInfoList);

        newMarkers.push(place.markers);
        placeUrls.push(...place.urls);
        userInputs.push(...place.prompts);
      }

      setRecommendedRoutesMarkers(newMarkers);
      setOnCourseBtn([false, false, false]);

      chatGpt.setDefaultMessage(userInputs.join("\n"));
    } else if (condition === "addRoute") {
      const place = sufflePlaceInfoList(placeInfoList);

      newMarkers = place.markers;
      placeUrls = place.urls;
      userInputs = place.prompts;

      setRecommendedRoutesMarkers((prev) => [...prev, newMarkers]);
      setOnCourseBtn((prev) => [...prev, false]);

      chatGpt.addRecomandationMessage(userInputs.join("\n"));
    } else if (condition === "askQuestion") {
      chatGpt.addRecomandationMessage(followupQuestion);
    }

    /////////////////////////// 1. start crawling ///////////////////////////
    setIsCrawlDone(false);
    setCrawledData(null);
    axios
      .post("https://brown-flies-flow-121-135-160-141.loca.lt/crawling", {
        data: placeUrls,
      })
      .then((res) => {
        setCrawledData((prev) => [...prev, ...res.data]);
        setIsCrawlDone(true);
        return res;
      })
      .catch(console.error);

    /////////////////////////// 2. ask question ///////////////////////////
    setIsLoading(true);

    const decoder = new TextDecoder("utf-8");
    const answer = await chatGpt.askQuestion();

    setIsLoading(false);

    /////////////////////////// 3. read answer ///////////////////////////
    setChatDone(false);

    let currentChunk = "";
    while (true) {
      const { value, done } = await answer.read();
      if (done) {
        setChatDone(true);
        setChunks((prev) => prev + "\n\n");
        chatGpt.addAssistantMessage(currentChunk);
        break;
      }

      const text = decoder.decode(value).split(`\n\n`).at(0);

      const data = text.split("data: ")[1];
      if (data === "[DONE]") {
        return;
      }

      const response = JSON.parse(data);
      const content = response.choices?.[0]?.delta?.content;

      if (content && content !== "\n\n") {
        setChunks((prev) => prev + words);
        currentChunk += content;
      }
    }
  };

  return (
    <>
      <div className="wrapper" ref={containerRef}>
        <section>
          <button
            className="default-btn"
            style={{ width: "130px", height: "40px", fontSize: "18px" }}
            onClick={() => {
              setOpenPostcode(!openPostcode);
            }}
          >
            주소검색
          </button>
          {openPostcode && (
            <DaumPostcode
              onComplete={(data) => {
                handler.handleCompletePostCode(data.address);
                setOpenPostcode(false);
              }}
              autoClose={false}
              defaultQuery="강남구 강남대로 156길 16"
            />
          )}
        </section>
        <section>
          <p>주소 : {location.address}</p>
          <KakaoMap
            center={{ lat: location.lat, lng: location.lng }}
            onCreate={(map) => setMap(map)}
            showACenterMarker={showACenterMarker}
            markers={markersOfThisRoute}
            selectedMarker={selectedMarker}
            onMarkerClick={(marker) => {
              const menuData = crawledData?.find(
                (v) => v.title === marker.content
              );

              setSelecterMarker({
                content: marker.content,
                address_name: marker.address_name,
                phone: marker.phone,
                menu: menuData?.menu,
                open: menuData?.opening_time,
              });
            }}
          />
        </section>
        <section>
          <button
            className="default-btn"
            style={{ width: "180px", height: "40px", fontSize: "18px" }}
            onClick={() => {
              setMarkersOfThisRoute([]);
              setSelecterMarker(null);
              setShowACenterMarker(true);

              talkToChatGPT("newRoutes");
            }}
          >
            데이트 코스 추천받기
          </button>
          <div className="result-box">
            {isLoading ? (
              <img
                src="assets/images/loading.gif"
                alt="loading..."
                style={{ width: "40px", height: "40px" }}
              />
            ) : (
              chunks || (
                <img
                  style={{ width: "40px", height: "40px" }}
                  alt="listening..."
                  src="assets/images/listeningimage.png"
                />
              )
            )}
          </div>
        </section>
        {!isCrawlDone && (
          <section
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
          </section>
        )}
        {chatDone && (
          <>
            <section>
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
              {recommendedRoutesMarkers.map((routesMarkers, index) => {
                return (
                  <div key={index}>
                    <input
                      className="course-option"
                      type={"text"}
                      style={{ cursor: "pointer" }}
                      readOnly
                      value={routesMarkers?.map((v) => v.content).join(" -> ")}
                      onClick={() => {
                        setOnCourseBtn((prev) =>
                          prev.map((open, i) => (i === index ? !open : open))
                        );
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
                          className="default-btn course-option-btn"
                          onClick={() =>
                            handler.handleSaveMyCourse(routesMarkers)
                          }
                        >
                          데이트 코스 저장
                        </button>
                        <button
                          className="default-btn course-option-btn"
                          onClick={() => {
                            handler.handleDrawRoute(routesMarkers);
                          }}
                        >
                          지도로 경로 확인
                        </button>
                        <button
                          className="default-btn course-option-btn"
                          onClick={() => {
                            handler.handleRemoveAOneCourse(index);
                          }}
                        >
                          경로 제거
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "center",
                  width: "450px",
                }}
              >
                <button
                  className="default-btn"
                  style={{
                    width: "120px",
                    height: "26px",
                    marginLeft: "15px",
                    marginTop: "10px",
                  }}
                  onClick={() => {
                    talkToChatGPT("addRoute");
                  }}
                >
                  경로 추가
                </button>
              </div>
            </section>
            <section>
              <input
                type="text"
                onChange={() => {
                  handler.handleChangeFollowupQuestion();
                }}
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
                  talkToChatGPT("askQuestion");
                }}
                className="default-btn"
                style={{
                  width: "80px",
                  height: "35px",
                  marginLeft: "5px",
                }}
              >
                질문하기
              </button>
            </section>
          </>
        )}
        <style jsx>{`
          .wrapper {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            gap: 25px;
          }
          .default-btn {
            background-color: white;
            border: 1px solid black;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
          }
          .course-option-btn {
            width: 120px;
            height: 30px;
            font-size: 14px;
            margin: 5px;
          }
          .course-option {
            width: 450px;
            height: 30px;
            font-size: 14px;
            margin: 5px;
          }
          .result-box {
            display: flex;
            flex-direction: column;
            align-items: center;

            border: 1px solid black;
            margin: 10px;

            background-color: #fff0f0;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);

            padding: 12px;
            width: 450px;
            white-space: pre-wrap;
          }
        `}</style>
      </div>
    </>
  );
};

export default GetUsersAddress;

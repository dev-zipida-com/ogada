import { Map, MapMarker, Polyline } from "react-kakao-maps-sdk";

export default function KakaoMap({
  center,
  onCreate,
  showACenterMarker,
  markers,
  selectedMarker,
  onMarkerClick,
}) {
  return (
    <Map
      center={center}
      style={{ width: "420px", height: "420px" }}
      level={3}
      onCreate={onCreate}
    >
      {markers?.map((marker, index) => (
        <>
          <MapMarker
            key={index}
            position={marker.position}
            content={marker.content}
            image={{
              src: marker.imageUrl,
              size: { width: 33, height: 33 },
            }}
            onClick={() => {
              onMarkerClick(marker);
            }}
          >
            {selectedMarker?.content === marker.content && (
              <div style={{ width: "auto", height: "auto" }}>
                <div className="place_name">{selectedMarker.content}</div>
                <div className="address">{selectedMarker.address_name}</div>
                <div className="phone">{selectedMarker.phone}</div>
                <div>
                  {selectedMarker.menu &&
                    Object.entries(selectedMarker.menu).map(
                      ([menuName, price]) => {
                        return (
                          <div key={`${menuName}${price}`}>
                            {menuName}, {price} ₩
                          </div>
                        );
                      }
                    )}
                </div>
                <div>{selectedMarker.open || "영업시간 정보 없음"}</div>
              </div>
            )}
          </MapMarker>
          <Polyline
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
      {showACenterMarker && (
        <MapMarker
          position={center}
          image={{
            src: "assets/images/bluestar.png",
            size: { width: 33, height: 33 },
          }}
        />
      )}
    </Map>
  );
}

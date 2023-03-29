import React, { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import * as mapActions from "@/lib/store/modules/map";
import DaumPostcode from "react-daum-postcode";
import setCoordinationOnStore from "@/lib/setCoordinationOnStore";
import getPlaceInfoList from "@/lib/getPlaceInfoList";
import { useSelector } from "react-redux";

export default function SearchAddress() {
    const dispatch = useDispatch();
    const [openPostcode, setOpenPostcode] = useState(false);
    const { map } = useSelector((state) => state.map);

    return (
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
                onClick={() => {
                    setOpenPostcode(!openPostcode);
                }}
            >
                주소검색
            </button>
            {openPostcode && (
                <DaumPostcode
                    onComplete={async (data) => {
                        dispatch(mapActions.setMapData(data));
                        dispatch(mapActions.setAddress(data.address));
                        const { lat, lng } = await setCoordinationOnStore(
                            data.address
                        );
                        dispatch(mapActions.setCenterPosition({ lat, lng }));
                        const placeInfoList = await getPlaceInfoList(
                            data.address,
                            map
                        );

                        dispatch(mapActions.setPlaceInfoList(placeInfoList));
                        setOpenPostcode(false);
                    }}
                    autoClose={false}
                    defaultQuery="강남구 강남대로 156길 16"
                />
            )}
        </div>
    );
}

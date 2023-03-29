import React, { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import * as mapActions from "@/lib/store/modules/map";
import DaumPostcode from "react-daum-postcode";
import setCoordinationOnStore from "@/lib/setCoordinationOnStore";
import getPlaceInfoList from "@/lib/getPlaceInfoList";
import { useSelector } from "react-redux";

// a React component called "SearchAddress" that allows the user to search for a location using a postcode (zipcode) lookup service provided by Daum Postcode.
export default function SearchAddress() {
    const dispatch = useDispatch();
    const [openPostcode, setOpenPostcode] = useState(false);
    const { map } = useSelector((state) => state.map);

    // When the user clicks on the "주소검색" (search address) button, the onClick event handler is triggered, either displaying or hiding the DaumPostcode component.
    // If the DaumPostcode component is displayed, the user can search for a location using the postcode lookup service provided by Daum Postcode.
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

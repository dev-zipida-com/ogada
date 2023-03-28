// import * as mapActions from "@/lib/store/modules/map";
// import * as chatGPTActions from "@/lib/store/modules/chatGPT";

// import { useDispatch } from "react-redux";

// export default function setInitializationOnStore() {
//     const dispatch = useDispatch();

//     function init() {
//         dispatch(mapActions.setAddress(""));
//         dispatch(mapActions.setMap(null));
//         dispatch(mapActions.setPlaceInfoList([]));
//         dispatch(mapActions.setPromptsList([]));
//         dispatch(mapActions.setUrlsList([]));
//         dispatch(mapActions.setMarkersList([]));
//         dispatch(mapActions.setCenterPosition({ lat: 0, lng: 0 }));
//         dispatch(mapActions.setShowACenter(true));
//         dispatch(mapActions.setAttentionIndex(null));
//         dispatch(mapActions.setCrawledData([]));
//         dispatch(mapActions.setMapData([]));

//         dispatch(chatGPTActions.init());
//     }

//     init();
// }

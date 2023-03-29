export default async function getPlaceInfoList(address, map) {
    const service = new kakao.maps.services.Places(map);
    const keywords = [
        address + " 주변 맛집",
        address + " 주변 카페",
        address + " 주변 영화관",
        address + " 주변 미술관",
        address + " 주변 박물관",
        address + " 주변 공원",
        address + " 주변 공연장",
    ];

    return await Promise.all(
        keywords.map((keyword) => {
            return new Promise((resolve, reject) => {
                service.keywordSearch(keyword, (data, status) => {
                    if (status === kakao.maps.services.Status.ERROR) {
                        resolve(null);
                    } else {
                        resolve(data);
                    }
                });
            });
        })
    );
}

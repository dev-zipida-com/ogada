export class PlaceService {
  constructor(map) {
    this.map = map;
    this.service = new kakao.maps.services.Places(map);
  }

  search(keyword) {
    return new Promise((resolve, reject) => {
      this.service.keywordSearch(keyword, (data, status) => {
        if (status === kakao.maps.services.Status.ERROR) {
          resolve(null);
        } else {
          resolve(data);
        }
      });
    });
  }
}

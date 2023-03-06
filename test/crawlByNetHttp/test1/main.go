package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/PuerkitoBio/goquery"
)

func main() {
	urls, err := getCrawlingUrls(fmt.Sprintf("https://m.map.naver.com/search2/search.naver?query=%s&sm=hty&style=v5", "맛집"))
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println(urls)
}

func getCrawlingUrls(url string) ([]string, error) {

	// HTTP 클라이언트 생성
	client := &http.Client{}

	// 요청 생성
	req, err := http.NewRequest("GET", "https://www.example.com", nil)
	if err != nil {
		log.Fatal(err)
	}

	// User-Agent 헤더 설정
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36")

	// 요청 전송
	res, err := client.Do(req)
	if err != nil {
		log.Fatal(err)
	}
	defer res.Body.Close()

	// HTTP 응답 코드 확인
	if res.StatusCode != http.StatusOK {
		log.Fatalf("Unexpected status code: %d", res.StatusCode)
	}

	// goquery로 HTML 파싱
	doc, err := goquery.NewDocumentFromReader(res.Body)
	if err != nil {
		return nil, err
	}

	// 결과를 저장할 url 슬라이스 생성
	var urls []string

	doc.Find("#ct > div.search_listview._content._ctList > ul > li").Each(func(i int, s *goquery.Selection) {
		if dataID, exists := s.Attr("data-id"); exists {
			url := "https://m.place.naver.com/restaurant/" + dataID
			urls = append(urls, url)
		}
	})
	// li:nth-child(1) 태그의 data-id 속성을 가져와서 url 슬라이스에 추가
	// if dataID, exists := doc.Find("#ct > div.search_listview._content._ctList > ul > li:nth-child(1)").Attr("data-id"); exists {
	// 	url := "https://m.place.naver.com/restaurant/" + dataID
	// 	urls = append(urls, url)
	// } else {
	// 	fmt.Println("not exists")
	// }

	return urls, nil
}

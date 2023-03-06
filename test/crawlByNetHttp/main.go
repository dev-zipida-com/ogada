package main

import (
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/PuerkitoBio/goquery"
)

type Restaurant struct {
	URL      string
	Title    string
	Category string
	Location string
	Image    string
	Phone    string
	Context  string
	Menu     map[string]string
}

func main() {
	keyword := "맛집"
	urls, err := getCrawlingUrls(fmt.Sprintf("https://m.map.naver.com/search2/search.naver?query=%s&sm=hty&style=v5", keyword))
	if err != nil {
		log.Fatal(err)
	}

	for _, url := range urls {
		fmt.Println(url)
	}
}

func getCrawlingUrls(url string) ([]string, error) {
	// 웹 페이지 요청
	res, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	// goquery로 HTML 파싱
	doc, err := goquery.NewDocumentFromReader(res.Body)
	if err != nil {
		return nil, err
	}

	// 결과를 저장할 url 슬라이스 생성
	var urls []string

	// li 태그의 data-id 속성을 가져와서 url 슬라이스에 추가
	doc.Find("#ct > div.search_listview._content._ctList > ul > li").Each(func(i int, s *goquery.Selection) {
		if dataID, exists := s.Attr("data-id"); exists {
			url := "https://m.place.naver.com/restaurant/" + dataID
			urls = append(urls, url)
		}
	})

	return urls, nil
}

func CrawlerByURL(url string, ch chan Restaurant) {
	// 웹 페이지 요청
	res, err := http.Get(url)
	if err != nil {
		log.Fatal(err)
	}
	defer res.Body.Close()

	// goquery로 HTML 파싱
	doc, err := goquery.NewDocumentFromReader(res.Body)
	if err != nil {
		log.Fatal(err)
	}

	// 제목 파싱
	title := doc.Find("#_title > span.Fc1rA").Text()

	// 카테고리 파싱
	category := doc.Find("#_title > span.DJJvD").Text()

	// 주소 파싱
	address := doc.Find("#app-root > div > div > div > div:nth-child(6) > div > div.place_section.no_margin.vKA6F > div > div > div.O8qbU.tQY7D > div > a > span.LDgIH").Text()
	// 주소에서 공백 제거
	address = strings.TrimSpace(address)

	// 전화번호 파싱
	phone := doc.Find("#app-root > div > div > div > div:nth-child(6) > div > div.place_section.no_margin.vKA6F > div > div > div.O8qbU.nbXkr > div > span.xlx7Q").Text()

	// 결과 출력
	fmt.Println("------------------------------------------")
	fmt.Println("Title:", title)
	fmt.Println("Category:", category)
	fmt.Println("Address:", address)
	fmt.Println("Phone:", phone)
}

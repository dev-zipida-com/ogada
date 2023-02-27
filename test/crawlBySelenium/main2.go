package main

import (
	"fmt"
	"time"

	"github.com/tebeka/selenium"
	"github.com/tebeka/selenium/chrome"
)

func main() {
	// Chrome 옵션 설정
	opts := []selenium.ServiceOption{}
	chromeCaps := chrome.Capabilities{
		Path: "",
		Args: []string{
			"--headless",                      // 브라우저 창 숨기기
			"--no-sandbox",                    // 샌드박스 모드 비활성화
			"--disable-gpu",                   // GPU 가속 사용 안 함
			"--disable-dev-shm-usage",         // dev/shm 사용 안 함
			"--disable-web-security",          // CORS 에러 해결
			"--disable-site-isolation-trials", // 사이트 격리 기능 비활성화
		},
	}
	caps := selenium.Capabilities{"browserName": "chrome", "chromeOptions": &chromeCaps}

	// Chrome 실행
	service, err := selenium.NewChromeDriverService("chromedriver", 9515, opts...)
	if err != nil {
		panic(err)
	}
	defer service.Stop()

	wd, err := selenium.NewRemote(caps, fmt.Sprintf("http://localhost:%d/wd/hub", 9515))
	if err != nil {
		panic(err)
	}
	defer wd.Quit()

	// Set up search keywords
	keywords := []string{"강남역 맛집", "홍대 맛집", "이태원 맛집"}

	// Search on Naver Maps for each keyword
	for _, keyword := range keywords {
		fmt.Println("Searching for", keyword)
		naverMapSearchURL := fmt.Sprintf("https://m.map.naver.com/search2/search.naver?query=%s&sm=hty&style=v5", keyword)

		if err := wd.Get(naverMapSearchURL); err != nil {
			panic(err)
		}

		time.Sleep(3 * time.Second)
		for i := 1; i <= 10; i++ {
			cssSelector := fmt.Sprintf("#ct > div.search_listview._content._ctList > ul > li:nth-child(%d) > div.item_info > a.a_item.a_item_distance._linkSiteview", i)
			element, err := wd.FindElement(selenium.ByCSSSelector, cssSelector)
			if err != nil {
				fmt.Println("No search results found")
				continue
			}

			dataCID, err := element.GetAttribute("data-cid")
			if err != nil {
				panic(err)
			}

			naverMapURL := fmt.Sprintf("https://m.place.naver.com/restaurant/%s", dataCID)
			fmt.Println("Naver Map URL:", naverMapURL)

			cssSelector = fmt.Sprintf("#ct > div.search_listview._content._ctList > ul > li:nth-child(%d) > div.item_info > a.a_item.a_item_distance._linkSiteview > div.item_tit._title > strong", i)
			title, err := wd.FindElement(selenium.ByCSSSelector, cssSelector)
			if err != nil {
				fmt.Println("No search results found")
				continue
			}
			titleText, err := title.Text()
			if err != nil {
				fmt.Println("Failed to get category text")
				continue
			}
			fmt.Println("상호명:", titleText)

			cssSelector = fmt.Sprintf("#ct > div.search_listview._content._ctList > ul > li:nth-child(%d) > div.item_info > a.a_item.a_item_distance._linkSiteview > div.item_tit._title > em", i)
			category, err := wd.FindElement(selenium.ByCSSSelector, cssSelector)
			if err != nil {
				fmt.Println("No search results found")
				continue
			}
			categoryText, err := category.Text()
			if err != nil {
				fmt.Println("Failed to get category text")
				continue
			}
			fmt.Println("카테고리:", categoryText)
		}
		fmt.Println()

	}
}

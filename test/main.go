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

	// 네이버 지도 접속
	if err := wd.Get("https://pcmap.place.naver.com/restaurant/list?query=%EC%8B%A0%EC%82%AC%EC%97%AD%20%EB%A7%9B%EC%A7%91&keywordFilter=rank%5E%EB%A7%8E%EC%9D%B4%EC%B0%BE%EB%8A%94"); err != nil {
		panic(err)
	}
	time.Sleep(5 * time.Second) // 페이지 로딩을 위해 5초 기다림

	// 신사역 맛집 리스트 추출
	elements, err := wd.FindElements(selenium.ByCSSSelector, "span.place_bluelink.TYaxT")
	if err != nil {
		panic(err)
	}
	categorys, err := wd.FindElements(selenium.ByCSSSelector, "span.KCMnt")
	if err != nil {
		panic(err)
	}

	fmt.Printf("총 %d개의 맛집을 찾았습니다.\n", len(elements))

	for i, el := range elements {
		category, err := categorys[i].Text()
		if err != nil {
			panic(err)
		}
		name, err := el.Text()
		if err != nil {
			panic(err)
		}

		fmt.Printf("%d. %s : %s\n", i+1, name, category)
	}
}

package main

import (
	"context"
	"errors"
	"fmt"
	"log"
	"strings"
	"sync"

	"github.com/chromedp/chromedp"
)

type ThumbNail struct {
	Title       string
	OpeningTime string
	Menu        map[string]string
}

func CrawlerByURL(url string, ch chan ThumbNail, ctx context.Context) {
	// 새로운 탭 생성
	ctx, cancel := chromedp.NewContext(ctx)
	defer cancel()

	// timeout, cancel := context.WithTimeout(ctx, 3*time.Second)
	// defer cancel()
	// Navigate 함수의 콜백 함수에서 응답 코드 확인 및 새로고침
	if err := chromedp.Run(ctx,
		chromedp.Navigate(url),
	); err != nil {
		log.Fatalln(err)
	}

	// Extract the desired value from the page
	var openingTime, title string
	err := chromedp.Run(ctx,
		chromedp.WaitVisible("#mArticle > div.cont_essential > div.details_placeinfo > div:nth-child(3) > div > div.location_present > ul > li > span"),
		chromedp.Text("#mArticle > div.cont_essential > div:nth-child(1) > div.place_details > div > h2", &title),
		chromedp.Text("#mArticle > div.cont_essential > div.details_placeinfo > div:nth-child(3) > div > div.location_present > ul > li > span", &openingTime),
	)
	CheckErr(err)

	menu := make(map[string]string)
	size := 0

	if err := chromedp.Run(ctx,
		chromedp.Evaluate(`document.querySelectorAll("#mArticle > div.cont_menu > ul > li").length`, &size),
	); err != nil {
		log.Fatal(err)
	}
	fmt.Println(size)
	for i := 1; i <= size; i++ {
		var name, price string
		// #mArticle > div.cont_menu > ul > li:nth-child(1) > div > span
		nameSelector := fmt.Sprintf("#mArticle > div.cont_menu > ul > li:nth-child(%d) > div > span", i)
		priceSelector := fmt.Sprintf("#mArticle > div.cont_menu > ul > li:nth-child(%d) > div > em.price_menu", i)
		// #mArticle > div.cont_menu > ul > li:nth-child(1) > div > em.price_menu
		err := chromedp.Run(ctx,
			chromedp.Text(nameSelector, &name),
			chromedp.Text(priceSelector, &price),
		)
		CheckErr(err)

		if name != "" && price != "" {
			menu[name] = RemoveString(price)
		}
	}

	ch <- ThumbNail{Title: title, Menu: menu}
}

func CheckErr(err error) {
	if err != nil {
		if !errors.Is(err, context.DeadlineExceeded) {
			fmt.Printf("에러발생")
			log.Fatal(err)
		}
	}
}

func RemoveString(str string) string {
	// Remove "가격:" and "\n"
	price := strings.ReplaceAll(str, "가격:", "")
	price = strings.ReplaceAll(price, "\n", "")

	return price
}

func main() {
	opts := append(chromedp.DefaultExecAllocatorOptions[:],
		chromedp.Flag("headless", false),
		chromedp.Flag("no-sandbox", true),
		chromedp.Flag("disable-gpu", true),
		chromedp.Flag("disable-dev-shm-usage", true),
		chromedp.Flag("disable-web-security", true),
		chromedp.Flag("disable-site-isolation-trials", true),
		chromedp.Flag("blink-settings", "imagesEnabled=false, cssEnabled=false"),
	)
	// Chrome 실행
	ctx, cancel := chromedp.NewExecAllocator(context.Background(), opts...)
	defer cancel()

	ctx, cancel = chromedp.NewContext(ctx)
	defer cancel()

	if err := chromedp.Run(ctx,
		chromedp.Navigate("about:blank"),
	); err != nil {
		log.Fatal(err)
	}

	keywords := []string{
		"https://place.map.kakao.com/8077717",
		"https://place.map.kakao.com/24856468",
		"https://place.map.kakao.com/10972091",
		"https://place.map.kakao.com/1302271913",
		"https://place.map.kakao.com/1568720995",
		"https://place.map.kakao.com/1309217753",
		"https://place.map.kakao.com/8130016",
		"https://place.map.kakao.com/1012984730",
		"https://place.map.kakao.com/90994097",
		"https://place.map.kakao.com/8746906",
		"https://place.map.kakao.com/544200314",
		"https://place.map.kakao.com/7847225",
		"https://place.map.kakao.com/431521088",
		"https://place.map.kakao.com/1503171998",
		"https://place.map.kakao.com/26324314",
		"https://place.map.kakao.com/1717103639",
		"https://place.map.kakao.com/1730645952",
		"https://place.map.kakao.com/8697741",
		"https://place.map.kakao.com/1106494282",
		"https://place.map.kakao.com/9507410",
		"https://place.map.kakao.com/1104225959",
		"https://place.map.kakao.com/12250697",
		"https://place.map.kakao.com/410757147",
		"https://place.map.kakao.com/1290897759",
	}

	ch := make(chan ThumbNail, 10)
	wg := sync.WaitGroup{}
	var mu sync.Mutex
	wg.Add(len(keywords))

	// 10개의 고루틴으로 처리
	for i := 0; i < 10; i++ {
		go func() {
			for {
				// 새로운 URL을 가져오기 위해 뮤텍스 사용
				mu.Lock()
				if len(keywords) == 0 {
					mu.Unlock()
					break
				}
				keyword := keywords[0]
				keywords = keywords[1:]
				mu.Unlock()

				CrawlerByURL(keyword, ch, ctx)
				wg.Done()
			}
		}()
	}
	// 모든 크롤링 작업이 완료될 때까지 대기
	go func() {
		wg.Wait()
		close(ch)
	}()

	// 채널에서 결과를 수신하여 출력
	for store := range ch {
		fmt.Println("상호명:", store.Title)
		fmt.Println("메뉴:", store.Menu)
		fmt.Println("---------------------------------------------------")
	}
}

package app

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"strings"
	"sync"

	"github.com/chromedp/chromedp"
)

type RequestBody struct {
	Data []struct {
		URL string `json:"url"`
	} `json:"data"`
}

type ThumbNail struct {
	Title       string            `json:"title"`
	OpeningTime string            `json:"opening_time"`
	Menu        map[string]string `json:"menu"`
}

var opts = append(chromedp.DefaultExecAllocatorOptions[:],
	chromedp.Flag("headless", false),
	chromedp.Flag("no-sandbox", true),
	chromedp.Flag("disable-gpu", true),
	chromedp.Flag("disable-dev-shm-usage", true),
	chromedp.Flag("disable-web-security", true),
	chromedp.Flag("disable-site-isolation-trials", true),
	chromedp.Flag("blink-settings", "imagesEnabled=false, cssEnabled=false"),
)

func (a *AppHandler) getCrawlingStoreListHandler(w http.ResponseWriter, r *http.Request) {
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

	var requestBody RequestBody
	// Read the request body
	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Failed to read request body", http.StatusBadRequest)
		return
	}

	// Parse the JSON body
	err = json.Unmarshal(body, &requestBody)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	var urls []string
	for _, item := range requestBody.Data {
		urls = append(urls, item.URL)
	}

	ch := make(chan ThumbNail, 10)
	wg := sync.WaitGroup{}
	var mu sync.Mutex
	wg.Add(len(urls))

	// 10개의 고루틴으로 처리
	for i := 0; i < 10; i++ {
		go func() {
			for {
				// 새로운 URL을 가져오기 위해 뮤텍스 사용
				mu.Lock()
				if len(urls) == 0 {
					mu.Unlock()
					break
				}
				url := urls[0]
				urls = urls[1:]
				mu.Unlock()

				CrawlerByURL(url, ch, ctx)
				wg.Done()
			}
		}()
	}
	// 모든 크롤링 작업이 완료될 때까지 대기
	go func() {
		wg.Wait()
		close(ch)
	}()

	var stores []ThumbNail
	for store := range ch {
		stores = append(stores, store)
	}

	rd.JSON(w, http.StatusCreated, stores)
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

	for i := 1; i <= size; i++ {
		var name, price string

		nameSelector := fmt.Sprintf("#mArticle > div.cont_menu > ul > li:nth-child(%d) > div > span", i)
		priceSelector := fmt.Sprintf("#mArticle > div.cont_menu > ul > li:nth-child(%d) > div > em.price_menu", i)
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
			log.Println("에러발생:", err)
		}
	}
}

func RemoveString(str string) string {
	// Remove "가격:" and "\n"
	price := strings.ReplaceAll(str, "가격:", "")
	price = strings.ReplaceAll(price, "\n", "")

	return price
}

package main

import (
	"context"
	"errors"
	"fmt"
	"log"
	"regexp"
	"strings"
	"sync"
	"time"

	"github.com/chromedp/chromedp"
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

func CheckPageError(ctx context.Context) {
	// check for the 500 error
	var res string
	err := chromedp.Run(ctx, chromedp.Text("#error", &res, chromedp.ByID))
	if err != nil {
		log.Fatal(err)
	}
	if res == "500" {
		// refresh the page
		err = chromedp.Run(ctx, chromedp.Reload())
		if err != nil {
			log.Fatal(err)
		}
		// wait for the page to reload
		err = chromedp.Run(ctx, chromedp.Sleep(5*time.Second))
		if err != nil {
			log.Fatal(err)
		}

		// select the body element and click it to focus
		err = chromedp.Run(ctx, chromedp.Click("body", chromedp.ByQuery))
		if err != nil {
			log.Fatal(err)
		}
		// send the F5 key to the focused element to refresh the page
		err = chromedp.Run(ctx, chromedp.KeyEvent("\uE035"))
		if err != nil {
			log.Fatal(err)
		}
		// wait for the page to reload
		err = chromedp.Run(ctx, chromedp.Sleep(5*time.Second))
		if err != nil {
			log.Fatal(err)
		}
	}
}

func CrawlerByURL(ctx context.Context, url string, ch chan Restaurant) {
	// 새로운 탭 생성
	ctx, cancel := chromedp.NewContext(ctx)
	defer cancel()

	// Navigate 함수의 콜백 함수에서 응답 코드 확인 및 새로고침
	if err := chromedp.Run(ctx,
		chromedp.Navigate(url),
	); err != nil {
		log.Fatalln(err)
	}

	// Extract the desired value from the page
	var phone, title, category, context, image, location string
	err := chromedp.Run(ctx,
		chromedp.Sleep(1*time.Second),
		chromedp.WaitVisible("#app-root > div > div > div > div:nth-child(6) > div > div.place_section.no_margin.vKA6F > div > div > div.O8qbU.nbXkr > div > span.xlx7Q"),
		chromedp.Text("#app-root > div > div > div > div:nth-child(6) > div > div.place_section.no_margin.vKA6F > div > div > div.O8qbU.nbXkr > div > span.xlx7Q", &phone),
		chromedp.Text("#_title > span.Fc1rA", &title),
		chromedp.Text("#_title > span.DJJvD", &category),
		chromedp.Text("#app-root > div > div > div > div:nth-child(6) > div > div.place_section.no_margin.vKA6F > div > div > div.O8qbU.tQY7D > div > a > span.LDgIH", &location),
		chromedp.EvaluateAsDevTools(`window.getComputedStyle(document.querySelector('.K0PDV._div')).getPropertyValue('background-image')`, &image),
	)
	image = extractURLFromBackgroundImage(image)
	CheckErr(err, title)
	isElementExist, err := IsElementExist(ctx)
	if isElementExist {
		restaurant := Restaurant{URL: url, Title: title, Location: location, Category: category, Phone: phone, Image: image, Context: context}
		ch <- restaurant
		return
	}
	fmt.Println(title)

	// if err := chromedp.Run(ctx,
	// 	chromedp.Text("#app-root > div > div > div > div:nth-child(6) > div > div.place_section.no_margin.vKA6F > div > div > div.O8qbU.dRAr1 > div > a > span.zPfVt", &context, chromedp.NodeVisible),
	// ); err != nil {
	// 	if err := chromedp.Run(ctx,
	// 		chromedp.WaitVisible("#app-root > div > div > div > div:nth-child(6) > div > div.place_section.no_margin.vKA6F > div > div > div.O8qbU.dRAr1 > div > div > span"),
	// 		chromedp.Text("#app-root > div > div > div > div:nth-child(6) > div > div.place_section.no_margin.vKA6F > div > div > div.O8qbU.dRAr1 > div > div > span", &context),
	// 	); err != nil {
	// 		panic(err)
	// 	}
	// }

	// 메뉴
	menu := make(map[string]string)

	var size int64
	var menuList, header string

	// if isElementExist {
	// 	menuList = "#root > div.naver_order_contents > div > div > div.order_list > div:nth-child(2) > div > ul > li"
	// 	header = "#root > div.user_header.place > div > div.order_info_area"
	// } else {
	menuList = "#app-root > div > div > div > div:nth-child(6) > div > div.place_section.no_margin > div > ul > li"
	header = "#app-root > div > div > div > div.place_section.OP4V8 > div.zD5Nm"

	err = chromedp.Run(ctx,
		chromedp.Navigate(url+"/menu/list"),
		chromedp.ScrollIntoView(header, chromedp.ByQuery),
		chromedp.WaitVisible(menuList, chromedp.ByQuery),
		chromedp.Evaluate(`document.querySelectorAll("#app-root > div > div > div > div:nth-child(6) > div > div.place_section.no_margin > div > ul > li").length`, &size),
	)
	CheckErr(err, title+" menuList "+menuList+header)

	for i := 0; i < 20; i++ {
		var name, price, nameTag, priceTag string
		// if isElementExist {
		// 	nameTag = fmt.Sprintf("#root > div.naver_order_contents > div > div > div.order_list > div:nth-child(2) > div > ul > li:nth-child(%d) > div > a > div.info_detail > div.tit", i+1)
		// 	priceTag = fmt.Sprintf("#root > div.naver_order_contents > div > div > div.order_list > div:nth-child(2) > div > ul > li:nth-child(%d) > div > a > div.info_detail > div.price", i+1)
		// } else {
		nameTag = fmt.Sprintf("#app-root > div > div > div > div:nth-child(6) > div > div.place_section.no_margin > div > ul > li:nth-child(%d) > a > div.LZ3Zm > div.pr1Qk > div > span", i+1)
		priceTag = fmt.Sprintf("#app-root > div > div > div > div:nth-child(6) > div > div.place_section.no_margin > div > ul > li:nth-child(%d) > a > div.LZ3Zm > div.SSaNE", i+1)

		err := chromedp.Run(ctx,
			chromedp.Text(nameTag, &name),
			chromedp.Text(priceTag, &price),
		)
		CheckErr(err, title)
		menu[name] = price
	}

	restaurant := Restaurant{URL: url, Title: title, Location: location, Category: category, Phone: phone, Image: image, Context: context, Menu: menu}
	// Send the extracted value to the channel
	ch <- restaurant
}

func extractURLFromBackgroundImage(backgroundImage string) string {
	re := regexp.MustCompile(`url\((.*?)\)`)
	matches := re.FindStringSubmatch(backgroundImage)
	if len(matches) != 2 {
		return ""
	}
	return strings.Trim(matches[1], "\"")
}

func CheckErr(err error, title string) {
	if err != nil {
		if !errors.Is(err, context.DeadlineExceeded) {
			fmt.Printf("에러발생 : %s", title)
			log.Fatal(err)
		}
	}
}

// 대상 요소가 존재하는지 확인하는 함수
func IsElementExist(ctx context.Context) (bool, error) {
	timeout, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	// var nodes []*cdp.Node
	// err := chromedp.Run(timeout, chromedp.Nodes("#app-root > div > div > div > div.place_section.OP4V8 > div.UoIF_.Afmx0 > div > span.yxkiA", &nodes, chromedp.NodeVisible, chromedp.ByQuery))
	// CheckErr(err, "exist")

	// if len(nodes) > 0 {
	// 	log.Println("The target element exists, exiting the function")
	// 	return true
	// }
	// return false
	var text string
	err := chromedp.Run(timeout, chromedp.Text("#app-root > div > div > div > div.place_section.OP4V8 > div.UoIF_.Afmx0 > div > span > a > span.yJySz", &text, chromedp.NodeVisible, chromedp.ByQuery))
	if err != nil {
		return false, err
	}
	if text == "주문" || text == "주문준비중" || text == "주문종료" {
		return true, nil
	}
	err = chromedp.Run(timeout, chromedp.Text("#app-root > div > div > div > div.place_section.OP4V8 > div.UoIF_.Afmx0 > div > span:nth-child(2) > a > span", &text, chromedp.NodeVisible, chromedp.ByQuery))
	if text == "주문" || text == "주문준비중" || text == "주문종료" {
		return true, nil
	}
	return false, nil
}

func UrlScraper(ctx context.Context) []string {

	var urls []string
	keyword := "서울 맛집"

	fmt.Println("Searching for", keyword)
	naverMapSearchURL := fmt.Sprintf("https://m.map.naver.com/search2/search.naver?query=%s&sm=hty&style=v5", keyword)

	var size int64
	if err := chromedp.Run(ctx,
		chromedp.Navigate(naverMapSearchURL),
		chromedp.WaitVisible("#ct > div.search_listview._content._ctList > ul > li", chromedp.ByQuery),
		chromedp.Evaluate(`document.querySelectorAll("#ct > div.search_listview._content._ctList > ul > li").length`, &size),
	); err != nil {
		panic(err)
	}

	for i := 1; i <= int(size); i++ {
		cssSelector := fmt.Sprintf("#ct > div.search_listview._content._ctList > ul > li:nth-child(%d) > div.item_info > a.a_item.a_item_distance._linkSiteview", i)

		var dataCID string
		if err := chromedp.Run(ctx,
			chromedp.AttributeValue(cssSelector, "data-cid", &dataCID, &[]bool{false}[0]),
		); err != nil {
			fmt.Println("No search results found")
			continue
		}

		if dataCID != "" {
			naverMapURL := fmt.Sprintf("https://m.place.naver.com/restaurant/%s", dataCID)

			urls = append(urls, naverMapURL)
		}
	}
	return urls
}

func main() {
	opts := append(chromedp.DefaultExecAllocatorOptions[:],
		chromedp.Flag("headless", false),
		chromedp.Flag("no-sandbox", true),
		chromedp.Flag("disable-gpu", true),
		chromedp.Flag("disable-dev-shm-usage", true),
		chromedp.Flag("disable-web-security", true),
		chromedp.Flag("disable-site-isolation-trials", true),
		chromedp.Flag("blink-settings", "imagesEnabled=false"),
	)
	// Chrome 실행
	ctx, cancel := chromedp.NewExecAllocator(context.Background(), opts...)
	defer cancel()

	ctx, cancel = chromedp.NewContext(ctx)
	defer cancel()

	var urls []string
	urls = UrlScraper(ctx)

	ch := make(chan Restaurant, 10)
	var wg sync.WaitGroup
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

				CrawlerByURL(ctx, url, ch)
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
		fmt.Println("URL:", store.URL)
		fmt.Println("상호명:", store.Title)
		fmt.Println("위치 정보:", store.Location)
		fmt.Println("카테고리:", store.Category)
		fmt.Println("전화번호:", store.Phone)
		fmt.Println("이미지 URL:", store.Image)
		fmt.Println("설명:", store.Context)
		fmt.Println("메뉴:", store.Menu)
		fmt.Println("---------------------------------------------------")
	}
}

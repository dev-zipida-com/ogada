package main

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/chromedp/chromedp"
)

type Restaurant struct {
	URL      string
	Title    string
	Category string
	Phone    string
	Context  string
	Menu     map[string]string
}

func CrawlerByURL(ctx context.Context, url string, ch chan Restaurant) {

	ctx, cancel := chromedp.NewContext(ctx)
	defer cancel()

	if err := chromedp.Run(ctx,
		chromedp.Navigate(url),
	); err != nil {
		panic(err)
	}
	// Extract the desired value from the page
	var phone, title, category, context string
	if err := chromedp.Run(ctx,
		chromedp.Sleep(1*time.Second),
		chromedp.WaitVisible("#app-root > div > div > div > div:nth-child(6) > div > div.place_section.no_margin.vKA6F > div > div > div.O8qbU.nbXkr > div > span.xlx7Q"),
		chromedp.Text("#app-root > div > div > div > div:nth-child(6) > div > div.place_section.no_margin.vKA6F > div > div > div.O8qbU.nbXkr > div > span.xlx7Q", &phone),
		chromedp.Text("#_title > span.Fc1rA", &title),
		chromedp.Text("#_title > span.DJJvD", &category),
	); err != nil {
		panic(err)
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
	if err := chromedp.Run(ctx,
		chromedp.Navigate(url+"/menu/list"),
		chromedp.ScrollIntoView("#app-root > div > div > div > div.place_section.OP4V8 > div.zD5Nm", chromedp.ByQuery),
		chromedp.WaitVisible("#app-root > div > div > div > div:nth-child(6) > div > div.place_section.no_margin > div > ul > li", chromedp.ByQuery),
		chromedp.Evaluate(`document.querySelectorAll("#app-root > div > div > div > div:nth-child(6) > div > div.place_section.no_margin > div > ul > li").length`, &size),
	); err != nil {
		panic(err)
	}

	var i int64
	for i = 0; i < size; i++ {
		var name string
		var price string
		if err := chromedp.Run(ctx,
			chromedp.Text(fmt.Sprintf("#app-root > div > div > div > div:nth-child(6) > div > div.place_section.no_margin > div > ul > li:nth-child(%d) > a > div.LZ3Zm > div.pr1Qk > div > span", i+1), &name),
			chromedp.Text(fmt.Sprintf("#app-root > div > div > div > div:nth-child(6) > div > div.place_section.no_margin > div > ul > li:nth-child(%d) > a > div.LZ3Zm > div.SSaNE", i+1), &price),
		); err != nil {
			panic(err)
		}
		menu[name] = price
	}

	restaurant := Restaurant{URL: url, Title: title, Category: category, Phone: phone, Context: context, Menu: menu}
	// Send the extracted value to the channel
	ch <- restaurant
}

func UrlScraper(ctx context.Context) []string {
	ctx, cancel := chromedp.NewContext(ctx)
	defer cancel()

	var urls []string
	keyword := "을지로입구역 맛집"

	fmt.Println("Searching for", keyword)
	naverMapSearchURL := fmt.Sprintf("https://m.map.naver.com/search2/search.naver?query=%s&sm=hty&style=v5", keyword)

	if err := chromedp.Run(ctx,
		chromedp.Navigate(naverMapSearchURL),
	); err != nil {
		panic(err)
	}

	chromedp.WaitVisible("#ct > div.search_listview._content._ctList > ul > li", chromedp.ByQuery)

	for i := 1; i <= 15; i++ {
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
		chromedp.Flag("headless", true),
		chromedp.Flag("no-sandbox", true),
		chromedp.Flag("disable-gpu", true),
		chromedp.Flag("disable-dev-shm-usage", true),
		chromedp.Flag("disable-web-security", true),
		chromedp.Flag("disable-site-isolation-trials", true),
	)
	// Chrome 실행
	ctx, cancel := chromedp.NewExecAllocator(context.Background(), opts...)
	defer cancel()

	var urls []string
	urls = UrlScraper(ctx)

	ch := make(chan Restaurant)

	// 10개의 크롤링 작업을 각각의 고루틴으로 실행
	for _, url := range urls {
		go CrawlerByURL(ctx, url, ch)
	}

	// 모든 크롤링 작업이 완료될 때까지 대기
	var wg sync.WaitGroup
	wg.Add(len(urls))
	go func() {
		wg.Wait()
		close(ch)
	}()

	// 채널에서 결과를 수신하여 출력
	for i := 0; i < len(urls); i++ {
		store := <-ch
		fmt.Println("URL:", store.URL)
		fmt.Println("상호명:", store.Title)
		fmt.Println("카테고리:", store.Category)
		fmt.Println("전화번호:", store.Phone)
		fmt.Println("설명:", store.Context)
		fmt.Println("메뉴:", store.Menu)
		fmt.Println("---------------------------------------------------")
	}
}

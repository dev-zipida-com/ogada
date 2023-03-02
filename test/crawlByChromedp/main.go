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
	// Extract the desired value from the page
	var phone, title, category, context string
	if err := chromedp.Run(ctx,
		chromedp.WaitVisible("#app-root > div > div > div > div:nth-child(6) > div > div.place_section.no_margin.vKA6F > div > div > div.O8qbU.nbXkr > div > span.xlx7Q"),
		chromedp.Text("#app-root > div > div > div > div:nth-child(6) > div > div.place_section.no_margin.vKA6F > div > div > div.O8qbU.nbXkr > div > span.xlx7Q", &phone),
		chromedp.Text("#_title > span.Fc1rA", &title),
		chromedp.Text("#_title > span.DJJvD", &category),
		chromedp.WaitVisible("#app-root > div > div > div > div:nth-child(7) > div > div.place_section.no_margin.vKA6F > div > div > div.O8qbU.dRAr1 > div > a > span.zPfVt"),
		chromedp.Text("#app-root > div > div > div > div:nth-child(7) > div > div.place_section.no_margin.vKA6F > div > div > div.O8qbU.dRAr1 > div > a > span.zPfVt", &context),
	); err != nil {
		panic(err)
	}

	restaurant := Restaurant{URL: url, Title: title, Category: category, Phone: phone, Context: context}
	// Send the extracted value to the channel
	ch <- restaurant
}

func main() {
	// Chrome 옵션 설정
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

	ctx, cancel = chromedp.NewContext(ctx)
	defer cancel()

	// Set up search keywords
	keywords := []string{"강남역 맛집", "홍대 맛집", "이태원 맛집"}

	// Search on Naver Maps for each keyword
	for _, keyword := range keywords {
		var urls []string

		fmt.Println("Searching for", keyword)
		naverMapSearchURL := fmt.Sprintf("https://m.map.naver.com/search2/search.naver?query=%s&sm=hty&style=v5", keyword)

		if err := chromedp.Run(ctx, chromedp.Navigate(naverMapSearchURL)); err != nil {
			panic(err)
		}

		time.Sleep(3 * time.Second)

		for i := 1; i <= 1; i++ {
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
		var wg sync.WaitGroup
		wg.Add(len(urls))

		ch := make(chan Restaurant, len(urls))

		for _, url := range urls {
			go func(url string) {
				CrawlerByURL(ctx, url, ch)
				wg.Done()
			}(url)
		}
		wg.Wait()
		close(ch)

		for i := 0; i < len(urls); i++ {
			store := <-ch
			fmt.Println("URL:", store.URL)
			fmt.Println("상호명:", store.Title)
			fmt.Println("카테고리:", store.Category)
			fmt.Println("전화번호:", store.Phone)
			fmt.Println("설명:", store.Context)
			fmt.Println("---------------------------------------------------")
		}

	}
}

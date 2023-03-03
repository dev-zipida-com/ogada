package main

import (
	"context"
	"fmt"
	"time"

	"github.com/chromedp/chromedp"
)

type Restaurant struct {
	URL      string
	Title    string
	Category string
	Phone    string
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
		var restaurants []Restaurant

		fmt.Println("Searching for", keyword)
		naverMapSearchURL := fmt.Sprintf("https://m.map.naver.com/search2/search.naver?query=%s&sm=hty&style=v5", keyword)

		if err := chromedp.Run(ctx, chromedp.Navigate(naverMapSearchURL)); err != nil {
			panic(err)
		}

		time.Sleep(3 * time.Second)

		for i := 1; i <= 10; i++ {
			cssSelector := fmt.Sprintf("#ct > div.search_listview._content._ctList > ul > li:nth-child(%d) > div.item_info > a.a_item.a_item_distance._linkSiteview", i)

			var dataCID, titleText, categoryText string
			if err := chromedp.Run(ctx,
				chromedp.AttributeValue(cssSelector, "data-cid", &dataCID, &[]bool{false}[0]),
				chromedp.Text(fmt.Sprintf("#ct > div.search_listview._content._ctList > ul > li:nth-child(%d) > div.item_info > a.a_item.a_item_distance._linkSiteview > div.item_tit._title > strong", i), &titleText),
				chromedp.Text(fmt.Sprintf("#ct > div.search_listview._content._ctList > ul > li:nth-child(%d) > div.item_info > a.a_item.a_item_distance._linkSiteview > div.item_tit._title > em", i), &categoryText),
			); err != nil {
				fmt.Println("No search results found")
				continue
			}

			if dataCID != "" {
				naverMapURL := fmt.Sprintf("https://m.place.naver.com/restaurant/%s", dataCID)

				restaurant := Restaurant{URL: naverMapURL, Title: titleText, Category: categoryText}
				restaurants = append(restaurants, restaurant)
			}
		}
		for i := 0; i < len(restaurants); i++ {
			fmt.Println("URL:", restaurants[i].URL)
			fmt.Println("상호명:", restaurants[i].Title)
			fmt.Println("카테고리:", restaurants[i].Category)
			fmt.Println("---------------------------------------------------")
		}

	}
}

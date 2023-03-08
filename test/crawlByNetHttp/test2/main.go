package main

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/PuerkitoBio/goquery"
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

type ThumbNail struct {
	URL   string
	Image string
}

func getMenuList(doc *goquery.Document) (map[string]string, error) {

	menuList := make(map[string]string)
	size := 0
	doc.Find(".place_section_content > ul.mpoxR").Each(func(i int, s *goquery.Selection) {
		size = s.Find("li").Length()
	})

	fmt.Println(size)
	for i := 1; i <= size; i++ {
		menuTitle := doc.Find(fmt.Sprintf(".place_section_content > ul.mpoxR > li:nth-child(%d) > a > div > div.erVoL", i)).Text()
		menuPrice := doc.Find(fmt.Sprintf(".place_section_content > ul.mpoxR > li:nth-child(%d) > a > div > div.Yrsei", i)).Text()
		if menuTitle != "" {
			menuList[menuTitle] = menuPrice
		}
	}

	if size == 0 {
		doc.Find(".place_section_content > ul.jnwQZ").Each(func(i int, s *goquery.Selection) {
			size = s.Find("li").Length()
		})
	}
	for i := 1; i <= size; i++ {
		menuTitle := doc.Find(fmt.Sprintf(".place_section_content > ul.jnwQZ > li:nth-child(%d) > div > div > span", i)).Text()
		menuPrice := doc.Find(fmt.Sprintf(".place_section_content > ul.jnwQZ > li:nth-child(%d) > div > em", i)).Text()
		if menuTitle != "" {
			menuList[menuTitle] = menuPrice
		}
	}

	return menuList, nil
}

func CrawlerByURL(thumbNail ThumbNail, ch chan Restaurant) {

	url := thumbNail.URL
	image := thumbNail.Image
	client := &http.Client{}
	// 웹 페이지 요청
	var resp *http.Response
	var err error

	for retry := 0; retry < 10; retry++ {
		req, err := http.NewRequest("GET", url, nil)
		if err != nil {
			log.Fatal(err)
		}

		req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/58.0.3029.110")
		req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8")
		req.Header.Set("Accept-Language", "en-US,en;q=0.5")
		req.Header.Set("Referer", "https://www.google.com/")
		req.Header.Set("Cookie", "session_id=1234")

		resp, err = client.Do(req)
		if err == nil && resp.StatusCode == http.StatusOK {
			break
		}

		// 요청이 실패하면 재시도
		fmt.Printf("Request failed: %v, retrying... %d\n", err, retry)
		time.Sleep(time.Duration(1) * time.Second)
	}

	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	// goquery로 HTML 파싱
	doc, err := goquery.NewDocumentFromReader(resp.Body)
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

	// var context string
	// context = doc.Find("#app-root > div > div > div > div:nth-child(6) > div > div.place_section.no_margin.vKA6F > div > div > div.O8qbU.Ld5_q > div > ul > li > div > p").Text()

	// if context == "" {
	// 	context = doc.Find("#app-root > div > div > div > div:nth-child(7) > div > div.place_section.no_margin.vKA6F > div > div > div.O8qbU.dRAr1 > div > a > span.zPfVt").Text()
	// }

	menu, err := getMenuList(doc)
	if err != nil {
		log.Fatal(err)
	}

	restaurant := Restaurant{URL: url, Title: title, Location: address, Category: category, Phone: phone, Image: image, Context: "", Menu: menu}
	// Send the extracted value to the channel
	ch <- restaurant
}

func CheckErr(err error, title string) {
	if err != nil {
		if !errors.Is(err, context.DeadlineExceeded) {
			fmt.Printf("에러발생 : %s", title)
			log.Fatal(err)
		}
	}
}

func UrlScraper(keyword string, ctx context.Context) []ThumbNail {

	var thumbNails []ThumbNail

	fmt.Println("Searching for", keyword)
	naverMapSearchURL := fmt.Sprintf("https://m.map.naver.com/search2/search.naver?query=%s&sm=hty&style=v5", keyword)

	ctx, cancel := chromedp.NewContext(ctx)
	defer cancel()

	timeout, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	var size int
	if err := chromedp.Run(timeout,
		chromedp.Navigate(naverMapSearchURL),
	); err != nil && err != context.DeadlineExceeded {
		panic(err)
	}

	if err := chromedp.Run(timeout,
		chromedp.WaitVisible("#ct > div.search_listview._content._ctList > ul > li", chromedp.ByQuery),
		chromedp.Evaluate(`document.querySelectorAll("#ct > div.search_listview._content._ctList > ul > li").length`, &size),
	); err != nil && err != context.DeadlineExceeded {
		panic(err)
	}
	if size == 0 {
		return thumbNails
	}

	for i := 1; i <= 1; i++ {
		cssSelector := fmt.Sprintf("#ct > div.search_listview._content._ctList > ul > li:nth-child(%d) > div.item_info > a.a_item.a_item_distance._linkSiteview", i)
		imageSelector := fmt.Sprintf("#ct > div.search_listview._content._ctList > ul > li:nth-child(%d) > div.item_info > a.item_thumb._itemThumb > img._thumbImg", i)

		var dataCID, imageUrl string
		if err := chromedp.Run(ctx,
			chromedp.AttributeValue(cssSelector, "data-cid", &dataCID, &[]bool{false}[0]),
			chromedp.AttributeValue(imageSelector, "src", &imageUrl, &[]bool{false}[0]),
		); err != nil {
			fmt.Println("No search results found")
			continue
		}

		if dataCID != "" {
			naverMapURL := fmt.Sprintf("https://m.place.naver.com/restaurant/%s", dataCID)

			thumbNail := ThumbNail{URL: naverMapURL, Image: imageUrl}
			thumbNails = append(thumbNails, thumbNail)
		}
	}
	return thumbNails
}

func main() {
	opts := append(chromedp.DefaultExecAllocatorOptions[:],
		chromedp.Flag("headless", false),
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

	if err := chromedp.Run(ctx,
		chromedp.Navigate("about:blank"),
	); err != nil {
		log.Fatal(err)
	}

	keyword := []string{"cgv 압구정본관"}

	var thumbNails []ThumbNail
	sem := make(chan struct{}, 6)
	wg := sync.WaitGroup{}
	for _, kw := range keyword {
		// 버퍼 채널에 빈 구조체를 전송하여 동시 실행 가능 개수를 줄입니다.
		sem <- struct{}{}
		go func(k string) {
			defer func() {
				// 버퍼 채널에서 구조체를 수신하여 동시 실행 가능 개수를 늘립니다.
				<-sem
			}()
			thumbNails = append(thumbNails, UrlScraper(k, ctx)...)
		}(kw)
	}
	for i := 0; i < 6; i++ {
		sem <- struct{}{} // 남아 있는 동시 실행 가능한 작업들을 모두 마무리합니다.
	}
	wg.Wait()

	ch := make(chan Restaurant, 10)
	var mu sync.Mutex
	wg.Add(len(thumbNails))

	// 10개의 고루틴으로 처리
	for i := 0; i < 10; i++ {
		go func() {
			for {
				// 새로운 URL을 가져오기 위해 뮤텍스 사용
				mu.Lock()
				if len(thumbNails) == 0 {
					mu.Unlock()
					break
				}
				thumbNail := thumbNails[0]
				thumbNails = thumbNails[1:]
				mu.Unlock()

				CrawlerByURL(thumbNail, ch)
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

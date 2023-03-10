package main

import (
	"log"
	"net/http"
	"os"

	"server/app"
)

func main() {
	m := app.MakeHandler(os.Getenv("DATABASE_URL"))
	defer m.Close()

	log.Println("Started App")
	err := http.ListenAndServe(":3000", m)
	if err != nil {
		panic(err)
	}
}

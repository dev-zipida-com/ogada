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
	err := http.ListenAndServe(":8080", m)
	if err != nil {
		panic(err)
	}
}

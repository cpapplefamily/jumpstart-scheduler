// main.go
package main

import (
	"log"
	"net/http"
	"JUMPSTART_SCHEDULER/web"
)

func main() {
	web.SetupRoutes()
	log.Println("Server running → http://localhost:8080/import")
	http.ListenAndServe(":8080", nil)
}
// web/web.go
package web

import (
	"log"
	"net/http"
	"JUMPSTART_SCHEDULER/db"
)

func init() {
	if err := db.Init(); err != nil {
		log.Fatal("DB Init failed:", err)
	}
}

func SetupRoutes() {
	http.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("static"))))
	http.HandleFunc("/", IndexPage)
	http.HandleFunc("/import", ImportPage)
}
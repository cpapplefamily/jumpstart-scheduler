// web/web.go
package web

import (
	"log"
	"net/http"
	"JUMPSTART_SCHEDULER/db"
	"io"
	"os"
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
	http.HandleFunc("/schedule", SchedulePage)
	http.Handle("/schedule.json", http.FileServer(http.Dir(".")))
	http.HandleFunc("/session", SessionDetailPage)
	http.HandleFunc("/room", RoomDetailPage)
	http.HandleFunc("/admin/edit", func(w http.ResponseWriter, r *http.Request) {
    	http.ServeFile(w, r, "templates/admin_edit.html")
	})
	http.HandleFunc("/api/save-schedule", func(w http.ResponseWriter, r *http.Request) {
		body, _ := io.ReadAll(r.Body)

		// Save to disk
		if err := os.WriteFile("schedule.json", body, 0644); err != nil {
			http.Error(w, "Failed to save", 500)
			return
		}

		// Refresh the live in-memory copy
		RefreshScheduleJSON()

		w.WriteHeader(200)
	})

}
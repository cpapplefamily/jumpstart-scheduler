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
	http.HandleFunc("/admin/edit", requireAdmin(func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "templates/admin_edit.html")
	}))
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
	http.HandleFunc("/admin/login", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "templates/admin_login.html")
	})
	http.HandleFunc("/admin/logout", func(w http.ResponseWriter, r *http.Request) {
		http.SetCookie(w, &http.Cookie{
			Name: "adminAuth", Value: "", Path: "/", MaxAge: -1,
		})
		http.Redirect(w, r, "/", http.StatusSeeOther)
	})

}

func requireAdmin(next http.HandlerFunc) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        auth := false
        if cookie, err := r.Cookie("adminAuth"); err == nil {
            if cookie.Value == "1" {
                auth = true
            }
        }

        if !auth && r.URL.Path == "/admin/edit" {
            http.Redirect(w, r, "/admin/login", http.StatusSeeOther)
            return
        }
        next(w, r)
    }
}
// web/schedule.go
package web

import (
	"html/template"
	"net/http"
)

var scheduleTmpl = template.Must(template.ParseFiles("templates/schedule.html"))

func SchedulePage(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/schedule" {
		http.NotFound(w, r)
		return
	}
	scheduleTmpl.Execute(w, nil)
}
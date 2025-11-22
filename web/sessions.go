package web

import (
	"html/template"
	"net/http"
)

func SessionDetailPage(w http.ResponseWriter, r *http.Request) {
    tmpl.Execute(w, nil)
}
var tmpl = template.Must(template.ParseFiles("templates/session.html"))
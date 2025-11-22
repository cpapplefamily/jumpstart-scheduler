// web/index.go
package web

import (
	"html/template"
	"net/http"
)

var indexTmpl = template.Must(template.ParseFiles("templates/index.html"))

func IndexPage(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		http.NotFound(w, r)
		return
	}
	indexTmpl.Execute(w, nil)
}
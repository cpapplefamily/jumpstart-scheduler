// web/room.go
package web

import (
	"html/template"
	"net/http"
)

var roomTmpl = template.Must(template.ParseFiles("templates/room.html"))

func RoomDetailPage(w http.ResponseWriter, r *http.Request) {
    roomTmpl.Execute(w, nil)
}
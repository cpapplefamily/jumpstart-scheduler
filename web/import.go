// web/import.go
package web

import (
	"html/template"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"JUMPSTART_SCHEDULER/db"
)

type ImportData struct {
	FlashSuccess string
	FlashError   string
}

var importTmpl = template.Must(template.ParseFiles("templates/import.html"))

func ImportPage(w http.ResponseWriter, r *http.Request) {
	data := ImportData{}

	if r.Method == http.MethodPost {
		file, header, err := r.FormFile("csvfile")
		if err != nil {
			data.FlashError = "No file selected"
			importTmpl.Execute(w, data)
			return
		}
		defer file.Close()

		// ←←← THIS IS THE ONLY NEW LINE WE ADD ←←←
		if err := os.MkdirAll("uploads", 0755); err != nil {
			data.FlashError = "Failed to create uploads folder"
			importTmpl.Execute(w, data)
			return
		}

		uploadPath := filepath.Join("uploads", header.Filename)
		out, err := os.Create(uploadPath)
		if err != nil {
			data.FlashError = "Cannot save file on server: " + err.Error()
			importTmpl.Execute(w, data)
			return
		}
		defer out.Close()

		_, err = io.Copy(out, file)
		if err != nil {
			data.FlashError = "Failed to write file"
			importTmpl.Execute(w, data)
			return
		}

		// Import into DB
		count, err := db.ImportCSV(uploadPath)
		if err != nil {
			data.FlashError = "Import failed: " + err.Error()
		} else {
			data.FlashSuccess = "Success! Imported " + strconv.Itoa(count) + " sessions"
			// Clean up the temporary file
			os.Remove(uploadPath)
		}
	}

	importTmpl.Execute(w, data)
}
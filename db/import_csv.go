// db/import_csv.go
package db

import (
	"encoding/csv"
	"encoding/json"
	"os"
	"regexp"
	"strings"
)

var rooms = []string{
	"Voyageurs South", "Voyageurs North", "Glacier South", "Glacier North",
	"Cascade", "Theater", "Gallery", "Alumni Room", "Mississippi", "Valhalla",
}

// Regex to match: "10:30AM - 11:45AM"  (any dash: -, –, —)
var timeRangeRegex = regexp.MustCompile(`^(\d{1,2}:\d{2}[AP]M)\s*[-–—]\s*(\d{1,2}:\d{2}[AP]M)$`)
var timeOnlyRegex = regexp.MustCompile(`^\d{1,2}:\d{2}[AP]M$|^Lunch|\d{1,2}[AP]M$`)

func parseTimeSlot(raw string) (start, end string) {
	raw = strings.TrimSpace(raw)
	if matches := timeRangeRegex.FindStringSubmatch(raw); len(matches) == 3 {
		return matches[1], matches[2]
	}
	// Single time or special text (Lunch, etc.)
	if timeOnlyRegex.MatchString(raw) {
		return raw, raw
	}
	return raw, raw // fallback
}

func parseSpeakers(raw string) []string {
	if strings.TrimSpace(raw) == "" || strings.ToLower(raw) == "various" {
		return []string{"Various / Panel"}
	}
	parts := regexp.MustCompile(`[,&/]`).Split(raw, -1)
	var result []string
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p == "" {
			continue
		}
		// Handle team numbers like "1234" → "Team 1234"
		if regexp.MustCompile(`^\d{4,}$`).MatchString(p) && p != "2024" && p != "2025" {
			result = append(result, "Team "+p)
			continue
		}
		// Handle "Name 1234" → "Name (Team 1234)"
		if m := regexp.MustCompile(`(.+?)\s+(\d{4,})$`).FindStringSubmatch(p); len(m) > 2 {
			result = append(result, m[1]+" (Team "+m[2]+")")
			continue
		}
		result = append(result, p)
	}
	if len(result) == 0 {
		return []string{"Various / Panel"}
	}
	return result
}

func ImportCSV(path string) (int, error) {
	file, err := os.Open(path)
	if err != nil {
		return 0, err
	}
	defer file.Close()

	reader := csv.NewReader(file)
	reader.LazyQuotes = true
	reader.Comment = '#'
	records, err := reader.ReadAll()
	if err != nil {
		return 0, err
	}

	// Clear existing data
	tx, err := DB.Begin()
	if err != nil {
		return 0, err
	}
	_, err = tx.Exec("DELETE FROM sessions")
	if err != nil {
		tx.Rollback()
		return 0, err
	}

	stmt, err := tx.Prepare(`
		INSERT INTO sessions 
		(time_slot, start_time, end_time, round, room, title, description, speakers, presenter, event, location)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '2024 JUMPSTART Training Sessions', 'St Cloud State University')
	`)
	if err != nil {
		tx.Rollback()
		return 0, err
	}
	defer stmt.Close()

	count := 0
	timeRegex := regexp.MustCompile(`\d{1,2}:\d{2}[AP]M|\d{1,2}[AP]M`)

	for i := 0; i < len(records); i++ {
		record := records[i]
		if len(record) < 3 {
			continue
		}
		c0 := strings.TrimSpace(record[0])

		// Special non-round events (Check-in, Lunch, Kickoff, etc.)
		if timeRegex.MatchString(c0) && len(record) > 1 && record[1] != "" && !strings.Contains(strings.ToLower(record[1]), "round") {
			timeSlot := c0
			startTime, endTime := parseTimeSlot(timeSlot)
			title := strings.TrimSpace(record[1])
			room := "Various"
			if len(record) > 3 && strings.TrimSpace(record[3]) != "" {
				room = strings.TrimSpace(record[3])
			}
			if strings.Contains(strings.ToLower(title), "lunch") || strings.Contains(title, "Garvey") {
				room = "Garvey Commons"
			}
			if strings.Contains(title, "Atwood") {
				room = "Atwood Memorial Center"
			}

			speakersJSON, _ := json.Marshal([]string{"Various / Panel"})
			_, err := stmt.Exec(timeSlot, startTime, endTime, nil, room, title, title, string(speakersJSON), "Various / Panel")
			if err != nil {
				tx.Rollback()
				return 0, err
			}
			count++
			continue
		}

		// Round-based sessions
		if timeRegex.MatchString(c0) && len(record) > 1 && strings.Contains(strings.ToLower(record[1]), "round") {
			timeSlot := c0
			startTime, endTime := parseTimeSlot(timeSlot)
			round := strings.TrimSpace(record[1])

			// Optional description rows
			descs := []string{}
			if i+1 < len(records) && len(records[i+1]) >= 12 && records[i+1][0] == "" && records[i+1][1] == "" {
				descs = records[i+1][2:]
				i++
			}

			speakersRaw := []string{}
			if i+1 < len(records) && len(records[i+1]) >= 12 && records[i+1][0] == "" && records[i+1][1] == "" {
				speakersRaw = records[i+1][2:]
				i++
			}

			titles := record[2:]
			for j := 0; j < len(rooms); j++ {
				if j >= len(titles) || strings.TrimSpace(titles[j]) == "" {
					continue
				}

				title := strings.TrimSpace(titles[j])
				desc := ""
				if j < len(descs) {
					desc = strings.TrimSpace(descs[j])
				}
				speakerStr := ""
				if j < len(speakersRaw) {
					speakerStr = strings.TrimSpace(speakersRaw[j])
				}

				speakers := parseSpeakers(speakerStr)
				presenter := strings.Join(speakers, ", ")
				if presenter == "" {
					presenter = "Various / Panel"
				}

				speakersJSON, _ := json.Marshal(speakers)

				_, err := stmt.Exec(
					timeSlot, startTime, endTime,
					round, rooms[j], title, desc,
					string(speakersJSON), presenter,
				)
				if err != nil {
					tx.Rollback()
					return 0, err
				}
				count++
			}
		}
	}

	// Always add Lunch if not present
	stmt.Exec("12:05PM - 1:25PM", "12:05PM", "1:25PM", nil, "Garvey Commons", "Lunch Break", "Lunch served in Garvey Commons", `[""]`, "")

	return count, tx.Commit()
}
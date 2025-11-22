// db/db.go
package db

import (
	"database/sql"
	"log"

	_ "modernc.org/sqlite"
)

var DB *sql.DB

// Init creates/opens the SQLite database and creates schema
func Init() error {
	var err error
	DB, err = sql.Open("sqlite", "./db/jumpstart2024.db")
	if err != nil {
		return err
	}

	// Recommended pragmas for modernc.org/sqlite
	_, err = DB.Exec(`
		PRAGMA journal_mode = WAL;
		PRAGMA synchronous = NORMAL;
		PRAGMA foreign_keys = ON;
		PRAGMA busy_timeout = 5000;
	`)
	if err != nil {
		return err
	}

	createTable := `
	CREATE TABLE IF NOT EXISTS sessions (
		id          INTEGER PRIMARY KEY AUTOINCREMENT,
		time_slot   TEXT NOT NULL,        -- original: "10:30AM - 11:45AM"
		start_time  TEXT NOT NULL,        -- new: "10:30AM"
		end_time    TEXT NOT NULL,        -- new: "11:45AM"
		round       TEXT,
		room        TEXT NOT NULL,
		title       TEXT NOT NULL,
		description TEXT,
		speakers    TEXT NOT NULL,
		presenter   TEXT,
		event       TEXT,
		location    TEXT,
		search_text TEXT GENERATED ALWAYS AS (
			title || ' ' || COALESCE(description,'') || ' ' || room || ' ' || COALESCE(round,'')
		) VIRTUAL
	);

	CREATE INDEX IF NOT EXISTS idx_time_slot ON sessions(time_slot);
	CREATE INDEX IF NOT EXISTS idx_room      ON sessions(room);
	CREATE INDEX IF NOT EXISTS idx_search    ON sessions(search_text);
	`

	_, err = DB.Exec(createTable)
	if err != nil {
		return err
	}

	log.Println("SQLite database ready → ./db/jumpstart2024.db (modernc.org/sqlite)")
	return nil
}
package web

import (
    "os"
    _ "embed"
)


var ScheduleJSON []byte // This is your shared, live JSON

// Call this after saving to instantly update the live copy
func RefreshScheduleJSON() {
    if data, err := os.ReadFile("../schedule.json"); err == nil {
        ScheduleJSON = data
    }
}
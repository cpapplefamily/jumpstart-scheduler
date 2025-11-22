// static/js/schedule.js
document.addEventListener("DOMContentLoaded", async () => {
  const sessionsDiv = document.getElementById("sessions");
  const noResults = document.getElementById("no-results");
  const searchInput = document.getElementById("search");
  const roomFilter = document.getElementById("roomFilter");

  let sessions = [];

  // Load schedule.json
  try {
    const res = await fetch("/schedule.json?" + Date.now()); // cache bust
    sessions = await res.json();
    renderSessions(sessions);
  } catch (err) {
    sessionsDiv.innerHTML = "<p style='text-align:center;color:#f87171'>Failed to load schedule.json</p>";
  }

  function renderSessions(list) {
    if (list.length === 0) {
      noResults.classList.remove("hidden");
      sessionsDiv.innerHTML = "";
      return;
    }
    noResults.classList.add("hidden");

    sessionsDiv.innerHTML = list
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
      .map(s => `
        <div class="session">
          <div class="session-header">
            <div class="session-time">${s.time_slot}</div>
            ${s.round ? `<div class="session-round">${s.round}</div>` : ""}
          </div>
          <div class="session-body">
            <div class="session-title">${escapeHtml(s.title)}</div>
            <div class="session-room">${escapeHtml(s.room)}</div>
            ${s.description ? `<div class="session-desc">${escapeHtml(s.description)}</div>` : ""}
            ${s.speakers && s.speakers.length > 0 ? `
              <div class="session-speakers">
                <strong>Speakers:</strong> ${s.speakers.map(escapeHtml).join(", ")}
              </div>` : ""}
          </div>
        </div>
      `).join("");
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function filterSessions() {
    const query = searchInput.value.toLowerCase();
    const room = roomFilter.value;

    const filtered = sessions.filter(s => {
      const matchesSearch = s.title.toLowerCase().includes(query) ||
        (s.description && s.description.toLowerCase().includes(query)) ||
        (s.speakers && s.speakers.some(sp => sp.toLowerCase().includes(query))) ||
        s.room.toLowerCase().includes(query);

      const matchesRoom = !room || s.room === room;

      return matchesSearch && matchesRoom;
    });

    renderSessions(filtered);
  }

  searchInput.addEventListener("input", filterSessions);
  roomFilter.addEventListener("change", filterSessions);
});
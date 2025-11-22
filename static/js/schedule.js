// static/js/schedule.js
document.addEventListener("DOMContentLoaded", async () => {
  const tableBody = document.querySelector("#schedule-table tbody");
  const theadRow = document.querySelector("#schedule-table thead tr");
  const searchInput = document.getElementById("search");
  const updatedEl = document.getElementById("updated");
  const noResults = document.getElementById("no-results");

  let data = { rooms: [], sessions: [], generated_at: "" };

  try {
    const res = await fetch("/schedule.json?t=" + Date.now());
    data = await res.json();
  } catch (err) {
    noResults.textContent = "Failed to load schedule.json";
    noResults.classList.remove("hidden");
    return;
  }

  if (data.generated_at) {
    updatedEl.textContent = `Last updated: ${new Date(data.generated_at).toLocaleString()}`;
    updatedEl.classList.remove("hidden");
  }

  const rooms = data.rooms || [];
  const sessions = data.sessions || [];

  // Build header: Time/Round + all rooms
  rooms.forEach(room => {
    const th = document.createElement("th");
    th.textContent = room;
    theadRow.appendChild(th);
  });

  // Group sessions by round + time_slot
  const sessionsByRound = {};
  sessions.forEach(s => {
    const key = `${s.round || "Other"}|||${s.time_slot}`;
    if (!sessionsByRound[key]) {
      sessionsByRound[key] = { round: s.round || "Other", time_slot: s.time_slot, cells: {} };
    }
    sessionsByRound[key].cells[s.room] = s;
  });

  // Sort rounds naturally (Round 1, Round 2, etc.)
  const sortedKeys = Object.keys(sessionsByRound).sort((a, b) => {
    const ra = a.split("|||")[0];
    const rb = b.split("|||")[0];
    return ra.localeCompare(rb, undefined, { numeric: true });
  });

  // Build rows
  sortedKeys.forEach(key => {
    const item = sessionsByRound[key];
    const tr = document.createElement("tr");

    // First cell: Round + Time
    const timeCell = document.createElement("td");
    timeCell.innerHTML = `<strong>${escapeHtml(item.round)}</strong><br><small>${escapeHtml(item.time_slot)}</small>`;
    timeCell.style.fontWeight = "600";
    tr.appendChild(timeCell);

    // One cell per room
    rooms.forEach(room => {
      const td = document.createElement("td");
      td.className = "session-cell";
      const session = item.cells[room];
      if (session) {
        td.innerHTML = `
          <div class="session-card">
            <div class="session-title">${escapeHtml(session.title)}</div>
            ${session.speakers && session.speakers.length > 0
              ? `<div class="session-speakers">${session.speakers.map(escapeHtml).join(", ")}</div>`
              : ""}
          </div>`;
      }
      tr.appendChild(td);
    });

    tableBody.appendChild(tr);
  });

  // Search functionality
  searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim().toLowerCase();
    const rows = tableBody.querySelectorAll("tr");

    let visible = 0;
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      if (text.includes(query)) {
        row.style.display = "";
        visible++;
      } else {
        row.style.display = "none";
      }
    });

    noResults.classList.toggle("hidden", visible > 0);
  });
});

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text || "";
  return div.innerHTML;
}
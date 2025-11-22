document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(location.search);
  const roomName = decodeURIComponent(params.get("name") || "");
  
  if (!roomName) {
    document.body.innerHTML = "<h1 style='text-align:center;padding:5rem;color:#f87171'>Room not specified</h1>";
    return;
  }

  try {
    const res = await fetch("/schedule.json?t=" + Date.now());
    const data = await res.json();

    const sessionsInRoom = (data.sessions || [])
      .filter(s => s.room === roomName)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));

    if (sessionsInRoom.length === 0) {
      document.body.innerHTML = `<h1 style='text-align:center;padding:5rem;color:#cbd5e1'>No sessions found in<br><strong>${escape(roomName)}</strong></h1>`;
      return;
    }

    document.getElementById("page-title").textContent = roomName + " • JUMPSTART 2024";
    document.getElementById("room-name").textContent = roomName;
    document.getElementById("session-count").textContent = 
      `${sessionsInRoom.length} session${sessionsInRoom.length > 1 ? "s" : ""} scheduled`;

    const list = document.getElementById("sessions-list");
    list.innerHTML = sessionsInRoom.map(s => `
        <div class="session-item">
            <div class="session-time">${escape(s.time_slot)}</div>
            ${s.round ? `<div class="session-round">${escape(s.round)}</div>` : ""}
            
            <h3 class="session-title">
            <a href="/session?id=${s.id}" class="session-link">
                ${escape(s.title)}
            </a>
            </h3>
            
            ${s.description ? `<p class="session-desc">${escape(s.description)}</p>` : ""}
            
            ${s.speakers && s.speakers.length > 0 ? `
            <div class="session-speakers">
                <strong>Speakers:</strong> ${s.speakers.map(escape).join(", ")}
            </div>` : ""}
        </div>
    `).join("");

  } catch (err) {
    console.error(err);
    alert("Failed to load room schedule");
  }
});

function escape(text) {
  const div = document.createElement("div");
  div.textContent = text || "";
  return div.innerHTML;
}
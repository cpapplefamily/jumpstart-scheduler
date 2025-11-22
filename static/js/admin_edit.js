let data = { rooms: [], sessions: [] };
const modal = document.getElementById("modal");

document.addEventListener("DOMContentLoaded", () => {
  loadData();
  document.getElementById("refresh").onclick = loadData;
  document.getElementById("roomFilter").onchange = render;
  document.querySelector(".close").onclick = () => modal.classList.add("hidden");
  document.querySelector(".cancel").onclick = () => modal.classList.add("hidden");
  document.getElementById("editForm").onsubmit = saveSession;
});

async function loadData() {
  try {
    const res = await fetch("/schedule.json?t=" + Date.now());
    data = await res.json();

    const sel = document.getElementById("roomFilter");
    sel.innerHTML = `<option value="">All Rooms</option>`;
    data.rooms.forEach(r => sel.add(new Option(r, r)));

    render();
  } catch (e) {
    document.body.innerHTML = "<h2 style='color:#f87171;text-align:center;margin:4rem'>Failed to load schedule.json<br>Run importer first!</h2>";
  }
}

function render() {
  const room = document.getElementById("roomFilter").value;
  let list = data.sessions;
  if (room) list = list.filter(s => s.room === room);
  list.sort((a,b) => a.start_time.localeCompare(b.start_time));

  document.getElementById("sessions").innerHTML = list.map(s => `
    <div class="card" onclick="openEdit('${s.id}')">
      <div class="time">${s.time_slot} ${s.round ? '· ' + escape(s.round) : ''}</div>
      <div class="title">${escape(s.title)}</div>
      <div class="speakers">${escape(s.speakers?.join(", ") || "—")}</div>
      <div class="room">${escape(s.room)}</div>
    </div>
  `).join("") || "<p style='grid-column:1/-1;text-align:center;opacity:0.7'>No sessions found</p>";
}

function openEdit(id) {
  const s = data.sessions.find(x => x.id === id);
  document.getElementById("editId").value = s.id;
  document.getElementById("editRoom").textContent = s.room;
  document.getElementById("editTime").textContent = s.time_slot;
  document.getElementById("editRound").textContent = s.round || "—";
  document.getElementById("editTitle").value = s.title;
  document.getElementById("editDesc").value = s.description || "";
  document.getElementById("editSpeakers").value = s.speakers?.join(", ") || "";

  modal.classList.remove("hidden");
}

async function saveSession(e) {
  e.preventDefault();
  const id = document.getElementById("editId").value;
  const s = data.sessions.find(x => x.id === id);

  s.title = document.getElementById("editTitle").value.trim();
  s.description = document.getElementById("editDesc").value.trim();
  const sp = document.getElementById("editSpeakers").value;
  s.speakers = sp ? sp.split(",").map(x => x.trim()).filter(Boolean) : [];

  try {
    await fetch("/api/save-schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rooms: data.rooms, sessions: data.sessions }, null, 2)
    });
    alert("Saved!");
    modal.classList.add("hidden");
    render();
  } catch (err) {
    alert("Save failed");
  }
}

function escape(text) {
  const div = document.createElement("div");
  div.textContent = text || "";
  return div.innerHTML;
}
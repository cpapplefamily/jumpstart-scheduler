let data = { rooms: [], sessions: [] };
const tbody = document.querySelector("#schedule-table tbody");
const theadRow = document.querySelector("#schedule-table thead tr");
const modal = document.getElementById("modal");

document.addEventListener("DOMContentLoaded", () => {
  loadData();
  document.getElementById("refresh").onclick = loadData;
 /*  document.getElementById("roomFilter").onchange = render; */
  document.querySelector(".close").onclick = () => modal.classList.add("hidden");
  document.querySelector(".cancel").onclick = () => modal.classList.add("hidden");
  document.getElementById("editForm").onsubmit = saveSession;
});

async function loadData() {
  try {
    const res = await fetch("/schedule.json?t=" + Date.now());
    data = await res.json();

    // Populate room filter
    /* const sel = document.getElementById("roomFilter");
    sel.innerHTML = `<option value="">All Rooms</option>`;
    data.rooms.forEach(r => sel.add(new Option(r, r))); */

    // Populate header
    theadRow.innerHTML = `<th>Time / Round</th>`;
    data.rooms.forEach(r => {
      const th = document.createElement("th");
      th.textContent = r;
      theadRow.appendChild(th);
    });

    render();
  } catch (e) {
    document.body.innerHTML = "<h2 style='color:#f87171;text-align:center;margin:4rem'>Failed to load schedule.json</h2>";
  }
}

function render() {
  /* const selectedRoom = document.getElementById("roomFilter").value; */
  const sessionsByRound = {};

  data.sessions.forEach(s => {
    const key = `${s.round || "Other"}|||${s.time_slot}`;
    if (!sessionsByRound[key]) {
      sessionsByRound[key] = { round: s.round || "Other", time_slot: s.time_slot, cells: {} };
    }
    sessionsByRound[key].cells[s.room] = s;
  });

  const sorted = Object.keys(sessionsByRound).sort((a,b) => a.localeCompare(b, undefined, {numeric: true}));

  tbody.innerHTML = sorted.map(key => {
    const item = sessionsByRound[key];
    const tr = document.createElement("tr");

    const timeTd = document.createElement("td");
    timeTd.innerHTML = `<strong>${escape(item.round)}</strong><br><small>${escape(item.time_slot)}</small>`;
    tr.appendChild(timeTd);

    data.rooms.forEach(room => {
      const td = document.createElement("td");
      const session = item.cells[room];
      if (session) {
        td.innerHTML = `
          <div class="session-card" onclick="openEdit('${session.id}')">
            <div class="session-title">${escape(session.title)}</div>
            ${session.speakers?.length ? `<div class="session-speakers">${session.speakers.map(escape).join(", ")}</div>` : ""}
          </div>`;
      }
      tr.appendChild(td);
    });

    return tr.outerHTML;
  }).join("");
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
  s.speakers = document.getElementById("editSpeakers").value
    .split(",").map(x => x.trim()).filter(Boolean);

  await fetch("/api/save-schedule", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rooms: data.rooms, sessions: data.sessions }, null, 2)
  });

  alert("Saved!");
  modal.classList.add("hidden");
  render();
}

function escape(text) {
  const div = document.createElement("div");
  div.textContent = text || "";
  return div.innerHTML;
}
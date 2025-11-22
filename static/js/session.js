// static/js/session.js
document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(location.search);
  const sessionId = params.get("id");
  if (!sessionId) {
    document.body.innerHTML = "<h1 style='text-align:center;padding:4rem;color:#f87171'>Session not found</h1>";
    return;
  }

  try {
    const res = await fetch("/schedule.json?t=" + Date.now());
    const data = await res.json();
    const session = data.sessions.find(s => s.id === sessionId || s.title === sessionId);

    if (!session) {
      document.body.innerHTML = "<h1 style='text-align:center;padding:4rem;color:#f87171'>Session not found</h1>";
      return;
    }

    // Fill page
    document.getElementById("page-title").textContent = session.title + " • JUMPSTART 2024";
    document.getElementById("title").textContent = session.title;
    document.getElementById("time").textContent = session.time_slot;
    document.getElementById("room").textContent = session.room;

    // Speakers
    const speakersEl = document.getElementById("speakers");
    if (session.speakers && session.speakers.length > 0) {
      speakersEl.innerHTML = session.speakers.map(s => `<span>${escape(s)}</span>`).join("");
    } else {
      document.getElementById("speakers-section").style.display = "none";
    }

    // Description
    const descEl = document.getElementById("description");
    if (session.description && session.description.trim()) {
      descEl.textContent = session.description;
    } else {
      document.getElementById("description-section").style.display = "none";
    }

  } catch (err) {
    console.error(err);
    alert("Failed to load session details");
  }
});

function escape(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
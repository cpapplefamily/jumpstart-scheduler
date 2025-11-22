document.getElementById("loginForm").onsubmit = function(e) {
  e.preventDefault();
  
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  if (username === "admin" && password === "1234Five") {
    // Set session cookie (expires when browser closes)
    document.cookie = "adminAuth=1; path=/; SameSite=Strict";
    window.location.href = "/admin/edit";
  } else {
    document.getElementById("error").textContent = "Invalid username or password";
  }
};
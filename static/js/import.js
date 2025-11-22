document.getElementById('file').addEventListener('change', function(e) {
    const label = e.target.nextElementSibling;
    if (e.target.files.length > 0) {
        label.textContent = e.target.files[0].name;
        label.style.background = 'rgba(0, 212, 255, 0.3)';
    }
});
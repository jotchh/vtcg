fetch("/auth/me")
    .then(response => {
        if (!response.ok) {
            throw new Error("Not authenticated");
        }

        return response.json();
    })
    .then(user => {
        document.getElementById("username").textContent = user.username;
        document.getElementById("welcome-message").textContent =
            `Welcome back, ${user.username}!`;
    })
    .catch(() => {
        window.location.href = "/login.html";
    });

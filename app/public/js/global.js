function setupNavigation() {
    fetch("/auth/me")
        .then(response => {
            if (!response.ok) {
                throw new Error("Not authenticated");
            }

            return response.json();
        })
        .then(user => {
            renderLoggedInNavigation(user);
        })
        .catch(() => {
            renderLoggedOutNavigation();
        });
}

function renderLoggedInNavigation(user) {
    let username = document.getElementById("username");
    let authLink = document.getElementById("auth-link");
    let authenticatedNav = document.querySelectorAll(".authenticated-nav");

    if (username) {
        username.textContent = user.username;
    }

    if (authLink) {
        authLink.textContent = "Logout";
        authLink.href = "/auth/logout";
    }

    authenticatedNav.forEach(element => {
        element.style.display = "";
    });
}

function renderLoggedOutNavigation() {
    let username = document.getElementById("username");
    let authLink = document.getElementById("auth-link");
    let authenticatedNav = document.querySelectorAll(".authenticated-nav");

    if (username) {
        username.textContent = "";
        username.style.display = "none";
    }

    if (authLink) {
        authLink.textContent = "Login";
        authLink.href = "/login.html";
    }

    authenticatedNav.forEach(element => {
        element.style.display = "none";
    });
}

setupNavigation();

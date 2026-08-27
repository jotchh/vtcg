let form = document.getElementById("new-deck-form");
let statusMessage = document.getElementById("status-message");

form.addEventListener("submit", (event) => {
    event.preventDefault();
    let name = document.getElementById("deck-name").value.trim();

    if (!name) {
        statusMessage.textContent = "Deck name is required.";
        return;
    }

    fetch("/api/decks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
    })
        .then(response => response.json())
        .then(deck => {
            window.location.href = `deck-editor.html?id=${deck.id}`;
        })
        .catch(error => {
            console.error("Error creating deck:", error);
        });
});

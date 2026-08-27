let deckList = document.getElementById("deck-list");
let statusMessage = document.getElementById("status-message");
let newDeckBtn = document.getElementById("new-deck-btn");

function loadDecks() {
    fetch("/api/decks")
        .then(response => response.json())
        .then(decks => {
            renderDecks(decks);
        })
        .catch(error => {
            console.error("Error loading decks:", error);
        });
}

function renderDecks(decks) {
    deckList.replaceChildren();

    if (decks.length === 0) {
        let empty = document.createElement("li");
        empty.className = "hint";
        empty.textContent = "You don't have any decks yet. Click \"New Deck\" to create one.";
        deckList.appendChild(empty);
        return;
    }

    for (let deck of decks) {
        let row = document.createElement("li");
        row.className = "deck-row";

        let info = document.createElement("div");
        info.className = "deck-info";

        let name = document.createElement("span");
        name.textContent = deck.name;
        info.appendChild(name);

        let actions = document.createElement("div");
        actions.className = "deck-actions";

        let editBtn = document.createElement("button");
        editBtn.textContent = "Edit";
        editBtn.addEventListener("click", () => {
            window.location.href = `deck-editor.html?id=${deck.id}`;
        });

        let deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.addEventListener("click", () => deleteDeck(deck.id));

        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);

        row.appendChild(info);
        row.appendChild(actions);
        deckList.appendChild(row);
    }
}

function deleteDeck(deckId) {
    fetch(`/api/decks/${deckId}`, { method: "DELETE" })
        .then(response => {
            if (!response.ok) throw new Error("Failed to delete deck");
            return loadDecks();
        })
        .catch(error => {
            statusMessage.textContent = "Failed to delete deck.";
            console.error("Error deleting deck:", error);
        });
}

newDeckBtn.addEventListener("click", () => {
    window.location.href = "new-deck.html";
});

loadDecks();

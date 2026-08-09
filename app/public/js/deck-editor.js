let params = new URLSearchParams(window.location.search);
let deckId = params.get("id");
let mode = params.get("mode") === "edit" ? "edit" : "view";

let deckNameEl = document.getElementById("deck-name");
let deckTypeEl = document.getElementById("deck-type");
let modeActions = document.getElementById("mode-actions");
let statusMessage = document.getElementById("status-message");
let addCardSection = document.getElementById("add-card-section");
let addCardBtn = document.getElementById("add-card-btn");
let cardList = document.getElementById("card-list");

let currentDeck = null;

function loadDeck() {
    fetch(`/api/decks/${deckId}`)
        .then(response => response.json())
        .then(deck => {
            currentDeck = deck;
            renderDeck();
        })
        .catch(error => {
            console.error("Error loading deck:", error);
        });
}

function renderDeck() {
    deckNameEl.textContent = currentDeck.name;
    deckTypeEl.textContent = currentDeck.deckType === "WISHLIST" ? "Wishlist Deck" : "True Deck";

    renderModeActions();
    addCardSection.style.display = mode === "edit" ? "block" : "none";
    renderCards();
}

function renderModeActions() {
    modeActions.replaceChildren();

    if (mode === "view") {
        let editBtn = document.createElement("button");
        editBtn.textContent = "Edit Deck";
        editBtn.addEventListener("click", () => {
            window.location.href = `deck-editor.html?id=${deckId}&mode=edit`;
        });
        modeActions.appendChild(editBtn);
    } else {
        let doneBtn = document.createElement("button");
        doneBtn.textContent = "Done Editing";
        doneBtn.addEventListener("click", finishEditing);
        modeActions.appendChild(doneBtn);
    }
}

function renderCards() {
    cardList.replaceChildren();

    if (currentDeck.cards.length === 0) {
        let empty = document.createElement("li");
        empty.className = "hint";
        empty.textContent = mode === "edit"
            ? "No cards yet. Click \"Add Card\" to start building this deck."
            : "This deck has no cards.";
        cardList.appendChild(empty);
        return;
    }

    for (let card of currentDeck.cards) {
        let row = document.createElement("li");
        row.className = "card-row";

        let left = document.createElement("div");
        if (card.img_url) {
            let img = document.createElement("img");
            img.src = card.img_url;
            img.alt = card.name;
            left.appendChild(img);
        }
        let label = document.createElement("span");
        label.textContent = `${card.name} x${card.quantity}${card.set_name ? " (" + card.set_name + ")" : ""}`;
        left.appendChild(label);
        row.appendChild(left);

        if (mode === "edit") {
            let removeBtn = document.createElement("button");
            removeBtn.textContent = "Remove";
            removeBtn.addEventListener("click", () => removeCard(card.cardId));
            row.appendChild(removeBtn);
        }

        cardList.appendChild(row);
    }
}

function removeCard(cardId) {
    fetch(`/api/decks/${deckId}/cards/${cardId}`, { method: "DELETE" })
        .then(response => response.json())
        .then(deck => {
            currentDeck = deck;
            renderCards();
        })
        .catch(error => {
            console.error("Error removing card:", error);
        });
}

// TODO: wire up to card search/collections once that exists, no picker yet
addCardBtn.addEventListener("click", () => {
    statusMessage.textContent = "Card picker not built yet.";
});

// wishlist decks dump their cards into the wishlist when done editing
function finishEditing() {
    fetch(`/api/decks/${deckId}/finish-editing`, { method: "POST" })
        .then(response => response.json())
        .then(() => {
            window.location.href = `deck-editor.html?id=${deckId}&mode=view`;
        })
        .catch(error => {
            console.error("Error finishing edit:", error);
        });
}

loadDeck();

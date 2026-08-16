let params = new URLSearchParams(window.location.search);
let deckId = params.get("id");
let mode = params.get("mode") === "edit" ? "edit" : "view";

let deckNameEl = document.getElementById("deck-name");
let deckTypeEl = document.getElementById("deck-type");
let modeActions = document.getElementById("mode-actions");
let statusMessage = document.getElementById("status-message");
let addCardSection = document.getElementById("add-card-section");
let addCardBtn = document.getElementById("add-card-btn");
let cardPickerEl = document.getElementById("card-picker");
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
        doneBtn.addEventListener("click", () => {
            window.location.href = `deck-editor.html?id=${deckId}&mode=view`;
        });
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
        cardList.appendChild(renderCardRow(card, mode === "edit" ? removeCard : null));
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

function addCardToDeck(card) {
    fetch(`/api/decks/${deckId}/cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId: card.id, quantity: 1 }),
    })
        .then(response => response.json())
        .then(deck => {
            currentDeck = deck;
            cardPickerEl.style.display = "none";
            statusMessage.textContent = "";
            renderCards();
        })
        .catch(error => {
            statusMessage.textContent = "Failed to add card.";
            console.error("Error adding card:", error);
        });
}

addCardBtn.addEventListener("click", () => {
    if (currentDeck.deckType !== "WISHLIST") {
        // TODO: TRUE decks should pick from the user's owned collection (user_cards),
        // but no "my collection" endpoint exists yet on any branch.
        statusMessage.textContent = "Adding cards to true decks needs a collection API - not built yet.";
        return;
    }

    toggleCardPicker(cardPickerEl, addCardToDeck);
});

loadDeck();

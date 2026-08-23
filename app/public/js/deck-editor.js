let params = new URLSearchParams(window.location.search);
let deckId = params.get("id");

let deckNameEl = document.getElementById("deck-name");
let statusMessage = document.getElementById("status-message");
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
    renderCards();
}

function renderCards() {
    cardList.replaceChildren();

    if (currentDeck.cards.length === 0) {
        let empty = document.createElement("li");
        empty.className = "hint";
        empty.textContent = "No cards yet. Click \"Add Card\" to start building this deck.";
        cardList.appendChild(empty);
        return;
    }

    for (let card of currentDeck.cards) {
        cardList.appendChild(renderCardRow(card, removeCard));
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

addCardBtn.addEventListener("click", () => {
    // TODO: pick from the user's owned collection via /collections once that
    // route merges in from main - deck cards can't exceed what the user owns.
    statusMessage.textContent = "Adding cards needs the collections API, which lands after merging main.";
});

loadDeck();

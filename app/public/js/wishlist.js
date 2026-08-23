let cardList = document.getElementById("card-list");
let statusMessage = document.getElementById("status-message");
let addCardBtn = document.getElementById("add-card-btn");
let cardPickerEl = document.getElementById("card-picker");

function loadWishlist() {
    fetch("/api/wishlist")
        .then(response => response.json())
        .then(cards => {
            renderWishlist(cards);
        })
        .catch(error => {
            console.error("Error loading wishlist:", error);
        });
}

function renderWishlist(cards) {
    cardList.replaceChildren();

    if (cards.length === 0) {
        let empty = document.createElement("li");
        empty.className = "hint";
        empty.textContent = "Your wishlist is empty.";
        cardList.appendChild(empty);
        return;
    }

    for (let card of cards) {
        cardList.appendChild(renderCardRow(card, removeCard));
    }
}

function removeCard(cardId) {
    fetch(`/api/wishlist/${cardId}`, { method: "DELETE" })
        .then(response => response.json())
        .then(cards => renderWishlist(cards))
        .catch(error => {
            console.error("Error removing card:", error);
        });
}

function addCardToWishlist(card) {
    let quantity = parseInt(window.prompt(`How many of "${card.name}" do you want?`, "1"), 10);
    if (!quantity || quantity < 1) return;

    fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId: card.id, quantity }),
    })
        .then(response => response.json())
        .then(cards => {
            cardPickerEl.style.display = "none";
            statusMessage.textContent = "";
            renderWishlist(cards);
        })
        .catch(error => {
            statusMessage.textContent = "Failed to add card.";
            console.error("Error adding card:", error);
        });
}

addCardBtn.addEventListener("click", () => {
    toggleCardPicker(cardPickerEl, searchAllCards, addCardToWishlist);
});

loadWishlist();

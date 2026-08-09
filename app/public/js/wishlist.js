let cardList = document.getElementById("card-list");
let statusMessage = document.getElementById("status-message");
let addCardBtn = document.getElementById("add-card-btn");

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

        let removeBtn = document.createElement("button");
        removeBtn.textContent = "Remove";
        removeBtn.addEventListener("click", () => removeCard(card.cardId));
        row.appendChild(removeBtn);

        cardList.appendChild(row);
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

// TODO: wire up to card search once that exists, no picker yet
addCardBtn.addEventListener("click", () => {
    statusMessage.textContent = "Card picker not built yet.";
});

loadWishlist();

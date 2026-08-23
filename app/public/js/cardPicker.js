// Shared card-picker UI used by deck-editor.js and wishlist.js's "Add Card" buttons.
// Visually reuses search.css's .card-grid/.card classes so the picker matches the
// look of the search/collection pages.

// Every card in the catalog, matching a name/set search (no ownership filter).
// Used by the wishlist picker - you can wish for anything, owned or not.
function searchAllCards(query) {
    let url = `/search/product?q=${encodeURIComponent(query)}`;
    return fetch(url).then(response => {
        if (!response.ok) throw new Error("Failed to search cards");
        return response.json();
    }).then(data => data.cards);
}

// Cards the current user owns, with how many of each. Used by the deck-editor
// picker - deck quantities can't exceed what's here. /collections has no text
// search yet (only game/set_name/rarity filters), so `query` is unused for now.
function searchOwnedCards(query) {
    return fetch("/collections").then(response => {
        if (!response.ok) throw new Error("Failed to load collection");
        return response.json();
    }).then(data => data.cards.map(c => ({ ...c, cardId: c.id })));
}

// Renders a searchable card grid inside `container` and calls onPick(card) when the
// user selects one. `fetchCards(query)` resolves to an array of { id, name, set_name,
// rarity, img_url }.
function renderCardPicker(container, fetchCards, onPick) {
    container.replaceChildren();

    let form = document.createElement("form");
    form.className = "search-controls";
    let input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Search cards...";
    let submit = document.createElement("button");
    submit.type = "submit";
    submit.textContent = "Search";
    form.append(input, submit);

    let status = document.createElement("p");
    status.className = "hint";

    let grid = document.createElement("div");
    grid.className = "card-grid";

    container.append(form, status, grid);

    function renderGrid(cards) {
        grid.replaceChildren();

        if (cards.length === 0) {
            let empty = document.createElement("p");
            empty.className = "hint";
            empty.textContent = "No cards found.";
            grid.appendChild(empty);
            return;
        }

        for (let card of cards) {
            let item = document.createElement("div");
            item.className = "card";

            if (card.img_url) {
                let img = document.createElement("img");
                img.src = card.img_url;
                img.alt = card.name;
                item.appendChild(img);
            }

            let content = document.createElement("div");
            content.className = "card-content";

            let title = document.createElement("h3");
            title.textContent = card.name;
            content.appendChild(title);

            let meta = document.createElement("div");
            meta.className = "meta";
            meta.textContent = card.set_name || "";
            content.appendChild(meta);

            if (card.quantity !== undefined) {
                let owned = document.createElement("div");
                owned.className = "meta";
                owned.textContent = `You own: ${card.quantity}`;
                content.appendChild(owned);
            }

            let pickBtn = document.createElement("button");
            pickBtn.type = "button";
            pickBtn.textContent = "Add";
            pickBtn.addEventListener("click", () => onPick(card));
            content.appendChild(pickBtn);

            item.appendChild(content);
            grid.appendChild(item);
        }
    }

    function runSearch(query) {
        status.textContent = "Loading...";
        fetchCards(query)
            .then(cards => {
                status.textContent = "";
                renderGrid(cards);
            })
            .catch(error => {
                status.textContent = "Failed to load cards.";
                console.error("Error loading cards:", error);
            });
    }

    form.addEventListener("submit", event => {
        event.preventDefault();
        runSearch(input.value.trim());
    });

    runSearch("");
}

// Shows/hides the picker in `container`, (re)rendering it each time it's opened.
function toggleCardPicker(container, fetchCards, onPick) {
    let showing = container.style.display !== "none";
    if (showing) {
        container.style.display = "none";
        return;
    }

    container.style.display = "block";
    renderCardPicker(container, fetchCards, onPick);
}

// Builds a card-row element for a card already in a deck/wishlist:
// image + "name xN (set)" label, plus a Remove button if onRemove is given.
// `card` has { cardId, name, set_name, quantity, img_url }.
function renderCardRow(card, onRemove) {
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

    if (onRemove) {
        let removeBtn = document.createElement("button");
        removeBtn.textContent = "Remove";
        removeBtn.addEventListener("click", () => onRemove(card.cardId));
        row.appendChild(removeBtn);
    }

    return row;
}

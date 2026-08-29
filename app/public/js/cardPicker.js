// Shared card-picker UI used by deck-editor.js and wishlist.js's "Add Card" buttons.
// Visually reuses search.css's .card-grid/.card classes so the picker matches the
// look of the search/collection pages.

// Both /search/product and /collections paginate at a fixed page size and only
// return one page per call. The picker wants the full result set to search/pick
// from, so this fetches every page (up to a sane cap) and concatenates them.
const MAX_PICKER_PAGES = 25;

async function fetchAllPages(urlForPage) {
    let cards = [];
    let page = 1;
    let totalPages = 1;

    do {
        let response = await fetch(urlForPage(page));
        if (!response.ok) throw new Error("Failed to load cards");
        let data = await response.json();
        cards = cards.concat(data.cards);
        totalPages = data.totalPages || 1;
        page++;
    } while (page <= totalPages && page <= MAX_PICKER_PAGES);

    return cards;
}

// Every card in the catalog, matching a name/set search (no ownership filter).
// Used by the wishlist picker - you can wish for anything, owned or not.
function searchAllCards(query) {
    return fetchAllPages(page => `/search/product?q=${encodeURIComponent(query)}&page=${page}`);
}

// Cards the current user owns, with how many of each. Used by the deck-editor
// picker - deck quantities can't exceed what's here. /collections has no text
// search yet (only game/set_name/rarity filters), so `query` is unused for now.
function searchOwnedCards(query) {
    return fetchAllPages(page => `/collections?page=${page}`)
        .then(cards => cards.map(c => ({ ...c, cardId: c.id })));
}

// Renders a searchable card grid inside `container` and calls onPick(card) when the
// user selects one. `fetchCards(query)` resolves to an array of { id, name, set_name,
// rarity, img_url }.
function renderCardPicker(container, fetchCards, onPick) {
    container.replaceChildren();

    let form = document.createElement("form");
    form.className = "search-controls";
    let field = document.createElement("div");
    field.className = "search-field";
    let input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Search cards...";
    input.id = "search";
    field.appendChild(input);
    let submit = document.createElement("button");
    submit.type = "submit";
    submit.id = "submit";
    submit.textContent = "Search";
    form.append(field, submit);

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
            pickBtn.className = "card-btn";
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

// Builds a .card tile for a card already in a deck/wishlist, matching the same
// .card/.quantity-badge structure collections.js uses for owned cards - image,
// a "xN" quantity badge, name/set, and a Remove button instead of a click-through.
// `card` has { cardId, name, set_name, quantity, img_url }.
function renderCardTile(card, onRemove) {
    let tile = document.createElement("div");
    tile.className = "card";

    tile.addEventListener("click", () => {
        window.location.href = `/card.html?id=${encodeURIComponent(card.cardId ?? card.id)}`;
    });

    if (card.img_url) {
        let img = document.createElement("img");
        img.src = card.img_url;
        img.alt = card.name;
        tile.appendChild(img);
    }

    let quantityBadge = document.createElement("div");
    quantityBadge.className = "quantity-badge";
    quantityBadge.textContent = `x${card.quantity}`;
    tile.appendChild(quantityBadge);

    let content = document.createElement("div");
    content.className = "card-content";

    let title = document.createElement("h3");
    title.textContent = card.name;
    content.appendChild(title);

    if (card.set_name) {
        let meta = document.createElement("div");
        meta.className = "meta";
        meta.textContent = card.set_name;
        content.appendChild(meta);
    }

    if (onRemove) {
        let removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "card-btn";
        removeBtn.textContent = "Remove";
        removeBtn.addEventListener("click", event => {
            event.stopPropagation();
            onRemove(card.cardId);
        });
        content.appendChild(removeBtn);
    }

    tile.appendChild(content);
    return tile;
}

// Renders a list of deck/wishlist cards as a .card-grid of tiles inside `container`,
// or a hint message if there are none.
function renderCardGrid(container, cards, emptyMessage, onRemove) {
    container.replaceChildren();

    if (cards.length === 0) {
        let empty = document.createElement("p");
        empty.className = "hint";
        empty.textContent = emptyMessage;
        container.appendChild(empty);
        return;
    }

    for (let card of cards) {
        container.appendChild(renderCardTile(card, onRemove));
    }
}

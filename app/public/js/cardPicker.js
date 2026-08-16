// Adapter over the card search API used by deck & wishlist "Add Card" pickers.
// Backed today by the shared /search?q= route, which returns every match unpaginated.
// TODO: once josh.cardsearch merges, swap searchCards() to call
// /search/product?q=&game=&page= (real server-side pagination) instead - callers don't change.

function searchCards(query) {
    let url = query ? `/search?q=${encodeURIComponent(query)}` : "/search";
    return fetch(url).then(response => {
        if (!response.ok) throw new Error("Failed to search cards");
        return response.json();
    });
}

// Renders a searchable card list inside `container` and calls onPick(card)
// when the user selects one. `card` has { id, name, set_name, rarity, img_url }.
function renderCardPicker(container, onPick) {
    container.replaceChildren();

    let form = document.createElement("form");
    let input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Search cards...";
    let submit = document.createElement("button");
    submit.type = "submit";
    submit.textContent = "Search";
    form.append(input, submit);

    let status = document.createElement("p");
    status.className = "hint";

    let grid = document.createElement("ul");
    grid.className = "card-picker-grid";

    container.append(form, status, grid);

    function renderGrid(cards) {
        grid.replaceChildren();

        if (cards.length === 0) {
            let empty = document.createElement("li");
            empty.className = "hint";
            empty.textContent = "No cards found.";
            grid.appendChild(empty);
            return;
        }

        for (let card of cards) {
            let item = document.createElement("li");
            item.className = "card-picker-item";

            if (card.img_url) {
                let img = document.createElement("img");
                img.src = card.img_url;
                img.alt = card.name;
                item.appendChild(img);
            }

            let label = document.createElement("span");
            label.textContent = `${card.name}${card.set_name ? " (" + card.set_name + ")" : ""}`;
            item.appendChild(label);

            let pickBtn = document.createElement("button");
            pickBtn.type = "button";
            pickBtn.textContent = "Add";
            pickBtn.addEventListener("click", () => onPick(card));
            item.appendChild(pickBtn);

            grid.appendChild(item);
        }
    }

    function runSearch(query) {
        status.textContent = "Loading...";
        searchCards(query)
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
function toggleCardPicker(container, onPick) {
    let showing = container.style.display !== "none";
    if (showing) {
        container.style.display = "none";
        return;
    }

    container.style.display = "block";
    renderCardPicker(container, onPick);
}

// Builds a <li class="card-row"> for a card already in a deck/wishlist:
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

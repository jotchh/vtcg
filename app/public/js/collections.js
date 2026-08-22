let gameSelect = document.getElementById("game-select");
let setSelect = document.getElementById("set-select");
let raritySelect = document.getElementById("rarity-select");
let resultsGrid = document.getElementById("collection-results");
let queryMessage = document.getElementById("query-message");

let prevBtn = document.getElementById("prev-page");
let nextBtn = document.getElementById("next-page");
let pageInfo = document.getElementById("page-info");

let allSets = [];
let currentPage = 1;
let totalPages = 1;
let totalCards = 0;

const RARITY_LABELS = { M: "Mythic", R: "Rare", U: "Uncommon", C: "Common" };

function populateSetsForGame(selectedGame) {
    let currentValue = setSelect.value;
    setSelect.replaceChildren();

    let allOption = document.createElement("option");
    allOption.value = "";
    allOption.textContent = "All Sets";
    setSelect.appendChild(allOption);

    for (let set of allSets) {
        if (selectedGame && set.game !== selectedGame) continue;

        let option = document.createElement("option");
        option.value = set.set_name;
        option.textContent = set.set_name;
        setSelect.appendChild(option);
    }

    if ([...setSelect.options].some(option => option.value === currentValue)) {
        setSelect.value = currentValue;
    }
}

function loadFilters() {
    return fetch("/collections/filters")
        .then(response => response.json())
        .then(data => {
            allSets = data.sets;

            gameSelect.replaceChildren();
            let allGamesOption = document.createElement("option");
            allGamesOption.value = "";
            allGamesOption.textContent = "All Games";
            gameSelect.appendChild(allGamesOption);

            for (let game of data.games) {
                let option = document.createElement("option");
                option.value = game;
                option.textContent = game;
                gameSelect.appendChild(option);
            }

            populateSetsForGame(gameSelect.value);
        })
        .catch(error => {
            console.error("Error loading collection filters:", error);
        });
}

gameSelect.addEventListener("change", () => {
    populateSetsForGame(gameSelect.value);
});

function setLoading(loading) {
    if (loading) {
        queryMessage.textContent = "LOADING...";
        prevBtn.disabled = true;
        nextBtn.disabled = true;
    } else {
        queryMessage.textContent = totalCards === 0 ? "No cards found." : "";
        prevBtn.disabled = currentPage === 1;
        nextBtn.disabled = currentPage === totalPages;
    }
}

function renderGrid(cards) {
    resultsGrid.replaceChildren();

    for (let card of cards) {
        let cardElement = document.createElement("div");
        cardElement.className = "card";

        let image = document.createElement("img");
        image.src = card.img_url;
        image.alt = card.name;

        let quantityBadge = document.createElement("div");
        quantityBadge.className = "quantity-badge";
        quantityBadge.textContent = `x${card.quantity}`;

        let cardContent = document.createElement("div");
        cardContent.className = "card-content";

        let title = document.createElement("h3");
        title.textContent = card.name;

        let meta = document.createElement("div");
        meta.className = "meta";

        let game = document.createElement("div");
        let gameLabel = document.createElement("strong");
        gameLabel.textContent = "Game:";
        game.append(gameLabel, document.createTextNode(` ${card.game}`));

        let set = document.createElement("div");
        let setLabel = document.createElement("strong");
        setLabel.textContent = "Set:";
        set.append(setLabel, document.createTextNode(` ${card.set_name}`));

        let rarity = document.createElement("div");
        let rarityLabel = document.createElement("strong");
        rarityLabel.textContent = "Rarity:";
        rarity.append(rarityLabel, document.createTextNode(` ${RARITY_LABELS[card.rarity] ?? card.rarity}`));

        meta.append(game, set, rarity);
        cardContent.append(title, meta);
        cardElement.append(image, quantityBadge, cardContent);

        cardElement.addEventListener("click", () => {
            window.location.href = `card.html?id=${card.id}`;
        });

        resultsGrid.appendChild(cardElement);
    }
}

function loadCollection(page = 1) {
    let params = new URLSearchParams({ page });

    if (gameSelect.value) params.set("game", gameSelect.value);
    if (setSelect.value) params.set("set_name", setSelect.value);
    if (raritySelect.value) params.set("rarity", raritySelect.value);

    setLoading(true);
    return fetch(`/collections?${params.toString()}`)
        .then(response => {
            if (!response.ok) {
                throw new Error("Failed to load collection");
            }
            return response.json();
        })
        .then(data => {
            currentPage = data.page;
            totalPages = data.totalPages;
            totalCards = data.total;
            renderGrid(data.cards);
            pageInfo.textContent = `Page ${currentPage} of ${totalPages} (${totalCards} unique cards)`;
        })
        .catch(error => {
            console.error("Error loading collection:", error);
            queryMessage.textContent = "Failed to load collection.";
            resultsGrid.replaceChildren();
        })
        .finally(() => {
            setLoading(false);
        });
}

prevBtn.addEventListener("click", () => {
    if (currentPage > 1) loadCollection(currentPage - 1);
});

nextBtn.addEventListener("click", () => {
    if (currentPage < totalPages) loadCollection(currentPage + 1);
});

document.getElementById("filter-form").addEventListener("submit", event => {
    event.preventDefault();
    loadCollection(1);
});

loadFilters().then(() => loadCollection(1));

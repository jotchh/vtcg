let gameSelect = document.getElementById("game-select");
let setSelect = document.getElementById("set-select");
let opensRemaining = document.getElementById("opens-remaining");
let statusMessage = document.getElementById("status-message");
let openBtn = document.getElementById("open-btn");
let tbody = document.getElementById("pulled-cards");

let packOpening = document.getElementById("pack-opening");
let pack = document.getElementById("pack");
let packSetName = document.getElementById("pack-set-name");
let packFlash = document.getElementById("pack-flash");
let cardReveal = document.getElementById("card-reveal");
let resultsTable = document.getElementById("results-table");

let allSets = [];

function populateSetsForGame(selectedGame) {
    setSelect.replaceChildren();

    for (let set of allSets) {
        if (set.game !== selectedGame) continue;

        let option = document.createElement("option");
        option.value = set.set_name;
        option.textContent = set.set_name;
        setSelect.appendChild(option);
    }
}

async function loadPackInfo() {
    fetch("/packs")
        .then(response => {
            if (!response.ok) {
                throw new Error(
                    response.status === 403
                        ? "You must be logged in to open packs."
                        : "Failed to load pack info."
                );
            }

            return response.json();
        })
        .then(data => {
            opensRemaining.textContent =
                `Free opens left today: ${data.dailyPackOpens}`;

            allSets = data.sets;

            let games = [...new Set(allSets.map(set => set.game))];

            gameSelect.replaceChildren();

            for (let game of games) {
                let option = document.createElement("option");
                option.value = game;
                option.textContent = game;
                gameSelect.appendChild(option);
            }

            populateSetsForGame(gameSelect.value);
        })
        .catch(error => {
            console.error("Error loading pack info:", error);
            statusMessage.textContent = error.message;
        });
}

gameSelect.addEventListener("change", () => {
    populateSetsForGame(gameSelect.value);
});

function renderResults(cards) {
    tbody.replaceChildren();

    for (let card of cards) {
        let row = document.createElement("tr");

        let nameCell = document.createElement("td");
        let setCell = document.createElement("td");
        let rarityCell = document.createElement("td");
        let imgCell = document.createElement("td");
        let img = document.createElement("img");

        nameCell.textContent = card.name;
        setCell.textContent = card.set_name;
        rarityCell.textContent = card.rarity;

        img.src = card.img_url;
        img.alt = card.name;
        img.width = 100;

        imgCell.appendChild(img);

        row.appendChild(nameCell);
        row.appendChild(setCell);
        row.appendChild(rarityCell);
        row.appendChild(imgCell);

        tbody.appendChild(row);
    }
}

function wait(milliseconds) {
    return new Promise(resolve => {
        setTimeout(resolve, milliseconds);
    });
}

async function animatePackOpening(cards, setName) {
    packOpening.classList.remove("hidden");
    resultsTable.classList.add("hidden");

    cardReveal.replaceChildren();

    packSetName.textContent = setName;

    pack.classList.remove("open");
    pack.classList.add("shake");

    await wait(1000);

    pack.classList.remove("shake");
    pack.classList.add("open");

    packFlash.classList.remove("active");

    void packFlash.offsetWidth;

    packFlash.classList.add("active");

    await wait(500);

    for (let card of cards) {
        cardReveal.replaceChildren();

        let img = document.createElement("img");

        img.className = "reveal-card";
        img.src = card.img_url;
        img.alt = card.name;

        cardReveal.appendChild(img);

        await wait(1200);
    }

    packOpening.classList.add("hidden");
    resultsTable.classList.remove("hidden");

    renderResults(cards);
}

document.getElementById("open-form").addEventListener("submit", (event) => {
    event.preventDefault();

    if (!gameSelect.value || !setSelect.value) {
        statusMessage.textContent = "No set selected.";
        return;
    }

    let game = gameSelect.value;
    let set_name = setSelect.value;

    statusMessage.textContent = "Opening pack...";
    openBtn.disabled = true;

    fetch("/packs/open", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            game,
            set_name
        }),
    })
        .then(async response => {
            if (!response.ok) {
                throw new Error(await response.text());
            }

            return response.json();
        })
        .then(async data => {
            statusMessage.textContent = "Opening pack...";

            await animatePackOpening(data.cards, set_name);

            statusMessage.textContent =
                `Pulled ${data.cards.length} cards!`;

            loadPackInfo();
        })
        .catch(error => {
            statusMessage.textContent =
                `ERROR opening pack: ${error.message}`;

            console.error("Error opening pack:", error);

            packOpening.classList.add("hidden");
            resultsTable.classList.remove("hidden");
        })
        .finally(() => {
            openBtn.disabled = false;
        });
});

let scrapToggleBtn = document.getElementById("scrap-toggle-btn");
let scrapPanel = document.getElementById("scrap-panel");
let scrapCardList = document.getElementById("scrap-card-list");
let scrapSelectionInfo = document.getElementById("scrap-selection-info");
let scrapConfirmBtn = document.getElementById("scrap-confirm-btn");
let scrapCostLabel = document.getElementById("scrap-cost");

const RARITY_LABELS = { M: "Mythic", R: "Rare", U: "Uncommon", C: "Common" };

let scrapCost = 10;
let selectedScrapIds = new Set();
let scrappableLoaded = false;

function updateScrapSelectionInfo() {
    scrapSelectionInfo.textContent = `${selectedScrapIds.size} / ${scrapCost} selected`;
    scrapConfirmBtn.disabled = selectedScrapIds.size !== scrapCost;

    let atMax = selectedScrapIds.size >= scrapCost;
    for (let checkbox of scrapCardList.querySelectorAll("input[type=checkbox]")) {
        checkbox.disabled = atMax && !checkbox.checked;
    }
}

function renderScrappable(cards) {
    scrapCardList.replaceChildren();
    selectedScrapIds.clear();

    if (cards.length === 0) {
        scrapCardList.textContent = "You have no cards available to scrap.";
        updateScrapSelectionInfo();
        return;
    }

    for (let card of cards) {
        let label = document.createElement("label");
        label.className = "scrap-card";

        let checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = card.user_card_id;

        checkbox.addEventListener("change", () => {
            if (checkbox.checked) {
                selectedScrapIds.add(card.user_card_id);
            } else {
                selectedScrapIds.delete(card.user_card_id);
            }
            label.classList.toggle("selected", checkbox.checked);
            updateScrapSelectionInfo();
        });

        let img = document.createElement("img");
        img.src = card.img_url;
        img.alt = card.name;
        img.width = 80;

        let text = document.createElement("span");
        let rarity = RARITY_LABELS[card.rarity] ?? card.rarity;
        text.textContent = `${card.name} · ${card.set_name} · ${rarity}`;

        label.append(checkbox, img, text);
        scrapCardList.appendChild(label);
    }

    updateScrapSelectionInfo();
}

function loadScrappable() {
    scrapCardList.textContent = "Loading...";
    return fetch("/packs/scrappable")
        .then(async response => {
            if (!response.ok) {
                throw new Error(await response.text());
            }
            return response.json();
        })
        .then(data => {
            scrapCost = data.scrapCost;
            scrapCostLabel.textContent = scrapCost;
            scrapConfirmBtn.textContent = `Scrap ${scrapCost} & Open Pack`;
            renderScrappable(data.cards);
            scrappableLoaded = true;
        })
        .catch(error => {
            console.error("Error loading scrappable cards:", error);
            scrapCardList.textContent = `Failed to load cards: ${error.message}`;
        });
}

scrapToggleBtn.addEventListener("click", () => {
    let show = scrapPanel.hidden;
    scrapPanel.hidden = !show;
    scrapToggleBtn.textContent = show ? "Hide Scrap Menu" : "Scrap Cards for a Pack";
    if (show && !scrappableLoaded) {
        loadScrappable();
    }
});

scrapConfirmBtn.addEventListener("click", () => {
    if (!gameSelect.value || !setSelect.value) {
        statusMessage.textContent = "No set selected.";
        return;
    }
    if (selectedScrapIds.size !== scrapCost) return;

    let game = gameSelect.value;
    let set_name = setSelect.value;
    let user_card_ids = [...selectedScrapIds];

    if (!confirm(`Permanently scrap ${scrapCost} cards to open a ${set_name} pack?`)) return;

    statusMessage.textContent = "Scrapping cards and opening pack...";
    scrapConfirmBtn.disabled = true;

    fetch("/packs/scrap-open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game, set_name, user_card_ids }),
    })
        .then(async response => {
            if (!response.ok) {
                throw new Error(await response.text());
            }
            return response.json();
        })
        .then(async data => {
            statusMessage.textContent = "Opening pack...";

            await animatePackOpening(data.cards, set_name);

            statusMessage.textContent = `Scrapped ${scrapCost} cards and pulled ${data.cards.length} new cards!`;
            scrappableLoaded = false;
            loadScrappable();
            loadPackInfo();
        })
        .catch(error => {
            statusMessage.textContent = `ERROR scrapping for pack: ${error.message}`;
            console.error("Error scrapping for pack:", error);

            packOpening.classList.add("hidden");
            resultsTable.classList.remove("hidden");
        })
        .finally(() => {
            updateScrapSelectionInfo();
        });
});

loadPackInfo();
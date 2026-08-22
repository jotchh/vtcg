let gameSelect = document.getElementById("game-select");
let setSelect = document.getElementById("set-select");
let opensRemaining = document.getElementById("opens-remaining");
let statusMessage = document.getElementById("status-message");
let openBtn = document.getElementById("open-btn");
let tbody = document.getElementById("pulled-cards");
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
        .then(response => response.json())
        .then(data => {
            opensRemaining.textContent = `Free opens left today: ${data.dailyPackOpens}`;

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
        let cndCell = document.createElement("td");
        let imgCell = document.createElement("td");
        let img = document.createElement("img");

        nameCell.textContent = card.name;
        setCell.textContent = card.set_name;
        rarityCell.textContent = card.rarity;
        cndCell.textContent = card.cnd;

        img.src = card.img_url;
        img.alt = card.name;
        img.width = 100;

        imgCell.appendChild(img);

        row.appendChild(nameCell);
        row.appendChild(setCell);
        row.appendChild(rarityCell);
        row.appendChild(cndCell);
        row.appendChild(imgCell);

        tbody.appendChild(row);
    }
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game, set_name }),
    })
        .then(async response => {
            if (!response.ok) {
                throw new Error(await response.text());
            }
            return response.json();
        })
        .then(data => {
            statusMessage.textContent = `Pulled ${data.cards.length} cards!`;
            renderResults(data.cards);
            loadPackInfo();
        })
        .catch(error => {
            statusMessage.textContent = `ERROR opening pack: ${error.message}`;
            console.error("Error opening pack:", error);
        })
        .finally(() => {
            openBtn.disabled = false;
        });
});

loadPackInfo();

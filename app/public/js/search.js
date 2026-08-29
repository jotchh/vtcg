let submitBtn = document.getElementById("submit");
let gameSelect = document.getElementById("game-select");
let tbody = document.getElementById("search-results");
let queryMessage = document.getElementById("query-message");

let prevBtn = document.getElementById("prev-page");
let nextBtn = document.getElementById("next-page");
let pageInfo = document.getElementById("page-info");

let cards = [];
let currentPage = 1;
let totalCards = 0;
let totalPages = 1;

function loadFilters() {
    return fetch("/search/filters")
        .then(response => {
            if (!response.ok) {
                throw new Error("Failed to load filters");
            }

            return response.json();
        })
        .then(data => {
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
        })
        .catch(error => {
            console.error("Error loading search filters:", error);
        });
    }

function loadCards(page = 1) {
    let search = document.getElementById("search").value;
    let game = gameSelect.value;

    let url = `/search/product?q=${encodeURIComponent(search)}&page=${page}`;

    if (game) {
        url += `&game=${encodeURIComponent(game)}`;
        console.log(url);
    }

    setLoading(true);

    return fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error("Failed to load cards");
            }

            return response.json();
        })
        .then(data => {
            cards = data.cards;
            currentPage = data.page;
            totalCards = data.total;
            totalPages = data.totalPages;

            renderGrid();
        })
        .catch(error => {
            console.error("Error fetching cards:", error);

            queryMessage.textContent = "Failed to load cards.";
            renderError();
        })
        .finally(() => {
            setLoading(false);

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        });
}

function setLoading(loading) {
    if (loading) {
        queryMessage.textContent = "LOADING...";

        prevBtn.disabled = true;
        nextBtn.disabled = true;

        renderSkeletons();
    } else {
        queryMessage.textContent = "";

        prevBtn.disabled = currentPage === 1;
        nextBtn.disabled = currentPage === totalPages;
    }
}

function renderSkeletons() {
    tbody.replaceChildren();

    for (let i = 0; i < 8; i++) {
        let card = document.createElement("div");
        card.className = "card skeleton-card";

        let image = document.createElement("div");
        image.className = "skeleton-image";

        let content = document.createElement("div");
        content.className = "card-content";

        let title = document.createElement("div");
        title.className = "skeleton-line title";

        let line1 = document.createElement("div");
        line1.className = "skeleton-line";

        let line2 = document.createElement("div");
        line2.className = "skeleton-line";

        let shortLine = document.createElement("div");
        shortLine.className = "skeleton-line short";

        content.append(title, line1, line2, shortLine);
        card.append(image, content);
        tbody.append(card);
    }
}

function renderError() {
    tbody.replaceChildren();

    let errorMessage = document.createElement("div");
    errorMessage.className = "error-message";
    errorMessage.textContent = "Something went wrong while loading the cards.";

    tbody.append(errorMessage);
}

function renderGrid() {
    tbody.replaceChildren();

    cards.forEach(card => {
        let cardElement = document.createElement("div");
        cardElement.className = "card";

        let image = document.createElement("img");
        image.src = card.img_url;
        image.alt = card.name;

        let cardContent = document.createElement("div");
        cardContent.className = "card-content";

        let title = document.createElement("h3");
        title.textContent = card.name;

        let meta = document.createElement("div");
        meta.className = "meta";

        let game = document.createElement("div");
        let gameLabel = document.createElement("strong");
        gameLabel.textContent = "Game:";

        game.append(
            gameLabel,
            document.createTextNode(` ${card.game}`)
        );

        let set = document.createElement("div");
        let setLabel = document.createElement("strong");
        setLabel.textContent = "Set:";

        set.append(
            setLabel,
            document.createTextNode(` ${card.set_name}`)
        );

        meta.append(game, set);
        cardContent.append(title, meta);
        cardElement.append(image, cardContent);

        cardElement.addEventListener("click", () => {
            window.location.href = `card.html?id=${card.id}`;
        });

        tbody.append(cardElement);
    });

    pageInfo.textContent =
        `Page ${currentPage} of ${totalPages} (${totalCards} cards)`;
}

prevBtn.addEventListener("click", () => {
    if (currentPage > 1) {
        loadCards(currentPage - 1);
    }
});

nextBtn.addEventListener("click", () => {
    if (currentPage < totalPages) {
        loadCards(currentPage + 1);
    }
});

document.getElementById("search-form").addEventListener("submit", event => {
    event.preventDefault();

    let search = document.getElementById("search").value;

    loadCards(1)
        .then(() => {
            if (search) {
                queryMessage.textContent = `Searching for: ${search}`;
            } else {
                queryMessage.textContent = "";
            }
        })
        .catch(error => {
            queryMessage.textContent =
                `ERROR searching for: ${search} - ${error.message}`;

            console.error("Error searching cards:", error);
        });
});

loadFilters().then(() => loadCards(1));
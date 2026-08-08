let submitBtn = document.getElementById("submit");
let tbody = document.getElementById("search-results");
let queryMessage = document.getElementById("query-message");
let gameSelect = document.getElementById("game-select");

let prevBtn = document.getElementById("prev-page");
let nextBtn = document.getElementById("next-page");
let pageInfo = document.getElementById("page-info");

let cards = [];
let currentPage = 1;
let totalCards = 0;
let totalPages = 1;

function loadCards(page = 1) {
    const search = document.getElementById("search").value;

    setLoading(true);

    return fetch(`/search/all/product?q=${encodeURIComponent(search)}&page=${page}`)
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
            renderTable();
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
        const card = document.createElement("div");
        card.className = "card skeleton-card";

        const image = document.createElement("div");
        image.className = "skeleton-image";

        const content = document.createElement("div");
        content.className = "card-content";

        const title = document.createElement("div");
        title.className = "skeleton-line title";

        const line1 = document.createElement("div");
        line1.className = "skeleton-line";

        const line2 = document.createElement("div");
        line2.className = "skeleton-line";

        const shortLine = document.createElement("div");
        shortLine.className = "skeleton-line short";

        content.append(title, line1, line2, shortLine);
        card.append(image, content);
        tbody.append(card);
    }
}

function renderError() {
    tbody.replaceChildren();

    const errorMessage = document.createElement("div");
    errorMessage.className = "error-message";
    errorMessage.textContent = "Something went wrong while loading the cards.";

    tbody.append(errorMessage);
}

function renderTable() {
    tbody.replaceChildren();

    cards.forEach(card => {
        let details;

        try {
            details = typeof card.ext_data === "string" ? JSON.parse(card.ext_data) : card.ext_data;
        } catch (error) {
            details = null;
        }

        const cardElement = document.createElement("div");
        cardElement.className = "card";

        const image = document.createElement("img");
        image.src = card.img_url;
        image.alt = card.name;

        const cardContent = document.createElement("div");
        cardContent.className = "card-content";

        const title = document.createElement("h3");
        title.textContent = card.name;

        const meta = document.createElement("div");
        meta.className = "meta";

        const game = document.createElement("div");
        const gameLabel = document.createElement("strong");
        gameLabel.textContent = "Game:";

        game.append(gameLabel, document.createTextNode(` ${card.game}`));

        const set = document.createElement("div");
        const setLabel = document.createElement("strong");
        setLabel.textContent = "Set:";

        set.append(setLabel, document.createTextNode(` ${card.set_name}`));

        meta.append(game, set);

        const detailsElement = document.createElement("div");
        detailsElement.className = "details";

        if (details && typeof details === "object") {
            Object.entries(details).forEach(([key, value]) => {
                const detail = document.createElement("div");
                const label = document.createElement("strong");
                label.textContent = `${key}:`;

                detail.append(label);
                const description = document.createElement("span");
                description.innerHTML = value;
                detail.append(description);

                detailsElement.append(detail);
            });
        } else {
            detailsElement.textContent = "No details";
        }

        cardContent.append(title, meta, detailsElement);
        cardElement.append(image,cardContent);
        tbody.append(cardElement);
    });

    pageInfo.textContent = `Page ${currentPage} of ${totalPages} (${totalCards} cards)`;
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

document
    .getElementById("search-form")
    .addEventListener("submit", event => {
        event.preventDefault();

        const search =
            document.getElementById("search").value;

        loadCards(1)
            .then(() => {
                if (search) {
                    queryMessage.textContent =
                        `Searching for: ${search}`;
                } else {
                    queryMessage.textContent = "";
                }
            })
            .catch(error => {
                queryMessage.textContent =
                    `ERROR searching for: ${search} - ${error.message}`;

                console.error(
                    "Error searching cards:",
                    error
                );
            });
    });

loadCards(1);
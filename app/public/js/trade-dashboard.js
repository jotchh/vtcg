
let users = [];

let userSearchButton = document.getElementById("user-search-button");
let cardSearchButton = document.getElementById("card-search-button");
let userSearchPanel = document.getElementById("user-search-panel");
let cardSearchPanel = document.getElementById("card-search-panel");
let userSearchInput = document.getElementById("user-search");
let userResults = document.getElementById("user-results");
let cardSearchInput = document.getElementById("card-search");
let cardResults = document.getElementById("card-results");
let gameFilter = document.getElementById("game-filter");
let setFilter = document.getElementById("set-filter");
let incomingTab = document.getElementById("incoming-tab");
let outgoingTab = document.getElementById("outgoing-tab");
let completedTab = document.getElementById("completed-tab");
let tradeList = document.getElementById("trade-list");
let allSets = [];

let currentPage = 1;
let totalPages = 1;

let previousPageButton = document.getElementById("previous-page");
let nextPageButton = document.getElementById("next-page");
let pageNumber = document.getElementById("page-number");

let myTrades = {
    incoming: [],
    outgoing: [],
    completed: []
};

fetch("/trades/users")
.then(response => {
    return response.json();
})
.then(data => {
    users = data;
})
.catch(error => {
    console.error("Error loading trade users:", error);
});

function loadCardFilters() {
    fetch("/trades/filters")
    .then(response => {
        if (!response.ok) {
            throw new Error("Failed to load card filters");
        }

        return response.json();
    })
    .then(data => {
        allSets = data.sets;

        gameFilter.replaceChildren();

        let allGamesOption = document.createElement("option");
        allGamesOption.value = "";
        allGamesOption.textContent = "All Games";

        gameFilter.appendChild(allGamesOption);

        for (let game of data.games) {
            let option = document.createElement("option");

            option.value = game;
            option.textContent = game;

            gameFilter.appendChild(option);
        }

        populateSets(gameFilter.value);
    })
    .catch(error => {
        console.error("Error loading trade card filters:", error);
    });
}

function populateSets(selectedGame) {
    let currentValue = setFilter.value;

    setFilter.replaceChildren();

    let allSetsOption = document.createElement("option");
    allSetsOption.value = "";
    allSetsOption.textContent = "All Sets";

    setFilter.appendChild(allSetsOption);

    for (let set of allSets) {
        if (selectedGame && set.game !== selectedGame) {
            continue;
        }

        let option = document.createElement("option");

        option.value = set.set_name;
        option.textContent = set.set_name;

        setFilter.appendChild(option);
    }

    if ([...setFilter.options].some(option => option.value === currentValue)) {
        setFilter.value = currentValue;
    }
}

userSearchButton.addEventListener("click", function() {
    userSearchPanel.style.display = "block";
    cardSearchPanel.style.display = "none";

    userSearchButton.classList.add("active");
    cardSearchButton.classList.remove("active");
});

cardSearchButton.addEventListener("click", function() {
    userSearchPanel.style.display = "none";
    cardSearchPanel.style.display = "block";

    cardSearchButton.classList.add("active");
    userSearchButton.classList.remove("active");
});

userSearchInput.addEventListener("input", function() {
    let searchText = userSearchInput.value.toLowerCase();

    while (userResults.firstChild) {
        userResults.removeChild(userResults.firstChild);
    }

    let matchingUsers = users.filter(function(user) {
        return user.username.toLowerCase().includes(searchText);
    });

    matchingUsers.forEach(function(user) {
        let result = document.createElement("div");

        let username = document.createElement("p");
        username.textContent = user.username;

        let cardCount = document.createElement("p");
        cardCount.textContent = `${user.tradable_cards} tradable cards`;

        let tradeButton = document.createElement("button");
        tradeButton.textContent = "Start Trade";

        tradeButton.addEventListener("click", function() {
            window.location.href = `create-trade.html?userId=${user.id}`;
        });

        result.appendChild(username);
        result.appendChild(cardCount);
        result.appendChild(tradeButton);

        userResults.appendChild(result);
    });
});

function searchTradeCards(page = 1) {
    let searchText = cardSearchInput.value.trim();
    let game = gameFilter.value;
    let setName = setFilter.value;

    while (cardResults.firstChild) {
        cardResults.removeChild(cardResults.firstChild);
    }

    if (searchText === "" && game === "" && setName === "") {
        currentPage = 1;
        totalPages = 1;

        pageNumber.textContent = "Page 1";
        previousPageButton.disabled = true;
        nextPageButton.disabled = true;

        return;
    }

    let params = new URLSearchParams();

    if (searchText) {
        params.set("search", searchText);
    }

    if (game) {
        params.set("game", game);
    }

    if (setName) {
        params.set("set_name", setName);
    }

    params.set("page", page);

    fetch(`/trades/search-cards?${params.toString()}`)
    .then(response => {
        if (!response.ok) {
            throw new Error("Failed to search trade cards");
        }

        return response.json();
    })
    .then(data => {
        currentPage = data.page;
        totalPages = data.totalPages;

        pageNumber.textContent =
            `Page ${currentPage} of ${totalPages}`;

        previousPageButton.disabled = currentPage <= 1;
        nextPageButton.disabled = currentPage >= totalPages;

        for (let card of data.cards) {
            let result = document.createElement("div");
            result.className = "card-result";

            let image = document.createElement("img");
            image.src = card.img_url;
            image.alt = card.name;

            let cardName = document.createElement("h3");
            cardName.textContent = card.name;

            let cardInfo = document.createElement("div");
            cardInfo.className = "card-result-content";

            let gameName = document.createElement("p");
            gameName.className = "card-game";
            gameName.textContent = card.game;

            let setName = document.createElement("p");
            setName.textContent = card.set_name;

            let owner = document.createElement("p");
            owner.textContent = `Owned by: ${card.username}`;

            let copyCount = document.createElement("p");
            copyCount.className = "card-copies";
            copyCount.textContent =
                `${card.tradable_copies} tradable copies`;

            let tradeButton = document.createElement("button");
            tradeButton.textContent = "Start Trade";

            tradeButton.addEventListener("click", function() {
                window.location.href =
                    `create-trade.html?userId=${card.user_id}`;
            });

            cardInfo.appendChild(gameName);
            cardInfo.appendChild(setName);
            cardInfo.appendChild(owner);
            cardInfo.appendChild(copyCount);

            result.appendChild(image);
            result.appendChild(cardName);
            result.appendChild(cardInfo);
            result.appendChild(tradeButton);

            cardResults.appendChild(result);
        }
    })
    .catch(error => {
        console.error("Error searching trade cards:", error);
    });
}

cardSearchInput.addEventListener("input", function() {
    searchTradeCards(1);
});

gameFilter.addEventListener("change", function() {
    populateSets(gameFilter.value);
    searchTradeCards(1);
});

setFilter.addEventListener("change", function() {
    searchTradeCards(1);
});

previousPageButton.addEventListener("click", function() {
    if (currentPage > 1) {
        searchTradeCards(currentPage - 1);
    }
});

nextPageButton.addEventListener("click", function() {
    if (currentPage < totalPages) {
        searchTradeCards(currentPage + 1);
    }
});

userSearchPanel.style.display = "block";
cardSearchPanel.style.display = "none";

fetch("/trades/my-trades")
.then(response => {
    return response.json();
})
.then(data => {
    myTrades = data;
    displayTrades("incoming");
})
.catch(error => {
    console.error("Error loading trades:", error);
});

incomingTab.addEventListener("click", function() {
    displayTrades("incoming");
});

outgoingTab.addEventListener("click", function() {
    displayTrades("outgoing");
});

completedTab.addEventListener("click", function() {
    displayTrades("completed");
});

function displayTrades(type) {
    while (tradeList.firstChild) {
        tradeList.removeChild(tradeList.firstChild);
    }

    incomingTab.classList.remove("active");
    outgoingTab.classList.remove("active");
    completedTab.classList.remove("active");

    if (type === "incoming") {
        incomingTab.classList.add("active");
    } else if (type === "outgoing") {
        outgoingTab.classList.add("active");
    } else {
        completedTab.classList.add("active");
    }

    let trades = myTrades[type];

    if (trades.length === 0) {
        let message = document.createElement("p");
        message.textContent = "No trades to display.";

        tradeList.appendChild(message);
        return;
    }

    for (let i = 0; i < trades.length; i++) {
        let trade = trades[i];

        let tradeResult = document.createElement("div");
        tradeResult.classList.add("trade-item");

        let tradeTitle = document.createElement("h3");

        if (type === "incoming") {
            tradeTitle.textContent =
                `Trade from ${trade.other_username}`;
        } else {
            tradeTitle.textContent =
                `Trade with ${trade.other_username}`;
        }

        let status = document.createElement("p");
        status.textContent = `Status: ${trade.status}`;

        let offeredCards = document.createElement("div");
        let requestedCards = document.createElement("div");

        offeredCards.classList.add("trade-side");
        requestedCards.classList.add("trade-side");

        let offeredTitle = document.createElement("h4");
        let requestedTitle = document.createElement("h4");

        if (type === "incoming") {
            offeredTitle.textContent = "They Offer";
            requestedTitle.textContent = "They Request";
        } else if (type === "outgoing") {
            offeredTitle.textContent = "You Offer";
            requestedTitle.textContent = "You Request";
        } else {
            offeredTitle.textContent = "Offered Cards";
            requestedTitle.textContent = "Requested Cards";
        }

        offeredCards.appendChild(offeredTitle);
        requestedCards.appendChild(requestedTitle);

        tradeResult.appendChild(tradeTitle);
        tradeResult.appendChild(status);

        if (type === "incoming" && trade.status === "PENDING") {
            let acceptButton = document.createElement("button");
            acceptButton.textContent = "Accept";

            acceptButton.addEventListener("click", function() {
                fetch(`/trades/${trade.id}/accept`, {
                    method: "PATCH"
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error("Trade could not be accepted");
                    }

                    return response.json();
                })
                .then(data => {
                    console.log(data);

                    myTrades.incoming =
                        myTrades.incoming.filter(function(currentTrade) {
                            return currentTrade.id !== trade.id;
                        });

                    trade.status = "COMPLETED";
                    myTrades.completed.push(trade);

                    displayTrades("incoming");
                })
                .catch(error => {
                    console.error("Error accepting trade:", error);
                });
            });

            let rejectButton = document.createElement("button");
            rejectButton.textContent = "Reject";

            rejectButton.addEventListener("click", function() {
                fetch(`/trades/${trade.id}/reject`, {
                    method: "PATCH"
                })
                .then(response => {
                    return response.json();
                })
                .then(data => {
                    console.log(data);

                    myTrades.incoming =
                        myTrades.incoming.filter(function(currentTrade) {
                            return currentTrade.id !== trade.id;
                        });

                    trade.status = "REJECTED";
                    myTrades.completed.push(trade);

                    displayTrades("incoming");
                })
                .catch(error => {
                    console.error("Error rejecting trade:", error);
                });
            });

            tradeResult.appendChild(acceptButton);
            tradeResult.appendChild(rejectButton);
        }

        tradeResult.appendChild(offeredCards);
        tradeResult.appendChild(requestedCards);

        tradeList.appendChild(tradeResult);

        loadTradeCards(
            trade.id,
            offeredCards,
            requestedCards
        );
    }
}

function loadTradeCards(tradeID, offeredCards, requestedCards) {
    fetch(`/trades/${tradeID}/cards`)
    .then(response => {
        return response.json();
    })
    .then(data => {
        for (let i = 0; i < data.length; i++) {
            let card = data[i];

            let cardResult = document.createElement("div");
            cardResult.classList.add("trade-card-result");

            let image = document.createElement("img");
            image.src = card.img_url;
            image.alt = card.name;

            let cardName = document.createElement("p");
            cardName.textContent = card.name;

            let condition = document.createElement("p");
            condition.textContent = card.cnd;

            cardResult.appendChild(image);
            cardResult.appendChild(cardName);
            cardResult.appendChild(condition);

            if (card.trade_side === "OFFER") {
                offeredCards.appendChild(cardResult);
            } else {
                requestedCards.appendChild(cardResult);
            }
        }
    })
    .catch(error => {
        console.error("Error loading trade cards:", error);
    });
}

loadCardFilters();
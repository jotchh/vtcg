let users = [];

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

let userSearchButton = document.getElementById("user-search-button");
let cardSearchButton = document.getElementById("card-search-button");
let userSearchPanel = document.getElementById("user-search-panel");
let cardSearchPanel = document.getElementById("card-search-panel");
let userSearchInput = document.getElementById("user-search");
let userResults = document.getElementById("user-results");
let cardSearchInput = document.getElementById("card-search");
let cardResults = document.getElementById("card-results");
let incomingTab = document.getElementById("incoming-tab");
let outgoingTab = document.getElementById("outgoing-tab");
let completedTab = document.getElementById("completed-tab");
let tradeList = document.getElementById("trade-list");

let myTrades = {
    incoming: [],
    outgoing: [],
    completed: []
};

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

cardSearchInput.addEventListener("input", function() {
    let searchText = cardSearchInput.value.trim();

    while (cardResults.firstChild) {
        cardResults.removeChild(cardResults.firstChild);
    }

    if (searchText === "") {
        return;
    }

    fetch(`/trades/search-cards?search=${searchText}`)
    .then(response => {
        return response.json();
    })
    .then(data => {
        for (let i = 0; i < data.length; i++) {
            let card = data[i];

            let result = document.createElement("div");

            let image = document.createElement("img");
            image.src = card.img_url;
            image.alt = card.name;

            let cardName = document.createElement("p");
            cardName.textContent = card.name;

            let owner = document.createElement("p");
            owner.textContent = `Owned by: ${card.username}`;

            let setName = document.createElement("p");
            setName.textContent = card.set_name;

            let copyCount = document.createElement("p");
            copyCount.textContent = `${card.tradable_copies} tradable copies`;

            let tradeButton = document.createElement("button");
            tradeButton.textContent = "Start Trade";

            tradeButton.addEventListener("click", function() {
                window.location.href = `create-trade.html?userId=${card.user_id}`;
            });

            result.appendChild(image);
            result.appendChild(cardName);
            result.appendChild(owner);
            result.appendChild(setName);
            result.appendChild(copyCount);
            result.appendChild(tradeButton);

            cardResults.appendChild(result);
        }
    })
    .catch(error => {
        console.error("Error searching trade cards:", error);
    });
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
            tradeTitle.textContent = `Trade from ${trade.other_username}`;
        } else if (type === "outgoing") {
            tradeTitle.textContent = `Trade with ${trade.other_username}`;
        } else {
            tradeTitle.textContent = `Trade with ${trade.other_username}`;
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
                    
                    myTrades.incoming = myTrades.incoming.filter(function(currentTrade) {
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
                    
                    myTrades.incoming = myTrades.incoming.filter(function(currentTrade) {
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

        loadTradeCards(trade.id, offeredCards, requestedCards);
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
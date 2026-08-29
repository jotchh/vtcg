let yourCardList = document.getElementById("your-card-list");
let offeredCardsList = document.getElementById("offered-cards");
let params = new URLSearchParams(window.location.search);
let userID = params.get("userId");
let tradePartnerName = document.getElementById("trade-partner-name");
let partnerCollectionName = document.getElementById("partner-collection-name");
let offeredCards = [];
let requestedCards = [];
let theirCardList = document.getElementById("their-card-list");
let requestedCardsList = document.getElementById("requested-cards");
let yourCardSearch = document.getElementById("your-card-search");
let theirCardSearch = document.getElementById("their-card-search");
let yourCards = [];
let theirCards = [];

fetch(`/trades/users/${userID}`)
.then(response => {
    return response.json();
})
.then(data => {
    tradePartnerName.textContent = data.username;
    partnerCollectionName.textContent = data.username;
})
.catch(error => {
    console.error("Error loading trade partner:", error);
});

fetch(`/trades/users/${userID}/cards`)
.then(response => {
    return response.json();
})
.then(data => {
    theirCards = data;
    displayTheirCards();
})
.catch(error => {
    console.error("Error loading trade user cards:", error);
});

fetch("/trades/my-cards")
.then(response => {
    return response.json();
})
.then(data => {
    yourCards = data;
    displayYourCards();
})
.catch(error => {
    console.error("Error loading your cards:", error);
});

yourCardSearch.addEventListener("input", function() {
    displayYourCards();
});

theirCardSearch.addEventListener("input", function() {
    displayTheirCards();
});

function displayYourCards() {
    while (yourCardList.firstChild) {
        yourCardList.removeChild(yourCardList.firstChild);
    }

    let search = yourCardSearch.value.toLowerCase().trim();

    for (let i = 0; i < yourCards.length; i++) {
        let card = yourCards[i];

        if (
            search &&
            !card.name.toLowerCase().includes(search) &&
            !card.set_name.toLowerCase().includes(search)
        ) {
            continue;
        }

        let cardResult = document.createElement("div");
        cardResult.classList.add("trade-card");

        let cardName = document.createElement("p");
        cardName.textContent = card.name;

        let condition = document.createElement("p");
        condition.textContent = card.cnd;

        let image = document.createElement("img");
        image.src = card.img_url;
        image.alt = card.name;

        let offerButton = document.createElement("button");
        offerButton.textContent = "Offer";

        offerButton.addEventListener("click", function() {
            let alreadySelected = false;

            for (let j = 0; j < offeredCards.length; j++) {
                if (offeredCards[j].user_card_id === card.user_card_id) {
                    alreadySelected = true;
                    break;
                }
            }

            if (alreadySelected === false) {
                offeredCards.push(card);
                displayOfferedCards();
            }
        });

        cardResult.appendChild(image);
        cardResult.appendChild(cardName);
        cardResult.appendChild(condition);
        cardResult.appendChild(offerButton);

        yourCardList.appendChild(cardResult);
    }
}

function displayTheirCards() {
    while (theirCardList.firstChild) {
        theirCardList.removeChild(theirCardList.firstChild);
    }

    let search = theirCardSearch.value.toLowerCase().trim();

    for (let i = 0; i < theirCards.length; i++) {
        let card = theirCards[i];

        if (
            search &&
            !card.name.toLowerCase().includes(search) &&
            !card.set_name.toLowerCase().includes(search)
        ) {
            continue;
        }

        let cardResult = document.createElement("div");
        cardResult.classList.add("trade-card");

        let cardName = document.createElement("p");
        cardName.textContent = card.name;

        let condition = document.createElement("p");
        condition.textContent = card.cnd;

        let image = document.createElement("img");
        image.src = card.img_url;
        image.alt = card.name;

        let requestButton = document.createElement("button");
        requestButton.textContent = "Request";

        requestButton.addEventListener("click", function() {
            let alreadySelected = false;

            for (let j = 0; j < requestedCards.length; j++) {
                if (requestedCards[j].user_card_id === card.user_card_id) {
                    alreadySelected = true;
                    break;
                }
            }

            if (alreadySelected === false) {
                requestedCards.push(card);
                displayRequestedCards();
            }
        });

        cardResult.appendChild(image);
        cardResult.appendChild(cardName);
        cardResult.appendChild(condition);
        cardResult.appendChild(requestButton);

        theirCardList.appendChild(cardResult);
    }
}

let submitTradeButton = document.getElementById("submit-trade");
let tradeMessage = document.getElementById("trade-message");

submitTradeButton.addEventListener("click", function() {
    let offeredCardIDs = [];
    let requestedCardIDs = [];

    offeredCards.forEach(function(card) {
        offeredCardIDs.push(card.user_card_id);
    });

    requestedCards.forEach(function(card) {
        requestedCardIDs.push(card.user_card_id);
    });

    if (offeredCardIDs.length === 0 || requestedCardIDs.length === 0) {
        tradeMessage.textContent = "Select at least one card to offer and request.";
        return;
    }

    tradeMessage.textContent = "Creating trade request..."
    submitTradeButton.disabled = true;

    fetch("/trades", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            receiverID: userID,
            offeredCardIDs: offeredCardIDs,
            requestedCardIDs: requestedCardIDs
        })
    })
    .then(response => {
        return response.json();
    })
    .then(data => {
        tradeMessage.textContent = "Trade created successfully.";
        submitTradeButton.disabled = true;
        console.log(data);
    })
    .catch(error => {
        console.error("Error creating trade:", error);
        tradeMessage.textContent = "Error creating trade.";
        submitTradeButton.disabled = false;
    });
});

function displayRequestedCards() {
    while (requestedCardsList.firstChild) {
        requestedCardsList.removeChild(requestedCardsList.firstChild);
    }

    if (requestedCards.length === 0) {
        let emptyMessage = document.createElement("p");
        emptyMessage.classList.add("empty-message");
        emptyMessage.textContent = "No cards selected.";
        requestedCardsList.appendChild(emptyMessage);
        return;
    }

    for (let i = 0; i < requestedCards.length; i++) {
        let card = requestedCards[i];

        let requestedCard = document.createElement("div");
        requestedCard.classList.add("summary-card");

        let cardName = document.createElement("p");
        cardName.textContent = card.name;

        let condition = document.createElement("p");
        condition.textContent = card.cnd;

        let removeButton = document.createElement("button");
        removeButton.textContent = "Remove";

        removeButton.addEventListener("click", function() {
            requestedCards.splice(i, 1);
            displayRequestedCards();
        });

        requestedCard.appendChild(cardName);
        requestedCard.appendChild(condition);
        requestedCard.appendChild(removeButton);

        requestedCardsList.appendChild(requestedCard);
    }
}

function displayOfferedCards() {
    while (offeredCardsList.firstChild) {
        offeredCardsList.removeChild(offeredCardsList.firstChild);
    }

    if (offeredCards.length === 0) {
        let emptyMessage = document.createElement("p");
        emptyMessage.classList.add("empty-message");
        emptyMessage.textContent = "No cards selected.";
        offeredCardsList.appendChild(emptyMessage);
        return;
    }

    for (let i = 0; i < offeredCards.length; i++) {
        let card = offeredCards[i];

        let offeredCard = document.createElement("div");
        offeredCard.classList.add("summary-card");

        let cardName = document.createElement("p");
        cardName.textContent = card.name;

        let condition = document.createElement("p");
        condition.textContent = card.cnd;

        let removeButton = document.createElement("button");
        removeButton.textContent = "Remove";

        removeButton.addEventListener("click", function() {
            offeredCards.splice(i, 1);
            displayOfferedCards();
        });

        offeredCard.appendChild(cardName);
        offeredCard.appendChild(condition);
        offeredCard.appendChild(removeButton);

        offeredCardsList.appendChild(offeredCard);
    }
}

let yourScrollLeft = document.getElementById("your-scroll-left");
let yourScrollRight = document.getElementById("your-scroll-right");

let theirScrollLeft = document.getElementById("their-scroll-left");
let theirScrollRight = document.getElementById("their-scroll-right");

function scrollCards(list, direction) {
    let card = list.querySelector(".trade-card");

    if (!card) {
        return;
    }

    let cardWidth = card.offsetWidth;
    let gap = parseInt(getComputedStyle(list).gap) || 0;

    list.scrollBy({
        left: direction * (cardWidth + gap),
        behavior: "smooth"
    });
}

yourScrollLeft.addEventListener("click", function() {
    scrollCards(yourCardList, -1);
});

yourScrollRight.addEventListener("click", function() {
    scrollCards(yourCardList, 1);
});

theirScrollLeft.addEventListener("click", function() {
    scrollCards(theirCardList, -1);
});

theirScrollRight.addEventListener("click", function() {
    scrollCards(theirCardList, 1);
});

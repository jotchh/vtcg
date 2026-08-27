let yourCardList = document.getElementById("your-card-list");
let offeredCardsList = document.getElementById("offered-cards");

let params = new URLSearchParams(window.location.search);
let userID = params.get("userId");

let offeredCards = [];
let requestedCards = [];

let theirCardList = document.getElementById("their-card-list");
let requestedCardsList = document.getElementById("requested-cards");

fetch(`/trades/users/${userID}/cards`)
.then(response => {
    return response.json();
})
.then(data => {
    let theirCards = data;

    for (let i = 0; i < theirCards.length; i++) {
        let card = theirCards[i];
        
        let cardResult = document.createElement("div");
        
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
})
.catch(error => {
    console.error("Error loading trade user cards:", error);
});

fetch("/trades/my-cards")
.then(response => {
    return response.json();
})
.then(data => {
    let yourCards = data;

    for (let i = 0; i < yourCards.length; i++) {
        let card = yourCards[i];
        
        let cardResult = document.createElement("div");
        
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
})
.catch(error => {
    console.error("Error loading trade user cards:", error);
});

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
        console.log(data);
    })
    .catch(error => {
        console.error("Error creating trade:", error);
        tradeMessage.textContent = "Error creating trade.";
    });
});

function displayRequestedCards() {
    while (requestedCardsList.firstChild) {
        requestedCardsList.removeChild(requestedCardsList.firstChild);
    }

    for (let i = 0; i < requestedCards.length; i++) {
        let card = requestedCards[i];

        let requestedCard = document.createElement("div");

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
};

function displayOfferedCards() {
    while (offeredCardsList.firstChild) {
        offeredCardsList.removeChild(offeredCardsList.firstChild);
    }

    for (let i = 0; i < offeredCards.length; i++) {
        let card = offeredCards[i];

        let offeredCard = document.createElement("div");

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
};
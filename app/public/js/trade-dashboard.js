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

userSearchButton.addEventListener("click", function() {
    userSearchPanel.style.display = "block";
    cardSearchPanel.style.display = "none";
});

cardSearchButton.addEventListener("click", function() {
    userSearchPanel.style.display = "none";
    cardSearchPanel.style.display = "block";
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
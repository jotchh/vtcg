let users = [
    { id: 1, username: "testuser", tradableCards: 5 },
    { id: 2, username: "user123", tradableCards: 10 },
    { id: 3, username: "sampleuser", tradableCards: 3 }
];

let userSearchButton = document.getElementById("user-search-button");
let cardSearchButton = document.getElementById("card-search-button");
let userSearchPanel = document.getElementById("user-search-panel");
let cardSearchPanel = document.getElementById("card-search-panel");
let userSearchInput = document.getElementById("user-search");
let userResults = document.getElementById("user-results");

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
        cardCount.textContent = `${user.tradableCards} tradable cards`;

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

userSearchPanel.style.display = "block";
cardSearchPanel.style.display = "none";
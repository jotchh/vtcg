let pageTitle = document.getElementById("page-title");
let cardViewer = document.getElementById("card-viewer");
let queryMessage = document.getElementById("query-message");

let params = new URLSearchParams(window.location.search);
let cardId = params.get("id");

if (!cardId) {
    queryMessage.textContent = "No card specified.";
} else {
    fetch(`/card/api/${cardId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error("Failed to load card");
            }
            return response.json();
        })
        .then(card => {
            console.log(card);

            pageTitle.textContent = card.name;
            queryMessage.remove();

            let cardElement = document.createElement("div");
            cardElement.className = "card";

            let cardArt = document.createElement("div");
            cardArt.className = "card-art";

            let image = document.createElement("img");
            image.src = card.img_url;
            image.alt = card.name;

            cardArt.append(image);

            let cardContent = document.createElement("div");
            cardContent.className = "card-content";

            let title = document.createElement("h3");
            title.textContent = card.name;

            let meta = document.createElement("div");
            meta.className = "meta";

            let game = document.createElement("div");
            let gameLabel = document.createElement("strong");
            gameLabel.textContent = "Game:";
            game.append(gameLabel, document.createTextNode(` ${card.game}`));

            let set = document.createElement("div");
            let setLabel = document.createElement("strong");
            setLabel.textContent = "Set:";
            set.append(setLabel, document.createTextNode(` ${card.set_name}`));

            let rarity = document.createElement("div");
            let rarityLabel = document.createElement("strong");
            rarityLabel.textContent = "Rarity:";
            rarity.append(rarityLabel, document.createTextNode(` ${card.rarity}`));

            meta.append(game, set, rarity);

            let detailsElement = document.createElement("div");
            detailsElement.className = "details";

            let details;

            try {
                details = typeof card.ext_data === "string" ? JSON.parse(card.ext_data) : card.ext_data;
            } catch (error) {
                details = null;
            }

            if (details && typeof details === "object") {
                Object.entries(details).forEach(([key, value]) => {
                    let detail = document.createElement("div");

                    let label = document.createElement("strong");
                    label.textContent = `${key}:`;

                    let description = document.createElement("span");
                    description.innerHTML = value;

                    detail.append(label, description);
                    detailsElement.append(detail);
                });
            } else {
                detailsElement.textContent = "No details";
            }

            cardContent.append(title, meta, detailsElement);
            cardElement.append(cardArt, cardContent);
            cardViewer.append(cardElement);
        })
        .catch(error => {
            console.error("Error fetching card:", error);
            queryMessage.textContent = "Failed to load card.";
        });
}

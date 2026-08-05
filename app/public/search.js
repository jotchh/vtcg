let submitBtn = document.getElementById("submit");
let tbody = document.getElementById("search-results");
let queryMessage = document.getElementById("query-message");

let prevBtn = document.getElementById("prev-page");
let nextBtn = document.getElementById("next-page");
let pageInfo = document.getElementById("page-info");

let cards = [];
let currentPage = 1;
let pageSize = 25;

async function loadCards() {
   fetch("/search").then(response => response.json())
    .then(data => {
        cards = data;
        currentPage = 1;
        renderTable();
    })
    .catch(error => {
        console.error("Error fetching cards:", error);
    });
}

function renderTable() {
    tbody.replaceChildren();

    let start = (currentPage - 1) * pageSize;
    let end = start + pageSize;

    let pageCards = cards.slice(start, end);

    for (let card of pageCards) {
        let row = document.createElement("tr");

        let nameCell = document.createElement("td");
        let setCell = document.createElement("td");
        let rarityCell = document.createElement("td");
        let imgCell = document.createElement("td");
        let img = document.createElement("img");

        nameCell.textContent = card.name;
        setCell.textContent = card.set_name;
        rarityCell.textContent = card.rarity;

        img.src = card.img_url;
        img.alt = card.name;
        img.width = 100;

        imgCell.appendChild(img);

        row.appendChild(nameCell);
        row.appendChild(setCell);
        row.appendChild(rarityCell);
        row.appendChild(imgCell);

        tbody.appendChild(row);
    }

    let totalPages = Math.max(1, Math.ceil(cards.length / pageSize));

    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;

    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
}

prevBtn.addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage--;
        renderTable();
    }
});

nextBtn.addEventListener("click", () => {
    let totalPages = Math.ceil(cards.length / pageSize);
    if (currentPage < totalPages) {
        currentPage++;
        renderTable();
    }
});

document.getElementById("search-form").addEventListener("submit", (event) => {
    event.preventDefault();
    let search = document.getElementById("search").value;
    queryMessage.textContent = `LOADING...`;

    if (!search) {
        queryMessage.textContent = "";
        loadCards();
        return;
    }

    fetch(`/search?q=${encodeURIComponent(search)}`)
        .then(response => response.json())
        .then(data => {
            queryMessage.textContent = `Searching for: ${search}`;
            cards = data;
            currentPage = 1;
            renderTable();
        })
        .catch(error => {
            queryMessage.textContent = `ERROR searching for: ${search} - ${error.message}`;
            console.error("Error searching cards:", error);
        });
});

loadCards();
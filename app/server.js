const express = require("express");
const cookieParser = require("cookie-parser");
const crypto = require("crypto");
const { Pool } = require("pg");
const env = require("../env.json");

// make this script's dir the cwd
// b/c npm run start doesn't cd into src/ to run this
// and if we aren't in its cwd, all relative paths will break
process.chdir(__dirname);

const createCardUpdateService = require("./services/cardUpdateService");
const createDailyPackUpdateService = require("./services/dailyPackUpdateService");
const searchRoutes = require("./routes/searchRoutes");
const cardRoutes = require("./routes/cardRoutes");
const packRoutes = require("./routes/packRoutes");
const collectionRoutes = require("./routes/collectionRoutes");
const authRoutes = require("./routes/auth");
const tradeRoutes = require("./routes/tradeRoutes");
const decksRoutes = require("./routes/decksRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");

const HOURS_PER_DAY = 24;
const MINUTES_PER_HOUR = 60;
const SECONDS_PER_MINUTE = 60;
const MILLISECONDS_PER_SECOND = 1000;
const DAILY_UPDATE_INTERVAL = HOURS_PER_DAY * MINUTES_PER_HOUR * SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND;

const port = 3000;
let host;
let databaseConfig;
// fly.io sets NODE_ENV to production automatically, otherwise it's unset when running locally
if (process.env.NODE_ENV == "production") {
	host = "0.0.0.0";
	databaseConfig = { connectionString: process.env.DATABASE_URL };
} else {
	host = "localhost";
	let { PGUSER, PGPASSWORD, PGDATABASE, PGHOST, PGPORT } = process.env;
	databaseConfig = { PGUSER, PGPASSWORD, PGDATABASE, PGHOST, PGPORT };
}

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(express.static("public"));

const pool = new Pool(databaseConfig);
pool.connect().then(() => {
	console.log("Connected to db");
});

const cardUpdateService = createCardUpdateService(pool, env);
const dailyPackUpdateService = createDailyPackUpdateService(pool);

const tokenStorage = {};

function makeToken() {
    return crypto.randomBytes(32).toString("hex");
}

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict"
};

function authorize(req, res, next) {
    const { token } = req.cookies;

    if (token === undefined || !Object.prototype.hasOwnProperty.call(tokenStorage, token)) {
        return res.sendStatus(403);
    }

    req.user = tokenStorage[token];
    next();
}

function pageAuth(req, res, next) {
    const { token } = req.cookies;

    if (token === undefined || !Object.prototype.hasOwnProperty.call(tokenStorage, token)) {
        return res.redirect("/login.html");
    }

    req.user = tokenStorage[token];
    next();
}

async function runCardUpdate() {
    try {
        if (await cardUpdateService.shouldUpdate()) {
            console.log("Starting card sync...");
            await cardUpdateService.updateCards();
        } else {
            console.log("Card sync not needed.");
        }
    } catch (error) {
        console.error("Sync failed:", error);
    }
}

const protectedPages = [
    "/packs.html",
    "/collections.html",
    "/trade-dashboard.html",
    "/create-trade.html",
    "/new-deck.html",
    "/deck-editor.html",
    "/dashboard.html",
    "/decks.html",
    "/wishlist.html"
];

protectedPages.forEach(page => {
    app.use(page, pageAuth);
});

app.use("/auth", authRoutes(pool, tokenStorage, makeToken, cookieOptions));

app.use("/search", searchRoutes(pool));
app.use("/card", cardRoutes(pool));
app.use("/packs", authorize, packRoutes(pool, env));
app.use("/collections", authorize, collectionRoutes(pool));
app.use("/trades", authorize, tradeRoutes(pool));
app.use("/api/decks", authorize, decksRoutes(pool));
app.use("/api/wishlist", authorize, wishlistRoutes(pool));

/*
KEEP EVERYTHING BELOW HERE
*/

app.listen(port, host, async () => {
    console.log(`http://${host}:${port}`);

    await runCardUpdate();

    dailyPackUpdateService.updatePulls();

    setInterval(runCardUpdate, DAILY_UPDATE_INTERVAL);

    setInterval(
        () => dailyPackUpdateService.updatePulls(),
        DAILY_UPDATE_INTERVAL
    );
});

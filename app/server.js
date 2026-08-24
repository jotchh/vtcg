const express = require("express");
const cookieParser = require("cookie-parser");
const crypto = require("crypto");
const { Pool } = require("pg");
const env = require("../env.json");

const createCardUpdateService = require("./services/cardUpdateService");
const createDailyPackUpdateService = require("./services/dailyPackUpdateService");
const searchRoutes = require("./routes/searchRoutes");
const cardRoutes = require("./routes/cardRoutes");
const packRoutes = require("./routes/packRoutes");
const collectionRoutes = require("./routes/collectionRoutes");
const authRoutes = require("./routes/auth");
const tradeRoutes = require("./routes/tradeRoutes");

const HOURS_PER_DAY = 24;
const MINUTES_PER_HOUR = 60;
const SECONDS_PER_MINUTE = 60;
const MILLISECONDS_PER_SECOND = 1000;
let DAILY_UPDATE_INTERVAL = HOURS_PER_DAY * MINUTES_PER_HOUR * SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND;

const app = express();
const port = 3000;
const hostname = "localhost";
const pool = new Pool(env.pool);

const cardUpdateService = createCardUpdateService(pool, env);
const dailyPackUpdateService = createDailyPackUpdateService(pool);

const tokenStorage = {};

function makeToken() {
    return crypto.randomBytes(32).toString("hex");
}

const cookieOptions = {
    httpOnly: true,
    secure: false, 
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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static("public"));

app.use("/auth", authRoutes(pool, tokenStorage, makeToken, cookieOptions));
app.use("/search", searchRoutes(pool));
app.use("/card", cardRoutes(pool));
app.use("/packs", authorize, packRoutes(pool, env));
app.use("/collections", authorize, collectionRoutes(pool));
app.use("/trades", authorize, tradeRoutes(pool));

app.listen(port, hostname, async () => {
    console.log(`http://${hostname}:${port}`);

    await runCardUpdate();
    dailyPackUpdateService.updatePulls();
    setInterval(runCardUpdate, DAILY_UPDATE_INTERVAL);
    setInterval(() => dailyPackUpdateService.updatePulls(), DAILY_UPDATE_INTERVAL);
});

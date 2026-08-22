let axios = require("axios");
let express = require("express");
let { Pool } = require("pg"); 
let env = require("../env.json");

let app = express();
let port = 3000;
let hostname = "localhost";
app.use(express.static("public"));
let pool = new Pool(env.pool);
pool.connect().then(() => {
  console.log("Connected to database");
});

const HOURS_PER_DAY = 24;
const MINUTES_PER_HOUR = 60;
const SECONDS_PER_MINUTE = 60;
const MILLISECONDS_PER_SECOND = 1000;
let CARD_UPDATE_INTERVAL = HOURS_PER_DAY * MINUTES_PER_HOUR * SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND;

let createCardUpdateService = require("./services/cardUpdateService");
let cardUpdateService = createCardUpdateService(pool, env);

let searchRoutes = require("./routes/searchRoutes");
let cardRoutes = require("./routes/cardRoutes");

app.use("/search", searchRoutes(pool));
app.use("/card", cardRoutes(pool));

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

app.listen(port, hostname, async () => {
  console.log(`http://${hostname}:${port}`);

  // intial run on start-up as a sanity check.
  await runCardUpdate();
  
  setInterval(runCardUpdate, CARD_UPDATE_INTERVAL);
});

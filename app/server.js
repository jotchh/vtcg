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

let createSyncService = require("./services/syncService");
let syncService = createSyncService(pool, env);

let searchRoutes = require("./routes/searchRoutes");
let cardRoutes = require("./routes/cardRoutes");

app.use("/search", searchRoutes(pool));
app.use("/card", cardRoutes(pool));

app.listen(port, hostname, async () => {
  console.log(`http://${hostname}:${port}`);
  if (await syncService.shouldSync()){
    console.log("Syncing database...")
    await syncService.syncDatabase();
  } 
});

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

app.listen(port, hostname, () => {
  console.log(`http://${hostname}:${port}`);
});

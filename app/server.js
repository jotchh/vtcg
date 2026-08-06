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

const BASE_URL = env.api.baseUrl;
const GAMES = env.api.games;
const RARITY_MAP = env.api.rarityMap;

async function shouldSync(){
  let res = await pool.query("SELECT value FROM metadata WHERE key = 'last_sync'");
  
  if (res.rows.length === 0) {
    return true; 
  }

  let lastSync = new Date(res.rows[0].value);
  let now = new Date();
  let sevenDays = 7 * 24 * 60 * 60 * 1000;
  return now - lastSync >= sevenDays;
}

async function syncDatabase(){
  let {data: categoryData} = await axios.get(`${BASE_URL}/categories`);

  for(let game of categoryData.categories){
    let {data: setData} = await axios.get(`${BASE_URL}/${game.id}/sets`);
    if (GAMES.includes(game.name)){
      console.log(`Syncing ${game.name}...`);
      
      for(let set of setData.sets){
        try {
          const { data: cardData } = await axios.get(`${BASE_URL}/${game.id}/sets/${set.id}/cards`);
          
          for (const card of cardData.products) {
            query = `INSERT INTO cards (api_card_id, game, set_name, name, rarity, card_number, img_url) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (api_card_id) DO NOTHING`;
            
            rarity = RARITY_MAP[card.rarity] ?? null;
            values = [card.id, game.name, set.name, card.name, rarity, card.number, card.image_url];
            
            pool.query(query, values);
          }
        } catch (error) {
          // If the error is a 404, it means the set has no card, so we can ignore it and continue to the next set.
          if (error.response?.status === 404) {
            continue;
          }
          throw error;
        }  
      }
    }
  }
  
  let metdataQuery = "INSERT INTO metadata (key, value) VALUES ('last_sync', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value"
  pool.query(metdataQuery, [new Date().toISOString()])
    .then(result => {
      console.log(result);
      console.log("Done!")
    })
    .catch(error => {
      console.error("Error executing query:", err.stack);
    });
}

app.get("/search", (req, res) => {
  search = req.query.q;
  query = "SELECT * FROM cards WHERE 1=1";
  let values = [];
  let index = 1;

  if (search) {
    query += " AND (name ILIKE $1 OR set_name ILIKE $1)";
    values = [`%${search}%`];
  }
  
  pool.query(query, values)
    .then(result => {
      res.status(200).json(result.rows);
    })
    .catch(error => {
      console.error("Error executing query:", error.stack);
      res.status(500).send("Error executing query");
    });
});

app.listen(port, hostname, async () => {
  console.log(`http://${hostname}:${port}`);
  if (await shouldSync()){
    console.log("Syncing database...")
    await syncDatabase();
  } 
});

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

async function syncDatabase(){
  console.time("syncDatabase");
  let {data: categoryData} = await axios.get(`${BASE_URL}/categories`);
  for(let game of categoryData.categories){
    console.log(`Game: ${game.name}`)
    let {data: setData} = await axios.get(`${BASE_URL}/${game.id}/sets`);
    if (GAMES.includes(game.name)){
      for(let set of setData.sets){
        try {
          const { data: cardData } = await axios.get(`${BASE_URL}/${game.id}/sets/${set.id}/cards`);
          for (const card of cardData.products) {
            query = `INSERT INTO cards (api_card_id, game, set_name, name, rarity, card_number, img_url) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (api_card_id) DO NOTHING`;
            
            rarity = RARITY_MAP[card.rarity] ?? null;
            values = [card.id, game.name, set.name, card.name, rarity, card.number, card.image_url];
            
            console.log(values);
            await pool.query(query, values);
          }
        } catch (err) {
          // If the error is a 404, it means the set has no card, so we can ignore it and continue to the next set. Otherwise, we throw the error.
          if (err.response?.status === 404) {
            continue;
          }
          throw err;
        }  
      }
    }
  } 
}

app.listen(port, hostname, () => {
  console.log(`http://${hostname}:${port}`);
  syncDatabase();
});

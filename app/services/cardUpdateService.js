const axios = require("axios");

module.exports = function(pool, env) {
    const BASE_URL = env.api.baseUrl;
    const GAMES = env.api.games;
    const RARITY_MAP = env.api.rarityMap;

    async function shouldUpdate(){
        let res = await pool.query("SELECT value FROM metadata WHERE key = 'last_sync'");
        
        if (res.rows.length === 0) {
            return true; 
        }

        let lastSync = new Date(res.rows[0].value);
        let now = new Date();
        let sevenDays = 7 * 24 * 60 * 60 * 1000;
        return now - lastSync >= sevenDays;
    }

    async function updateCards(){
        let {data: categoryData} = await axios.get(`${BASE_URL}/categories`);

        for(let game of categoryData.categories){
            let {data: setData} = await axios.get(`${BASE_URL}/${game.id}/sets`);
            if (GAMES.includes(game.name)){
                for(let set of setData.sets){
                    try {
                        let { data: cardData } = await axios.get(`${BASE_URL}/${game.id}/sets/${set.id}/cards`);

                        for (let card of cardData.products) {
                            let query = `INSERT INTO cards (api_card_id, game, set_name, name, rarity, card_number, ext_data, img_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (api_card_id) DO NOTHING`;

                            let rarity = RARITY_MAP[card.rarity] ?? null;
                            let ext_data = card.ext_data ? card.ext_data : null;
                            let values = [card.id, game.name, set.name, card.name, rarity, card.number, ext_data, card.image_url];
                            await pool.query(query, values);
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

        let metdataQuery = "INSERT INTO metadata (key, value) VALUES ('last_sync', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value";
        try {
            await pool.query(metdataQuery, [new Date().toISOString()]);
            console.log("Done!");
        } catch (error) {
            console.error("Error executing query:", error.stack || error);
        }
    }
    return { shouldUpdate, updateCards};
};

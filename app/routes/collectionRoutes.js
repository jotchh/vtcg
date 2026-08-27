const express = require("express");
const router = express.Router();

// TODO: using in place of auth, replace with checking logged in account
const DEV_USER_ID = 1;

module.exports = function (pool) {
  router.get("/", async (req, res) => {
    const userId = req.user.id ?? DEV_USER_ID;
    const { game, set_name, rarity } = req.query;

    const pageNumber = Math.max(parseInt(req.query.page) || 1, 1);
    const pageSize = 20;
    const offset = (pageNumber - 1) * pageSize;

    const conditions = ["uc.user_id = $1"];
    const values = [userId];

    if (game) {
      conditions.push(`c.game = $${values.length + 1}`);
      values.push(game);
    }
    if (set_name) {
      conditions.push(`c.set_name = $${values.length + 1}`);
      values.push(set_name);
    }
    if (rarity) {
      conditions.push(`c.rarity = $${values.length + 1}`);
      values.push(rarity);
    }

    const whereClause = conditions.join(" AND ");

    try {
      const countResult = await pool.query(
        `SELECT COUNT(*) AS total FROM (
           SELECT c.id
           FROM user_cards uc
           JOIN cards c ON c.id = uc.card_id
           WHERE ${whereClause}
           GROUP BY c.id
         ) AS grouped`,
        values
      );
      const total = parseInt(countResult.rows[0].total, 10);

      const dataValues = [...values, pageSize, offset];
      const result = await pool.query(
        `SELECT c.id, c.name, c.game, c.set_name, c.rarity, c.card_number, c.img_url,
                COUNT(uc.id)::int AS quantity
         FROM user_cards uc
         JOIN cards c ON c.id = uc.card_id
         WHERE ${whereClause}
         GROUP BY c.id
         ORDER BY c.game, c.set_name, c.name
         LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
        dataValues
      );

      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      res.status(200).json({ cards: result.rows, page: pageNumber, total, totalPages });
    } catch (err) {
      console.error("Error loading collection:", err);
      res.status(500).send("Error loading collection");
    }
  });

  router.get("/filters", async (req, res) => {
    const userId = req.user.id ?? DEV_USER_ID;

    try {
      const result = await pool.query(
        `SELECT DISTINCT c.game, c.set_name, c.rarity
         FROM user_cards uc
         JOIN cards c ON c.id = uc.card_id
         WHERE uc.user_id = $1
         ORDER BY c.game, c.set_name`,
        [userId]
      );

      const games = [...new Set(result.rows.map((r) => r.game))];
      const sets = [
        ...new Map(
          result.rows.map((r) => [`${r.game}|${r.set_name}`, { game: r.game, set_name: r.set_name }])
        ).values(),
      ];
      const rarities = [...new Set(result.rows.map((r) => r.rarity))];

      res.status(200).json({ games, sets, rarities });
    } catch (err) {
      console.error("Error loading collection filters:", err);
      res.status(500).send("Error loading collection filters");
    }
  });

  return router;
};

const express = require("express");
const router = express.Router();

module.exports = function(pool) {
  router.get("/product", async (req, res) => {
      try { 
        let search = req.query.q || "";
        let game = req.query.game || "";
        
        let pageNumber = Math.max(parseInt(req.query.page) || 1, 1);
        let pageSize = 20;
        let offset = (pageNumber - 1) * pageSize;

        let conditions = [];
        let values = [];

        if (search) {
            conditions.push(`name ILIKE $${values.length + 1} OR set_name ILIKE $${values.length + 1}`);
            values.push(`%${search}%`);
        }

        if (game) {
          conditions.push(`game = $${values.length + 1}`);
          values.push(`${game}`);
        }

        let query = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
        console.log(query);
        let countQuery = `SELECT COUNT(*) AS total FROM cards ${query}`;

        let countResult = await pool.query(countQuery, values);
        let total = parseInt(countResult.rows[0].total, 10);

        let dataQuery = `SELECT * FROM cards ${query} ORDER BY id LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
        let dataValues = [...values, pageSize, offset];

        let result = await pool.query(dataQuery, dataValues);

        let totalPages = Math.max(1, Math.ceil(total / pageSize));
        res.status(200).json({ cards: result.rows, page: pageNumber, total: total, totalPages: totalPages});
      } catch (error) {
          console.error("Error executing query:", error);
          res.status(500).json({error: "Error executing query"});
      }
    });

    return router;
};

const express = require("express");
const router = express.Router();

module.exports = function(pool) {
  router.get("/all/product", async (req, res) => {
      try {
          const search = req.query.q || "";
          const pageNumber = Math.max(parseInt(req.query.page) || 1, 1);

          const PAGE_SIZE = 20;
          const offset = (pageNumber - 1) * PAGE_SIZE;

          let whereClause = "";
          let values = [];

          if (search) {
              whereClause = `WHERE name ILIKE $1 OR set_name ILIKE $1`;
              values.push(`%${search}%`);
          }

          const countQuery = `SELECT COUNT(*) AS total FROM cards ${whereClause}`;

          const countResult = await pool.query(countQuery, values);
          const total = parseInt(countResult.rows[0].total, 10);

          const dataQuery = `SELECT * FROM cards ${whereClause} ORDER BY id LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;

          const dataValues = [...values, PAGE_SIZE, offset];

          const result = await pool.query(dataQuery, dataValues);

          const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
          res.status(200).json({ cards: result.rows, page: pageNumber, total: total, totalPages: totalPages});
      } catch (error) {
          console.error("Error executing query:", error);
          res.status(500).json({error: "Error executing query"});
      }
    });

    router.get("/magic/product", (req, res) => {
    });

    return router;
};
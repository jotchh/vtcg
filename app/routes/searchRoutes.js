const express = require("express");
const router = express.Router();

module.exports = function(pool) {
  router.get("/", (req, res) => {
    let search = req.query.q;
    let query = "SELECT * FROM cards WHERE 1=1";
    let values = [];

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

  return router;
};

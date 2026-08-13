const express = require("express");
const path = require("path");

const router = express.Router();

module.exports = function(pool) {
  router.get("/:id", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/card.html"));
  });

  router.get("/api/:id", (req, res) => {
      let cardId = req.params.id;
      let query = `SELECT * FROM cards WHERE id = $1`;

      pool.query(query, [cardId])
          .then(result => {
              if (result.rows.length === 0) {
                  return res.status(404).json({
                      error: "Card not found"
                  });
              }
              res.status(200).json(result.rows[0]);
          })
          .catch(error => {
              console.error("Error executing query:", error);
              res.status(500).json({
                  error: "Error executing query"
              });
          });
    });
    return router;
};

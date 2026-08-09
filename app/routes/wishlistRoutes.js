const express = require("express");
const router = express.Router();
const deckService = require("../services/deckService");

module.exports = function (pool) {
  router.get("/", (req, res) => {
    res.status(200).json(deckService.listWishlistForUser(req.userId));
  });

  router.post("/", (req, res) => {
    let wishlist = deckService.addCardToWishlist(req.userId, req.body);
    res.status(200).json(wishlist);
  });

  router.delete("/:cardId", (req, res) => {
    let wishlist = deckService.removeCardFromWishlist(req.userId, parseInt(req.params.cardId, 10));
    res.status(200).json(wishlist);
  });

  return router;
};

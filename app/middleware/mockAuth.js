// fake auth will wire later
module.exports = function mockAuth(req, res, next) {
  req.userId = 1;
  next();
};

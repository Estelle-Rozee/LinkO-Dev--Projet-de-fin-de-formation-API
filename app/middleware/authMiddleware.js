const dotenv = require('dotenv');
const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
    console.log(req.headers)
  const token =
    req.body.token || req.query.token || req.headers["apitoken"];

  if (!token) {
    return res.status(403).send("A token is required for authentication");
  }
  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.user = decoded;
  } catch (err) {
    return res.status(401).send("Invalid Token");
  }
  return next();
};

module.exports = verifyToken;
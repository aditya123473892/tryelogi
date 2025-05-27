const express = require("express");
const UserController = require("../controllers/UserController");
const auth = require("../middlewares/auth");

const router = express.Router();

router.post("/register", UserController.register);
router.post("/login", UserController.login);

module.exports = router;

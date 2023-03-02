const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

//register
router.get("/register", authController.showRegister);
router.post("/register", authController.register);

//login

router.post("/login", authController.login);

//logout
router.get("/logout", authController.logout);

//dashboard
router.get("/user/dashboard", authController.showDashboard);


module.exports = router;
// routes/auth.js
const express = require("express");
const passport = require("passport");
const bcrypt = require("bcryptjs");
const cookieParser = require('cookie-parser');
const User = require("../models/user");
const session = require("express-session");
const router = express.Router();


router.use(cookieParser());
router.use(
  session({
    secret: "secret-key", 
    resave: false,
    saveUninitialized: false,
    cookie:{expires:9999999999}

  })
);


// Register route
// Register route
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.redirect('/register?exists=true');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();
    res.redirect('/')
    console.log(newUser)
  } catch (err) {
    // Handle any other errors here
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});




router.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      // If authentication fails, redirect back to the login page with an error message
      return res.redirect('/login?error=true');
    }

    // If authentication is successful, log in the user
    req.login(user, (err) => {
      if (err) {
        return next(err);
      }
      // Redirect the user to the home page or any other authorized page
      console.log(user)
      return res.redirect('/');

    });
  })(req, res, next);
});

// Logout route
router.post("/logout", (req, res) => {
  req.logout();
  res.redirect('/login')
});
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect("/login"); // Or send a 401 Unauthorized response
  }
};

module.exports = router;

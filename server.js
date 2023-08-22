const express = require("express");
const mongoose = require("mongoose");
const app = express();
const bcrypt = require("bcrypt");
const authRoute = require("./routes/auth");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const User = require("./models/user");
const Comment = require('./models/comment');


//Route middleware

app.use("/api/user", authRoute);

app.use("/static", express.static(__dirname + "/public"));

const methodOverride = require("method-override");
const Article = require("./models/article");

mongoose.connect("mongodb://localhost/new-blog", {
  // Use a single connection for both databases
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const articleRouter = require("./routes/articles");
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect('/login');
  }
};
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride("_method"));
app.set("view engine", "ejs");
app.use(
  session({
    secret: "secret-key", // Replace with your own secret key
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());

app.use(passport.session());

app.get("/", async (req, res) => {
  try {
    articleId= req.params.id
    const articles = await Article.find()
      .sort({ createdAt: "desc" })
      .populate("author", "email");
      const articleComments = {}; 


    for (const article of articles) {
      const comments = await Comment.find({ article: article._id }).populate('author');
      articleComments[article._id] = comments;
    }
    // console.log(articleComments);
    const authorEmails = articles.map((article) => {
      if (article.author && article.author.email) {
        return article.author.email;
      } else {
        return 'Unknown Author';
      }
    });
    // console.log(articles);

    res.render("index", { articles: articles, authenticatedUser: req.user, authorEmails: authorEmails, articleComments: articleComments});
  } catch (error) {
    console.error("Error fetching articles:", error);
    res.status(500).send("Error fetching articles.");
  }
});


passport.use(
  new LocalStrategy(
    { usernameField: "email" }, // Use "email" as the username field
    async (email, password, done) => {
      try {
        const user = await User.findOne({ email });

        if (!user) {
          return done(null, false, { message: "Incorrect email or password." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: "Incorrect email or password." });
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// Serialize and deserialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

app.get("/home", (req, res) => {
  res.render("home.ejs");
});

const authRoutes = require("./routes/auth");
const article = require("./models/article");
app.use("/", authRoutes);

app.use("/articles", articleRouter);

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.get("/myblogs", ensureAuthenticated, async (req, res) => {
  try {
    // Find all articles published by the current authenticated user
    console.log("Fetching articles for user:", req.user._id);
    const articles = await Article.find({ author: req.user._id }).sort({ createdAt: 'desc' }).populate('author', 'email'
    );
    console.log("Fetched articles:", articles);
    res.render('articles/myblogs', { articles: articles }); // Pass 'articles' to the template
  } catch (err) {
    console.error('Error fetching user articles:', err);
    res.redirect('/');
  }
});
app.get("/register", (req, res) => {
  res.render("register.ejs");
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});

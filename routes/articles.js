const express = require("express");
const Article = require("./../models/article");
const router = express.Router();
const User = require("../models/user");
const multer = require("multer");
const article = require("./../models/article");
const Comment = require("../models/comment");

const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect("/login");
  }
};

router.use(express.urlencoded({ extended: true }));

router.post("/:id/comment", ensureAuthenticated, async (req, res) => {
  try {
    const articleId = req.params.id;
    const { comment } = req.body; // Use req.body.comment
    const newComment = new Comment({
      content: comment, // Use the extracted comment directly
      author: req.user._id,
      article: articleId,
    });
    await newComment.save();
    // console.log(newComment.content);
    res.redirect(`/`);
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).send("Error creating comment.");
  }
});

router.get("/new", ensureAuthenticated, (req, res) => {
  res.render("articles/new", { article: new Article() });
});

router.get("/edit/:id", async (req, res) => {
  const article = await Article.findById(req.params.id).populate(
    "author",
    "email"
  );
  res.render("articles/edit", {
    article: article,
    authenticatedUser: req.user,
  });
});

router.get('/:slug', ensureAuthenticated, async (req, res) => {
  try {
    const article = await Article.findOne({ slug: req.params.slug }).populate('author', 'email');
    let authorEmail = 'Unknown Author';

    if (!article) {
      return res.redirect('/');
    }

    if (article && article.author && article.author.email) {
      authorEmail = article.author.email;
      // console.log(authorEmail);
    }

    
    res.render('articles/show', { article: article, authorEmail: authorEmail, authenticatedUser: req.user }); // Pass authorEmail as part of the render data
  } catch (err) {
    console.error('Error fetching article:', err);
    res.redirect('/');
  }
});

router.post(
  "/",
  async (req, res, next) => {
    try {
      req.article = new Article();
      await next();
      console.log(req.article);
    } catch (error) {
      console.error("Error in router.post:", error);
      res.status(500).send("Error in router.post.");
    }
  },
  saveArticleAndRedirect("new")
);

router.put(
  "/:id",
  ensureAuthenticated,
  async (req, res, next) => {
    req.article = await Article.findById(req.params.id);
    next();
  },
  saveArticleAndRedirect("edit")
);

router.delete("/:id", ensureAuthenticated, async (req, res) => {
  try {
    const articleId = req.params.id;
    const article = await Article.findById(articleId);

    if (!article) {
      console.log("Article not found.");
      return res.redirect("/");
    }

    // Check if the authenticated user is the author of the article
    if (req.user._id.toString() !== article.author.toString()) {
      console.log("User is not the author of the article.");
      return res.redirect(`/articles/${article.slug}`);
    }

    await Article.findByIdAndDelete(articleId);
    res.redirect("/");
  } catch (error) {
    // Handle errors appropriately
    console.error("Error deleting article:", error);
    res.status(500).send("Error deleting article.");
  }
});

router.get("/myblogs", ensureAuthenticated, async (req, res) => {
  try {
    console.log("Fetching articles for user:", req.user._id);
    const articles = await Article.find({ author: req.user._id }).sort({
      createdAt: "desc",
    });
    console.log("Fetched articles:", articles);
    res.render("articles/myblogs", { articles: articles });
  } catch (err) {
    console.error("Error fetching user articles:", err);
    res.redirect("/");
  }
});

function saveArticleAndRedirect(path) {
  return async (req, res) => {
    let article = req.article;

    article.title = req.body.title;
    // console.log(article.title);
    // article.description = req.body.description;
    article.markdown = req.body.markdown;
    article.tags = req.body.tags;


      article.author = req.user._id;
      article.author.name = req.user.name;
      article.author.username = req.user.username;
      article.authorEmail = req.user.email;
    


    // console.log(article, article.title, + '#####');
    // if (req.file) {
    //   article.image = {
    //   data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)),
    //         contentType: 'image/png'
    //   };
    // }

    try {
      // console.log("tryu");
      article = await article.save();
      console.log("saved");
      res.redirect(`/articles/${article.slug}`);
    } catch (e) {
      console.log(e.message);
      res.render(`articles/${path}`, { article: article });
    }
  };
}

module.exports = router;

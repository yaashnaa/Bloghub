const mongoose = require("mongoose");
const marked = require("marked");
marked.setOptions({
  mangle: false,
  headerIds: false,
});
const slugify = require("slugify");
const createDomPurifier = require("dompurify");
const { JSDOM } = require("jsdom");
const dompurify = createDomPurifier(new JSDOM().window);
const articleSchema = new mongoose.Schema({
  title: {
    required: true,
    type: String,
  },
  // description: {
  //   type: String,
  // },
  markdown: {
    required: true,
    type: String,
  },
  tags: {
    required: true,
    type: String,
  },
  createdAt: {
    required: true,
    type: Date,
    default: Date.now,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  // sanitizedHTML: {
  //   type: String,
  //   required: true,
  // },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
});

articleSchema.pre("validate", function (next) {
  if (this.title) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  if (this.markdown) {
    this.sanitizedHTML = dompurify.sanitize(marked.parse(this.markdown));
  }

  next();
});

module.exports = mongoose.model("Article", articleSchema);

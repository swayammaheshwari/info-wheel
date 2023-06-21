require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const shortid = require("shortid");
const upload = require("./multerConfig");

const app = express();
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

mongoose.set("strictQuery", true);
mongoose.connect(process.env.MONGOLAB_URI, { useNewUrlParser: true });

const blogSchema = new mongoose.Schema({
  title: String,
  body: String,
  date: String,
  category: String,
  titleImage: String,
  bodyImage1: String,
  bodyImage2: String,
});

const uniqueId = shortid.generate();

const Blog = mongoose.model("blog", blogSchema);

app.get("/", (req, res) => {
  const categoryLimits = {
    Technology: 3,
    Lifestyle: 4,
    Food: 3,
    "Home Improvement": 4,
  };

  Blog.find({}, (err, blogs) => {
    if (err) {
      throw err;
    } else {
      const renderedBlogs = {
        Technology: [],
        Lifestyle: [],
        Food: [],
        "Home Improvement": [],
      };

      // Sort blogs by date in descending order
      blogs.sort((a, b) => new Date(b.date) - new Date(a.date));

      for (const blog of blogs) {
        const category = blog.category;
        if (renderedBlogs[category].length < categoryLimits[category]) {
          renderedBlogs[category].push(blog);
        }
      }

      res.render("index", { blogs: renderedBlogs });
    }
  });
});

app.get("/update", (req, res) => {
  res.render("Update");
});

app.get("/blog/:id", (req, res) => {
  let _id = req.params.id;
  Blog.findOne({ _id }, (err, blog) => {
    if (err) {
      throw err;
    } else {
      // Split the blog body into paragraphs of approximately 60 words each
      const words = blog.body.split(" ");
      const totalWords = words.length;

      let body1, body2;

      if (totalWords <= 250) {
        body1 = wrapInParagraphs(words, 60);
        body2 = "";
      } else {
        const halfWords = Math.floor(totalWords / 2);
        const words1 = words.slice(0, halfWords);
        const words2 = words.slice(halfWords);

        body1 = wrapInParagraphs(words1, 60);
        body2 = wrapInParagraphs(words2, 60);
      }

      // Render the blog with the revised body structure
      res.render("Blog", { blogBody: { body1, body2 }, blog });
    }
  });
});

// Function to wrap words in paragraphs of maxWordsPerParagraph
function wrapInParagraphs(words, maxWordsPerParagraph) {
  const paragraphs = [];
  let currentParagraph = "";

  for (let i = 0; i < words.length; i++) {
    if (i > 0 && i % maxWordsPerParagraph === 0) {
      paragraphs.push(currentParagraph);
      currentParagraph = "";
    }

    currentParagraph += `${words[i]} `;
  }

  if (currentParagraph !== "") {
    paragraphs.push(currentParagraph);
  }

  return paragraphs;
}

app.get("/category/:category", (req, res) => {
  let category = req.params.category;

  Blog.find({ category: category }, (err, data) => {
    if (err) {
      throw err;
    } else {
      res.render("Category", { category: category, blogs: data });
    }
  });
});

app.get("/login", (req, res) => {
  res.render("Login");
});

app.post("/login", (req, res) => {
  if (req.body.password == "123") res.redirect("/dashboard");
  else res.redirect("/login");
});
app.get("/about", (req, res) => {
  res.render("About");
});
app.get("/writeus", (req, res) => {
  res.render("WriteUs");
});
app.get("/contact", (req, res) => {
  res.render("Contact");
});

app.get("/dashboard", (req, res) => {
  res.render("Dashboard");
});

app.post(
  "/post",
  upload.fields([
    { name: "titleImage", maxCount: 1 },
    { name: "bodyImage1", maxCount: 1 },
    { name: "bodyImage2", maxCount: 1 },
  ]),
  (req, res) => {
    try {
      const blogId = shortid.generate(); // Generate a unique ID for the blog post

      // Extract the file paths from req.files
      const titleImage = req.files["titleImage"];
      const bodyImage1 = req.files["bodyImage1"];
      const bodyImage2 = req.files["bodyImage2"];

      // Check if the title image exists in the request
      if (!titleImage) {
        throw new Error("Title image is missing.");
      }

      // Get the title image path and remove "public" directory from it
      const titleImagePath = path.join(
        titleImage[0].path.replace("public", "")
      );

      // Create a new blog post object
      const blog = new Blog({
        title: req.body.title,
        body: req.body.Body,
        category: req.body.category,
        date: new Date().toLocaleDateString(),
        titleImage: titleImagePath,
      });

      // Check if the body images exist and add their paths if available
      if (bodyImage1) {
        const bodyImage1Path = path.join(
          bodyImage1[0].path.replace("public", "")
        );
        blog.bodyImage1 = bodyImage1Path;
      }

      if (bodyImage2) {
        const bodyImage2Path = path.join(
          bodyImage2[0].path.replace("public", "")
        );
        blog.bodyImage2 = bodyImage2Path;
      }

      // Save the blog post to the database
      blog.save((err) => {
        if (err) {
          console.log(err);
          res.status(500).send("Error saving the blog post.");
        } else {
          res.status(200).send("Blog post saved successfully.");
        }
      });
    } catch (error) {
      console.log(error);
      res.status(400).send("Bad request.");
    }
  }
);

// app.post("/post", (req, res) => {
//   const blog = new Blog({
//     title: req.body.title,
//     body: req.body.Body,
//     category: req.body.category,
//     date: new Date().toLocaleDateString(),
//   });

//   console.log(req.body);

//   // blog.save();
//   res.send("blog saved");
//   // res.redirect("/");
// });

app.listen(process.env.PORT, function () {
  console.log(`Server started on http://localhost:${process.env.PORT}`);
});

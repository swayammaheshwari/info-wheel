require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const { upload, jsonToHtml } = require("./Config");

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
});

const Blog = mongoose.model("blog", blogSchema);

app.get("/test", (req, res) => {
  res.render("test");
});

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
      blogs = blogs.reverse();
      blogs.forEach((blog) => {
        let t = JSON.parse(blog.body);
        t = t.blocks[0].data.text;
        blog.body = t;
      });
      const renderedBlogs = {
        Technology: [],
        Lifestyle: [],
        Food: [],
        "Home Improvement": [],
      };

      // // Sort blogs by date in descending order
      // blogs.sort((a, b) => new Date(b.date) - new Date(a.date));

      for (const blog of blogs) {
        const category = blog.category;
        if (renderedBlogs[category].length < categoryLimits[category]) {
          renderedBlogs[category].push(blog);
        }
      }

      const recentBlogs = {
        Technology: [],
        Lifestyle: [],
        Food: [],
        "Home Improvement": [],
      };

      for (const category in renderedBlogs) {
        if (renderedBlogs[category].length > 0) {
          recentBlogs[category].push(renderedBlogs[category][0]);
        }
      }
      // console.log(recentBlogs);
      res.render("index", { blogs: renderedBlogs, recentBlogs });
    }
  });
});

app.get("/update", (req, res) => {
  Blog.find({}, (err, blogs) => {
    if (err) {
      throw err;
    } else {
      blogs.forEach((blog) => {
        let t = JSON.parse(blog.body);
        t = t.blocks[0].data.text;
        blog.body = t;
      });
      res.render("Update", { blogs: blogs });
    }
  });
});

app.get("/update/:id", (req, res) => {
  const _id = req.params.id;
  Blog.findOne({ _id }, (err, blog) => {
    if (err) {
      throw err;
    } else {
      res.render("updateForm", { blog });
    }
  });
});

app.post("/updatepost", upload.single("title-image"), (req, res) => {
  const id = req.body.id;
  console.log(id);
  console.log(req.body);
  Blog.findOneAndUpdate(
    { _id: id },
    { $set: req.body },
    { new: true },
    (err, blog) => {
      if (err) {
        throw err;
      } else {
        res.render("succes", { msg: "blog update successfully" });
      }
    }
  );
});

app.get("/editor", (req, res) => {
  res.render("editor");
});

app.get("/blog/:id", (req, res) => {
  let _id = req.params.id;
  Blog.findOne({ _id }, (err, blog) => {
    if (err) {
      throw err;
    } else {
      blog.body = jsonToHtml(blog.body);
      res.render("Blog", { blog });
    }
  });
});

app.get("/category/:category", (req, res) => {
  const category = req.params.category;

  Blog.find({ category: category }, (err, blogs) => {
    if (err) {
      throw err;
    } else {
      blogs.forEach((blog) => {
        let t = JSON.parse(blog.body);
        t = t.blocks[0].data.text;
        blog.body = t;
      });
      res.render("search&categary", {
        taskData: category,
        blogs,
        task: "Category",
      });
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

app.get("/search", (req, res) => {
  const searchQuery = req.query.q;

  const regexQuery = new RegExp(searchQuery, "i");

  Blog.find({}, (err, blogs) => {
    if (err) {
      throw err;
    } else {
      const foundBlogs = blogs.filter((blog) => {
        const parsedBody = JSON.parse(blog.body);
        const blocks = parsedBody.blocks;

        for (const block of blocks) {
          const text = block.data.text;
          if (regexQuery.test(text)) {
            return true;
          }
        }
        return false;
      });
      foundBlogs.forEach((blog) => {
        let t = JSON.parse(blog.body);
        t = t.blocks[0].data.text;
        blog.body = t;
      });
      res.render("search&categary", {
        blogs: foundBlogs,
        taskData: searchQuery,
        task: "Search For",
      });
    }
  });
});

app.get("/dashboard", (req, res) => {
  Blog.countDocuments({}, (err, count) => {
    if (err) {
      throw err;
    } else {
      res.render("Dashboard", { count });
    }
  });
});

app.post("/uploadEditor", upload.single("image"), (req, res) => {
  if (!req.file) res.status(400).send("No file uploaded");

  const imagePath = req.file.path;
  const relativeImagePath = imagePath.replace("public", "");

  res.json({
    success: 1,
    file: {
      url: `http://localhost:5000/${relativeImagePath}`,
      width: "10px",
      // ... and any additional fields you want to store, such as width, height, color, extension, etc
    },
  });
});

app.post("/post", upload.single("title-image"), (req, res) => {
  if (!req.file) {
    res.status(400).send("No file uploaded");
    return;
  }

  const imagePath = req.file.path;
  const titleImagePath = imagePath.replace("public", "");

  const blog = new Blog({
    title: req.body.title,
    body: req.body.editorContent,
    category: req.body.category,
    date: new Date().toLocaleDateString(),
    titleImage: titleImagePath,
  });

  blog.save();

  res.render("succes", { msg: "blog saved successfully" });
});

app.get("/delete/:id", (req, res) => {
  const blogId = req.params.id; // Get the blog ID from the request parameters

  Blog.findByIdAndRemove(blogId, (err, deletedBlog) => {
    if (err) {
      throw err;
    } else {
      res.render("succes", { msg: "Blog deleted successfully" });
    }
  });
});

app.listen(process.env.PORT, function () {
  console.log(`Server started on http://localhost:${process.env.PORT}`);
});

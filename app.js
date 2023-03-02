require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const mongoose = require('mongoose');

const app = express();
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.static("public"));
app.use(express.urlencoded({extended: true}));

mongoose.set('strictQuery', true);
mongoose.connect(process.env.MONGOLAB_URI, {useNewUrlParser: true});

app.get("/",(req,res)=>{
    res.send("Hello World")
})

app.listen(process.env.PORT, function() {
  console.log(`Server started on http://localhost:${process.env.PORT}`);
});



//PORT=5000
//MONGOLAB_URI=mongodb://localhost/
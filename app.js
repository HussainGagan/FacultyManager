const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const app = express();
app.use(bodyParser.urlencoded({extended:true}))
app.use(express.static("public"));
app.set('view engine', 'ejs');

mongoose.connect("mongodb://localhost:27017/facMangDB", {useNewUrlParser : true , useUnifiedTopology: true });

const facSchema = new mongoose.Schema({
  facId : Number,
  name : String,
  email : String,
  password : String
})
const Faculty = mongoose.model("faculty",facSchema);

app.get("/",function(res,res){
  res.render("facLogin");
})

app.post("/",function(req,res){
  var lgnFacId = req.body.lgnFacultyId;
  var lgnFacPass = req.body.lgnFacultyPass;
  Faculty.findOne({facId : lgnFacId}, function(err, foundUser){
    if(err){
      console.log(err);
    }else{
      if(foundUser){
        if(foundUser.password === lgnFacPass){
          res.redirect("/dashboard");
        }
      }
    }
  })
})

// app.post("/register",function(req,res){
//   var regFacultyId = req.body.regFacultyId;
//   var regFacultyName = req.body.regFacultyName;
//   var regFacultyEmail = req.body.regFacultyEmail;
//   var regFacultyPass = req.body.regFacultyPass;
//   const faculty = new Faculty({
//     facId : regFacultyId,
//     name : regFacultyName,
//     email : regFacultyEmail,
//     password : regFacultyPass
//   })
//   faculty.save(function(err){
//     if(!err){
//       res.redirect("/dashboard");
//     }
//   });
// })

app.get("/dashboard",function(req,res){
  res.render("sidebar");
})

app.listen(3000,function(){
  console.log("Server started at port 3000");
})

const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const app = express();
app.use(bodyParser.urlencoded({extended:true}))
app.use(express.static("public"));
app.set('view engine', 'ejs');

mongoose.connect("mongodb://localhost:27017/facMangDB", {useNewUrlParser : true , useUnifiedTopology: true });

///////// ------------------------- Faculty Schema ---------------------- //////
const facSchema = new mongoose.Schema({
  facId : Number,
  name : String,
  email : String,
  password : String,
  role : String,
  areaOfInterest : String
})
const Faculty = mongoose.model("faculty",facSchema);

///////// ------------------------- Admin Schema ---------------------- //////
const adminSchema = new mongoose.Schema({
  adminId : Number,
  password : String
})
const Admin = mongoose.model("admin",adminSchema);
const admin = new Admin({
  adminId : 1523,
  password: "qwerty"
})
// admin.save();

///////// ------------------------- Faculty module ---------------------- //////
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
  res.render("myProfile");
})
app.get("/addEvent",function(req,res){
  res.render("addEvent");
})
app.get("/timeTable",function(res,res){
  res.render("timeTable");
})
app.get("/studentFeedback",function(res,res){
  res.render("studentFeedback");
})
app.get("/freeSlot",function(res,res){
  res.render("freeSlot");
})


////---------------------------Admin module -----------------------------///////////////
app.get("/admin",(req,res)=>{
  res.render("adminLogin");
})

app.post("/admin",(req,res)=>{
  var adminId = req.body.adminId;
  var adminPass = req.body.adminPass;
  Admin.findOne({adminId : adminId}, function(err, foundAdmin){
    if(err){
      console.log(err);
    }else{
      if(foundAdmin){
        if(foundAdmin.password === adminPass){
          res.render("admFaculty");
        }
      }
    }
  })
})

app.get("/admFaculty",function(req,res){
  res.render("admFaculty");
})

app.post("/admFaculty",function(req,res){
    var regFacId = req.body.facAdminId;
    var regFacName = req.body.facultyAdminName;
    var regFacEmail = req.body.facAdminEmail;
    var regFacPass = req.body.facAdminPass;
    var regFacAreaOfInterest = req.body.areaOfInterest;
    var regFacRole = req.body.facRole;
    const faculty = new Faculty({
        facId : regFacId,
        name : regFacName,
        email : regFacEmail,
        password : regFacPass,
        role  : regFacRole,
        areaOfInterest : regFacAreaOfInterest
      })
      faculty.save(function(err){
        if(!err){
          console.log("Succesfully added faculty to the database");
          res.redirect("/admFaculty");
        }
      });
})

app.get("/admStudent",function(req,res){
  res.render("admStudent");
})
app.get("/admTimeTable",function(res,res){
  res.render("admTimeTable");
})


///------------------- starting port at 3000 ------------------//////////////////
app.listen(3000,function(){
  console.log("Server started at port 3000");
})

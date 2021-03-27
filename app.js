require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const flash = require("connect-flash");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const {ensureAuthenticated} = require("./config/auth");
const {ensureJWTAuthenticated} = require("./config/auth-jwt.js");
const jwt = require('jsonwebtoken');
var cookieParser = require('cookie-parser')
const Swal = require("sweetalert2");

const app = express();
app.use(cookieParser())
app.use(bodyParser.urlencoded({extended:true}))
app.use(express.static("public"));
app.set('view engine', 'ejs');

//Express session
app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: false
}));
// Passport middelware
app.use(passport.initialize());
app.use(passport.session());

//Connect flash
app.use(flash());

// Global Vars
app.use((req, res, next)=>{
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");

  next()
});

mongoose.connect("mongodb://localhost:27017/facMangDB", {useNewUrlParser : true , useUnifiedTopology: true });

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

///////// ------------------------- Time-tableSchema ---------------------- //////
const timeTableSchema = new mongoose.Schema({
  time : String,
  subject : String,
  subLocation : String
})
// const TimeTable = mongoose.model("timetable",timeTableSchema);

///////// ------------------------- Faculty Schema ---------------------- //////
const facSchema = new mongoose.Schema({
  facId : Number,
  name : String,
  email : String,
  password : String,
  role : String,
  areaOfInterest : String,
  phone : Number,
  Monday : [timeTableSchema],
  Tuesday : [timeTableSchema],
  Wednesday : [timeTableSchema],
  Thursday : [timeTableSchema],
  Friday : [timeTableSchema],
  Saturday : [timeTableSchema]
})

const Faculty = mongoose.model("faculty",facSchema);

//passport //
passport.use("faculty", new LocalStrategy({usernameField : "lgnFacultyId", passwordField: 'lgnFacultyPass'}, (facId, password, done) =>{
  // Match Faculty
  Faculty.findOne({facId : facId})
  .then(faculty =>{
    if(!faculty){
      return done(null, false, {message : "Incorrect Faculty Id"});
    }
    //Match Password
    bcrypt.compare(password, faculty.password, (err,isMatch)=>{
      if (err) throw err;
      if(isMatch){
        return done(null, faculty);
      }else{
        return done(null, false, {message : "Incorrect Password"})
      }
    });
  })
  .catch(err => console.log(err));
}));

// passport.use("admin", new LocalStrategy({usernameField : "adminId", passwordField: 'adminPass'}, (adminId, password, done) =>{
//   // Match Faculty
//   Admin.findOne({adminId : adminId})
//   .then(admin =>{
//     if(!admin){
//       return done(null, false, {message : "Incorrect Admin Id"});
//     }
//     //Match Password
//     bcrypt.compare(password, admin.password, (err,isMatch)=>{
//       if (err) throw err;
//       if(isMatch){
//         return done(null, admin);
//       }else{
//         return done(null, false, {message : "Incorrect Password"})
//       }
//     });
//   })
//   .catch(err => console.log(err));
// }));


passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  Faculty.findById(id, function(err, user) {
    done(err, user);
  });
});



///////// ------------------------- Faculty module ---------------------- //////
app.get("/",function(res,res){
  res.render("facLogin");
})

app.post("/",function(req, res, next){
  passport.authenticate("faculty",{
    successRedirect : "/dashboard",
    failureRedirect : "/",
    failureFlash : true
  })(req, res, next);
})
app.get("/facLogout",function(req,res){
  req.logout();
  req.flash("success_msg", "Succesfully logged out");
  res.redirect("/");
})


app.get("/dashboard", ensureAuthenticated , function(req,res){
    res.render("myProfile",{
      foundFacName : req.user.name,
      foundFacEmail : req.user.email,
      foundFacPhone : req.user.phone,
      foundFacId : req.user.facId,
      foundFacRole : req.user.role,
      foundFacAOF : req.user.areaOfInterest
     });

})
app.get("/addEvent", ensureAuthenticated, function(req,res){
  res.render("addEvent");
})
app.get("/timeTable", ensureAuthenticated, function(req,res){
  res.render("timeTable",{
    monday : req.user.Monday,
    tuesday : req.user.Tuesday,
    wednesday : req.user.Wednesday,
    thursday : req.user.Thursday,
    friday : req.user.Friday,
    saturday : req.user.Saturday
  });
})
app.get("/studentFeedback", ensureAuthenticated, function(req,res){
  res.render("studentFeedback");
})
app.get("/freeSlot", ensureAuthenticated, function(req,res){
  res.render("freeSlot",{
    monday : req.user.Monday,
    tuesday : req.user.Tuesday,
    wednesday : req.user.Wednesday,
    thursday : req.user.Thursday,
    friday : req.user.Friday,
    saturday : req.user.Saturday
  });
})


////---------------------------Admin module -----------------------------///////////////
app.get("/admin",(req,res)=>{
  res.render("adminLogin");
})

app.post("/admin",(req, res)=>{
  var adminId = req.body.adminId;
  var adminPass = req.body.adminPass;
  let admLgnErr = []
  Admin.findOne({adminId : adminId}, function(err, foundAdmin){
      if(foundAdmin){
        bcrypt.compare(adminPass, foundAdmin.password, (err, isMatch)=>{
          if(err) throw err;
          if(isMatch){
            const token = jwt.sign(
              {
                adminId : foundAdmin.adminId
              },
              process.env.JWT_SECRET
            )

            res.cookie("jwt", token,{
              // expires : new Date(Date.now() + 300000),
              httpOnly : true
            })
            res.redirect("/admFacultyAdd");
            // console.log(token);
          }else{
            admLgnErr.push({msg : "Invalid ID or Password"});
            res.render("adminLogin", {admLgnErr,adminId,adminPass});
          }
        })
      }else{
        admLgnErr.push({msg : "Invalid ID or Password"});
        res.render("adminLogin", {admLgnErr,adminId,adminPass});
      }

})
})

app.get("/admLogout", ensureJWTAuthenticated,function(req,res){
  res.clearCookie("jwt");
  req.flash("success_msg", "Succesfully logged out");
  res.redirect("/admin");
})

// var success = false;

app.get("/admFacultyAdd", ensureJWTAuthenticated,async (req,res)=>{
  const {adminId} = res.locals; // accessing the adminId passes from middelware (ensureJWTAuthenticated)
  console.log(adminId);
  res.render("admFacultyAdd");
  // success = false;
})

app.post("/admFacultyAdd",function(req,res){
    var regFacId = req.body.regFacId;
    var regFacName = req.body.facultyAdminName;
    var regFacEmail = req.body.facAdminEmail;
    var regFacPass = req.body.facAdminPass;
    var regFacAreaOfInterest = req.body.areaOfInterest;
    var regFacRole = req.body.facRole;
    var regFacPhone = req.body.facPhone;
    let errors = [];
    //check required fields
    if(!regFacId || !regFacName || !regFacEmail || !regFacPass || !regFacAreaOfInterest || !regFacRole || !regFacPhone){
      errors.push({msg : "All fields are Required"})
    }
    if(regFacPass){
      if(regFacPass.length < 6){
        errors.push({msg: "password should be of at least 6 characters"});
      }
    }
    if(regFacPhone){
      if(regFacPhone.toString().length!=10){
        errors.push({msg : "Phone number length should be 10"})
      }
    }
    if(errors.length > 0){
      res.render("admFacultyAdd",{
        errors,
        regFacId,
        regFacName,
        regFacEmail,
        regFacPass,
        regFacAreaOfInterest,
        regFacRole,
        regFacPhone
      });
    }else{
    Faculty.findOne({facId : regFacId})
    .then(fac => {
      if(fac) {
        //faculty already registered
        errors.push({msg : "Faculty with "+regFacId+" ID is already added"});
        res.render("admFacultyAdd",{
          errors,
          regFacId,
          regFacName,
          regFacEmail,
          regFacPass,
          regFacAreaOfInterest,
          regFacRole,
          regFacPhone
        });
      }else{
        const faculty = new Faculty({
            facId : regFacId,
            name : regFacName,
            email : regFacEmail,
            password : regFacPass,
            role  : regFacRole,
            areaOfInterest : regFacAreaOfInterest,
            phone : regFacPhone
          })
          bcrypt.genSalt(10, (err,salt) =>{
            bcrypt.hash(faculty.password, salt, (err, hash) => {
              if(err) throw err;
              //set password to hash
              faculty.password = hash;
              //save faculty
              faculty.save(function(err){
                if(!err){
                  // success = true ;
                  req.flash("success_msg", "Succesfully Added Faculty to the database");
                  res.redirect("/admFacultyAdd");
                }
              });
            })
          })

      }
    })
    }

})

app.get("/admFacultyRmv",ensureJWTAuthenticated,function(req,res){
  Faculty.find({}, function(err, foundFaculties){
    if(err){
      console.log(err);
    } else{
      res.render("admFacultyRmv", {listOfFac : foundFaculties});
    }

  })

})

app.post("/admFacultyRmv",function(req,res){
  var checked = req.body.checkbox;
  console.log(checked);
  Faculty.deleteOne({facId : checked},function(err){
    if(err){
      console.log(err);
    }else{
      console.log("Succesfully Deleted");
      res.redirect("/admFacultyRmv");
    }
  })
})

app.get("/admStudent",ensureJWTAuthenticated,function(req,res){
  res.render("admStudent");
})

var successTimeTable = false;
app.get("/admTimeTable",ensureJWTAuthenticated,function(req,res){
  Faculty.find({}, 'name', function(err, foundFacultiesName){
    if(err){
      console.log(err);
    } else{
      res.render("admTimeTable", {listOfFacName : foundFacultiesName, successTimeTable : successTimeTable});
      successTimeTable = false;
    }

  })
})
app.post("/admTimeTable",function(req,res){
  const {facName, day, time, subject, subLocation} = req.body;
  Faculty.updateOne({name : facName},{$push : {[day] : {  //instead of timetable if using that new schema [day]
    time : time,
    subject : subject,
    subLocation : subLocation
  }}},{upsert: true},function(err){
    if(err){
      console.log(err);
    } else{
      successTimeTable = true;
      res.redirect("/admTimeTable");
    }
  })
})

app.get("/admViewTimeTable",ensureJWTAuthenticated,function(req,res){
  Faculty.find({}, 'name', function(err, foundFacultiesName){
    if(err){
      console.log(err);
    } else{
      res.render("admViewTT", {listOfFacNames : foundFacultiesName});
    }

  })
})
app.post("/admViewTimeTable",function(req,res){
  var facName = req.body.facName;
  Faculty.findOne({name : facName}, 'Monday Tuesday Wednesday Thursday Friday Saturday', function(err, timetable){
    if(err){
      console.log(err);
    }else{
      res.send(timetable)
    }
  })
})

///------------------- starting port at 3000 ------------------//////////////////
app.listen(3000,function(){
  console.log("Server started at port 3000");
})

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
const {ensureAuthenticated, forwardAuthenticated} = require("./config/auth");
const {ensureJWTAuthenticated, forwardJWTAuthenticated} = require("./config/auth-jwt.js");
const jwt = require('jsonwebtoken');
var cookieParser = require('cookie-parser');
const facultyController = require("./controllers/facultyController");
const adminController = require("./controllers/adminController");
const Faculty = require("./models/faculty");
const Admin = require("./models/admin");
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


// FACULTY SIDE
app.get("/", forwardAuthenticated, facultyController.faculty_login) 

app.post("/", forwardAuthenticated, facultyController.faculty_loginPost)

app.get("/facLogout", ensureAuthenticated, facultyController.faculty_logout)

app.get("/dashboard", ensureAuthenticated , facultyController.faculty_profile)

app.get("/addEvent", ensureAuthenticated, facultyController.faculty_addEvent)

app.get("/timeTable", ensureAuthenticated, facultyController.faculty_timeTable)

app.get("/studentFeedback", ensureAuthenticated, facultyController.faculty_studFeedback)

app.get("/freeSlot", ensureAuthenticated, facultyController.faculty_freeSlot)



// ADMIN SIDE

app.get("/admin", forwardJWTAuthenticated, adminController.admin_login)

app.post("/admin", adminController.admin_loginPost)

app.get("/admLogout", ensureJWTAuthenticated,adminController.admin_logout)

app.get("/admFacultyAdd", ensureJWTAuthenticated, adminController.admin_facultyAdd) 

app.post("/admFacultyAdd",ensureJWTAuthenticated, adminController.admin_facultyAddPost)

app.get("/admFacultyList",ensureJWTAuthenticated,adminController.admin_facultyList)

app.post("/admFacultyList", ensureJWTAuthenticated, adminController.admin_facultyListPost)

app.get("/admStudent",ensureJWTAuthenticated,adminController.admin_student)

app.get("/admTimeTable",ensureJWTAuthenticated,adminController.admin_AddTimeTable)
app.post("/admTimeTable",ensureJWTAuthenticated,adminController.admin_AddTimeTablePost)

app.get("/admViewTimeTable",ensureJWTAuthenticated,adminController.admin_viewTimeTable)

app.post("/admViewTimeTable",ensureJWTAuthenticated,adminController.admin_viewTimeTablePost)



// listening to port 3000
app.listen(3000,function(){
  console.log("Server started at port 3000");
})
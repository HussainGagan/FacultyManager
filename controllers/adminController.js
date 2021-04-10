const Admin = require("../models/admin");
const Faculty = require("../models/faculty");
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const flash = require("connect-flash");
var cookieParser = require('cookie-parser');


const admin_login = (req,res) => {
    res.render("adminLogin");
}

const admin_loginPost = (req, res)=>{
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
}

const admin_logout = (req,res) => {
    res.clearCookie("jwt");
    req.flash("success_msg", "Succesfully logged out");
    res.redirect("/admin");
}

const admin_facultyAdd = (req,res)=>{
    const {adminId} = res.locals; // accessing the adminId passes from middelware (ensureJWTAuthenticated)
    console.log(adminId);
    res.render("admFacultyAdd");
    // success = false;
}

const admin_facultyAddPost = (req,res)=>{
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
}

const admin_facultyList = (req,res) => {
    Faculty.find({}, function(err, foundFaculties){
        if(err){
          console.log(err);
        } else{
          res.render("admFacultyList", {listOfFac : foundFaculties});
        }
    
      })
}

const admin_facultyListPost = (req,res) => {
    var checked = req.body.checkbox;
    console.log(checked);
    Faculty.deleteOne({facId : checked},function(err){
        if(err){
        console.log(err);
        }else{
        console.log("Succesfully Deleted");
        res.redirect("/admFacultyList");
        }
    })
}

const admin_student = (req,res) => {
  res.render("admStudent");
}
const admin_AddTimeTable = (req,res) => {
  Faculty.find({}, 'name', function(err, foundFacultiesName){
    if(err){
      console.log(err);
    } else{
      res.render("admTimeTable", {listOfFacName : foundFacultiesName});
      // successTimeTable = false;
    }

  })
}

const admin_AddTimeTablePost = (req,res) => {
  const {facName, day, time, subject, subLocation} = req.body;
  Faculty.updateOne({name : facName},{$push : {[day] : {  //instead of timetable if using //that new schema [day]
    time : time,
    subject : subject,
    subLocation : subLocation
  }}},{upsert: true},function(err){
    if(err){
      console.log(err);
    } else{
      req.flash("success_msg", "Time-Table data added successfully");
      res.redirect("/admTimeTable");
    }
  })
}

const admin_viewTimeTable = (req,res) => {
  Faculty.find({}, 'name', function(err, foundFacultiesName){
    if(err){
      console.log(err);
    } else{
      res.render("admViewTT", {listOfFacNames : foundFacultiesName});
    }
  })
}

const admin_viewTimeTablePost = (req,res) => {
  var facName = req.body.facName;
  Faculty.findOne({name : facName}, 'Monday Tuesday Wednesday Thursday Friday Saturday', function(err, timetable){
    if(err){
      console.log(err);
    }else{
      res.send(timetable)
    }
  })
}


module.exports = {
    admin_login,
    admin_loginPost,
    admin_logout,
    admin_facultyAdd,
    admin_facultyAddPost,
    admin_facultyList,
    admin_facultyListPost,
    admin_student,
    admin_AddTimeTable,
    admin_AddTimeTablePost,
    admin_viewTimeTable,
    admin_viewTimeTablePost
}
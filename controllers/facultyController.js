const Faculty = require("../models/faculty");
const passport = require("passport");
const flash = require("connect-flash");

const faculty_login = (req,res) =>{
    res.render("facLogin");
}

const faculty_loginPost = (req,res,next) =>{
    passport.authenticate("faculty",{
        successRedirect : "/dashboard",
        failureRedirect : "/",
        failureFlash : true
      })(req, res, next);
}

const faculty_logout = (req,res) =>{
    req.logout();
    req.flash("success_msg", "Succesfully logged out");
    res.redirect("/");
}

const faculty_profile = (req,res) =>{
    res.render("myProfile",{
        foundFacName : req.user.name,
        foundFacEmail : req.user.email,
        foundFacPhone : req.user.phone,
        foundFacId : req.user.facId,
        foundFacRole : req.user.role,
        foundFacAOF : req.user.areaOfInterest
       });
}

const faculty_addEvent = (req,res) => {
    res.render("addEvent");
}

const faculty_timeTable = (req,res) => {
    res.render("timeTable",{
        monday : req.user.Monday,
        tuesday : req.user.Tuesday,
        wednesday : req.user.Wednesday,
        thursday : req.user.Thursday,
        friday : req.user.Friday,
        saturday : req.user.Saturday
      });
}

const faculty_studFeedback = (req,res) => {
    res.render("studentFeedback");
}

const faculty_freeSlot = (req,res) => {
    res.render("freeSlot",{
        monday : req.user.Monday,
        tuesday : req.user.Tuesday,
        wednesday : req.user.Wednesday,
        thursday : req.user.Thursday,
        friday : req.user.Friday,
        saturday : req.user.Saturday
      });
}



module.exports = {
    faculty_login,
    faculty_loginPost,
    faculty_logout,
    faculty_profile,
    faculty_addEvent,
    faculty_timeTable,
    faculty_studFeedback,
    faculty_freeSlot
}
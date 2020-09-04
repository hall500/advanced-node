"use strict";

const express = require("express");
const fccTesting = require("./freeCodeCamp/fcctesting.js");
const path = require("path");
const passport = require("passport");
const session = require("express-session");

const ObjectID    = require("mongodb").ObjectID;
const mongo       = require("mongodb").MongoClient;

const LocalStrategy = require("passport-local");

const app = express();
app.set("view engine", "pug");
app.set("views",  path.join(__dirname, "views/pug"));

fccTesting(app); //For FCC testing purposes
app.use("/public", express.static(process.cwd() + "/public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

mongo.connect(process.env.DATABASE,{ useNewUrlParser: true, useUnifiedTopology: true }, (err, dbo) => {
  if(err){
    console.log("A Database error occurrred");
  }else{
    passport.serializeUser((user, done) => {
      done(null, user._id);
    });

    const db = dbo.db("advancednode");
    passport.deserializeUser((id, done) => {
      db.collection("users").findOne({ _id: new ObjectID(id) }, (err, doc) => {
        if(err) console.error(err.message);
        done(null, doc);
      }); 
    });

    passport.use(new LocalStrategy(
      function(username, password, done) {
        db.collection("users").findOne({ username: username }, function (err, user) {
          console.log("User "+ username +" attempted to log in.");
          if (err) { return done(err); }
          if (!user) { return done(null, false); }
          if (password !== user.password) { return done(null, false); }
          console.log(user);
          return done(null, user);
        });
      }
    ));

    app.route("/").get((req, res) => {
      //Change the response to render the Pug template
      res.render("index", {
        title: "home page",
        message: "Please login",
        showLogin: true
      });
    });

    app.route("/login")
    .post(passport.authenticate("local", { 
      failureRedirect: "/" 
    }), (req, res) => {
      res.redirect("/profile");
    });

    const ensureAuthenticated = (req, res, next) => {
      if(req.isAuthenticated()){
        return next();
      }
      res.redirect("/");
    };

    app.route("/profile").get(ensureAuthenticated, (req, res) => {
      res.render("profile", 
      {
        username: req.user.username
      }
      );
    });

    app.route("/logout").get((req, res) => {

    });

    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log("Listening on port " + port);
    });

  }
});

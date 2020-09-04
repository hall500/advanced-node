"use strict";

const express = require("express");
const fccTesting = require("./freeCodeCamp/fcctesting.js");
const passport = require("passport");
const session = require("express-session");

const mongo       = require("mongodb").MongoClient;

const app = express();

const routes = require("./routes.js");
const auth = require("./auth.js");

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

app.set("view engine", "pug");

mongo.connect(process.env.DATABASE,{ useNewUrlParser: true, useUnifiedTopology: true }, (err, dbo) => {
  if(err){
    console.log("A Database error occurrred");
  }else{
    const db = dbo.db("advancednode");

    auth(app, db);
    routes(app, db);
    
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log("Listening on port " + port);
    });

  }
});

import express from "express";
import path from "path";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

mongoose
  .connect("mongodb://localhost:27017", {
    dbname: "Backend",
  })
  .then(() => {
    console.log("Database Conncected successfully...!");
  })
  .catch((error) => console.log(error, "Failed to connect...! "));

// TO ADD DATA IN THE DATABASE
const userSChema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});

const User = mongoose.model("User", userSChema);

const app = express();

//MIDDLEWARES

// MIDDLEWARE : TO STATIC FILES
app.use(express.static(path.join(path.resolve(), "public")));

// MIDDLEWARE TO RECIEVE AND ACCESS THAT DATA
app.use(express.urlencoded({ extended: true }));

// TO ACCESS COOKIE
app.use(cookieParser());

// HOW TO  SERVER DYNAMIC DATA :
// SERVING DYNAMIC DATA ->

// TO RENDER EJS FILES WITHOUT GIVEING EXTENSION IN RENDER
// SETTING UP VIEW ENGINE
app.set("view engine", "ejs");

const isAuthenticated = async (req, res, next) => {
  const { token } = req.cookies;

  if (token) {
    const decoded = jwt.verify(token, "HeyIamHere");

    req.user = await User.findById(decoded._id);
    next();
  } else {
    res.redirect("/login");
  }
};

app.get("/", isAuthenticated, (req, res) => {
  res.render("logout", { name: req.user.name });
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

// app.post("/login", async (req, res) => {
//   const { name, email } = req.body;

//   let user = await User.findOne({ email });

//   if (!user) return res.redirect("/register");

//   const token = jwt.sign({ _id: user._id }, "HeyIamHere");

//   res.cookie("token", token, {
//     httpOnly: true,
//     expires: new Date(Date.now() + 60 * 100),
//   });
//   res.redirect("/");
// });

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  let user = await User.findOne({ email });

  if (!user) return res.redirect("/register");

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch)
    return res.render("login", { email, message: "Incorrect Password" });

  const token = jwt.sign({ _id: user._id }, "HeyIamHere");

  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 100),
  });
  res.redirect("/");
});

//  CREATING USER ROUTE : REGISTER USER

app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  let user = await User.findOne({ email });

  if (user) return res.redirect("/login");

  const hashedPassword = await bcrypt.hash(password, 10);

  user = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  const token = jwt.sign({ _id: user._id }, "HeyIamHere");

  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 100),
  });
  res.redirect("/");
});

app.get("/logout", (req, res) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
  });
  res.redirect("/");
});

app.listen(5000, () => {
  console.log("Server is running successfully...!");
});

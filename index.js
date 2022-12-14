import express from "express";
import { engine } from "express-handlebars";
import bcrypt from "bcrypt";

import sqlite3 from "sqlite3";
import { open } from "sqlite";

const SALT_ROUNDS = 10;

const dbPromise = open({
  filename: "data.db",
  driver: sqlite3.Database,
});

const app = express();

app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", "./views");

app.use(express.urlencoded({ extended: true }));

app.get("/", async (req, res) => {
  const db = await dbPromise;
  const messages = await db.all("SELECT * FROM Message;");
  res.render("home", { messages });
});

app.get("/register", async (req, res) => {
  res.render("register");
});

app.post("/register", async (req, res) => {
  const db = await dbPromise;
  const { username, password, passwordRepeat } = req.body;
  if (password !== passwordRepeat) {
    res.render("register", { error: "Passwords must match" });
    return;
  }
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  await db.run(
    "INSERT INTO User (username, password) VALUES (?, ?)",
    username,
    passwordHash
  );
  res.redirect("/");
});

app.post("/message", async (req, res) => {
  const db = await dbPromise;
  const messageText = req.body.messageText;
  await db.run("INSERT INTO Message (text) VALUES (?);", messageText);
  res.redirect("/");
  // res.send('message received ' + messageText )
});

app.get("/", (req, res) => {
  res.render("home");
});

const setup = async () => {
  const db = await dbPromise;
  await db.migrate();
  app.listen(8000, () => {
    console.log("listening on localhost:8000");
  });
};
setup();

const express = require("express");
const bcrypt = require("bcrypt");
const session = require("express-session");
const { Pool } = require("pg");
const env = require("../env.json");
const createCardUpdateService = require("./services/cardUpdateService");
const searchRoutes = require("./routes/searchRoutes");
const cardRoutes = require("./routes/cardRoutes");
const packRoutes = require("./routes/packRoutes");
const collectionRoutes = require("./routes/collectionRoutes");

const app = express();
const port = 3000;
const hostname = "localhost";
const pool = new Pool(env.pool);

const HOURS_PER_DAY = 24;
const MINUTES_PER_HOUR = 60;
const SECONDS_PER_MINUTE = 60;
const MILLISECONDS_PER_SECOND = 1000;
let CARD_UPDATE_INTERVAL = HOURS_PER_DAY * MINUTES_PER_HOUR * SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND;

const cardUpdateService = createCardUpdateService(pool, env);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(
  session({
    secret: "change_this_to_a_real_secret",
    resave: false,
    saveUninitialized: false,
  })
);

app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const query =
      "INSERT INTO users (username, password_hash, email) VALUES ($1, $2, $3)";
    const values = [username, hashedPassword, email];

    await pool.query(query, values);

    res.redirect("/login.html");
  } catch (err) {
    console.error(err);
    res.send("Error registering user. Username or email may already exist.");
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.send("User not found.");
    }

    const user = userResult.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);

    if (match) {
      req.session.userId = user.id;
      req.session.username = user.username;

      res.send(`Welcome back, ${user.username}! You are logged in.`);
     
      res.send("Incorrect password.");
    }
  } catch (err) {
    console.error(err);
    res.send("Error logging in.");
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login.html");
  });
});

app.use("/search", searchRoutes(pool));
app.use("/card", cardRoutes(pool));

async function runCardUpdate() {
  try {
    if (await cardUpdateService.shouldUpdate()) {
      console.log("Starting card sync...");
      await cardUpdateService.updateCards();
    } else {
      console.log("Card sync not needed.");
    }
  } catch (error) {
    console.error("Sync failed:", error);
  }
}
app.use("/packs", packRoutes(pool, env));
app.use("/collections", collectionRoutes(pool));

app.listen(port, hostname, async () => {
  console.log(`http://${hostname}:${port}`);

  // intial run on start-up as a sanity check.
  await runCardUpdate();
  
  setInterval(runCardUpdate, CARD_UPDATE_INTERVAL);
});

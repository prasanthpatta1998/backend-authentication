const express = require("express");
const bodyParser = require("body-parser");
const db = require("./db");
const jwt = require('jsonwebtoken')
const bcrypt = require("bcrypt");

const app = express();
app.use(bodyParser.json());

db.run(`
CREATE TABLE IF NOT EXISTS userRegistration (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    password TEXT,
    email TEXT,
    number INTEGER  
)
`);

app.post("/registration", async (req, res) => {
  const { username, password, email, number } = req.body;

  db.get(
    "SELECT * FROM userRegistration WHERE username=?",
    [username],
    async (err, row) => {
      if (err) {
        return res.status(500).json({ error: "Internal Server Error" });
      }

      if (row) {
        return res.status(400).json({ error: "User Already Exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      db.run(
        `INSERT INTO userRegistration (username, password, email, number) VALUES (?,?,?,?)`,
        [username, hashedPassword, email, number],
        (err) => {
          if (err) {
            return res.status(500).json({ error: "Internal Server Error" });
          }
          res.status(200).json({ message: "User Registered Successfully" });
        }
      );
    }
  );
});

app.get("/users", (req, res) => {
  db.all("SELECT * from userRegistration", (err, row) => {
    if (err) res.status(500).json({ error: "Internal Server Error" });
    res.status(200).json(row);
  });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  db.get(
    "SELECT * FROM userRegistration WHERE username=?",
    [username],
    async (err, row) => {
      if (err) return res.status(500).json({ error: "Internal Server Error" });
      if (row) {
        const isPasswordmtched = await bcrypt.compare(password, row.password);
        if (isPasswordmtched) {
          const payLoad = {
            username
          }
          const token = jwt.sign(payLoad, 'Access-My-Token', {expiresIn: '1h'})
          res.status(200).json({ message: "Login Successfully" , token});
        } else {
          res.status(400).json({ message: "Invalid Password" });
        }
      } else {
        res.status(400).json({ error: "Invalid User" });
      }
    }
  );
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running successfully on PORT ${PORT}`);
});

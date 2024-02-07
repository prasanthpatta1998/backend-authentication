const express = require("express");
const bodyParser = require("body-parser");
const db = require("./db");
const jwt = require("jsonwebtoken");
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

db.run(`
CREATE TABLE IF NOT EXISTS book (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  content TEXT,
  price INTEGER
)
`);

const authorizationToken = (request, response, next) => {
  let jwtToken;
  console.log(request.headers);
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(401).json({ error: "Invalid User: Missing Token" });
  } else {
    jwt.verify(jwtToken, "Access-My-Token", async (err, payload) => {
      console.log(payload);
      if (err)
        return response
          .status(401)
          .json({ error: "Invalid User: Token Verification Failed" });
      request.username = payload.username;
      next();
    });
  }
};

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
            username,
          };
          const token = jwt.sign(payLoad, "Access-My-Token", {
            expiresIn: "1h",
          });
          res.status(200).json({ message: "Login Successfully", token });
        } else {
          res.status(400).json({ message: "Invalid Password" });
        }
      } else {
        res.status(400).json({ error: "Invalid User" });
      }
    }
  );
});

app.post("/book", (req, res) => {
  const body = req.body;
  const values = body.map((each) => `(?,?,?)`).join(", ");
  const valuesInsert = body.flatMap((each) => [
    each.name,
    each.content,
    each.price,
  ]);
  console.log(valuesInsert);
  db.run(
    `INSERT INTO book (name, content, price) VALUES ${values}`,
    [...valuesInsert],
    (err) => {
      if (err) return res.status(500).json({ error: "Internal Server Error" });
      res.status(200).json({ message: "Book Added successfully" });
    }
  );
});

app.get("/books", authorizationToken, (req, res) => {
  db.all(" SELECT * FROM book", (err, row) => {
    if (err)
      return res.status(500).json({ error: "Error while fetching data" });
    res.status(200).json(row);
  });
});

app.put("/book/:id", authorizationToken, (req, res) => {
  const { name, content, price } = req.body;
  const bookId = req.params.id;
  db.run(
    "UPDATE book SET name=?, content=?, price=? WHERE id=?",
    [name, content, price, bookId],
    (err) => {
      if (err) return res.status(500).json({ error: "Internal Server Error" });
      res.status(200).json({ message: "Updated Data successfully" });
    }
  );
});

app.patch("/book/:id", authorizationToken, (req, res) => {
  const updateFields = req.body;
  const bookId = req.params.id;
  if (Object.keys(updateFields)?.length === 0) {
    return res.status(400).json({ error: "No fields to update provided" });
  }

  const setQuery = Object.keys(updateFields)
    ?.map((field) => `${field}=?`)
    .join(", ");
  db.run(
    `UPDATE book SET ${setQuery} WHERE id=?`,
    [...Object.values(updateFields), bookId],
    (err) => {
      if (err) return res.status(500).json({ error: "Internal Server Error" });
      res.status(200).json({ message: "Updated Data successfully" });
    }
  );
});

app.delete("/book/:id", authorizationToken, (req, res) => {
  const bookId = req.params.id;
  db.run("DELETE FROM book WHERE id=?", [bookId], (err) => {
    if (err) return res.status(500).json({ error: "Error while Deleting" });
    res.status(200).json({ message: "Book Deleted Successfully" });
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running successfully on PORT ${PORT}`);
});

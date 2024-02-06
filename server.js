const express = require("express");
const bodyParser = require("body-parser");
const db = require("./db");

const app = express();
app.use(bodyParser.json());

db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT,
  )
`);


app.post("/user", (request, response) => {
  const { name, email } = request.body;
  db.run(
    "INSERT INTO users (name, email) VALUES (?,?)",
    [name, email],
    (err) => {
      if (err)
        return response.status(500).json({ error: "Error Updating User" });
      response.status(200).json({ message: "User Updated Successfully" });
    }
  );
});

app.get("/users", (req, res) => {
  db.all("SELECT * FROM users", (err, rows) => {
    if (err) return res.status(500).json({ error: "Error Getting Users" });
    res.status(200).json(rows);
  });
});

app.put("/user/:id", (req, res) => {
  const { name, email } = req.body;
  const userId = req.params.id;
  db.run(
    "UPDATE users SET name=?, email=? WHERE id=?",
    [name, email, userId],
    (err) => {
      if (err) return res.status(500).json({ error: "Error Updating User" });
      res.status(200).json({ message: "User Updated Successfully" });
    }
  );
});

app.delete("/user/:id", (req, res) => {
  const userId = req.params.id;
  db.run("DELETE FROM users WHERE id=?", [userId], (err) => {
    if (err) res.status(500).json({ error: "Failed to Delete User" });
    res.status(200).json({ message: "Deleted User Successfully" });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const db = require("./database");

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.get("/", (req, res) => {
 app.post("/register", (req, res) => {
  const { email, password } = req.body;

  db.run(
    "INSERT INTO users (email, password, active) VALUES (?, ?, ?)",
    [email, password, 0],
    function (err) {
      if (err) {
        return res.status(400).json({ error: "Usuário já existe" });
      }
      res.json({ success: true });
    }
  );
});

});

const PORT = 3000;
app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.get(
    "SELECT * FROM users WHERE email = ? AND password = ?",
    [email, password],
    (err, row) => {
      if (!row) {
        return res.status(401).json({ error: "Login inválido" });
      }

      if (row.active === 0) {
        return res.status(403).json({ error: "Acesso bloqueado" });
      }

      res.json({ success: true });
    }
  );
});

app.post("/webhook-kiwify", (req, res) => {
  const { email, status } = req.body;

  if (status === "paid") {
    db.run("UPDATE users SET active = 1 WHERE email = ?", [email]);
  }

  if (status === "refunded" || status === "canceled") {
    db.run("UPDATE users SET active = 0 WHERE email = ?", [email]);
  }

  res.send("OK");
});


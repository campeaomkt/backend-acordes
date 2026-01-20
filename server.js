const cors = require("cors");
require("dotenv").config();

const express = require("express");
const bcrypt = require("bcrypt");
const db = require("./database");

const app = express();

// ====== CORS ======
app.use(cors());

// ====== JSON ======
app.use(express.json());

// =====================
// ROTAS DE TESTE
// =====================
app.get("/", (req, res) => {
  res.send("Backend funcionando!");
});

app.get("/healthz", (req, res) => {
  res.send("ok");
});

// =====================
// WEBHOOK KIWIFY
// =====================
app.post("/webhook-kiwify", (req, res) => {

  console.log("=== WEBHOOK CHEGOU ===");
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);

  const recebido = req.headers["authorization"];
  const token = process.env.KIWIFY_TOKEN;

  if (!recebido) {
    console.log("Webhook sem authorization");
    return res.status(401).json({ erro: "Sem token" });
  }

  const tokenLimpo = recebido.replace("Bearer ", "").trim();

  if (tokenLimpo !== token) {
    console.log("Token inválido recebido:", tokenLimpo);
    return res.status(401).json({ erro: "Token inválido" });
  }

  const email = req.body.customer?.email?.trim().toLowerCase();
  const status = req.body.order_status;

  if (!email) return res.status(400).send("Sem email");

  if (status === "paid") {
    const senhaPadrao = "123456";

    bcrypt.hash(senhaPadrao, 10, (err, hash) => {
      if (err) return console.log("Erro hash:", err);

      db.run(
        "INSERT OR IGNORE INTO users(email,password,active) VALUES(?,?,1)",
        [email, hash]
      );

      db.run("UPDATE users SET active=1 WHERE email=?", [email]);
    });
  }

  if (status === "refunded" || status === "canceled") {
    db.run("UPDATE users SET active=0 WHERE email=?", [email]);
  }

  console.log("Webhook processado:", email, status);

  res.json({ ok: true });
});

// =====================
// CHECK ACCESS
// =====================
app.post("/check-access", (req, res) => {
  const email = req.body.email?.trim().toLowerCase();

  if (!email) return res.json({ active: false });

  db.get("SELECT active FROM users WHERE email=?", [email], (err, user) => {
    if (!user) return res.json({ active: false });
    res.json({ active: user.active === 1 });
  });
});

// =====================
// PORTA DO RENDER
// =====================
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Servidor rodando na porta " + PORT);
});

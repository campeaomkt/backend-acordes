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
  console.log("Body:", req.body);

  // EMAIL REAL DA KIWIFY
  const email = req.body.Customer?.email?.trim().toLowerCase();

  // STATUS REAL
  const status = req.body.order_status;

  if (!email) {
    console.log("Webhook sem email");
    return res.status(400).json({ erro: "Sem email" });
  }

  console.log("Email recebido:", email);
  console.log("Status recebido:", status);

  // =====================
  // COMPRA APROVADA
  // =====================
  if (status === "paid" || status === "order_approved") {

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

  // =====================
  // CANCELAMENTO / REEMBOLSO
  // =====================
  if (status === "refunded" || status === "canceled") {
    db.run("UPDATE users SET active=0 WHERE email=?", [email]);
  }

  console.log("Webhook processado:", email, status);

  res.json({ ok: true });
});

// =====================
// CHECK ACCESS (APP)
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

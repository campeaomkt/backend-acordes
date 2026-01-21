const cors = require("cors");
require("dotenv").config();

const express = require("express");
const bcrypt = require("bcrypt");
const User = require("./database");

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
app.post("/webhook-kiwify", async (req, res) => {

  console.log("=== WEBHOOK CHEGOU ===");
  console.log("Body:", req.body);

  const email = req.body.Customer?.email?.trim().toLowerCase();
  const status = req.body.order_status;

  if (!email) {
    console.log("Webhook sem email");
    return res.status(400).json({ erro: "Sem email" });
  }

  console.log("Email recebido:", email);
  console.log("Status recebido:", status);

  // ===== COMPRA APROVADA =====
  if (status === "paid" || status === "order_approved") {

    const senhaPadrao = "123456";
    const hash = await bcrypt.hash(senhaPadrao, 10);

    await User.findOneAndUpdate(
      { email },
      { email, password: hash, active: true },
      { upsert: true }
    );
  }

  // ===== REEMBOLSO =====
  if (status === "refunded") {
    await User.findOneAndUpdate(
      { email },
      { active: false }
    );
  }

  console.log("Webhook processado:", email, status);

  res.json({ ok: true });
});

// =====================
// CHECK ACCESS (APP)
// =====================
app.post("/check-access", async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();

  console.log("CHECK ACCESS:", email);

  if (!email) return res.json({ active: false });

  const user = await User.findOne({ email });

  console.log("USUÁRIO NO BANCO:", user);

  if (!user) return res.json({ active: false });

  res.json({ active: user.active === true });
});

// =====================
// PORTA DO RENDER
// =====================
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Servidor rodando na porta " + PORT);
});

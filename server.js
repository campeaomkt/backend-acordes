const cors = require("cors");
require("dotenv").config();

const express = require("express");
const crypto = require("crypto");
const User = require("./database");

const app = express();

app.use(cors());
app.use(express.json());

// =====================
// TESTE
// =====================
app.get("/", (req, res) => {
  res.send("Backend funcionando!");
});

// =====================
// WEBHOOK KIWIFY
// =====================
app.post("/webhook-kiwify", async (req, res) => {

  const email = req.body.Customer?.email?.trim().toLowerCase();
  const status = req.body.order_status;

  if (!email) return res.json({ ok:false });

  try {

    if (status === "paid" || status === "order_approved") {

      const token = crypto.randomBytes(32).toString("hex");

      await User.findOneAndUpdate(
        { email },
        {
          email,
          active: true,
          token
        },
        { upsert:true }
      );

      console.log("Usuário liberado:", email);
    }

    if (status === "refunded" || status === "canceled") {

      await User.findOneAndUpdate(
        { email },
        { active:false }
      );

      console.log("Usuário bloqueado:", email);
    }

    res.json({ ok:true });

  } catch (err) {
    console.log("Erro webhook:", err);
    res.status(500).json({ erro:"Erro interno" });
  }
});

// =====================
// GERAR TOKEN PELO EMAIL
// =====================
app.post("/get-token", async (req,res)=>{
  const { email } = req.body;

  const user = await User.findOne({ email, active:true });

  if(!user) return res.json({ ok:false });

  res.json({ ok:true, token:user.token });
});

// =====================
// CHECK ACCESS POR TOKEN
// =====================
app.post("/check-access", async (req,res)=>{
  const { token } = req.body;

  const user = await User.findOne({ token, active:true });

  if(!user) return res.json({ active:false });

  res.json({ active:true });
});

// =====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("Servidor rodando na porta " + PORT);
});

const cors = require("cors");
require("dotenv").config();

const express = require("express");
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

  console.log("Webhook:", email, status);

  if (!email) return res.json({ ok:false });

  try {

    // COMPRA APROVADA
    if (status === "paid" || status === "order_approved") {

      const user = await User.findOneAndUpdate(
        { email },
        {
          email,
          active: true
        },
        { upsert:true, new:true }
      );

      console.log("Usuário liberado:", user.email);
    }

    // REEMBOLSO / CANCELAMENTO
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
// CHECK ACCESS POR EMAIL
// =====================
app.post("/check-access", async (req,res)=>{

  const { email } = req.body;

  if(!email){
    console.log("CHECK ACCESS sem email");
    return res.json({ active:false });
  }

  const user = await User.findOne({ email, active:true });

  if(!user){
    console.log("CHECK ACCESS NEGADO:", email);
    return res.json({ active:false });
  }

  console.log("CHECK ACCESS OK:", email);
  res.json({ active:true });
});

// =====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("Servidor rodando na porta " + PORT);
});

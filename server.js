const cors = require("cors");
require("dotenv").config();

const express = require("express");
const bcrypt = require("bcrypt");
const db = require("./database");

const app = express();

// ====== DEBUG DAS VARIÁVEIS ======
console.log("ADMIN_EMAIL:", process.env.ADMIN_EMAIL);
console.log("ADMIN_PASSWORD:", process.env.ADMIN_PASSWORD ? "OK" : "UNDEFINED");

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
  const recebido = req.headers["authorization"];
  const token = process.env.KIWIFY_TOKEN;

  if (recebido !== token) {
    return res.status(401).json({ erro: "Token inválido" });
  }

  const email = req.body.customer?.email;
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
// LOGIN (ADMIN + ALUNO)
// =====================
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  console.log("Tentativa login:", email);

  // LOGIN ADMIN
  if (email === process.env.ADMIN_EMAIL) {
    console.log("Tentativa admin detectada");

    if (password === process.env.ADMIN_PASSWORD) {
      console.log("Login admin OK");
      return res.json({ ok: true, admin: true });
    } else {
      console.log("Senha admin incorreta");
      return res.json({ erro: "Senha inválida" });
    }
  }

  // LOGIN ALUNO
  db.get("SELECT * FROM users WHERE email=?", [email], async (err, user) => {
    if (!user) return res.json({ erro: "Usuário não encontrado" });

    if (!user.active) return res.json({ erro: "Acesso bloqueado" });

    const ok = await bcrypt.compare(password, user.password);

    if (!ok) return res.json({ erro: "Senha inválida" });

    res.json({ ok: true, admin: false });
  });
});

// =====================
// PAINEL ADMIN - CRIAR USUÁRIO
// =====================
app.post("/admin/add-user", async (req, res) => {
  const { email } = req.body;

  if (!email) return res.json({ erro: "Email obrigatório" });

  const senha = "123456";
  const hash = await bcrypt.hash(senha, 10);

  db.run(
    "INSERT OR IGNORE INTO users(email,password,active) VALUES(?,?,1)",
    [email, hash],
    err => {
      if (err) return res.json({ erro: "Erro ao salvar" });
      res.json({ ok: true, senha });
    }
  );
});

// =====================
// PORTA DO RENDER
// =====================
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Servidor rodando na porta " + PORT);
});

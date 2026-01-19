const express = require("express");
const app = express();

app.use(express.json());

// rota teste
app.get("/", (req, res) => {
  res.send("Backend funcionando!");
});

// rota health check
app.get("/healthz", (req, res) => {
  res.send("ok");
});

// PORTA DO RENDER
const PORT = process.env.PORT || 3000;

// ESCUTAR EM 0.0.0.0
app.listen(PORT, "0.0.0.0", () => {
  console.log("Servidor rodando na porta " + PORT);
});

app.post("/webhook/kiwify", express.json(), (req, res) => {
  console.log("Webhook recebido:", req.body);

  res.status(200).send("OK");
});

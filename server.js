const express = require("express");
const app = express();

app.use(express.json());

// rota teste obrigatória
app.get("/", (req, res) => {
  res.send("Backend funcionando!");
});

// rota health para Render
app.get("/healthz", (req, res) => {
  res.status(200).send("OK");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Servidor rodando na porta " + PORT);
});

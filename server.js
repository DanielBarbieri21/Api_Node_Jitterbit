const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
require("dotenv").config();

const orderRoutes = require("./routes/orderRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/order", orderRoutes);

// Rota de saúde para monitoramento
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Middleware 404
app.use((req, res) => {
  res.status(404).json({ error: "Recurso não encontrado" });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  // eslint-disable-line no-unused-vars
  console.error(err);
  res.status(err.status || 500).json({ error: "Erro interno no servidor" });
});

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`API rodando na porta ${PORT}`);
});


import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import alunoRoutes from "./routes/aluno.js";
import monitorRoutes from "./routes/monitor.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/aluno", alunoRoutes);
app.use("/monitor", monitorRoutes);

app.listen(3000, () => console.log("Servidor rodando na porta 3000"));

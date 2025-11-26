import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import alunoRoutes from "./routes/aluno.js";
import monitorRoutes from "./routes/monitor.js";
import cursosRoutes from "./routes/cursos.js";
import disciplinasRoutes from "./routes/disciplinas.js";
import alunoDisciplinasRoutes from "./routes/alunoDisciplinas.js";
import monitorDisciplinasRoutes from "./routes/monitorDisciplinas.js";
import matchRoutes from "./routes/match.js";
import connectionsRoutes from "./routes/connections.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/aluno", alunoRoutes);
app.use("/monitor", monitorRoutes);
app.use("/cursos", cursosRoutes);
app.use("/disciplinas", disciplinasRoutes);
app.use("/aluno", alunoDisciplinasRoutes);
app.use("/monitor", monitorDisciplinasRoutes);
app.use("/match", matchRoutes);
app.use("/connections", connectionsRoutes);

app.listen(3000, () => console.log("Servidor rodando na porta 3000"));

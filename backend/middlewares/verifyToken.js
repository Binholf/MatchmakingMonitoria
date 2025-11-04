import jwt from "jsonwebtoken";

export default function verificaToken(req, res, next) {
  const authHeader = req.headers["authorization"];

  if (!authHeader)
    return res.status(401).json({ error: "Token não fornecido" });

  const token = authHeader.split(" ")[1]; // Formato: Bearer <token>
  if (!token) return res.status(401).json({ error: "Token inválido" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id };
    next();
  } catch (err) {
    return res.status(403).json({ error: "Token expirado ou inválido" });
  }
}

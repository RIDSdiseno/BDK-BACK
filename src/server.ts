import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import contactoRoutes from "./modules/contacto/routes/contacto.routes";

dotenv.config();

const app = express();
app.set("trust proxy", 1);

const PORT = Number(process.env.PORT || 3001);
const DEFAULT_DEV_ORIGIN = "http://localhost:5173";
const rawOrigins = [
  process.env.FRONT_URL,
  process.env.CORS_ORIGIN,
  process.env.FRONTEND_ORIGIN,
  DEFAULT_DEV_ORIGIN,
]
  .filter(Boolean)
  .join(",");
const corsOrigins = Array.from(
  new Set(
    rawOrigins
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
  )
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} no permitido por CORS`));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "64kb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/contacto", contactoRoutes);
app.use("/api/contact", contactoRoutes);

app.listen(PORT, () => {
  console.log(`Servidor BDK escuchando en http://localhost:${PORT}`);
});

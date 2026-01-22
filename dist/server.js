"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const contacto_routes_1 = __importDefault(require("./modules/contacto/routes/contacto.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
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
const corsOrigins = Array.from(new Set(rawOrigins
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)));
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || corsOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error(`Origin ${origin} no permitido por CORS`));
    },
    credentials: true,
}));
app.use(express_1.default.json({ limit: "64kb" }));
app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/contacto", contacto_routes_1.default);
app.use("/api/contact", contacto_routes_1.default);
app.listen(PORT, () => {
    console.log(`Servidor BDK escuchando en http://localhost:${PORT}`);
});

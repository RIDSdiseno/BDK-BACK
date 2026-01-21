import { Router, type NextFunction, type Request, type Response } from "express";
import { enviarContacto } from "../controllers/contacto.controller";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;
const rateLimitStore = new Map<
  string,
  { count: number; windowStart: number }
>();

const getClientIp = (req: Request) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0];
  }
  return req.ip ?? "unknown";
};

const rateLimitContacto = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const now = Date.now();
  const ip = getClientIp(req);
  const current = rateLimitStore.get(ip);

  if (!current || now - current.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(ip, { count: 1, windowStart: now });
    return next();
  }

  current.count += 1;
  if (current.count > RATE_LIMIT_MAX) {
    return res
      .status(429)
      .json({ ok: false, error: "Demasiadas solicitudes" });
  }

  rateLimitStore.set(ip, current);
  return next();
};

const router = Router();

router.post("/", rateLimitContacto, enviarContacto);

export default router;

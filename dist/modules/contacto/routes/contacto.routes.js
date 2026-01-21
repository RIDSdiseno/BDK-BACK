"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const contacto_controller_1 = require("../controllers/contacto.controller");
const RATE_LIMIT_WINDOW_MS = 60000;
const RATE_LIMIT_MAX = 10;
const rateLimitStore = new Map();
const getClientIp = (req) => {
    const forwarded = req.headers["x-forwarded-for"];
    if (typeof forwarded === "string" && forwarded.length > 0) {
        return forwarded.split(",")[0].trim();
    }
    if (Array.isArray(forwarded) && forwarded.length > 0) {
        return forwarded[0];
    }
    return req.ip ?? "unknown";
};
const rateLimitContacto = (req, res, next) => {
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
const router = (0, express_1.Router)();
router.post("/", rateLimitContacto, contacto_controller_1.enviarContacto);
exports.default = router;

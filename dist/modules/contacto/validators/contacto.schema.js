"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatContactoError = exports.normalizeContactoPayload = exports.contactoSchema = void 0;
const zod_1 = require("zod");
exports.contactoSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(2).max(120),
    email: zod_1.z.string().email().max(160),
    mensaje: zod_1.z.string().min(10).max(4000),
    asunto: zod_1.z.string().min(3).max(160),
    telefono: zod_1.z.string().max(40).optional(),
    company: zod_1.z.string().max(120).optional(),
});
const asString = (value) => typeof value === "string" ? value.trim() : "";
const asOptionalString = (value) => {
    if (typeof value !== "string") {
        return undefined;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
};
const normalizeContactoPayload = (body) => {
    const data = typeof body === "object" && body !== null
        ? body
        : {};
    return {
        nombre: asString(data.nombre ?? data.name),
        email: asString(data.email),
        mensaje: asString(data.mensaje ?? data.message),
        asunto: asString(data.asunto ?? data.subject),
        telefono: asOptionalString(data.telefono ?? data.phone),
        company: asOptionalString(data.company ?? data["bot-field"] ?? data.honeypot),
    };
};
exports.normalizeContactoPayload = normalizeContactoPayload;
const formatContactoError = (error) => {
    const fields = Array.from(new Set(error.issues
        .map((issue) => issue.path[0])
        .filter((field) => typeof field === "string")));
    if (fields.length === 0) {
        return "Validacion: campos invalidos.";
    }
    return `Validacion: revisa ${fields.join(", ")}.`;
};
exports.formatContactoError = formatContactoError;

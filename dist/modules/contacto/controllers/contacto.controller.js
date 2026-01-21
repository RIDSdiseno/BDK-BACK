"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enviarContacto = void 0;
const contacto_schema_1 = require("../validators/contacto.schema");
const contacto_service_1 = require("../services/contacto.service");
const enviarContacto = async (req, res) => {
    const normalized = (0, contacto_schema_1.normalizeContactoPayload)(req.body);
    const parsed = contacto_schema_1.contactoSchema.safeParse(normalized);
    if (!parsed.success) {
        return res
            .status(400)
            .json({ ok: false, error: (0, contacto_schema_1.formatContactoError)(parsed.error) });
    }
    if (parsed.data.company && parsed.data.company.trim().length > 0) {
        return res
            .status(400)
            .json({ ok: false, error: "Validacion: solicitud invalida." });
    }
    try {
        await (0, contacto_service_1.enviarCorreoContacto)(parsed.data, {
            ip: req.ip,
            userAgent: req.get("user-agent") ?? undefined,
        });
        return res.status(200).json({ ok: true, message: "Enviado" });
    }
    catch (error) {
        console.error("Error enviando correo de contacto");
        const message = error instanceof Error && error.message.includes("Token error")
            ? "No se pudo autenticar con el proveedor de correo"
            : "No se pudo enviar el correo";
        return res
            .status(500)
            .json({ ok: false, error: message });
    }
};
exports.enviarContacto = enviarContacto;

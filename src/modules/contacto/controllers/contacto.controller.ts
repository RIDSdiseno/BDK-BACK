import type { Request, Response } from "express";
import {
  contactoSchema,
  formatContactoError,
  normalizeContactoPayload,
} from "../validators/contacto.schema";
import { enviarCorreoContacto } from "../services/contacto.service";

export const enviarContacto = async (req: Request, res: Response) => {
  const normalized = normalizeContactoPayload(req.body);
  const parsed = contactoSchema.safeParse(normalized);

  if (!parsed.success) {
    return res
      .status(400)
      .json({ ok: false, error: formatContactoError(parsed.error) });
  }

  if (parsed.data.company && parsed.data.company.trim().length > 0) {
    return res
      .status(400)
      .json({ ok: false, error: "Validacion: solicitud invalida." });
  }

  try {
    await enviarCorreoContacto(parsed.data, {
      ip: req.ip,
      userAgent: req.get("user-agent") ?? undefined,
    });
    return res.status(200).json({ ok: true, message: "Enviado" });
  } catch (error) {
    console.error("Error enviando correo de contacto");
    const message =
      error instanceof Error && error.message.includes("Token error")
        ? "No se pudo autenticar con el proveedor de correo"
        : "No se pudo enviar el correo";
    return res
      .status(500)
      .json({ ok: false, error: message });
  }
};

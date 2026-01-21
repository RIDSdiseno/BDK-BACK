import { z } from "zod";

export const contactoSchema = z.object({
  nombre: z.string().min(2).max(120),
  email: z.string().email().max(160),
  mensaje: z.string().min(10).max(4000),
  asunto: z.string().min(3).max(160),
  telefono: z.string().max(40).optional(),
  company: z.string().max(120).optional(),
});

export type ContactoPayload = z.infer<typeof contactoSchema>;

const asString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const asOptionalString = (value: unknown) => {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export const normalizeContactoPayload = (body: unknown): ContactoPayload => {
  const data =
    typeof body === "object" && body !== null
      ? (body as Record<string, unknown>)
      : {};

  return {
    nombre: asString(data.nombre ?? data.name),
    email: asString(data.email),
    mensaje: asString(data.mensaje ?? data.message),
    asunto: asString(data.asunto ?? data.subject),
    telefono: asOptionalString(data.telefono ?? data.phone),
    company: asOptionalString(
      data.company ?? data["bot-field"] ?? data.honeypot
    ),
  };
};

export const formatContactoError = (error: z.ZodError) => {
  const fields = Array.from(
    new Set(
      error.issues
        .map((issue) => issue.path[0])
        .filter((field): field is string => typeof field === "string")
    )
  );

  if (fields.length === 0) {
    return "Validacion: campos invalidos.";
  }

  return `Validacion: revisa ${fields.join(", ")}.`;
};

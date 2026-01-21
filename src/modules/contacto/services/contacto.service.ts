import type { ContactoPayload } from "../validators/contacto.schema";
import { sendContactMail } from "../../../services/mail/graphMailer";

type ContactoMeta = {
  ip?: string;
  userAgent?: string;
};

export const enviarCorreoContacto = async (
  payload: ContactoPayload,
  meta: ContactoMeta
) => {
  await sendContactMail(payload, meta);
};

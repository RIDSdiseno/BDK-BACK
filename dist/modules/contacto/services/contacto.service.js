"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enviarCorreoContacto = void 0;
const graphMailer_1 = require("../../../services/mail/graphMailer");
const enviarCorreoContacto = async (payload, meta) => {
    await (0, graphMailer_1.sendContactMail)(payload, meta);
};
exports.enviarCorreoContacto = enviarCorreoContacto;

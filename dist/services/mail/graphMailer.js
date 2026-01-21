"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendContactMail = exports.getGraphToken = void 0;
const DEFAULT_GRAPH_SCOPE = "https://graph.microsoft.com/.default";
const DEFAULT_GRAPH_BASE_URL = "https://graph.microsoft.com/v1.0";
const getRequiredEnv = (key) => {
    const value = process.env[key];
    if (!value || value.trim().length === 0) {
        throw new Error(`Missing env: ${key}`);
    }
    return value.trim();
};
const getOptionalEnv = (key) => {
    const value = process.env[key];
    if (!value || value.trim().length === 0) {
        return undefined;
    }
    return value.trim();
};
const getRequiredEnvAny = (keys) => {
    for (const key of keys) {
        const value = process.env[key];
        if (value && value.trim().length > 0) {
            return value.trim();
        }
    }
    throw new Error(`Missing env: ${keys.join(" or ")}`);
};
const maskId = (value) => {
    if (value.length <= 8) {
        return `${value.slice(0, 2)}...`;
    }
    return `${value.slice(0, 4)}...${value.slice(-4)}`;
};
const buildLogMeta = (overrides) => {
    const tenantId = getRequiredEnv("AZURE_TENANT_ID");
    const clientId = getRequiredEnv("AZURE_CLIENT_ID");
    return {
        tenant: maskId(tenantId),
        clientId: maskId(clientId),
        ...overrides,
    };
};
const parseEmailList = (value) => {
    const rawList = Array.isArray(value) ? value : value.split(",");
    return rawList.map((item) => item.trim()).filter(Boolean);
};
const formatGraphError = (rawText, statusText) => {
    try {
        const parsed = JSON.parse(rawText);
        const message = parsed?.error?.message || parsed?.error_description || parsed?.message;
        if (typeof message === "string" && message.length > 0) {
            return message;
        }
    }
    catch {
        // ignore JSON parse errors
    }
    return rawText.trim().length > 0 ? rawText : statusText;
};
const safeJsonParse = (rawText) => {
    try {
        return JSON.parse(rawText);
    }
    catch {
        return null;
    }
};
let tokenCache = null;
const assertFetchAvailable = () => {
    if (typeof fetch !== "function") {
        throw new Error("[Azure] fetch no esta disponible. Usa Node 18+ o agrega un polyfill.");
    }
};
const getGraphToken = async () => {
    assertFetchAvailable();
    if (tokenCache && Date.now() < tokenCache.expiresAt - 60000) {
        return tokenCache.token;
    }
    const tenantId = getRequiredEnv("AZURE_TENANT_ID");
    const clientId = getRequiredEnv("AZURE_CLIENT_ID");
    const clientSecret = getRequiredEnv("AZURE_CLIENT_SECRET");
    const scope = getOptionalEnv("AZURE_GRAPH_SCOPE") ?? DEFAULT_GRAPH_SCOPE;
    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    const response = await fetch(tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            scope,
            grant_type: "client_credentials",
        }),
    });
    const rawText = await response.text();
    const data = rawText ? safeJsonParse(rawText) : null;
    if (!response.ok || !data?.access_token) {
        console.error("[Azure] Token request failed", buildLogMeta({ status: response.status }), { raw: rawText });
        const message = formatGraphError(rawText, response.statusText);
        throw new Error(`[Azure] Token error: ${message}`);
    }
    const expiresIn = typeof data.expires_in === "number" ? data.expires_in : 3600;
    tokenCache = {
        token: data.access_token,
        expiresAt: Date.now() + expiresIn * 1000,
    };
    return tokenCache.token;
};
exports.getGraphToken = getGraphToken;
const escapeHtml = (value) => value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
const buildEmailHtml = (payload, meta) => {
    const rows = [
        `<p><b>Nombre:</b> ${escapeHtml(payload.nombre)}</p>`,
        `<p><b>Email:</b> ${escapeHtml(payload.email)}</p>`,
        `<p><b>Asunto:</b> ${escapeHtml(payload.asunto)}</p>`,
    ];
    if (payload.telefono) {
        rows.push(`<p><b>Telefono:</b> ${escapeHtml(payload.telefono)}</p>`);
    }
    rows.push(`<p><b>Mensaje:</b></p><p>${escapeHtml(payload.mensaje).replace(/\n/g, "<br/>")}</p>`);
    rows.push(`<p><b>Fecha:</b> ${escapeHtml(new Date().toLocaleString("es-CL"))}</p>`);
    if (meta?.ip) {
        rows.push(`<p><b>IP:</b> ${escapeHtml(meta.ip)}</p>`);
    }
    if (meta?.userAgent) {
        rows.push(`<p><b>User-Agent:</b> ${escapeHtml(meta.userAgent)}</p>`);
    }
    return `<h3>Nuevo mensaje desde el formulario web</h3>${rows.join("")}`;
};
const sendContactMail = async (payload, meta) => {
    assertFetchAvailable();
    const sender = getRequiredEnvAny([
        "CONTACT_SENDER_EMAIL",
        "CONTACT_FROM_EMAIL",
        "AZURE_SENDER_EMAIL",
        "MAIL_FROM",
    ]);
    const to = getRequiredEnvAny(["CONTACT_TO_EMAIL", "MAIL_TO"]);
    const toList = parseEmailList(to);
    if (toList.length === 0) {
        throw new Error("[Azure] No se encontraron destinatarios.");
    }
    const graphBase = getOptionalEnv("AZURE_GRAPH_BASE_URL") ?? DEFAULT_GRAPH_BASE_URL;
    const token = await (0, exports.getGraphToken)();
    const message = {
        subject: `[BDK Contacto] ${payload.asunto}`,
        body: {
            contentType: "HTML",
            content: buildEmailHtml(payload, meta),
        },
        toRecipients: toList.map((address) => ({
            emailAddress: { address },
        })),
        replyTo: [
            {
                emailAddress: {
                    address: payload.email,
                    name: payload.nombre,
                },
            },
        ],
    };
    const response = await fetch(`${graphBase}/users/${encodeURIComponent(sender)}/sendMail`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            message,
            saveToSentItems: true,
        }),
    });
    if (!response.ok) {
        const rawText = await response.text();
        const message = formatGraphError(rawText, response.statusText);
        const requestId = response.headers.get("request-id") ??
            response.headers.get("x-ms-request-id") ??
            undefined;
        console.error("[Azure] SendMail request failed", buildLogMeta({
            status: response.status,
            from: sender,
            to: toList.join(","),
        }), { error: message, requestId });
        throw new Error(`[Azure] SendMail error: ${message}`);
    }
    console.info("[Azure] SendMail success", buildLogMeta({
        status: response.status,
        from: sender,
        to: toList.join(","),
    }));
};
exports.sendContactMail = sendContactMail;

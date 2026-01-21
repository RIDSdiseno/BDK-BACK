# BDK Back - Contacto

## Correo de Contactanos (Microsoft Graph)
1. Microsoft Entra ID -> App registrations -> New registration.
   - Nombre: BDK-Contacto-Mailer
   - Single tenant
2. Certificates & secrets -> New client secret (guardar el VALUE).
3. API permissions -> Microsoft Graph -> Application permissions -> Mail.Send.
4. Grant admin consent para el tenant.
5. Define `CONTACT_SENDER_EMAIL` como buzon real con licencia Exchange.
6. `CONTACT_TO_EMAIL` puede ser usuario o shared mailbox (solo recibe).

Si ves 403, revisa Mail.Send (Application) y Grant admin consent.

## Variables de entorno
Ejemplo (ver `.env.example`):
- `AZURE_TENANT_ID` (Directory/Tenant ID)
- `AZURE_CLIENT_ID` (Application/Client ID)
- `AZURE_CLIENT_SECRET` (Secret VALUE)
- `CONTACT_SENDER_EMAIL` (buzon real que envia)
- `CONTACT_TO_EMAIL` (destino)
- `CORS_ORIGIN` o `FRONTEND_ORIGIN`

## Endpoint contacto
`POST /api/contacto` (alias: `/api/contact`)

Ejemplo:
```bash
curl -X POST http://localhost:3001/api/contacto \
  -H "Content-Type: application/json" \
  -d "{\"nombre\":\"Juan\",\"email\":\"juan@gmail.com\",\"telefono\":\"123\",\"asunto\":\"Consulta\",\"mensaje\":\"Hola BDK, necesito...\"}"
```

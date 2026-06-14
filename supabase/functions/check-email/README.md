# Supabase Edge Function: check-email

This function checks whether a given email exists in Supabase Auth using the Service Role key.

## Environment

The function requires these environment variables:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Request

POST JSON body:

```json
{
  "email": "user@example.com"
}
```

## Response

Success:

```json
{
  "exists": true
}
```

Error:

```json
{
  "error": "message"
}
```

## Deploy

Use the Supabase CLI to deploy this function:

```bash
supabase functions deploy check-email
```

If running locally, make sure to provide the environment variables with `supabase env set` or your local development setup.


--------------------------------------------------------------------------------------------------------


Checklist de Supabase para nuevo proyecto
🔑 API Keys (Settings → API)

Copiar la Project URL → VITE_SUPABASE_URL en .env
Copiar la Anon public key → VITE_SUPABASE_ANON_KEY en .env


🔐 Authentication → Sign In / Providers

Activar Email provider
Decidir si activas o no Confirm email
Activar Google provider → clientID y Secret de Google Cloud Console


📧 Authentication → Emails → Reset Password

Cambiar {{ .RedirectTo }} por {{ .ConfirmationURL }} en el template


🌐 Authentication → URL Configuration

Site URL → tu dominio de producción
Redirect URLs → añadir:

https://tu-dominio.com/changepassword
https://tu-dominio.com/welcome
https://tu-dominio.com/auth/callback




🛡️ Authentication → Attack Protection

Activar Captcha
Pegar el Turnstile Secret Key de Cloudflare


⚡ Authentication → Rate Limits

Revisar límites de emails por hora según el volumen esperado


📮 Authentication → Notifications → SMTP

Configurar SMTP de producción (Resend recomendado, no Gmail)
Host: smtp.resend.com / Port: 465 / User: resend


📁 .env del proyecto
bashVITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxx
VITE_TURNSTILE_SITE_KEY=xxxx        # Clave pública de Cloudflare
VITE_APP_URL=https://tu-dominio.com # Para los redirectTo

☁️ Cloudflare Turnstile (dash.cloudflare.com)

Crear nuevo widget con el dominio del nuevo proyecto
Copiar Site Key → .env
Copiar Secret Key → Supabase Attack Protection


✅ Orden recomendado
1. Crear proyecto en Supabase
2. Copiar keys al .env
3. Configurar SMTP
4. Configurar Google OAuth
5. Corregir template del email
6. Añadir URLs permitidas
7. Crear widget en Cloudflare → pegar keys
8. Activar captcha en Supabase
Con esta lista en 15-20 minutos tienes el nuevo proyecto configurado. 🚀
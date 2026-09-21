# Tienda Gemelos 3D

## Variables de Resend en Vercel

Después del deploy, configurar estas variables en el proyecto:

- `RESEND_API_KEY`: la clave `re_...` de Resend.
- `RESEND_FROM_EMAIL`: `onboarding@resend.dev` para modo test.
- `ADMIN_EMAIL`: `3dgemelos@gmail.com`.

Configurar las tres en **Production**, **Preview** y **Development**, y luego hacer un nuevo deploy/redeploy.

### Modo test

Con `onboarding@resend.dev`, Resend limita los destinatarios a la cuenta de email registrada/verificada en Resend. En este proyecto, el destinatario de prueba esperado es `jirafadon@gmail.com`.

El aviso al admin usa `ADMIN_EMAIL` y puede fallar en modo test si ese destinatario no está verificado por Resend. Es esperado.

Para producción real, verificar un dominio propio en Resend y usar una dirección de envío de ese dominio.

### Emails implementados

- Bienvenida al registrarse.
- Confirmación de pedido al crear la orden.
- Aviso al admin al crear una orden.
- Recuperación de contraseña.

No se envía todavía el email de “pedido enviado”.

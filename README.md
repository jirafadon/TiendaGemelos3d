# Tienda Gemelos 3D — Proyecto completo

Tienda online de productos impresos en 3D con frontend vanilla, panel de administración y backend Node.js + Express + MongoDB.

## Estructura

```text
tienda-gemelos-3d/
├── index.html                 # Frontend de la tienda
├── admin.html                 # Panel administrativo
├── docs/
│   └── frontend-backend-integration.md
└── backend/
    ├── package.json
    ├── .env.example
    ├── .gitignore
    ├── server.js
    ├── config/db.js
    ├── models/
    ├── middleware/
    ├── utils/
    ├── controllers/
    ├── services/
    ├── routes/
    └── templates/email/
```

> Si `frontend/index.html` todavía no está en tu copia local, usá el `frontend/index.html` de la Parte 1 antes de conectar los fragmentos de `docs/frontend-backend-integration.md`.

## 1. Requisitos

- Node.js 20 LTS o superior.
- MongoDB local o MongoDB Atlas.
- Una cuenta de Google Cloud para Google Login.
- Credenciales de Mercado Pago si vas a usar Mercado Pago.
- Credenciales de PayPal si vas a usar PayPal.
- Una cuenta de Stripe si vas a usar Stripe.
- Una cuenta de Resend para emails transaccionales.
- Git instalado para publicar el proyecto.

## 2. Instalar el backend

```bash
cd backend
npm install
```

Copiá el archivo de variables:

```bash
cp .env.example .env
```

En Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Completá `.env` con tus credenciales reales. Nunca subas `.env` a GitHub.

## 3. Variables de entorno

```env
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:5500
ADMIN_URL=http://localhost:5500/admin.html
BACKEND_URL=http://localhost:4000
MONGO_URI=mongodb://127.0.0.1:27017/tiendagemelos3d
JWT_SECRET=CAMBIAR_POR_UN_SECRETO_LARGO_Y_ALEATORIO
JWT_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=TU_CLIENT_ID.apps.googleusercontent.com
MP_ACCESS_TOKEN=TU_ACCESS_TOKEN
MP_PUBLIC_KEY=TU_PUBLIC_KEY
PAYPAL_CLIENT_ID=TU_CLIENT_ID
PAYPAL_CLIENT_SECRET=TU_CLIENT_SECRET
PAYPAL_ENV=sandbox
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=Tienda Gemelos 3D <no-reply@tu-dominio.com>
ADMIN_EMAIL=admin@tu-dominio.com
```

## 4. MongoDB Atlas

1. Entrá a MongoDB Atlas.
2. Creá un cluster gratuito.
3. Creá un usuario de base de datos.
4. En Network Access agregá tu IP de desarrollo. Para producción preferí reglas restrictivas.
5. Copiá la cadena de conexión.
6. Reemplazá `MONGO_URI` en `.env`.

Ejemplo:

```env
MONGO_URI=mongodb+srv://USUARIO:CONTRASENA@cluster.mongodb.net/tiendagemelos3d?retryWrites=true&w=majority
```

## 5. Obtener Google OAuth

1. Abrí Google Cloud Console: https://console.cloud.google.com/
2. Creá o seleccioná un proyecto.
3. Configurá la pantalla de consentimiento OAuth.
4. Creá un OAuth Client ID de tipo Web application.
5. Agregá los orígenes autorizados, por ejemplo `http://localhost:5500`.
6. Agregá las URLs de origen de tu frontend de producción.
7. Copiá el Client ID a `GOOGLE_CLIENT_ID`.
8. En `frontend/index.html`, reemplazá el marcador de `client_id` del fragmento de Google Identity Services.

## 6. Obtener Mercado Pago

1. Abrí el panel de desarrolladores: https://www.mercadopago.com.ar/developers/panel
2. Creá o seleccioná una aplicación.
3. Obtené el Access Token para backend.
4. Obtené la Public Key si el frontend la necesita para una integración futura.
5. Configurá `MP_ACCESS_TOKEN` y `MP_PUBLIC_KEY`.

Webhook de desarrollo:

```text
https://TU-DOMINIO-NGROK/api/payments/webhook/mercadopago
```

## 7. Obtener PayPal

1. Abrí PayPal Developer Dashboard: https://developer.paypal.com/dashboard/
2. Creá una aplicación REST.
3. Copiá Client ID y Secret.
4. Para pruebas usá `PAYPAL_ENV=sandbox`.
5. Para producción usá `PAYPAL_ENV=live` y las credenciales de producción.

## 8. Obtener Stripe

1. Abrí Stripe Dashboard: https://dashboard.stripe.com/apikeys
2. Copiá la Secret Key.
3. Creá un endpoint de webhook para `/api/payments/webhook/stripe`.
4. Copiá el signing secret `whsec_...` a `STRIPE_WEBHOOK_SECRET`.

## 9. Obtener Resend

1. Abrí Resend: https://resend.com/api-keys
2. Creá una API key.
3. Verificá el dominio de envío en Resend para producción.
4. Configurá `RESEND_API_KEY`.
5. Configurá `RESEND_FROM_EMAIL` con un remitente permitido por Resend.
6. Configurá `ADMIN_EMAIL` para recibir avisos de nuevos pedidos.

## 10. Ejecutar en desarrollo

Desde `backend/`:

```bash
npm run dev
```

Producción local:

```bash
npm start
```

Servidor esperado:

```text
http://localhost:4000
```

Health check:

```text
http://localhost:4000/api/health
```

## 11. Cargar productos demo

```bash
npm run seed
```

El seed elimina los productos existentes e inserta 20 productos demo. No ejecutes este comando contra una base de datos de producción que contenga productos reales.

## 12. Probar el frontend local

Podés servir el directorio `frontend/` con cualquier servidor estático. Una opción rápida con Python:

```bash
cd frontend
python -m http.server 5500
```

Abrí:

```text
http://localhost:5500/index.html
```

Y el panel:

```text
http://localhost:5500/admin.html
```

El backend debe estar corriendo en el puerto 4000.

## 13. Webhooks locales con ngrok

Instalá ngrok y autenticá tu cuenta. Luego:

```bash
ngrok http 4000
```

Ngrok mostrará una URL como:

```text
https://abc123.ngrok-free.app
```

Usala como `BACKEND_URL` temporal:

```env
BACKEND_URL=https://abc123.ngrok-free.app
```

### Mercado Pago

Configurá la URL de notificaciones:

```text
https://abc123.ngrok-free.app/api/payments/webhook/mercadopago
```

### Stripe CLI

Instalá Stripe CLI y ejecutá:

```bash
stripe login
stripe listen --forward-to localhost:4000/api/payments/webhook/stripe
```

Copiá el `whsec_...` que devuelve Stripe CLI a:

```env
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

Para disparar un evento de prueba:

```bash
stripe trigger checkout.session.completed
```

### PayPal

El flujo de PayPal usa la captura autenticada del backend en `/api/payments/webhook/paypal/capture`. Para pruebas con sandbox, mantené `PAYPAL_ENV=sandbox` y usá las cuentas sandbox de PayPal Developer.

## 14. Endpoints

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/` | No | Información de la API |
| GET | `/api/health` | No | Health check |
| POST | `/api/auth/google` | No | Login con Google |
| POST | `/api/auth/register` | No | Registro |
| POST | `/api/auth/login` | No | Login local |
| GET | `/api/auth/me` | JWT | Usuario actual |
| POST | `/api/auth/logout` | No | Cerrar sesión |
| POST | `/api/auth/forgot-password` | No | Solicitar reset |
| POST | `/api/auth/reset-password/:token` | No | Cambiar contraseña |
| GET | `/api/products` | No | Catálogo filtrado |
| GET | `/api/products/:id` | No | Producto por ID |
| GET | `/api/products/slug/:slug` | No | Producto por slug |
| POST | `/api/products` | Admin | Crear producto |
| PUT | `/api/products/:id` | Admin | Editar producto |
| DELETE | `/api/products/:id` | Admin | Soft delete |
| PATCH | `/api/products/:id/toggle` | Admin | Activar/desactivar |
| GET | `/api/orders/my` | JWT | Pedidos del usuario |
| GET | `/api/orders/:id` | JWT | Detalle de pedido |
| POST | `/api/payments/checkout` | JWT | Crear pedido e iniciar pago |
| POST | `/api/payments/webhook/mercadopago` | Webhook | Actualizar pago MP |
| POST | `/api/payments/webhook/paypal/capture` | JWT | Capturar PayPal |
| POST | `/api/payments/webhook/stripe` | Webhook | Procesar evento Stripe |
| GET | `/api/admin/dashboard` | Admin | KPIs del panel |
| GET | `/api/admin/dashboard/sales-chart` | Admin | Ventas últimos 7 días |
| GET | `/api/admin/dashboard/top-products` | Admin | Top 5 productos |
| GET | `/api/admin/dashboard/recent-orders` | Admin | Últimos pedidos |
| GET | `/api/admin/dashboard/recent-users` | Admin | Últimos usuarios |
| GET | `/api/admin/products` | Admin | Listar productos |
| POST | `/api/admin/products` | Admin | Crear producto |
| PUT | `/api/admin/products/:id` | Admin | Editar producto |
| DELETE | `/api/admin/products/:id` | Admin | Soft delete |
| PATCH | `/api/admin/products/:id/toggle` | Admin | Activar/desactivar |
| GET | `/api/admin/orders` | Admin | Listar pedidos |
| GET | `/api/admin/orders/export` | Admin | Exportar pedidos |
| GET | `/api/admin/orders/:id` | Admin | Detalle de pedido |
| PATCH | `/api/admin/orders/:id/status` | Admin | Cambiar estado |
| POST | `/api/admin/orders/:id/resend-email` | Admin | Reenviar confirmación |
| GET | `/api/admin/users` | Admin | Listar usuarios |
| PATCH | `/api/admin/users/:id` | Admin | Cambiar usuario |
| DELETE | `/api/admin/users/:id` | Admin | Eliminar usuario |
| GET | `/api/admin/coupons` | Admin | Listar cupones |
| POST | `/api/admin/coupons` | Admin | Crear cupón |
| PUT | `/api/admin/coupons/:id` | Admin | Editar cupón |
| DELETE | `/api/admin/coupons/:id` | Admin | Eliminar cupón |
| GET | `/api/admin/settings` | Admin | Obtener configuración |
| PUT | `/api/admin/settings` | Admin | Guardar configuración |
| POST | `/api/emails/newsletter` | No | Suscripción al newsletter |

## 15. Seguridad para producción

- Usar HTTPS en frontend, backend y webhooks.
- Usar `secure` + `httpOnly` para cookies de producción.
- No guardar secretos reales en GitHub.
- Rotar `JWT_SECRET`, API keys y secretos de webhooks si se exponen.
- Validar siempre la firma de los webhooks de Stripe.
- Mantener CORS con una whitelist explícita.
- Mantener rate limiting activo.
- Limitar tamaño de requests.
- Usar contraseñas de MongoDB fuertes y mínimo privilegio.
- Configurar backups automáticos de MongoDB Atlas.
- No ejecutar `npm run seed` contra producción.
- Revisar logs y alertas del proveedor de hosting.

## 16. Deploy recomendado

### Backend

Opciones compatibles con Node.js:

- Railway
- Render
- Fly.io

Configurá las variables de entorno desde el panel del proveedor y ejecutá:

```bash
npm install
npm start
```

### Frontend

Opciones para HTML/CSS/JS estático:

- Vercel
- Netlify
- Cloudflare Pages

Después actualizá:

```env
FRONTEND_URL=https://TU-FRONTEND.com
ADMIN_URL=https://TU-FRONTEND.com/admin.html
BACKEND_URL=https://TU-BACKEND.com
```

Y agregá esos orígenes en Google OAuth y demás servicios que tengan whitelist.

### Base de datos

MongoDB Atlas ofrece un tier gratuito que sirve para comenzar. Para producción real revisá límites, backups, región y escalado antes de depender del tier gratuito.

### Emails

Resend ofrece un nivel gratuito sujeto a sus límites y condiciones vigentes. Verificá los límites actuales en su panel antes de publicar el negocio.

## 17. Conexión frontend ↔ backend

Los fragmentos exactos están en:

```text
docs/frontend-backend-integration.md
```

Incluyen:

- Google Identity Services.
- `apiFetch()` con Bearer token y logout automático ante 401.
- `processPayment()` para Mercado Pago, PayPal y Stripe.
- fallback demo cuando el backend no responde.
- verificación de rol admin mediante `/api/auth/me`.
- exportación CSV con `Blob` y `URL.createObjectURL`.

## 18. Flujo de pagos

1. El frontend envía carrito, cliente, método y cupón a `/api/payments/checkout`.
2. El backend valida productos y stock.
3. Se crea la orden.
4. Se crea la preferencia/sesión de Mercado Pago, PayPal o Stripe.
5. El frontend redirige al checkout del proveedor.
6. El proveedor notifica el resultado mediante webhook o captura.
7. El backend actualiza `payStatus` y `externalId`.
8. Resend envía la confirmación al cliente y el aviso al administrador.

## 19. Roadmap futuro

- Analytics avanzado y métricas de conversión.
- Multi-idioma.
- PWA con instalación offline.
- Aplicación móvil.
- Seguimiento de envíos integrado con operadores logísticos.
- Recuperación de carrito abandonado.
- Automatizaciones de marketing.
- Sistema de reseñas verificadas.
- Variantes avanzadas con inventario por combinación.
- Gestión de archivos STL y personalizaciones para productos a medida.


## 🧪 Tests

Los tests automatizados usan Jest, Supertest y MongoDB Memory Server.

Desde `backend/`:

```bash
npm test
npm run test:watch
npm run test:coverage
```

Los tests cubren autenticación, productos, pedidos y checkout. La suite utiliza una instancia MongoDB en memoria y limpia las colecciones después de cada prueba.

## 🐳 Docker

Requisitos:

- Docker Desktop o Docker Engine con Docker Compose.
- `backend/.env` configurado.
- `backend/package-lock.json` generado a partir de `package.json` antes de construir la imagen, porque el Dockerfile utiliza `npm ci`.
- El `frontend/index.html` de la Parte 1 debe estar en la raíz del proyecto para construir la imagen frontend.

Desarrollo:

```bash
docker-compose up --build
```

Producción:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

URLs locales:

```text
Frontend: http://localhost:8080
API:      http://localhost:4000
Health:   http://localhost:4000/api/health
```

Detener los servicios:

```bash
docker-compose down
```

Detener producción y eliminar volúmenes:

```bash
docker-compose -f docker-compose.prod.yml down -v
```

## 🚀 CI/CD

GitHub Actions está dividido en tres workflows:

- `.github/workflows/ci.yml`: ejecuta `npm ci`, tests y cobertura en push/PR contra `main` y `develop`.
- `.github/workflows/deploy-backend.yml`: vuelve a ejecutar tests y, si pasan, despliega el backend con Railway.
- `.github/workflows/deploy-frontend.yml`: despliega el frontend con Vercel.

Secrets recomendados en GitHub:

| Secret | Uso | Obligatorio |
|---|---|---:|
| `RAILWAY_TOKEN` | Autenticación del deploy del backend en Railway | Sí para Railway |
| `VERCEL_TOKEN` | Autenticación del deploy del frontend en Vercel | Sí para Vercel |
| `CODECOV_TOKEN` | Subida de cobertura a Codecov | Opcional |

En GitHub: `Settings → Secrets and variables → Actions → New repository secret`.

El workflow de Railway incluye una alternativa comentada para Render mediante Deploy Hook. El workflow de Vercel incluye una alternativa comentada para Netlify.

## 📱 PWA

La tienda incluye:

- `frontend/manifest.json` para instalación como aplicación.
- `frontend/sw.js` como Service Worker.
- `frontend/offline.html` como fallback sin conexión.
- `frontend/index-pwa-snippet.html` con el bloque exacto que debe incorporarse al `frontend/index.html` de la Parte 1.

Antes de probar la instalación, el sitio debe servirse por HTTPS en producción o por `localhost` durante desarrollo. Un archivo abierto directamente con `file://` no permite registrar correctamente el Service Worker.

### Android

1. Abrí la tienda desde Chrome.
2. Esperá a que se registre el Service Worker.
3. Abrí el menú del navegador.
4. Elegí `Instalar aplicación` o `Agregar a pantalla principal`, según la versión.

### iPhone/iPad

1. Abrí la tienda con Safari.
2. Tocá `Compartir`.
3. Elegí `Agregar a pantalla de inicio`.
4. Confirmá el nombre de la aplicación.

### Desktop

1. Abrí la tienda con Chrome o Edge.
2. Buscá el icono de instalación en la barra de direcciones o el menú del navegador.
3. Elegí `Instalar Tienda Gemelos 3D`.

### Integración en `frontend/index.html`

Antes de `</body>`:

```html
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#00e0b8">
<script>
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => console.log('Service Worker registrado:', registration.scope))
        .catch(error => console.error('Error registrando Service Worker:', error));
    });
  }
</script>
```

## 14. Estructura añadida en la Parte 7

```text
tienda-gemelos-3d/
├── .dockerignore
├── Dockerfile
├── Dockerfile.frontend
├── docker-compose.yml
├── docker-compose.prod.yml
├── nginx.conf
├── .github/
│   ├── dependabot.yml
│   └── workflows/
│       ├── ci.yml
│       ├── deploy-backend.yml
│       └── deploy-frontend.yml
└── frontend/
    ├── manifest.json
    ├── sw.js
    ├── offline.html
    └── index-pwa-snippet.html

backend/
├── jest.config.js
└── tests/
    ├── setup.js
    ├── helpers.js
    ├── auth.test.js
    ├── products.test.js
    ├── orders.test.js
    └── payments.test.js
```

> Importante: el `frontend/index.html` de la Parte 1 no estaba presente en el filesystem acumulado al comenzar la Parte 7. No se fabricó una copia distinta. Para que el Dockerfile frontend y la PWA queden operativos, hay que reincorporar ese archivo en la raíz y pegar el snippet PWA.

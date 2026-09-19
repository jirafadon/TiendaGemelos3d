# Contribuir a PrintLab 3D

Gracias por querer mejorar PrintLab 3D.

## Reportar bugs

1. Buscá issues existentes para evitar duplicados.
2. Abrí un issue con pasos reproducibles.
3. Indicá navegador, sistema operativo, versión de Node.js y logs relevantes sin credenciales.
4. Explicá el resultado esperado y el resultado observado.

## Proponer features

1. Abrí una feature request antes de implementar cambios grandes.
2. Explicá el problema que resuelve.
3. Describí el comportamiento esperado.
4. Incluí criterios de aceptación y posibles impactos.

## Convenciones de código

- JavaScript moderno con ES Modules.
- Indentación de 2 espacios.
- Punto y coma obligatorio.
- Comillas simples en JavaScript.
- Prettier con la configuración de `.prettierrc`.
- ESLint con `.eslintrc.json`.
- Variables, funciones y estructura de código en inglés.
- Textos visibles al usuario y comentarios de negocio en español.
- No incluir credenciales ni secretos en el repositorio.

## Tests antes de un PR

Desde `print3d-backend/`:

```bash
npm install
npm test
npm run test:coverage
```

Antes de abrir el PR también verificá que Docker construya correctamente:

```bash
docker compose build
```

## Pull requests

- Una finalidad clara por PR.
- Descripción de cambios.
- Tests ejecutados.
- Capturas cuando cambie la interfaz.
- Sin cambios generados innecesarios.

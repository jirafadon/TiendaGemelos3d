export function notFound(req, res) {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`
  });
}

export function errorHandler(error, req, res, next) {
  console.error(error);

  let statusCode = error.statusCode || error.status || 500;
  let message = error.message || 'Error interno del servidor.';

  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(error.errors).map(item => item.message).join(' ');
  }

  if (error.name === 'CastError') {
    statusCode = 400;
    message = `Valor inválido para ${error.path}.`;
  }

  if (error.code === 11000) {
    statusCode = 409;
    const fields = Object.keys(error.keyPattern || error.keyValue || {});
    message = `Ya existe un registro con ${fields.join(', ')}.`;
  }

  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token inválido.';
  }

  if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'La sesión expiró.';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' ? { stack: error.stack } : {})
  });
}

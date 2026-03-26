/**
 * PUBLIC_INTERFACE
 * Express middleware for 404 routes.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {void}
 */
function notFoundHandler(req, res) {
  res.status(404).json({ error: "Not found" });
}

/**
 * PUBLIC_INTERFACE
 * Express error handler returning JSON error shapes.
 * @param {any} err
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 * @returns {void}
 */
function errorHandler(err, req, res, next) {
  // If CORS origin check fails, cors throws an error; return a clear message.
  const status = Number(err.status || err.statusCode || 500);

  // eslint-disable-next-line no-console
  console.error("[error]", err);

  res.status(status).json({
    error: err.message || "Internal server error",
    details: status === 500 ? "Unexpected error" : undefined
  });
}

module.exports = { notFoundHandler, errorHandler };

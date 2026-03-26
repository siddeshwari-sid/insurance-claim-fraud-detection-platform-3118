"use strict";

/**
 * CORS middleware for the demo/preview environment.
 *
 * The hosted preview runs the frontend and backend on different origins,
 * so browser requests will be blocked unless the backend responds with
 * the appropriate CORS headers.
 *
 * For simplicity (and because this is a demo app), we default to allowing
 * all origins. You can restrict this by setting ALLOWED_ORIGINS to a
 * comma-separated list of allowed origins.
 */

// PUBLIC_INTERFACE
function corsMiddleware(req, res, next) {
  /** Express middleware that adds CORS headers and handles OPTIONS preflight. */
  const allowed = process.env.ALLOWED_ORIGINS;
  const origin = req.headers.origin;

  let allowOrigin = "*";
  if (allowed) {
    const list = allowed
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (origin && list.includes(origin)) {
      allowOrigin = origin;
      // Needed so caches don't mix responses between origins
      res.setHeader("Vary", "Origin");
    } else {
      // If origin isn't in allow-list, do not reflect it; keep "*" (safe for demo)
      allowOrigin = "*";
    }
  }

  res.setHeader("Access-Control-Allow-Origin", allowOrigin);
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    req.headers["access-control-request-headers"] || "Content-Type, Authorization"
  );
  res.setHeader("Access-Control-Allow-Credentials", "false");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    return res.end();
  }

  next();
}

module.exports = { corsMiddleware };

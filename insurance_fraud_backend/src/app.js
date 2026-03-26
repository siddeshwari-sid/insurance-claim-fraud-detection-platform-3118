const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const { createSwaggerSpec, swaggerUi, swaggerUiOptions } = require("./swagger");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandlers");
const { requestLogger } = require("./middleware/requestLogger");
const claimsRouter = require("./routes/claims");
const fraudRouter = require("./routes/fraud");
const uploadRouter = require("./routes/upload");
const explanationRouter = require("./routes/explanation");

/**
 * PUBLIC_INTERFACE
 * Builds and configures the Express application with middleware, routes, and API docs.
 * @returns {import("express").Express} Configured Express app instance.
 */
function createApp() {
  const app = express();

  // Trust proxy when deployed behind reverse proxies (configured by env in this workspace).
  const trustProxy = (process.env.TRUST_PROXY || "").toLowerCase() === "true";
  if (trustProxy) {
    app.set("trust proxy", 1);
  }

  app.use(helmet());
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.use(requestLogger);

  const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const allowedHeaders = (process.env.ALLOWED_HEADERS || "Content-Type,Authorization")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const allowedMethods = (process.env.ALLOWED_METHODS || "GET,POST,PUT,DELETE,PATCH,OPTIONS")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const corsMaxAge = Number(process.env.CORS_MAX_AGE || 3600);

  // In hosted previews, frontend and backend are on different origins.
  // If `credentials: true`, browsers require a non-wildcard ACAO header and may block requests.
  // Default to credentials=false (safer/easier for demo). You can enable it explicitly via env.
  const corsCredentials =
    (process.env.CORS_CREDENTIALS || "").toLowerCase() === "true";

  app.use(
    cors({
      origin: (origin, cb) => {
        // Allow server-to-server and same-origin requests with no Origin header
        if (!origin) return cb(null, true);

        // If no explicit origins configured, allow all (developer-friendly).
        // When credentials are enabled, we must reflect the requesting origin.
        if (allowedOrigins.length === 0) {
          return cb(null, corsCredentials ? origin : true);
        }

        if (allowedOrigins.includes(origin)) return cb(null, origin);
        return cb(new Error(`CORS: Origin not allowed: ${origin}`));
      },
      methods: allowedMethods,
      allowedHeaders,
      credentials: corsCredentials,
      maxAge: Number.isFinite(corsMaxAge) ? corsMaxAge : 3600
    })
  );

  // Health check
  app.get("/health", (req, res) => {
    res.json({
      ok: true,
      service: "insurance_fraud_backend",
      time: new Date().toISOString()
    });
  });

  // Swagger/OpenAPI
  const spec = createSwaggerSpec();
  app.get("/openapi.json", (req, res) => res.json(spec));
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(spec, swaggerUiOptions));

  // API routes
  app.use("/claims", claimsRouter);
  app.use("/", uploadRouter);
  app.use("/", explanationRouter);
  app.use("/", fraudRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };

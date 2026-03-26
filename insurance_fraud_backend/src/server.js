require("dotenv").config();

const { createApp } = require("./app");

/**
 * PUBLIC_INTERFACE
 * Express server entrypoint. Starts the HTTP server on configured host/port.
 * Reads configuration from environment variables (PORT, HOST).
 *
 * @returns {void}
 */
function startServer() {
  const app = createApp();

  const port = Number(process.env.PORT || 3001);
  const host = process.env.HOST || "0.0.0.0";

  app.listen(port, host, () => {
    // eslint-disable-next-line no-console
    console.log(
      `[insurance_fraud_backend] listening on http://${host}:${port} (docs: /docs, openapi: /openapi.json)`
    );
  });
}

startServer();

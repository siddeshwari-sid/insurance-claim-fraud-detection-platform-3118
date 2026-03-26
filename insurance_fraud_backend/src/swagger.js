const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const openapiTags = [
  { name: "Health", description: "Service health endpoints" },
  { name: "Claims", description: "Claims CRUD and claim retrieval" },
  { name: "Upload", description: "CSV upload and ingestion" },
  { name: "Fraud", description: "Fraud scoring and fraud signals dashboard" },
  { name: "Explanations", description: "Per-claim explanation generation" }
];

/**
 * PUBLIC_INTERFACE
 * Creates the OpenAPI spec used by Swagger UI and /openapi.json.
 * @returns {object} OpenAPI JSON specification.
 */
function createSwaggerSpec() {
  const port = process.env.PORT || 3001;
  const backendUrl = process.env.BACKEND_URL || `http://localhost:${port}`;

  return swaggerJSDoc({
    definition: {
      openapi: "3.0.3",
      info: {
        title: "Insurance Claim Fraud Detection API",
        version: "1.0.0",
        description:
          "Express backend for insurance claim fraud detection: claims CRUD, CSV ingestion, fraud scoring signals, and explanation endpoint."
      },
      servers: [{ url: backendUrl }],
      tags: openapiTags,
      components: {
        schemas: {
          Claim: {
            type: "object",
            properties: {
              id: { type: "string", description: "Unique claim identifier" },
              claimant_name: { type: "string" },
              claim_amount: { type: "number" },
              claim_type: { type: "string" },
              incident_date: { type: "string", description: "ISO date string" },
              submission_date: { type: "string", description: "ISO date string" },
              status: { type: "string", description: "Claim status (e.g., Open, In Review, Denied)" },
              fraud_score: { type: "number", description: "0-100 risk score" },
              signals: {
                type: "array",
                items: { type: "string" },
                description: "Human-readable fraud signals for this claim"
              },
              raw: { type: "object", additionalProperties: true, description: "Original raw data payload" }
            },
            required: ["id", "claim_amount", "status", "fraud_score", "signals"]
          },
          CreateClaimRequest: {
            type: "object",
            properties: {
              claimant_name: { type: "string" },
              claim_amount: { type: "number" },
              claim_type: { type: "string" },
              incident_date: { type: "string" },
              submission_date: { type: "string" },
              status: { type: "string" },
              raw: { type: "object", additionalProperties: true }
            },
            required: ["claim_amount"]
          },
          UpdateClaimRequest: {
            type: "object",
            properties: {
              claimant_name: { type: "string" },
              claim_amount: { type: "number" },
              claim_type: { type: "string" },
              incident_date: { type: "string" },
              submission_date: { type: "string" },
              status: { type: "string" },
              raw: { type: "object", additionalProperties: true }
            }
          },
          FraudSignalsResponse: {
            type: "object",
            properties: {
              total_claims: { type: "number" },
              high_risk_count: { type: "number" },
              by_signal: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    signal: { type: "string" },
                    count: { type: "number" }
                  },
                  required: ["signal", "count"]
                }
              }
            },
            required: ["total_claims", "high_risk_count", "by_signal"]
          },
          ExplanationResponse: {
            type: "object",
            properties: {
              claim_id: { type: "string" },
              fraud_score: { type: "number" },
              explanation: { type: "string" },
              signals: { type: "array", items: { type: "string" } }
            },
            required: ["claim_id", "fraud_score", "explanation", "signals"]
          },
          ErrorResponse: {
            type: "object",
            properties: {
              error: { type: "string" },
              details: { type: "string" }
            },
            required: ["error"]
          }
        }
      }
    },
    apis: ["./src/routes/*.js", "./src/app.js"]
  });
}

const swaggerUiOptions = {
  explorer: true
};

module.exports = { createSwaggerSpec, swaggerUi, swaggerUiOptions };

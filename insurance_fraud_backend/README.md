# Insurance Fraud Backend (Express)

Runs an Express server on **port 3001** providing:

- Claims CRUD: `GET/POST /claims`, `GET/PUT/DELETE /claims/:id`
- CSV ingestion: `POST /upload_csv` (multipart file upload)
- Fraud signals: `GET /fraud_signals`
- Explanation: `GET /explanation/:claim_id`
- OpenAPI: `GET /openapi.json`
- Swagger UI: `GET /docs`

## Run

```bash
npm install
npm run dev
# or
npm start
```

Environment variables are loaded from `.env` (already present in this container). Key ones used:
- `PORT` (default 3001)
- `HOST` (default 0.0.0.0)
- `ALLOWED_ORIGINS` (comma-separated list for CORS)
"""

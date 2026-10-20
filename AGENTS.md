# vandelay-services

Serves the five Vandelay Industries APIs defined in `vandelay-openapi/` (Customers, Policies, Claims, Payments, Vendors) from one Bun + Hono container, backed by a seeded Postgres database, for Postman demos and classroom labs.

- The OpenAPI specs in `vandelay-openapi/` are the contract. Change the implementation to match them; edit a spec only deliberately (changes so far are listed in README.md under "Changes from the original specs"), then run `bun test`, which also checks that the specs' examples match the live data.
- Request bodies are validated against the specs at runtime (`src/lib/openapi.ts`); tests validate every response in strict mode.
- Seed data is deterministic (`src/seed/generate.ts`); after changing it, run `bun run seed:sql` and the test suite.
- API tokens come only from environment variables (`API_TOKEN_*`); never write token values into the repo. See README.md, Authentication.
- Run tests with the `API_TOKEN_*` variables and `ADMIN_TOKEN` exported (see README.md).
- Deploy to AWS (App Runner + RDS) with `deploy/aws/deploy.sh`; remove it with `deploy/aws/teardown.sh` (see README.md).

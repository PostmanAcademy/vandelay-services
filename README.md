# vandelay-services — Vandelay Industries API Services

The five Vandelay Industries insurance APIs defined in [`vandelay-openapi/`](vandelay-openapi/), served from one
Bun + Hono container and backed by Postgres. Built for demos and classroom labs showing how the Postman
Platform tests APIs and how the Postman AI stack supports agentic API work. In the Vandelay agentic architecture
these are the **Vandelay API Services** (Claims, Customer, Vendors, Payments, Policy) that sit behind the gateway.

| API | Base path | Spec |
| --- | --- | --- |
| Customer API | `/customers/v1` | `vandelay-openapi/customer-api.yaml` |
| Policy API | `/policies/v1` | `vandelay-openapi/policy-api.yaml` |
| Claims API | `/claims/v1` | `vandelay-openapi/claims-api.yaml` |
| Payments API | `/payments/v1` | `vandelay-openapi/payments-api.yaml` |
| Vendors API | `/vendors/v1` | `vandelay-openapi/vendors-api.yaml` |

In each spec the `servers` entries are host-only and every path carries its own prefix (for example
`/claims/v1/claims`). That way one host-only `baseUrl` serves all five APIs: a Postman collection generated from
a spec produces requests such as `{{baseUrl}}/claims/v1/claims`, and the Prod and Test environments only need
`baseUrl` set to the deployment's host (e.g. `https://<host>`). Each spec is also served at
`<base path>/openapi.yaml`, and `GET /` lists the APIs.

**The specs are the contract.** Request bodies are validated against them at runtime, and the test
suite validates every response against them in strict mode (undeclared properties fail).

## Authentication

Every API requires `Authorization: Bearer <token>`. There are four personas. Their identities and
scopes are defined in `src/lib/http.ts`, but **the token values are never stored in this repo or the
image**: each comes from an environment variable (an AWS Secrets Manager secret when deployed), and the server
refuses to start if none is set. Ask the project owner for the tokens for the environment you are using.

| Environment variable | Acts as | Scopes | Useful for showing |
| --- | --- | --- | --- |
| `API_TOKEN_AGENT` | `agt_claims_assistant` (AI agent) | none | Masked date of birth, 403 on payments: agent guardrails |
| `API_TOKEN_ADJUSTER` | `adj_220` Priya Raman | `customers:pii:read`, `payments:write` | Day-to-day claim handling |
| `API_TOKEN_SUPERVISOR` | `adj_105` Denise Okafor | + `customers:delete`, `payments:approve` | Approving large payments |
| `API_TOKEN_CUSTOMER` | `cus_01HX9K` Marisol Vega | none | Customer notes; internal notes are hidden |

Tokens must be at least 24 characters (use `openssl rand -hex 20` with a recognizable prefix, such as
`vdl_<env>_<persona>_`), and Prod and Test should use different values. Never commit them: keep local
values in your shell, a git-ignored `.env`, or your secrets manager, and rotate by updating the secret
and redeploying.

`customers:delete` and `payments:write` are not named in the specs. They guard the operations
whose specs document a `403` response.

## The data

On first start the server creates the schema (`db/schema.sql`) and seeds a deterministic book of
business as of **2026-10-19**, so Prod and Test begin identical. `db/seed.sql` is the same data as
readable SQL (`bun run seed:sql` regenerates it).

Vandelay Industries is a Southeast regional carrier headquartered in Charlotte. All addresses, loss
locations, and vendors are in its eight markets: **Charlotte and Asheville, NC; Greenville and
Charleston, SC; Jacksonville, FL; and Knoxville, Chattanooga, and Memphis, TN.** Phone numbers use
local area codes, time zones are Eastern, and police reports come from local agencies (CMPD, JSO,
MPD, …) or the state patrol on interstates.

- **71 customers** across the eight markets, in households with spouses, teen drivers, and employees.
  Statuses are active, inactive (moved, or did not renew), and suspended (fraud).
- **118 vehicles** with structurally valid VINs (real manufacturer codes, model-year codes, check digits)
  and NC/SC/FL/TN plate formats.
- **156 policy terms**: renewal chains, plus lapsed (non-payment), cancelled, expired, and quoted terms.
  Products are personal auto, motorcycle, classic car (agreed value), and commercial auto, each with
  realistic coverage sets, limits, and deductibles.
- **57 vendors**: every market has repair, tow, rental, glass, and appraisal partners with geocoded
  service areas. Most are in-network, plus some that are out-of-network, suspended, pending
  verification, or terminated.
- **48 claims** in every lifecycle state, simulated end to end. Coverage verification, towing, adjuster
  review, appraisals, repairs, rentals, approval, vendor and customer payments, approvals over the
  threshold, refunds (including a duplicate payment refunded in full), settlement, and closure all
  happen in order. Each claim has its notes and a timeline audit trail.

The records the spec examples use exist and agree with each other across APIs: `cus_01HX9K`,
`veh_7731`, `pol_AUT-882145`, `drv_301`, `clm_2026-000417`, `note_001`, `asg_5521`, `wo_9001`,
`ven_4417`, `ven_4502`, `pay_90311`, `pm_3321`, `pm_8802`, and `ref_2001`.

Marisol Vega lives at 129 W Trade St in Charlotte, her claim's loss was at 100 N Tryon St (police report
`CMPD-26-114382`), her Accord has NC plates, and Bayview Collision is at 1215 S Tryon St. She keeps her mobile
number `+14155550142`, the spec's phone-search example. `tests/examples.test.ts` fails if any spec example drifts
from this data.

### Business rules (beyond schema validation)

- **Claims:** the policy must belong to the customer and be in force on the loss date, the vehicle
  must be on the policy, and the coverage for the loss type must exist. This uses the same check as
  `POST /policies/{id}/coverage-verifications`. Status moves
  `draft → submitted → under_review → approved | denied`, with an adjuster required for review and an
  estimate required for approval. Cancelling a claim cancels its open vendor work and in-flight payments.
- **Approved amount** = estimate − deductible. Payments can't exceed what remains. When the claim is
  fully paid it moves to `settled`.
- **Payments:** an `Idempotency-Key` is required. Customer payments over $10,000 and vendor payments
  over $25,000 wait in `pending_approval`. The approver needs `payments:approve` and must not be the
  creator. A vendor invoice number can be paid only once. Processing payments and refunds complete
  after `PAYMENT_SETTLEMENT_SECONDS` (a simulated bank).
- **Vendors:** an assignment (Claims API) and a work order (Vendors API) are the same engagement. The
  vendor must be active and serve the loss location's postal code; Claims assignments also require
  in-network. Work orders move `issued → accepted → in_progress → completed`.

## Run locally

```bash
bun install
docker run -d --name vandelay-pg -e POSTGRES_PASSWORD=postgres -p 55432:5432 postgres:17-alpine
export API_TOKEN_AGENT=... API_TOKEN_ADJUSTER=... API_TOKEN_SUPERVISOR=... API_TOKEN_CUSTOMER=...   # see Authentication
POSTGRES_PORT=55432 ADMIN_TOKEN=<local admin token> bun run dev   # http://localhost:8080
```

Or run the container image (the database is created and seeded on first start):

```bash
docker build -t vandelay-services .
docker run --rm -p 8080:8080 -e POSTGRES_HOST=host.docker.internal -e POSTGRES_PORT=55432 -e POSTGRES_PASSWORD=postgres \
  -e API_TOKEN_AGENT -e API_TOKEN_ADJUSTER -e API_TOKEN_SUPERVISOR -e API_TOKEN_CUSTOMER vandelay-services
```

## Test

```bash
# with the four API_TOKEN_* variables and ADMIN_TOKEN (matching the server) exported:
bun test                                      # against http://localhost:8080
BASE_URL=https://<test-host> bun test         # against a deployed Test environment
```

The suite resets the database through `POST /_admin/reset`, then:

- **`tests/contract.test.ts`** calls every operation in all five specs, success and documented error
  paths, and runs end-to-end flows that cross APIs (claim intake → review → approval → payment →
  bank settlement → claim settled).
- **`tests/examples.test.ts`** checks the specs' own examples: each validates against its schema, every ID it names
  exists, every address is in the eight markets, and stable GET examples match what the live API returns.
- **`tests/integrity.test.ts`** walks the whole book through the public APIs and checks cross-API
  invariants. Examples: claims reference real customers, policies, and insured vehicles; losses fall
  within the policy term; deductibles match the coverage; assignments mirror work orders; payments stay
  within approved amounts.

Every status code the server returns is documented in the specs, and the suite fails on any that isn't.

**Changes from the original specs** (the only edits made to them, so the implementation and the contract agree):
- Added `400` (the specs' existing `BadRequest` response) to `cancelClaim`, `cancelPayment` and `approvePayment`.
- `servers` are host-only and every path is prefixed with its API's base path (`/customers/v1/customers`, ...), so
  generated Postman collections resolve correctly against a single host-only `baseUrl`. The URLs the API serves
  did not change.
- Examples moved from San Francisco to the Charlotte/Southeast data set, and corrected where they disagreed with the
  seed (full policy coverage list, vendor search results, `updatedAt` on the `listCustomers` example, claim and
  assignment statuses).
- Documented behavior that was implied but never written down: the `customers:delete` and `payments:write` scopes, the
  approval thresholds, automatic settlement, claim status rules, rate-limit and idempotency headers.
- `bearerAuth` now describes the opaque (non-JWT) tokens in use and the four personas and their scopes.

## Deploy to AWS (Prod and Test)

`deploy/aws/deploy.sh` stands up two public HTTPS services, `vandelay-prod` and `vandelay-test`, on AWS App Runner,
backed by one private RDS Postgres instance. It is idempotent: re-run it to roll out a new image or rotate tokens.

**Prerequisites:** AWS CLI v2 signed in to the target account (`aws sts get-caller-identity` works), Docker with
`buildx`, `python3`, `openssl`, and a default VPC with at least two subnets in the region.

**1. Create a tokens file** somewhere outside this repo (or in your secrets manager). It has one `# PROD` and one
`# TEST` section, and `ADMIN_TOKEN` is Test only:

```
# PROD
API_TOKEN_AGENT=vdl_prod_agent_<random>
API_TOKEN_ADJUSTER=vdl_prod_adjuster_<random>
API_TOKEN_SUPERVISOR=vdl_prod_supervisor_<random>
API_TOKEN_CUSTOMER=vdl_prod_customer_<random>

# TEST
API_TOKEN_AGENT=vdl_test_agent_<random>
...
ADMIN_TOKEN=<random>
```

Generate each value with `openssl rand -hex 20` (tokens must be at least 24 characters; use different values for
Prod and Test).

**2. Deploy:**

```bash
TOKENS_FILE=/path/to/vandelay-api-tokens.txt AWS_PROFILE=<profile> ./deploy/aws/deploy.sh
```

The first run takes 20-25 minutes, mostly creating the database and the first service rollout. It prints the Prod and Test URLs at the end.

**What it creates** (all tagged `Project=vandelay-demo`):

- **Secrets Manager:** the tokens and a generated database password. Nothing secret is in the image or the service config.
- **ECR:** a private repository; the image is built for `linux/amd64` and tagged with a timestamp.
- **RDS:** one private `db.t4g.micro` Postgres instance, encrypted, with separate `vandelay_prod` and `vandelay_test`
  databases. The app creates its own database on first start (`POSTGRES_CREATE_DB`) and seeds it.
- **App Runner:** two services (0.5 vCPU / 1 GB, at most 3 instances each) reaching the database through a VPC connector.
- **WAF:** a web ACL that blocks any client IP above 1,200 requests per minute (429), attached to both services.
- **IAM and security groups:** an ECR access role, an instance role that can read only `vandelay/*` secrets, and a
  security group that lets only App Runner reach Postgres.

The services are public on the internet. The bearer tokens are the access control, each token is limited to 600
requests per minute by the app, and the WAF rule limits floods. Prod has no reset endpoint; Test has
`POST /_admin/reset` (header `X-Admin-Token`) to restore the seed data between labs. Rough cost is $30-40 a month.

**3. Verify:**

```bash
curl https://<service-url>/health
BASE_URL=https://<test-url> bun test     # with the Test tokens and ADMIN_TOKEN exported; resets the Test database
```

Options (environment variables for `deploy.sh`): `AWS_REGION` (default `us-east-1`), `IMAGE_TAG`, `APP_CPU` (`512`),
`APP_MEMORY` (`1024`), `MAX_INSTANCES` (`3`), `WAF_IP_LIMIT` (`1200`), `PG_VERSION` (`17`).

**Remove everything** (services, database and its data, secrets, roles, image repository):

```bash
AWS_PROFILE=<profile> ./deploy/aws/teardown.sh --yes
```

### Runtime configuration

The deploy script sets these on each service; set them yourself when running the container elsewhere.

| Variable | Default | Purpose |
| --- | --- | --- |
| `API_TOKEN_AGENT`, `API_TOKEN_ADJUSTER`, `API_TOKEN_SUPERVISOR`, `API_TOKEN_CUSTOMER` | required (at least one) | Bearer token per persona; see Authentication |
| `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | `localhost`, `5432`, `postgres`, `postgres`, `postgres` | Database connection |
| `POSTGRES_SSL` | unset | `true` to encrypt the database connection (required by RDS) |
| `POSTGRES_CREATE_DB` | unset | `true` to create `POSTGRES_DB` on first start if it does not exist |
| `PORT` | `8080` | Listen port |
| `APP_ENV` | `development` | Label reported by `/health` and `/` |
| `ADMIN_TOKEN` | unset (reset disabled) | Enables `POST /_admin/reset` with `X-Admin-Token`; leave unset in Prod |
| `PAYMENT_SETTLEMENT_SECONDS` | `5` | Delay before processing payments and refunds complete |
| `RATE_LIMIT_PER_MINUTE` | `600` | Per-token limit (429 + `Retry-After`) |

The image must stay runnable as a non-root user, so every file in it is world-readable (the `Dockerfile` uses
`COPY --chmod=a+rX`). Test image changes with `docker run --user 1000:1000 --read-only`.

## Project layout

```
Dockerfile             Container image (Bun, non-root safe)
deploy/aws/            deploy.sh / teardown.sh: App Runner + RDS + WAF
vandelay-openapi/      The five OpenAPI specs (the contract)
src/server.ts          Hono app: mounts the five APIs at their spec base paths, health, admin reset
src/apis/*.ts          One router per API
src/lib/openapi.ts     Loads the specs; Ajv validators for requests (runtime) and responses (tests)
src/lib/http.ts        Problem errors, personas/scopes (tokens from env), rate limit, pagination, idempotency
src/lib/domain.ts      Coverage verification, approved balance, simulated settlement
src/seed/              Deterministic seed generator (reference data + claim lifecycle simulation)
db/schema.sql          Postgres schema with cross-API foreign keys
db/seed.sql            Generated seed data as SQL (for reading)
tests/                 Contract, example, and integrity suites
```

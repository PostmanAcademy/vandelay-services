-- Vandelay Industries API database.
-- One Postgres database backs all five APIs so that cross-API references (customer -> policy ->
-- claim -> work order -> payment) are enforced with real foreign keys, as they would be in the
-- systems of record behind the public APIs.

CREATE TABLE IF NOT EXISTS app_meta (
  key   text PRIMARY KEY,
  value text NOT NULL
);

-- Reference data -------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS postal_codes (
  postal_code text PRIMARY KEY,
  city        text NOT NULL,
  state       text NOT NULL,
  metro       text NOT NULL,
  latitude    double precision NOT NULL,
  longitude   double precision NOT NULL
);

CREATE TABLE IF NOT EXISTS adjusters (
  id         text PRIMARY KEY,
  first_name text NOT NULL,
  last_name  text NOT NULL,
  email      text NOT NULL,
  title      text NOT NULL,
  metro      text NOT NULL
);

-- Customer API ---------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS customers (
  id               text PRIMARY KEY CHECK (id ~ '^cus_[A-Za-z0-9]+$'),
  first_name       text NOT NULL,
  last_name        text NOT NULL,
  email            text NOT NULL,
  phone            text,
  date_of_birth    date,
  address_line1    text,
  address_line2    text,
  city             text,
  state            text,
  postal_code      text,
  country          text,
  status           text NOT NULL CHECK (status IN ('active', 'inactive', 'suspended')),
  contact_method   text CHECK (contact_method IN ('sms', 'email', 'phone', 'app')),
  language         text,
  marketing_opt_in boolean,
  created_at       timestamptz NOT NULL,
  updated_at       timestamptz NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS customers_email_uq ON customers (lower(email));
CREATE INDEX IF NOT EXISTS customers_last_name_idx ON customers (lower(last_name) text_pattern_ops);
CREATE INDEX IF NOT EXISTS customers_phone_idx ON customers (phone);

CREATE TABLE IF NOT EXISTS vehicles (
  id                  text PRIMARY KEY,
  customer_id         text NOT NULL REFERENCES customers (id),
  vin                 text NOT NULL CHECK (length(vin) = 17),
  year                integer NOT NULL,
  make                text NOT NULL,
  model               text NOT NULL,
  trim                text,
  color               text,
  license_plate       text,
  license_plate_state text,
  -- Internal: used for total-loss valuation; not exposed by the API.
  market_value        numeric(12, 2),
  created_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (customer_id, vin)
);
CREATE INDEX IF NOT EXISTS vehicles_vin_idx ON vehicles (vin);

-- Policy API -----------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS policies (
  id                text PRIMARY KEY CHECK (id ~ '^pol_[A-Z]{3}-[0-9]+$'),
  policy_number     text NOT NULL UNIQUE,
  customer_id       text NOT NULL REFERENCES customers (id),
  product           text NOT NULL CHECK (product IN ('personal_auto', 'commercial_auto', 'motorcycle', 'classic_car')),
  status            text NOT NULL CHECK (status IN ('quoted', 'active', 'lapsed', 'cancelled', 'expired')),
  effective_date    date NOT NULL,
  expiration_date   date NOT NULL,
  -- Internal: date a lapse or cancellation took effect. Coverage ends on this date.
  status_date       date,
  status_reason     text,
  premium_amount    numeric(12, 2),
  premium_currency  char(3) DEFAULT 'USD',
  billing_frequency text CHECK (billing_frequency IN ('monthly', 'quarterly', 'semiannual', 'annual')),
  created_at        timestamptz NOT NULL,
  updated_at        timestamptz NOT NULL,
  CHECK (expiration_date > effective_date)
);
CREATE INDEX IF NOT EXISTS policies_customer_idx ON policies (customer_id);

CREATE TABLE IF NOT EXISTS policy_coverages (
  policy_id         text NOT NULL REFERENCES policies (id) ON DELETE CASCADE,
  code              text NOT NULL,
  name              text NOT NULL,
  limit_amount      numeric(12, 2),
  deductible_amount numeric(12, 2),
  daily_limit_amount numeric(12, 2),
  currency          char(3) NOT NULL DEFAULT 'USD',
  sort_order        integer NOT NULL DEFAULT 0,
  PRIMARY KEY (policy_id, code)
);

CREATE TABLE IF NOT EXISTS policy_vehicles (
  policy_id  text NOT NULL REFERENCES policies (id) ON DELETE CASCADE,
  vehicle_id text NOT NULL REFERENCES vehicles (id),
  PRIMARY KEY (policy_id, vehicle_id)
);

CREATE TABLE IF NOT EXISTS drivers (
  id             text PRIMARY KEY,
  policy_id      text NOT NULL REFERENCES policies (id) ON DELETE CASCADE,
  first_name     text NOT NULL,
  last_name      text NOT NULL,
  date_of_birth  date NOT NULL,
  license_number text NOT NULL,
  license_state  text NOT NULL,
  relationship   text NOT NULL CHECK (relationship IN ('self', 'spouse', 'child', 'other')),
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (policy_id, license_number)
);

CREATE TABLE IF NOT EXISTS coverage_verifications (
  id            bigserial PRIMARY KEY,
  policy_id     text NOT NULL REFERENCES policies (id) ON DELETE CASCADE,
  claim_id      text,
  request       jsonb NOT NULL,
  result        jsonb NOT NULL,
  verified_at   timestamptz NOT NULL
);

-- Vendors API ----------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS vendors (
  id                text PRIMARY KEY CHECK (id ~ '^ven_[0-9]+$'),
  name              text NOT NULL,
  type              text NOT NULL CHECK (type IN ('repair', 'tow', 'rental', 'glass', 'appraisal')),
  tax_id            text UNIQUE,
  in_network        boolean NOT NULL DEFAULT false,
  rating            numeric(2, 1) CHECK (rating BETWEEN 0 AND 5),
  phone             text,
  email             text,
  address_line1     text,
  address_line2     text,
  city              text,
  state             text,
  postal_code       text,
  country           text,
  latitude          double precision,
  longitude         double precision,
  service_area      jsonb NOT NULL DEFAULT '[]',
  status            text NOT NULL CHECK (status IN ('pending', 'active', 'suspended', 'terminated')),
  created_at        timestamptz NOT NULL,
  updated_at        timestamptz NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS vendors_email_uq ON vendors (lower(email));

-- Claims API -----------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS claims (
  id                   text PRIMARY KEY CHECK (id ~ '^clm_[0-9]{4}-[0-9]{6}$'),
  customer_id          text NOT NULL REFERENCES customers (id),
  policy_id            text NOT NULL REFERENCES policies (id),
  vehicle_id           text REFERENCES vehicles (id),
  status               text NOT NULL CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'denied', 'settled', 'closed', 'cancelled')),
  type                 text NOT NULL CHECK (type IN ('collision', 'comprehensive', 'theft', 'glass', 'vandalism', 'weather', 'liability', 'other')),
  loss_date            date NOT NULL,
  loss_location        jsonb,
  description          text,
  drivable             boolean,
  injuries             boolean,
  police_report_number text,
  estimated_amount     numeric(12, 2),
  deductible_amount    numeric(12, 2),
  currency             char(3) NOT NULL DEFAULT 'USD',
  coverage_code        text,
  assigned_adjuster_id text REFERENCES adjusters (id),
  cancel_reason        text,
  cancel_comment       text,
  created_by_type      text,
  created_by_id        text,
  created_at           timestamptz NOT NULL,
  updated_at           timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS claims_customer_idx ON claims (customer_id);
CREATE INDEX IF NOT EXISTS claims_policy_idx ON claims (policy_id);
CREATE INDEX IF NOT EXISTS claims_status_idx ON claims (status);

CREATE TABLE IF NOT EXISTS claim_notes (
  id          text PRIMARY KEY,
  claim_id    text NOT NULL REFERENCES claims (id),
  author_type text NOT NULL CHECK (author_type IN ('customer', 'adjuster', 'vendor', 'system')),
  author_id   text NOT NULL,
  visibility  text NOT NULL CHECK (visibility IN ('internal', 'customer')),
  body        text NOT NULL,
  created_at  timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS claim_notes_claim_idx ON claim_notes (claim_id, created_at);

CREATE TABLE IF NOT EXISTS claim_events (
  id         bigserial PRIMARY KEY,
  claim_id   text NOT NULL REFERENCES claims (id),
  at         timestamptz NOT NULL,
  event      text NOT NULL,
  actor_type text,
  actor_id   text,
  summary    text NOT NULL
);
CREATE INDEX IF NOT EXISTS claim_events_claim_idx ON claim_events (claim_id, at);

-- A vendor engagement is one row: the Claims API exposes it as an Assignment (asg_*), and the
-- Vendors API exposes it as a Work Order (wo_*).
CREATE TABLE IF NOT EXISTS work_orders (
  id              text PRIMARY KEY CHECK (id ~ '^wo_[0-9]+$'),
  assignment_id   text NOT NULL UNIQUE,
  claim_id        text NOT NULL REFERENCES claims (id),
  vendor_id       text NOT NULL REFERENCES vendors (id),
  type            text NOT NULL CHECK (type IN ('repair', 'tow', 'rental', 'glass', 'appraisal')),
  status          text NOT NULL CHECK (status IN ('issued', 'accepted', 'declined', 'in_progress', 'completed', 'cancelled')),
  estimate_amount numeric(12, 2),
  currency        char(3) NOT NULL DEFAULT 'USD',
  -- Kept as text so the caller's UTC offset round-trips exactly (e.g. 2026-10-07T09:00:00-07:00).
  scheduled_for   text,
  instructions    text,
  notes           text,
  created_at      timestamptz NOT NULL,
  updated_at      timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS work_orders_claim_idx ON work_orders (claim_id);
CREATE INDEX IF NOT EXISTS work_orders_vendor_idx ON work_orders (vendor_id);

-- Payments API ---------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS payment_methods (
  id           text PRIMARY KEY,
  payee_type   text NOT NULL CHECK (payee_type IN ('customer', 'vendor')),
  payee_id     text NOT NULL,
  type         text NOT NULL CHECK (type IN ('bank_account', 'debit_card')),
  label        text,
  last4        char(4) NOT NULL,
  bank_name    text,
  is_default   boolean NOT NULL DEFAULT false,
  token_hash   text UNIQUE,
  created_at   timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS payment_methods_payee_idx ON payment_methods (payee_id);

CREATE TABLE IF NOT EXISTS payments (
  id                text PRIMARY KEY CHECK (id ~ '^pay_[0-9]+$'),
  claim_id          text NOT NULL REFERENCES claims (id),
  type              text NOT NULL CHECK (type IN ('settlement', 'vendor_invoice', 'rental_reimbursement', 'premium_refund')),
  payee_type        text NOT NULL CHECK (payee_type IN ('customer', 'vendor')),
  payee_id          text NOT NULL,
  payment_method_id text REFERENCES payment_methods (id),
  amount            numeric(12, 2) NOT NULL CHECK (amount > 0),
  currency          char(3) NOT NULL DEFAULT 'USD',
  status            text NOT NULL CHECK (status IN ('pending_approval', 'processing', 'completed', 'failed', 'cancelled', 'refunded')),
  method            text CHECK (method IN ('ach', 'check', 'card', 'wire')),
  invoice_number    text,
  memo              text,
  created_by        text,
  approved_by       text,
  approval_comment  text,
  cancel_reason     text,
  cancel_comment    text,
  -- Simulated bank settlement: a processing payment completes once this time passes.
  settle_after      timestamptz,
  created_at        timestamptz NOT NULL,
  completed_at      timestamptz,
  updated_at        timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS payments_claim_idx ON payments (claim_id);
CREATE INDEX IF NOT EXISTS payments_payee_idx ON payments (payee_id);

CREATE TABLE IF NOT EXISTS refunds (
  id           text PRIMARY KEY,
  payment_id   text NOT NULL REFERENCES payments (id),
  amount       numeric(12, 2) NOT NULL CHECK (amount > 0),
  currency     char(3) NOT NULL DEFAULT 'USD',
  reason       text NOT NULL CHECK (reason IN ('overpayment', 'duplicate', 'claim_reversed', 'other')),
  status       text NOT NULL CHECK (status IN ('processing', 'completed', 'failed')),
  created_by   text,
  settle_after timestamptz,
  created_at   timestamptz NOT NULL,
  completed_at timestamptz
);
CREATE INDEX IF NOT EXISTS refunds_payment_idx ON refunds (payment_id);

-- Cross-cutting --------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS idempotency_keys (
  scope        text NOT NULL,
  key          text NOT NULL,
  request_hash text NOT NULL,
  status_code  integer NOT NULL,
  headers      jsonb NOT NULL DEFAULT '{}',
  body         jsonb NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (scope, key)
);

-- ID sequences. Seeding moves each one past the highest seeded ID.
CREATE SEQUENCE IF NOT EXISTS customer_vehicle_seq START 1000;
CREATE SEQUENCE IF NOT EXISTS driver_seq START 302;
CREATE SEQUENCE IF NOT EXISTS claim_seq START 1;
CREATE SEQUENCE IF NOT EXISTS note_seq START 1;
CREATE SEQUENCE IF NOT EXISTS work_order_seq START 9000;
CREATE SEQUENCE IF NOT EXISTS assignment_seq START 5500;
CREATE SEQUENCE IF NOT EXISTS vendor_seq START 5100;
CREATE SEQUENCE IF NOT EXISTS payment_seq START 90312;
CREATE SEQUENCE IF NOT EXISTS refund_seq START 2002;
CREATE SEQUENCE IF NOT EXISTS payment_method_seq START 3400;

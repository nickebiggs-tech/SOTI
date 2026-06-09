# SOTI Production Deployment Plan

> **Decision: Option B — PHP Laravel (EchoRX Technology Stack Decision v2)**
> **Hosting: Nostra-managed infrastructure (AU data residency)**

---

## 1. What SOTI Is Today

SOTI (State of the Industry) is a **market intelligence dashboard for Australian pharmacy**, covering both Rx (prescription/ethical) and OTC (over-the-counter) markets.

### Current Architecture

| Layer | Current State |
|---|---|
| **Frontend** | React 19 SPA (Vite + TypeScript + Tailwind CSS 4) |
| **Backend** | None — fully static, no server |
| **Database** | None — all data baked into static JSON files served from `/public/data/` |
| **Auth** | Hardcoded local demo users (Jim/3101, Admin/0000). LDAP auth provider stubbed but not connected. |
| **AI / LLM** | Claude API called **directly from the browser** using a client-side API key (localStorage or env var) |
| **Hosting** | GitHub Pages (static files on `gh-pages` branch) |
| **CI/CD** | GitHub Actions — builds on push to `master`, deploys via `peaceiris/actions-gh-pages` |
| **Data Pipeline** | Node.js script (`preprocess-data.mjs`) converts raw CSV to optimised JSON at build time |

### Data Scale

| Dataset | Records | File Size | Load Strategy |
|---|---|---|---|
| Rx Categories | 16 | Tiny | Immediate |
| OTC Categories (Markets) | 65 | Tiny | Immediate |
| Rx SKUs | ~7,400 | Small | Immediate |
| OTC Packs | ~36,000 | Small | Immediate |
| Rx Monthly Detail | ~141,000 | ~4 MB | Lazy (on demand) |

Data uses a string-interning compression format (dictionary + index arrays) to reduce JSON payload size by ~50%.

### Feature Pages (11 routes)

| Route | Feature | Description |
|---|---|---|
| `/login` | Login | Animated hero with market stats, username/PIN auth |
| `/dashboard` | Dashboard | KPI cards ($21.4B Rx, $9.3B OTC), category breakdown, growth metrics |
| `/dispense` | Dispense Trends | Monthly Rx dispensing trends with category/molecule filters |
| `/otc` | OTC Overview | OTC market categories, manufacturer share |
| `/rx-watch` | Rx Watch | Rx category drill-downs, manufacturer and molecule analysis |
| `/otc-watch` | OTC Watch | OTC market drill-downs, manufacturer share analysis |
| `/search` | Search & Compare | Cross-market search with Group by Brand, side-by-side comparison charts |
| `/insights` | Insights | Market insights and analysis views |
| `/seasonality` | Seasonality | Monthly/seasonal patterns for categories and SKUs |
| `/ask` | Ask SOTI | AI chatbot powered by Claude — answers market questions using dynamic data context |
| `/admin/branding` | Branding Admin | Theme/branding configuration |

### Key Technical Details

- **Charts**: Recharts library for all data visualisations
- **Animations**: Custom `useCountUp` hook for KPI number animation
- **Brand grouping**: Two-pass algorithm extracts brand names from product descriptions, then merges sub-brands sharing a common root
- **AI context**: Dynamic per-question search across all SKU/OTC data, injecting up to 30 matching results + monthly trends into the Claude system prompt
- **Formatting**: Custom formatters for compact dollars ($21.4B), percentages, deltas

---

## 2. Production Architecture — Option B (PHP Laravel)

Based on the EchoRX Technology Stack Decision v2 document, the production stack is:

### 2.1 Core Stack

| Component | Technology |
|---|---|
| **Backend Framework** | PHP 8.3+ / Laravel 11 |
| **Frontend** | Existing React SPA (served by Laravel or separate static host) |
| **Database** | PostgreSQL 16 with Row-Level Security (RLS) |
| **Cache** | Redis / Laravel Cache |
| **Queue** | Laravel Horizon + Redis |
| **Search** | Laravel Scout (Meilisearch or Algolia) |
| **Auth** | Laravel Sanctum + LDAP integration (adldap2/laravel) |

### 2.2 Why Laravel (Option B)

The document evaluated six options. Laravel was selected because:

1. **Rapid development** — Eloquent ORM, Blade/Inertia, built-in auth scaffolding
2. **Mature ecosystem** — extensive packages for LDAP, encryption, queue processing
3. **Team familiarity** — PHP expertise available within the Nostra team
4. **Cost-effective** — lower infrastructure costs than .NET or microservices approaches
5. **Good enough performance** — with Redis caching and query optimisation, handles the SOTI data scale comfortably
6. **Laravel Sanctum** — provides token-based API auth without the complexity of full OAuth

### 2.3 Security Architecture

The PDF specifies a comprehensive security posture:

#### Data Security
- **PostgreSQL Row-Level Security (RLS)** — tenant isolation at the database level, not just application logic
- **Envelope encryption** — sensitive fields encrypted with per-tenant data encryption keys (DEKs), wrapped by a master key (KEK) stored in a KMS
- **Encryption at rest** — AES-256 for database storage, TLS 1.3 for data in transit
- **Data classification** — PHI, PII, and commercial data classified and handled per Australian Privacy Act requirements

#### Application Security
- **Laravel Sanctum** for API token management (replacing client-side API keys)
- **CSRF protection** built into Laravel
- **Rate limiting** on all API endpoints
- **Input validation** via Laravel Form Requests
- **SQL injection prevention** via Eloquent ORM parameterised queries
- **XSS prevention** via Blade auto-escaping + Content Security Policy headers

#### AI / LLM Security
- **Server-side proxy** for all Claude API calls — API key never exposed to the browser
- **Prompt injection defence** — input sanitisation, output validation, system prompt hardening
- **Token budget controls** — per-user and per-organisation rate limits on AI usage
- **Audit logging** — all AI queries and responses logged for compliance
- **PII redaction** — scrub sensitive data before sending to external LLM APIs

#### Network & Infrastructure
- **Zero-trust networking** — no implicit trust between services
- **WAF** (Web Application Firewall) in front of all public endpoints
- **DDoS protection** via Cloudflare or equivalent
- **VPN/private networking** for database and cache access
- **Container isolation** — Docker containers with minimal base images, no root

#### Identity & Access
- **LDAP/Active Directory integration** for enterprise SSO
- **RBAC** (Role-Based Access Control) — admin, analyst, viewer roles
- **MFA** (Multi-Factor Authentication) for admin and sensitive operations
- **Session management** — secure, httpOnly, sameSite cookies with configurable TTL
- **JWT for API consumers** with short-lived tokens + refresh flow

### 2.4 Compliance Requirements

| Requirement | Detail |
|---|---|
| **AU Data Residency** | All data stored in Australian data centres (Sydney region) |
| **Privacy Act 1988** | Compliant handling of health-related data (pharmacy dispensing = PHI-adjacent) |
| **OWASP Top 10** | All mitigations implemented and verified |
| **Logging & Audit** | Immutable audit logs for data access, auth events, AI queries |
| **Incident Response** | Documented IRP with < 72-hour breach notification per NDB scheme |
| **Backup & DR** | Automated daily backups, point-in-time recovery, cross-region replication |
| **Penetration Testing** | Annual third-party pentest + continuous SAST/DAST in CI pipeline |

### 2.5 Infrastructure

| Component | Specification |
|---|---|
| **Hosting** | Nostra-managed cloud (AWS Sydney `ap-southeast-2` or Azure Australia East) |
| **Compute** | Laravel on containerised (Docker/ECS) or managed (EC2/App Service) instances |
| **Database** | RDS PostgreSQL 16 (Multi-AZ) or Azure Database for PostgreSQL |
| **Cache** | ElastiCache Redis or Azure Cache for Redis |
| **CDN** | CloudFront or Cloudflare for static assets + React SPA |
| **DNS** | Route 53 / Cloudflare managed DNS |
| **Secrets** | AWS Secrets Manager or Azure Key Vault — no secrets in code or env files |
| **Monitoring** | Laravel Telescope (dev), Sentry (errors), Datadog or CloudWatch (infra) |
| **CI/CD** | GitHub Actions → build → test → deploy to staging → promote to production |

### 2.6 Supply Chain Integrity

- **Dependency scanning** — Composer audit + npm audit in CI
- **Container scanning** — Trivy or equivalent on Docker images
- **SBOM** (Software Bill of Materials) generation per build
- **Signed commits** enforced on main branch
- **Lock files** committed (`composer.lock`, `package-lock.json`) for reproducible builds

### 2.7 Implementation Timeline (14 Weeks)

| Phase | Weeks | Focus |
|---|---|---|
| **Phase 1: Foundation** | 1–3 | Laravel project setup, PostgreSQL schema, auth (Sanctum + LDAP), basic API endpoints |
| **Phase 2: Data Layer** | 4–6 | Data import pipeline (CSV → PostgreSQL), RLS policies, Redis caching, API for all current data endpoints |
| **Phase 3: AI Integration** | 7–8 | Server-side Claude proxy, prompt management, token budgets, audit logging |
| **Phase 4: Frontend Migration** | 9–10 | Connect React SPA to Laravel API (replace static JSON with API calls), deploy behind auth |
| **Phase 5: Security Hardening** | 11–12 | WAF setup, penetration testing, encryption-at-rest, incident response runbook |
| **Phase 6: Production Launch** | 13–14 | Staging → production promotion, DNS cutover, monitoring, go-live |

---

## 3. What Needs to Change (Current → Production)

### 3.1 Backend (New)

| Current | Production |
|---|---|
| No backend | Laravel 11 API serving all data endpoints |
| Static JSON files | PostgreSQL database with RLS |
| Build-time CSV preprocessing | Server-side data import pipeline (scheduled or on-demand) |
| No caching | Redis caching for expensive queries |

### 3.2 Authentication

| Current | Production |
|---|---|
| Hardcoded users (Jim/3101, Admin/0000) | LDAP/AD integration via Laravel Sanctum |
| No session management | Secure cookie sessions + API tokens |
| No RBAC | Role-based access (admin, analyst, viewer) |
| No MFA | MFA for admin operations |

### 3.3 AI / Ask SOTI

| Current | Production |
|---|---|
| Claude API key in browser (localStorage / env var) | Server-side proxy — key in Secrets Manager |
| Direct browser → Anthropic API calls | Laravel controller proxies requests |
| No rate limiting | Per-user token budgets + rate limiting |
| No audit trail | All queries/responses logged |
| No PII protection | PII redaction before sending to Claude |

### 3.4 Data Pipeline

| Current | Production |
|---|---|
| `preprocess-data.mjs` runs at build time | Laravel artisan command / scheduled job imports CSV → PostgreSQL |
| String-interned JSON in `/public/data/` | Normalised database tables with proper indexes |
| All data publicly accessible (static files) | API endpoints gated by auth + RLS |
| ~7.4K Rx SKUs + ~36K OTC items in client memory | Paginated, filterable API queries |

### 3.5 Frontend

| Current | Production |
|---|---|
| Loads all data into memory on mount | Fetches from Laravel API on demand |
| `DataProvider` with in-memory state | API client with React Query or SWR for caching |
| GitHub Pages hosting | CDN (CloudFront/Cloudflare) serving built SPA |
| No CSP headers | Strict Content-Security-Policy headers |

### 3.6 Deployment

| Current | Production |
|---|---|
| `gh-pages` branch deploy | Containerised deploy to Nostra infrastructure |
| Single environment | Staging + Production environments |
| No monitoring | Sentry + CloudWatch/Datadog |
| No backup/DR | Automated backups, cross-region replication |

---

## 4. Immediate Next Steps

1. **Provision Laravel project** — `laravel new soti-api` with PostgreSQL, Redis, Sanctum
2. **Design database schema** — migrate from flat JSON to normalised tables (categories, skus, manufacturers, molecules, monthly_data)
3. **Implement data import** — artisan command to ingest the existing CSVs into PostgreSQL
4. **Build API endpoints** — mirror the data shapes the React frontend currently expects
5. **Set up LDAP auth** — connect to Nostra AD, map groups to SOTI roles
6. **Create Claude proxy endpoint** — `POST /api/ask` that forwards to Anthropic with server-side key
7. **Update React frontend** — replace static JSON fetches with API calls
8. **Set up Nostra infrastructure** — Docker containers, RDS, ElastiCache, CDN
9. **Security hardening** — WAF, CSP headers, encryption, penetration test
10. **Staging deployment** — validate with real data before production cutover

# ZipDrop Production Readiness Assessment

**Project:** ZipDrop  
**Generated:** 2026-11-25  
**Target Deployment:** BigRock NVMe 8 VPS (4 vCPU, 8 GB RAM, 200 GB NVMe SSD, AlmaLinux 9) — owner-provided, unverified  
**Source:** Repository inspection of `D:\Projects\ZipDrop`

---

## 1. Readiness Summary

| Dimension | Rating | Summary |
|-----------|--------|---------|
| Core functionality | Functional | File sharing, conversion, compression, PDF tools, background removal, editor all implemented |
| Code maturity | Early | Monolithic server.js (2080 lines), minimal tests, no CI/CD |
| Security | Needs review | Secrets in `.env`, no `.env.example`, memory-based uploads, no confirmed rate limiting or auth |
| Operations | Not ready | No Docker, no process manager, no CI/CD, no reverse proxy config |
| Observability | Minimal | Basic error handling + stats; no structured logging, monitoring, or health endpoints beyond compression |
| Scalability | Limited | Single VPS, inline Python workers, memory storage — no job queue or horizontal scaling |

**Overall: NOT production-ready for VPS deployment without remediation.** Core features work, but security, operations, testing, and observability gaps must be addressed first.

---

## 2. Readiness Checklist

### Critical (block deployment if unaddressed)

| # | Check | Status | Evidence | Remediation |
|---|-------|--------|----------|-------------|
| C1 | Secrets excluded from git | FAIL | `backend/.env` present in working tree; contains `MONGO_URI`, `SUPABASE_URL`, `SUPABASE_KEY` | Add `.env` to `.gitignore`; create `.env.example` with placeholders; rotate any committed secrets |
| C2 | `.env.example` exists | FAIL | No `.env.example` in backend or frontend | Create `.env.example` for both backend and frontend |
| C3 | Test coverage | FAIL | Only 2 test files (`BaseCompressor.test.js`, `pdf_organizer_test.js`) | Add unit/integration tests for routes, converters, compressors |
| C4 | File upload storage | RISK | `multer.memoryStorage()` — full files in RAM | Switch to disk or stream storage; enforce file size limits |
| C5 | Rate limiting | UNVERIFIED | Not observed in `server.js` excerpts | Add `express-rate-limit` on upload/convert/compression endpoints |
| C6 | Authentication/authorization | UNVERIFIED | Code-based sharing only, public-by-code | Add auth if private/user-scoped sharing required |

### High (should address before launch)

| # | Check | Status | Evidence | Remediation |
|---|-------|--------|----------|-------------|
| H1 | CI/CD pipeline | FAIL | No `.github/workflows/` or CI config found | Add GitHub Actions (lint + test + build) |
| H2 | Containerization | FAIL | No `Dockerfile` or `docker-compose.yml` | Add Dockerfile + compose for reproducible VPS deploy |
| H3 | Process manager | UNVERIFIED | `nodemon.json` (dev only) found; no PM2/systemd | Add PM2 or systemd unit file for production |
| H4 | Reverse proxy / TLS | UNVERIFIED | No nginx/Apache config found | Add nginx for TLS termination, port 80/443 → 3000/5000 |
| H5 | Health checks | PARTIAL | `/health/compression` exists; no DB/storage health | Add `/health` endpoint checking Mongo + Supabase + R2 |
| H6 | Environment parity | RISK | Frontend API base inconsistent (render.com vs localhost:5000) | Unify `NEXT_PUBLIC_API_URL`; add `.env.production` |
| H7 | Security headers | UNVERIFIED | `helmet` not confirmed in use | Add Helmet (CSP, HSTS, X-Frame-Options, etc.) |
| H8 | CORS allowlist contents | UNVERIFIED | Mechanism confirmed, contents not fully read | Review and harden `allowedOriginSet` |

### Medium (post-launch)

| # | Check | Status | Evidence | Remediation |
|---|-------|--------|----------|-------------|
| M1 | Structured logging | FAIL | `console.error` only | Add structured logger (request IDs, log levels) |
| M2 | Monitoring/alerting | FAIL | None found | Add uptime monitoring, error tracking (Sentry), metrics |
| M3 | Async job queue | FAIL | Python workers run inline via `child_process` | Add BullMQ/Redis queue for long conversions |
| M4 | File expiration policy | FAIL | No expiration/cleanup confirmed | Add TTL cleanup for shared files |
| M5 | API documentation | PARTIAL | This API_REFERENCE generated; no OpenAPI/Swagger | Add Swagger/OpenAPI spec |
| M6 | Dead routes | FAIL | `convert-to-pdf/` empty; `convert/` subdirs lack `route.ts` | Implement or remove placeholder routes |
| M7 | `rembg` cold start | RISK | ONNX model downloads on first run | Pre-download model or add warm-up endpoint |
| M8 | LibreOffice dependency | RISK | Office↔PDF via LibreOffice subprocess | Ensure LibreOffice installed on VPS via `setup-libreoffice.mjs` |

---

## 3. Severity Breakdown

| Severity | Count | Items |
|----------|-------|-------|
| Critical | 6 | C1–C6 |
| High | 8 | H1–H8 |
| Medium | 8 | M1–M8 |
| **Total** | **22** | |

---

## 4. Detailed Findings

### 4.1 Secrets Management (Critical)
`backend/.env` contains real values: `MONGO_URI`, `SUPABASE_URL`, `SUPABASE_KEY`, and likely R2 credentials. The file is present in the working tree (git status clean means it's either committed or gitignored — `.gitignore` contents not verified). No `.env.example` exists anywhere in the repo.

**Risk:** High — credentials could be leaked if `.env` is committed or exposed.  
**Action:** Verify `.gitignore` excludes `.env`; create `.env.example`; rotate secrets if ever committed.

### 4.2 Memory-Based File Uploads (Critical)
`multer.memoryStorage()` buffers entire uploaded files in RAM. Combined with `upload.array("files", 50)` (bulk) and `upload.array("files", 20)` (images-to-PDF), concurrent large uploads could exhaust the 8 GB VPS RAM.

**Risk:** High — OOM under load.  
**Action:** Switch to disk storage (`multer.diskStorage()`) or streaming; enforce `maxFileSize` limits; stream to object storage directly.

### 4.3 No CI/CD (High)
No GitHub Actions, GitLab CI, or other pipeline found. No lint/test/build automation.

**Risk:** High — regressions ship unnoticed.  
**Action:** Add GitHub Actions workflow running `npm run lint`, `npm run test`, `npm run build` (scripts to be confirmed in `package.json`).

### 4.4 No Containerization (High)
No `Dockerfile` or `docker-compose.yml`. VPS deployment would require manual provisioning (Node, Python, LibreOffice, MongoDB, etc.) or Nixpacks on AlmaLinux 9.

**Risk:** High — environment drift, hard to reproduce.  
**Action:** Add Dockerfile (multi-stage: Node + Python) and docker-compose.yml; document manual VPS provisioning steps.

### 4.5 Minimal Test Coverage (Critical)
Only 2 test files identified:
- `backend/compression/BaseCompressor.test.js`
- `backend/pdf_organizer_test.js`

No frontend tests, no API integration tests, no Python worker tests. Test runner not confirmed.

**Risk:** High — no safety net for refactoring.  
**Action:** Add Jest/Vitest tests for routes, converters, compressors; add Python worker tests; configure test script.

### 4.6 No Rate Limiting (Critical — unverified)
No `express-rate-limit` observed in `server.js` excerpts. Upload/convert/compression endpoints are open to abuse.

**Risk:** High — DoS via repeated large uploads.  
**Action:** Add rate limiting per IP on write endpoints.

### 4.7 No Authentication (Critical — unverified)
File sharing is public-by-code. No user accounts, login, or access control confirmed.

**Risk:** Medium/High — depends on whether private sharing is required.  
**Action:** Add auth (session/JWT or OAuth) if user-scoped files needed; otherwise document public-by-code model.

### 4.8 Frontend API Base URL Inconsistency (High)
- `frontend/utils/api.ts`: defaults to `https://zipdrop.onrender.com`
- `frontend/app/api/send/route.ts`: defaults to `http://localhost:5000`
- `frontend/app/api/stats/route.ts`: `BACKEND_URL || NEXT_PUBLIC_API_URL || "http://localhost:5000"`
- `frontend/.env`: reported as `http://localhost:5000` (not exposed)

**Risk:** Medium — dev/prod mismatch, wrong endpoint in production.  
**Action:** Unify on `NEXT_PUBLIC_API_URL`; add `.env.production` with VPS backend URL.

### 4.9 Dead / Placeholder Routes (Medium)
- `frontend/app/api/convert-to-pdf/` — empty directory
- `frontend/app/api/convert/<7 subdirs>/` — directories exist, no `route.ts` (images-to-pdf, jpg-to-pdf, pdf-to-jpg, pdf-to-png, pdf-to-word, png-to-pdf, word-to-pdf)

**Risk:** Low — confusion, 404s if called.  
**Action:** Implement routes or remove directories.

### 4.10 Inline Python Workers (Medium)
Conversions run synchronously in the request cycle via `child_process`. Large files block the Express event loop worker handling the request.

**Risk:** Medium — request latency, timeouts on large files.  
**Action:** Add async job queue (BullMQ/Redis) with webhook/polling for completion.

### 4.11 Observability Gaps (High)
- Logging: `console.error` only (no structured logs, no request IDs)
- Monitoring: none found
- Alerting: none found
- Health: only `/health/compression`; no DB/storage connectivity checks

**Risk:** Medium — blind in production.  
**Action:** Add structured logging (Pino/Winston), uptime monitoring, error tracking, `/health` endpoint.

### 4.12 No Reverse Proxy / TLS Config (High)
No nginx/Apache config found. VPS would need TLS termination and port mapping (80/443 → 3000/5000).

**Risk:** High — no HTTPS termination confirmed.  
**Action:** Add nginx config with Certbot/LetsEncrypt for `getzipdrop.com`.

### 4.13 No Process Manager (High)
`nodemon.json` is dev-only. No PM2/systemd unit found for production process management.

**Risk:** High — no auto-restart on crash.  
**Action:** Add PM2 ecosystem file or systemd unit.

### 4.14 rembg Cold Start (Medium)
`rembg` downloads ONNX model on first run. Cold-start background removal will be slow and may fail without network access at runtime.

**Risk:** Medium — poor first-time UX.  
**Action:** Pre-download model in build/setup; add warm-up endpoint.

### 4.15 Stats Visibility Threshold (Medium)
`frontend/app/api/stats/route.ts` hides stats unless `files >= 100 && transfers >= 50`. Returns `{ visible: false }` otherwise. Intentional but potentially confusing.

**Risk:** Low — cosmetic.  
**Action:** Document behavior or make threshold configurable.

---

## 5. Deployment Readiness — VPS Checklist (Owner-Provided Target)

| Step | Status | Notes |
|------|--------|-------|
| Provision AlmaLinux 9 VPS (BigRock NVMe 8) | Pending | Owner-provided plan |
| Install Node.js, Python 3, pip | Pending | Required for backend + workers |
| Install LibreOffice | Pending | Via `backend/scripts/setup-libreoffice.mjs` |
| Install MongoDB | Pending | Backend metadata store |
| Install nginx + Certbot | Pending | TLS termination for getzipdrop.com |
| Clone repo, exclude `.env` | Pending | `.env` must not be committed |
| Create `.env` from `.env.example` | Pending | `.env.example` must be created first |
| Install Python deps (`requirements.txt`) | Pending | Via `setup-python.mjs` |
| Install Node deps (`npm install`) | Pending | Backend + frontend |
| Build frontend (`npm run build`) | Pending | Next.js production build |
| Start backend + frontend (PM2/systemd) | Pending | Process manager needed |
| Configure DNS (getzipdrop.com → VPS IP) | Pending | Registrar: Spaceship |
| Add AdSense tags | Pending | Monetization |
| Set up monitoring/backups | Pending | Not in repo |

---

## 6. Remediation Roadmap

### Phase 1 — Before VPS Deploy (1–2 weeks)
1. Create `.env.example` (backend + frontend); gitignore `.env`; rotate secrets
2. Add rate limiting on write endpoints
3. Switch uploads to disk/stream with size limits
4. Add test suite targeting core routes; configure test script
5. Add GitHub Actions CI (lint + test + build)
6. Add Dockerfile + docker-compose.yml
7. Add PM2/systemd process config
8. Add nginx + Certbot TLS config
9. Unify frontend API base URL; add `.env.production`
10. Add `/health` endpoint (DB + storage checks)

### Phase 2 — Launch Readiness (1 week)
11. Add structured logging + request IDs
12. Implement or remove dead API routes (`convert-to-pdf/`, `convert/` subdirs)
13. Add authentication if private sharing required
14. Pre-download rembg ONNX model; add warm-up
15. Add file expiration/cleanup policy

### Phase 3 — Post-Launch (ongoing)
16. Add monitoring/alerting (uptime, errors, metrics)
17. Add async job queue for long conversions
18. Add OpenAPI/Swagger docs
19. Add usage analytics beyond file/transfer counts
20. Consider CDN for static assets

---

## 7. Files That Must Not Change (Session Constraint)

Per current session scope, only documentation files may be created in `docs/technical-audit/`. The following must NOT be modified, deleted, or committed:
- All source code in `backend/`, `frontend/`, root
- `backend/.env`, `frontend/.env` (contain secrets)
- `.gitignore`, `package.json`, `package-lock.json`, etc.

All report files are confined to `docs/technical-audit/`.

---

## 8. Unverified Items (Marked Estimate/Unverified)

The following could not be confirmed from repository contents and should be verified by the owner:
- `.gitignore` contents (does it exclude `.env`, `node_modules`, `.venv`, `temp/`?)
- `backend/.env` and `frontend/.env` exact values (not exposed)
- Rate limiting presence/absence
- Authentication presence/absence
- CORS allowlist contents
- `helmet` usage
- Test runner (Jest/Vitest) configuration
- `nodemon.json` contents
- Process manager (PM2/systemd) configuration
- Reverse proxy (nginx) configuration
- MongoDB hosting (self-hosted on VPS vs managed)
- Whether `backend/.env` is already committed to git history

---

## 9. Conclusion

ZipDrop has a functional feature set but is **not production-ready** for the planned BigRock AlmaLinux 9 VPS deployment without remediation. The highest-priority items are secrets management (`.env.example` + gitignore + rotate), test coverage, rate limiting, upload storage (disk/stream over memory), CI/CD, containerization, process management, and TLS termination. Addressing Phase 1 items (estimated 1–2 weeks) would bring the application to a defensible production baseline.

---

*End of production readiness assessment.*

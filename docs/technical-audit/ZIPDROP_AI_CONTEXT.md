# ZipDrop AI Context File

**Purpose:** Context for AI agents (future coding sessions) working on the ZipDrop codebase.  
**Generated:** 2026-11-25  
**Scope:** Backend (Express/Node), Frontend (Next.js 14 App Router), Python workers.

---

## 1. Project Identity

- **Name:** ZipDrop — "Share. Convert. Compress. Simplify."
- **Repo:** `D:\Projects\ZipDrop` (git branch `main`, commit `c4c854f064fde9739945534ae5c45f393a89862a`, clean tree)
- **Primary domain:** https://getzipdrop.com
- **Monetization:** Google AdSense; registrar: Spaceship
- **Planned hosting:** BigRock NVMe 8 VPS (4 vCPU, 8 GB RAM, 200 GB NVMe SSD, AlmaLinux 9); frontend+backend on same VPS
- **Audit reports:** `docs/technical-audit/` (this session generated 6 report files there)

---

## 2. Codebase Layout

```
backend/          Node.js/Express API + Python workers
frontend/         Next.js 14 App Router (React)
docs/technical-audit/  Target output dir for audit reports (was empty)
root/             package.json, nixpacks.toml, railway.json, .gitignore
```

---

## 3. Backend Architecture (Single Monolith)

**Entry point:** `backend/server.js` (2080 lines) — all routes defined inline.

**Pattern:** Each route handler is an `async (req, res) => { ... }` defined directly in `server.js`. Route groups:
- File sharing: `POST /upload`, `POST /share-text`, `POST /resend`, `GET /receive/:code`
- Conversion: `POST /convert/<format>` (27 endpoints) + `POST /convert/images-to-pdf` (multi-file)
- Compression: `POST /compress/<format>`, `POST /compress/images/bulk`, `GET /health/compression`
- PDF tools: `POST /pdf/merge`, `POST /pdf/split`, `POST /pdf/organize`
- Image tools: `POST /image-tools/remove-background` (referenced by frontend)
- Stats: `GET /stats`
- Global error handler + 404 handler (both set CORS headers)

**Delegation:**
- Conversions delegate to `handleConversion(req, res, '<type>')` → `converters/index.js` router `.convert()`
- Compression delegates to `handleCompression(req, res, format)` → `compression/index.js` `getCompressionRouter()` `.compress()` / `.compressBulk()`

**Storage:** `multer.memoryStorage()` — files held in RAM, then uploaded to Supabase (primary) or Cloudflare R2 (secondary). Configs: `backend/config/supabase.js`, `backend/config/r2.js`.

**Metadata DB:** MongoDB via Mongoose; schema `backend/models/FileModel.js` (fields: `file_id`, `file_name`, `file_url`, `files`, `download_count`, text-share when `file_name === "text"`).

**Concurrency:** `backend/utils/concurrencyLimiter.js` — limits concurrent Python worker processes.

**Python workers** (invoked via `child_process`):
- `pdf_converter.py`, `pdf_merger.py`, `pdf_splitter.py`, `pdf_organizer.py`
- `compression/pdf_compressor.py`, `compression/image_compressor.py`
- `background_remover.py`, `background_remover_worker.py`
- `libreoffice_worker.py` (office↔PDF via LibreOffice subprocess)

**Setup scripts:** `backend/scripts/setup-python.mjs`, `backend/scripts/setup-libreoffice.mjs`

---

## 4. Frontend Architecture

**Framework:** Next.js v14.2.5, App Router, React.

**API base URL:**
- `frontend/utils/api.ts`: `process.env.NEXT_PUBLIC_API_URL || "https://zipdrop.onrender.com"`
- `frontend/app/api/send/route.ts`: `process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"`
- `frontend/app/api/stats/route.ts`: `BACKEND_URL || NEXT_PUBLIC_API_URL || "http://localhost:5000"`
- `frontend/.env`: reported as `http://localhost:5000` (not exposed)

**Frontend API routes** (all proxy to backend or run conversion in-edge):
- `send/route.ts` — POST to `BACKEND/resend`
- `share-edited/route.ts` — HTML→DOCX via `htmlToDocx`, then POST to `BACKEND/resend`
- `stats/route.ts` — GET `BACKEND/stats` (visible only if files>=100 && transfers>=50)
- `proxy-file/route.ts` — GET/HEAD proxy for Supabase URLs (allowlist: supabase.co, supabase.in)
- `convert-pdf-to-docx/route.ts` — POST, 50 MB limit, validates `%PDF-` signature, uses `@/lib/pdf/to-docx`
- `convert-to-docx/route.ts` — POST, HTML→DOCX via `htmlToDocx`
- `convert-to-html/route.ts` — POST, DOCX→HTML via mammoth (checks `PK` magic bytes)
- `convert-to-pdf/` — empty directory
- `convert/<7 subdirs>/` — directories exist, no `route.ts` found (images-to-pdf, jpg-to-pdf, pdf-to-jpg, pdf-to-png, pdf-to-word, png-to-pdf, word-to-pdf)

**Key client:** `frontend/utils/api.ts` — `uploadFile`, `shareText`, `receiveData`, `compressPdf/Jpg/Png/Webp`, `compressBulkImages`, `removeBackground`, `mergePdf`, `splitPdf`, `organizePdf`, `checkCompressionHealth`.

**Key pages:**
- `app/page.tsx` (landing), `app/conversion/page.tsx` (24 tools), `app/compression/page.tsx` (7 tools, some coming-soon)
- `app/pdf/merge/`, `app/pdf/organize/`, `app/pdf/split/`
- `app/image-tools/background-remover/`
- `app/editor/`, `app/about/`, `app/contact/`, `app/privacy/`, `app/terms/`, `app/blog/` (38 posts)

**Components:** `Navbar`, `UploadCard`, `ReceiveCard`, `FileUpload`

**Libs:** `lib/site.ts` (`MAX_FILES_PER_TRANSFER=10`), `lib/pdf/to-docx.ts`, `lib/editor/html-to-docx.ts` (`htmlToDocx`), `lib/editor/extensions.ts` (Tiptap), `utils/api.ts`

---

## 5. Conversion Endpoints (Backend) — 27 Total

All use `upload.single("file")` and call `handleConversion(req, res, '<type>')`:

| Endpoint | Converter type |
|----------|---------------|
| `/convert/pdf-to-word` | pdf-to-docx |
| `/convert/word-to-pdf` | docx-to-pdf |
| `/convert/excel-to-pdf` | xlsx-to-pdf |
| `/convert/powerpoint-to-pdf` | pptx-to-pdf |
| `/convert/pdf-to-jpg` | pdf-to-jpg |
| `/convert/pdf-to-png` | pdf-to-png |
| `/convert/pdf-to-excel` | pdf-to-xlsx |
| `/convert/pdf-to-powerpoint` | pdf-to-pptx |
| `/convert/pdf-to-text` | pdf-to-txt |
| `/convert/pdf-to-html` | pdf-to-html |
| `/convert/pdf-to-pdfa` | pdf-to-pdfa |
| `/convert/word-to-text` | docx-to-txt |
| `/convert/word-to-html` | docx-to-html |
| `/convert/excel-to-csv` | xlsx-to-csv |
| `/convert/text-to-pdf` | txt-to-pdf |
| `/convert/html-to-pdf` | html-to-pdf |
| `/convert/csv-to-excel` | csv-to-xlsx |
| `/convert/rtf-to-word` | rtf-to-docx |
| `/convert/jpg-to-pdf` | jpg-to-pdf |
| `/convert/png-to-pdf` | png-to-pdf |
| `/convert/images-to-pdf` | convertMultiple (up to 20 files) |
| `/convert/jpg-to-png` | jpg-to-png |
| `/convert/png-to-jpg` | png-to-jpg |
| `/convert/webp-to-jpg` | webp-to-jpg |
| `/convert/jpg-to-webp` | jpg-to-webp |
| `/convert/png-to-webp` | png-to-webp |
| `/convert/svg-to-png` | svg-to-png |

---

## 6. Compression Endpoints (Backend)

| Endpoint | Format | Notes |
|----------|--------|-------|
| `/compress/pdf` | pdf | 3 levels |
| `/compress/jpg` | jpg | quality presets |
| `/compress/png` | png | lossless/optimized |
| `/compress/webp` | webp | lossy/lossless |
| `/compress/images/bulk` | images (≤50) | ZIP output |

Compression stats returned in response headers: `X-Original-Size`, `X-Compressed-Size`, `X-Bytes-Saved`, `X-Reduction-Percent`, plus format-specific (`X-Level`, `X-Mode`, `X-Quality`, `X-Method`, `X-Warning`, `X-Page-Count`, `X-Width`, `X-Height`).

Compression error codes: `INVALID_INPUT`, `UNSUPPORTED_FORMAT`, `FILE_TOO_LARGE`, `PASSWORD_PROTECTED`, `CORRUPTED_FILE`, `MISSING_DEPENDENCY`, `ZIP_CREATION_FAILED`.

---

## 7. Python Worker Dependencies

Key packages (`backend/requirements.txt`): pypdf, pdf2docx, rembg, onnxruntime, pikepdf, PyMuPDF (fitz), pillow, reportlab, playwright, and others.

- **rembg + onnxruntime:** background removal; downloads ONNX model on first run (network required at cold start)
- **LibreOffice:** office↔PDF conversion via `libreoffice_worker.py`
- **pdf2docx / pikepdf / PyMuPDF:** PDF conversion
- **pypdf:** merge/split/organize

---

## 8. Conventions for Editing

- **No comments added to code** unless asked (codebase style: minimal inline comments)
- **Backend route pattern:** `app.post("/path", upload.single("file"), async (req, res) => { await handleX(req, res, 'type'); })`
- **Error response shape:** `{ error: string, code: string }` with appropriate HTTP status
- **Compression stats headers:** X-prefixed headers on success responses
- **Frontend API client:** functions throw `Error(message)` on non-ok responses; extract stats from response headers
- **API routes:** `export const runtime = "nodejs"; export const maxDuration = 60;` at top of route.ts files
- **Python workers:** invoked via `child_process`; check `concurrencyLimiter.js` before spawning many parallel workers

---

## 9. Gotchas & Risks

1. **`backend/.env` contains real secrets** (`MONGO_URI`, `SUPABASE_URL`, `SUPABASE_KEY`, R2 creds). Never log, commit, or expose values. Create `.env.example` with placeholders instead.
2. **`multer.memoryStorage()`** holds entire files in RAM. Large/concurrent uploads risk OOM on 8 GB VPS. Consider disk or stream storage.
3. **`upload.array("files", 50)`** bulk endpoint — 50 large images in memory simultaneously.
4. **No `.env.example` exists** in backend or frontend.
5. **No Dockerfile / docker-compose.yml** — VPS deployment requires manual provisioning or Nixpacks on AlmaLinux 9.
6. **No CI/CD pipeline** found (no `.github/workflows/` etc.).
7. **Only 2 test files** (`BaseCompressor.test.js`, `pdf_organizer_test.js`) — minimal coverage.
8. **No rate limiting confirmed** in `server.js` excerpts.
9. **No authentication/authorization confirmed** — sharing is code-based only (public-by-code).
10. **`convert/` API subdirs** (7 dirs) have no `route.ts`; `convert-to-pdf/` is empty — dead or placeholder routes.
11. **Frontend API base URL inconsistent:** `api.ts` defaults to render.com; `send/route.ts` defaults to localhost:5000; `.env` reportedly localhost:5000.
12. **`stats/route.ts` hides stats** unless files>=100 and transfers>=50 (intentional, but surprising).
13. **Python rembg model download** on first cold start — add warm-up or pre-download model for VPS deploy.

---

## 10. When Making Changes

- **Backend routes:** add new `app.post()` blocks in `server.js` near related endpoints; follow existing `handleConversion`/`handleCompression` delegation pattern.
- **New converters:** add to `backend/converters/` and register in `converters/index.js` router; add `.py` worker in `backend/` if Python needed; update `requirements.txt`.
- **New compression:** add compressor class in `backend/compression/` extending `BaseCompressor.js`; register in `compression/index.js`; add client function in `frontend/utils/api.ts`.
- **Frontend API routes:** create `app/api/<name>/route.ts` with `runtime = "nodejs"`, `maxDuration = 60`, `NextRequest`/`NextResponse`.
- **Never commit secrets:** `.env` files must be gitignored.
- **Run lint/typecheck/test** after changes (commands not confirmed in repo — check `package.json` scripts).
- **Do not modify files outside `docs/technical-audit/`** per current session constraints (only doc creation permitted).

---

*End of AI context file.*

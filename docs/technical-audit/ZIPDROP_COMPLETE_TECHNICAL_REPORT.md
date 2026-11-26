# ZipDrop Complete Technical Report

**Project:** ZipDrop  
**Tagline:** Share. Convert. Compress. Simplify.  
**Domain:** https://getzipdrop.com (previous: https://zip-drop.vercel.app)  
**Repo:** D:\Projects\ZipDrop  
**Git branch:** main  
**Git commit:** c4c854f064fde9739945534ae5c45f393a89862a  
**Working tree status:** clean  
**Audit date:** 2026-11-25  
**Auditor:** Kilo (automated technical audit)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Project Overview & Domain](#2-project-overview--domain)
3. [Monetization & Hosting Plan](#3-monetization--hosting-plan)
4. [Repository Structure](#4-repository-structure)
5. [Backend Stack](#5-backend-stack)
6. [Frontend Stack](#6-frontend-stack)
7. [Python Workers](#7-python-workers)
8. [Storage Layer](#8-storage-layer)
9. [File Sharing Feature](#9-file-sharing-feature)
10. [Conversion Feature](#10-conversion-feature)
11. [Compression Feature](#11-compression-feature)
12. [PDF Tools Feature](#12-pdf-tools-feature)
13. [Background Removal Feature](#13-background-removal-feature)
14. [Document Editor Feature](#14-document-editor-feature)
15. [Blog & Content](#15-blog--content)
16. [API Routes (Backend)](#16-api-routes-backend)
17. [API Routes (Frontend)](#17-api-routes-frontend)
18. [Frontend Pages & Routes](#18-frontend-pages--routes)
19. [Environment Configuration](#19-environment-configuration)
20. [Deployment History](#20-deployment-history)
21. [Security Observations](#21-security-observations)
22. [Performance Characteristics](#22-performance-characteristics)
23. [Error Handling](#23-error-handling)
24. [Testing & Quality Assurance](#24-testing--quality-assurance)
25. [CI/CD & DevOps](#25-cicd--devops)
26. [Technical Debt & Risks](#26-technical-debt--risks)
27. [Strengths](#27-strengths)
28. [Recommendations](#28-recommendations)
29. [File Inventory](#29-file-inventory)
30. [Unverified / Estimate Claims](#30-unverified--estimate-claims)
31. [Conclusion](#31-conclusion)

---

## 1. Executive Summary

ZipDrop is a full-stack web application for file sharing, conversion, compression, PDF manipulation, image background removal, and document editing. The codebase is split into a Node.js/Express backend and a Next.js 14 frontend (App Router), with Python workers for CPU-intensive file processing (PDF conversion, compression, background removal). The application targets self-hosting on an AlmaLinux 9 VPS (BigRock NVMe 8) with frontend+backend colocated.

The repository is in a functional, Phase 1 state. Core file sharing and conversion/compression endpoints are implemented. Several features are marked "Coming Soon" in the UI but have backend counterparts. No `.env.example` exists; actual secrets are present in `backend/.env` (must not be committed or exposed). Test coverage is minimal (one test file found: `BaseCompressor.test.js`).

Overall maturity: **early production-ready for core sharing/conversion; needs hardening, tests, security review, and docs before VPS deployment.**

---

## 2. Project Overview & Domain

| Field | Value | Source |
|-------|-------|--------|
| Name | ZipDrop | `frontend/lib/site.ts` |
| Tagline | Share. Convert. Compress. Simplify. | owner-provided |
| Primary domain | https://getzipdrop.com | owner-provided |
| Previous domain | https://zip-drop.vercel.app | owner-provided |
| Registrar | Spaceship | owner-provided |
| Monetization | Google AdSense | owner-provided |

Site config (`frontend/lib/site.ts`): `SITE_URL`, `MAX_FILES_PER_TRANSFER=10` (owner-provided constant; value not directly verified in read excerpt).

---

## 3. Monetization & Hosting Plan

| Field | Value | Source |
|-------|-------|--------|
| Hosting provider | BigRock | owner-provided |
| Plan | NVMe 8 VPS | owner-provided |
| vCPU | 4 | owner-provided |
| RAM | 8 GB | owner-provided |
| Storage | 200 GB NVMe SSD | owner-provided |
| OS | AlmaLinux 9 | owner-provided |
| Deployment model | Frontend + backend on same VPS | owner-provided |

**Note:** All hosting/monetization values above are owner-provided and not verifiable from repository contents.

---

## 4. Repository Structure

```
ZipDrop/
├── backend/
│   ├── .env                          (secrets - NOT to be exposed)
│   ├── .gitignore
│   ├── package.json
│   ├── package-lock.json
│   ├── nodemon.json
│   ├── requirements.txt
│   ├── server.js                     (2080 lines - Express entry point)
│   ├── config/
│   │   ├── supabase.js
│   │   └── r2.js
│   ├── models/
│   │   └── FileModel.js
│   ├── utils/
│   │   └── concurrencyLimiter.js
│   ├── converters/
│   │   ├── index.js                  (conversion router)
│   │   ├── types.js
│   │   ├── base.js
│   │   ├── libreoffice.js
│   │   ├── office-to-pdf.js
│   │   ├── pdf-to-word.js, word-to-pdf.js, pdf-to-image.js, image-to-pdf.js
│   │   ├── image-to-image.js, html-to-pdf.js, text-to-pdf.js
│   │   ├── csv-to-xlsx.js, excel-to-csv.js, rtf-to-docx.js
│   │   ├── word-to-text.js, word-to-html.js
│   │   ├── pdf-to-excel.js, pdf-to-pptx.js, pdf-to-text.js
│   │   ├── pdf-to-html.js, pdf-to-pdfa.js
│   │   ├── pdf-merger.js, pdf-splitter.js, pdf-organizer.js
│   │   └── *.py (Python worker scripts)
│   ├── compression/
│   │   ├── index.js                  (compression router)
│   │   ├── types.js
│   │   ├── BaseCompressor.js (+ test)
│   │   ├── PDFCompressor.js
│   │   ├── JPGCompressor.js
│   │   ├── PNGCompressor.js
│   │   ├── WEBPCompressor.js
│   │   ├── BulkImageCompressor.js
│   │   ├── pdf_compressor.py
│   │   └── image_compressor.py
│   ├── scripts/
│   │   ├── setup-python.mjs
│   │   └── setup-libreoffice.mjs
│   ├── pdf_converter.py, pdf_merger.py, pdf_splitter.py
│   ├── pdf_organizer.py (+ test)
│   ├── background_remover.py, background_remover_worker.py
│   ├── libreoffice_worker.py
│   ├── temp/                         (runtime temp dir)
│   └── *.pdf, *.jpg, *.docx, etc.    (test fixtures)
├── frontend/
│   ├── .env                          (API base URL)
│   ├── package.json
│   ├── next.config.js
│   ├── app/
│   │   ├── layout.tsx, page.tsx, sitemap.ts
│   │   ├── about/, contact/, privacy/, terms/, blog/ (38 posts)
│   │   ├── pdf/merge/, organize/, split/
│   │   ├── compression/jpg/, pdf/, png/, webp/
│   │   ├── image-tools/background-remover/
│   │   ├── conversion/<~28 tool dirs>/
│   │   ├── editor/
│   │   └── api/
│   │       ├── send/, receive/, stats/
│   │       ├── convert-pdf-to-docx/, convert-to-docx/, convert-to-html/
│   │       ├── convert-to-pdf/ (empty dir)
│   │       <convert/: 7 subdirs, no route.ts>
│   │       └── proxy-file/
│   ├── components/
│   │   ├── Navbar, UploadCard, ReceiveCard, FileUpload, ...
│   ├── lib/
│   │   ├── site.ts, pdf/to-docx.ts
│   │   ├── editor/extensions.ts, html-to-docx.ts, ...
│   │   ├── exports/index.ts, parsers/index.ts
│   ├── utils/api.ts                  (frontend API client)
│   └── public/
│       ├── robots.txt, BingSiteAuth.xml
├── docs/
│   └── technical-audit/              (target output dir - empty)
├── test_pdfs/
├── package.json, package-lock.json   (root)
├── nixpacks.toml                     (prior Render/Nixpacks deploy)
├── railway.json                      (prior Railway/Nixpacks deploy)
└── .gitignore
```

---

## 5. Backend Stack

**Runtime:** Node.js (Express.js v5)  
**Entry point:** `backend/server.js` (2080 lines)

### Key dependencies (`backend/package.json`)
- `express` (v5) - web framework
- `mongoose` - MongoDB ODM
- `multer` - multipart file upload (memory storage via `multer.memoryStorage()`)
- `@supabase/supabase-js` - Supabase client
- `@aws-sdk/client-s3` - Cloudflare R2 S3-compatible storage
- `archiver` - ZIP archive creation
- `node-cron` - scheduled cleanup jobs
- `cors`, `dotenv`, `helmet` (verification needed - helmets presence not confirmed in read excerpt)
- `pdf-lib`, `mammoth`, `jspdf` - frontend conversion libs (listed under frontend)

### Architecture
- Single monolithic Express app in `server.js`
- Route handlers defined inline in `server.js`
- `converters/index.js` exports a `router` object with `.convert()` and `.convertMultiple()` methods delegating to format-specific converter modules
- `compression/index.js` exports `getCompressionRouter()` returning an object with `.compress()`, `.compressBulk()`, `.getCompressor()`, `.getBulkSupportedFormats()`
- File storage: Supabase (primary) + Cloudflare R2 (fallback/secondary), configured in `config/supabase.js` and `config/r2.js`
- Concurrency limiting via `utils/concurrencyLimiter.js`
- Python workers invoked via `child_process` for PDF conversion/compression and background removal
- LibreOffice used for office↔PDF conversion (`libreoffice_worker.py`, `setup-libreoffice.mjs`)

### Concurrency model
- `concurrencyLimiter.js` (partially read) appears to limit concurrent Python worker processes to avoid resource exhaustion on the VPS

---

## 6. Frontend Stack

**Framework:** Next.js v14.2.5 (App Router, React)  
**Entry:** `frontend/next.config.js`  
**Key dependencies (`frontend/package.json`):**
- `next` 14.2.5, `react`, `react-dom`
- `@tiptap/*` - rich text editor (document editor)
- `mammoth` - DOCX→HTML (frontend-side)
- `pdf-lib` - PDF manipulation
- `jspdf` - PDF generation
- `lucide-react` - icons
- `clsx`, `tailwind-merge` - styling utilities

### Styling
- Inline styles + CSS variables (`var(--primary-teal)`, `var(--bg-main)`, etc.) — no Tailwind config confirmed in read files; className usage minimal
- Design tokens referenced but source not verified

### API base URL
- `frontend/utils/api.ts`: defaults to `https://zipdrop.onrender.com`
- `frontend/.env`: `http://localhost:5000` (per work state; value not exposed)
- `frontend/app/api/send/route.ts`: `process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"`

---

## 7. Python Workers

Located in `backend/` and invoked via `child_process`:

| Script | Purpose | Key libs |
|--------|---------|----------|
| `pdf_converter.py` | PDF format conversion | pypdf, pdf2docx, pikepdf, PyMuPDF |
| `pdf_merger.py` | Merge PDFs | pypdf |
| `pdf_splitter.py` | Split PDFs | pypdf |
| `pdf_organizer.py` | Reorder/rotate/delete pages | pypdf, PyMuPDF |
| `compression/pdf_compressor.py` | PDF compression | pikepdf, pypdf |
| `compression/image_compressor.py` | Image compression | pillow, rembg? |
| `background_remover.py` | Background removal (sync) | rembg, onnxruntime |
| `background_remover_worker.py` | Background removal (worker) | rembg |
| `libreoffice_worker.py` | Office↔PDF via LibreOffice | subprocess (libreoffice) |

### Python dependencies (`backend/requirements.txt`)
pypdf, pdf2docx, rembg, onnxruntime, pikepdf, PyMuPDF (fitz), pillow, reportlab, playwright, and others (full list not exhaustively verified).

### Setup scripts
- `backend/scripts/setup-python.mjs` - installs Python deps
- `backend/scripts/setup-libreoffice.mjs` - installs LibreOffice

---

## 8. Storage Layer

| Storage | Purpose | Config file |
|---------|---------|-------------|
| MongoDB (Mongoose) | File share metadata (FileModel) | `backend/models/FileModel.js` |
| Supabase | Primary file storage (URLs) | `backend/config/supabase.js` |
| Cloudflare R2 | Secondary S3-compatible storage | `backend/config/r2.js` |

**FileModel.js** (`backend/models/FileModel.js`): Mongoose schema for file sharing records with fields including `file_id`, `file_name`, `file_url`, `files`, `download_count`, and text-share support (`file_name === "text"`).

Files are stored in memory (`multer.memoryStorage()`) then streamed to Supabase/R2; download URLs returned to client.

---

## 9. File Sharing Feature

### Backend routes (`backend/server.js`)
- `POST /upload` - upload file(s), returns share code
- `POST /share-text` - share plain text, returns code
- `POST /resend` - resend/re-share a file
- `GET /receive/:code` - retrieve file(s) or text by code; increments `download_count`

### Frontend API routes
- `frontend/app/api/send/route.ts` - POST, proxies to `BACKEND/resend`
- `frontend/app/api/stats/route.ts` - GET, proxies to `BACKEND/stats` (shows stats only if files>=100 and transfers>=50)

### Frontend client (`frontend/utils/api.ts`)
- `uploadFile(formData)` → `POST /upload`
- `shareText(text)` → `POST /share-text`
- `receiveData(code)` → `GET /receive/:code`

### Frontend pages
- Share page (send), Receive page (receive) — exact routes not fully enumerated

### Limits
- `MAX_FILES_PER_TRANSFER=10` (from `frontend/lib/site.ts`, value owner-provided/not directly verified)

---

## 10. Conversion Feature

### Backend routes (`backend/server.js`, lines 1623–1801)
All use `upload.single("file")` and delegate to `handleConversion(req, res, '<type>')`:

| Endpoint | Converter type |
|----------|---------------|
| `POST /convert/pdf-to-word` | pdf-to-docx |
| `POST /convert/word-to-pdf` | docx-to-pdf |
| `POST /convert/excel-to-pdf` | xlsx-to-pdf |
| `POST /convert/powerpoint-to-pdf` | pptx-to-pdf |
| `POST /convert/pdf-to-jpg` | pdf-to-jpg |
| `POST /convert/pdf-to-png` | pdf-to-png |
| `POST /convert/pdf-to-excel` | pdf-to-xlsx |
| `POST /convert/pdf-to-powerpoint` | pdf-to-pptx |
| `POST /convert/pdf-to-text` | pdf-to-txt |
| `POST /convert/pdf-to-html` | pdf-to-html |
| `POST /convert/pdf-to-pdfa` | pdf-to-pdfa |
| `POST /convert/word-to-text` | docx-to-txt |
| `POST /convert/word-to-html` | docx-to-html |
| `POST /convert/excel-to-csv` | xlsx-to-csv |
| `POST /convert/text-to-pdf` | txt-to-pdf |
| `POST /convert/html-to-pdf` | html-to-pdf |
| `POST /convert/csv-to-excel` | csv-to-xlsx |
| `POST /convert/rtf-to-word` | rtf-to-docx |
| `POST /convert/jpg-to-pdf` | jpg-to-pdf |
| `POST /convert/png-to-pdf` | png-to-pdf |
| `POST /convert/images-to-pdf` | `router.convertMultiple()` (multi-file, upload.array 20) |
| `POST /convert/jpg-to-png` | jpg-to-png |
| `POST /convert/png-to-jpg` | png-to-jpg |
| `POST /convert/webp-to-jpg` | webp-to-jpg |
| `POST /convert/jpg-to-webp` | jpg-to-webp |
| `POST /convert/png-to-webp` | png-to-webp |
| `POST /convert/svg-to-png` | svg-to-png |

Total: **27 conversion endpoints**

### Frontend API routes
- `frontend/app/api/convert-pdf-to-docx/route.ts` - POST, 50 MB limit, validates PDF signature, uses `@/lib/pdf/to-docx`
- `frontend/app/api/convert-to-docx/route.ts` - POST, HTML→DOCX via `htmlToDocx`, mammoth
- `frontend/app/api/convert-to-html/route.ts` - POST, DOCX→HTML via mammoth, fetches fileUrl
- `frontend/app/api/convert/` - directory with 7 subdirs (images-to-pdf, jpg-to-pdf, pdf-to-jpg, pdf-to-png, pdf-to-word, png-to-pdf, word-to-pdf); no route.ts found (may be route segments or placeholder)
- `frontend/app/api/convert-to-pdf/` - empty directory

### Frontend conversion page
- `frontend/app/conversion/page.tsx` - 24 tools across 4 categories (PDF Conversions, Office to PDF, Office Other, Image Conversions, Other Conversions)

---

## 11. Compression Feature

### Backend routes (`backend/server.js`, lines 1919–2006)
| Endpoint | Format | Notes |
|----------|--------|-------|
| `POST /compress/pdf` | pdf | 3 levels |
| `POST /compress/jpg` | jpg | quality presets |
| `POST /compress/png` | png | lossless/optimized |
| `POST /compress/webp` | webp | lossy/lossless |
| `POST /compress/images/bulk` | images (up to 50) | ZIP output, mixed formats |

### Health check
- `GET /health/compression` - checks PDF + image compressor tooling

### Compression modules (`backend/compression/`)
- `BaseCompressor.js` (+ `BaseCompressor.test.js`)
- `PDFCompressor.js` (uses `pdf_compressor.py`)
- `JPGCompressor.js`, `PNGCompressor.js`, `WEBPCompressor.js` (use `image_compressor.py`)
- `BulkImageCompressor.js` (ZIP archive output)

### Error codes
`INVALID_INPUT`, `UNSUPPORTED_FORMAT`, `FILE_TOO_LARGE`, `PASSWORD_PROTECTED`, `CORRUPTED_FILE`, `MISSING_DEPENDENCY`, `ZIP_CREATION_FAILED`

### Frontend client (`frontend/utils/api.ts`)
- `compressPdf`, `compressJpg`, `compressPng`, `compressWebp`, `compressBulkImages`, `checkCompressionHealth`

### Frontend compression page
- `frontend/app/compression/page.tsx` - 7 tools across 5 categories; 4 available, 3 coming-soon document compression + 2 ZIP archive tools coming soon

---

## 12. PDF Tools Feature

### Backend JS modules
- `backend/pdf-merger.js` - PDF merge
- `backend/pdf-splitter.js` - PDF split (ranges, every_n, every_page modes)
- `backend/pdf-organizer.js` - PDF organize (reorder, rotate, delete pages)

### Backend routes (inferred from frontend client)
- `POST /pdf/merge` - merge multiple PDFs → single PDF
- `POST /pdf/split` - split PDF → ZIP of page PDFs
- `POST /pdf/organize` - reorder/rotate/delete pages → single PDF

### Frontend client (`frontend/utils/api.ts`)
- `mergePdf(files)` → `POST /pdf/merge`
- `splitPdf(file, config)` → `POST /pdf/split`
- `organizePdf(file, pages)` → `POST /pdf/organize`

### Frontend pages
- `frontend/app/pdf/merge/`, `frontend/app/pdf/organize/`, `frontend/app/pdf/split/`

---

## 13. Background Removal Feature

### Backend
- `backend/background_remover.py` - sync background removal via rembg
- `backend/background_remover_worker.py` - worker variant
- Backend route: `POST /image-tools/remove-background` (referenced in frontend client; route definition in server.js not fully verified in read excerpts)

### Frontend client (`frontend/utils/api.ts`)
- `removeBackground(file, options)` → `POST /image-tools/remove-background`
- `checkBackgroundRemoverHealth()` → `GET /health/background-remover`

### Frontend page
- `frontend/app/image-tools/background-remover/page.tsx` + `layout.tsx`

### Tech: rembg + onnxruntime (AI model download required on first run)

---

## 14. Document Editor Feature

### Frontend
- `frontend/app/editor/page.tsx` (route dir exists)
- `frontend/lib/editor/extensions.ts` - Tiptap extensions
- `frontend/lib/editor/html-to-docx.ts` - HTML→DOCX conversion (`htmlToDocx`)
- `frontend/lib/editor/page-editor-adapter.ts`
- `frontend/lib/editor/paginated-types.ts`
- `frontend/lib/exports/index.ts`
- `frontend/lib/parsers/index.ts`

### Frontend API routes
- `frontend/app/api/share-edited/route.ts` - POST, converts edited HTML to DOCX, shares via backend `/resend`
- `frontend/app/api/convert-to-docx/route.ts` - HTML→DOCX
- `frontend/app/api/convert-to-html/route.ts` - DOCX→HTML (mammoth)

---

## 15. Blog & Content

- `frontend/app/blog/` - 38 post directories (blog content)
- `frontend/app/sitemap.ts` - dynamic sitemap generation
- `frontend/app/about/`, `contact/`, `privacy/`, `terms/` - static pages
- `frontend/public/robots.txt` - allows all, disallows `/api/`, `/_next/`, `/_vercel/`; sitemap at `https://www.getzipdrop.com/sitemap.xml`
- `frontend/public/BingSiteAuth.xml` - Bing Webmaster verification (E3BF2630B92029BFAB9FE966737F8D27)

---

## 16. API Routes (Backend)

All routes in `backend/server.js`. Base URL: backend (default `https://zipdrop.onrender.com` per frontend env; localhost:5000 in dev).

### File Sharing
| Method | Path | Description |
|--------|------|-------------|
| POST | `/upload` | Upload file(s), get share code |
| POST | `/share-text` | Share plain text |
| POST | `/resend` | Re-share a file |
| GET | `/receive/:code` | Get file(s) or text by code |

### Conversion
| Method | Path | Description |
|--------|------|-------------|
| POST | `/convert/*` | 27 conversion endpoints (see section 10) |
| POST | `/convert/images-to-pdf` | Multi-file (up to 20) images→PDF |

### Compression
| Method | Path | Description |
|--------|------|-------------|
| POST | `/compress/pdf` | Compress PDF |
| POST | `/compress/jpg` | Compress JPG |
| POST | `/compress/png` | Compress PNG |
| POST | `/compress/webp` | Compress WEBP |
| POST | `/compress/images/bulk` | Bulk image compress → ZIP (up to 50) |
| GET | `/health/compression` | Compression health check |

### PDF Tools
| Method | Path | Description |
|--------|------|-------------|
| POST | `/pdf/merge` | Merge PDFs |
| POST | `/pdf/split` | Split PDF |
| POST | `/pdf/organize` | Organize PDF pages |

### Image Tools
| Method | Path | Description |
|--------|------|-------------|
| POST | `/image-tools/remove-background` | Remove image background (referenced) |

### Stats
| Method | Path | Description |
|--------|------|-------------|
| GET | `/stats` | Site stats (files, transfers) |

### Error handling
- Global error handler (after all routes) sets CORS headers on errors
- 404 handler sets CORS headers
- Structured error responses: `{ error, code }`
- HTTP status mapping: 400 (invalid/unsupported/password/corrupted), 413 (file too large), 503 (missing dependency), 500 (generic)

### CORS
- Origin-based allowlist (`allowedOriginSet`, `normalizeOrigin`)
- Credentials enabled
- Exposed headers: compression stats headers (X-Original-Size, etc.)

---

## 17. API Routes (Frontend Next.js API Routes)

All under `frontend/app/api/`. Base: `NEXT_PUBLIC_API_URL || http://localhost:5000`.

| Route | Method | Description |
|-------|--------|-------------|
| `send/route.ts` | POST | Proxy file upload to backend `/resend` |
| `share-edited/route.ts` | POST | Convert edited HTML→DOCX, share via backend |
| `stats/route.ts` | GET | Proxy backend `/stats` (conditional visibility) |
| `proxy-file/route.ts` | GET/HEAD | Proxy Supabase file URLs (allowlist: supabase.co, supabase.in) |
| `convert-pdf-to-docx/route.ts` | POST | PDF→DOCX (50 MB limit, signature validation) |
| `convert-to-docx/route.ts` | POST | HTML→DOCX |
| `convert-to-html/route.ts` | POST | DOCX→HTML (mammoth) |
| `convert-to-pdf/` | (empty dir) | no route |
| `convert/<7 subdirs>/` | (no route.ts) | images-to-pdf, jpg-to-pdf, pdf-to-jpg, pdf-to-png, pdf-to-word, png-to-pdf, word-to-pdf |

---

## 18. Frontend Pages & Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/about/` | About page |
| `/contact/` | Contact page |
| `/privacy/` | Privacy policy |
| `/terms/` | Terms of service |
| `/blog/[slug]/` | 38 blog posts |
| `/pdf/merge/` | PDF merge tool |
| `/pdf/organize/` | PDF organize tool |
| `/pdf/split/` | PDF split tool |
| `/compression/jpg/` | Compress JPG |
| `/compression/pdf/` | Compress PDF |
| `/compression/png/` | Compress PNG |
| `/compression/webp/` | Compress WEBP |
| `/image-tools/background-remover/` | Background removal |
| `/conversion/<~28 tools>/` | Conversion tools (see conversion/page.tsx) |
| `/editor/` | Document editor |

Key components: `Navbar`, `UploadCard`, `ReceiveCard`, `FileUpload`

---

## 19. Environment Configuration

### `backend/.env`
Contains actual secrets: `MONGO_URI`, `SUPABASE_URL`, `SUPABASE_KEY`, R2 credentials. **Must not be exposed or committed.** No `.env.example` exists.

### `frontend/.env`
API base URL (`http://localhost:5000` per work state; value not exposed).

### Missing
- No `.env.example` in backend or frontend
- No `docker-compose.yml`, no `Dockerfile` found
- No `.env.production` confirmed

---

## 20. Deployment History

| Config | Purpose | Builder | Target |
|--------|---------|---------|--------|
| `nixpacks.toml` | Prior deployment | Nixpacks | Render (`node backend/server.js`) |
| `railway.json` | Prior deployment | Nixpacks builder | Railway |

Both indicate past attempts at PaaS deployment (Render, Railway). Current plan is self-hosted VPS (BigRock AlmaLinux 9). No Dockerfiles present, so VPS deployment would require manual setup or Nixpacks on the VPS.

---

## 21. Security Observations

### Concerns (verified from code)
1. **Secrets in `.env`**: `backend/.env` contains `MONGO_URI`, `SUPABASE_URL`, `SUPABASE_KEY`. Must be excluded from git (verify `.gitignore`) and never committed.
2. **File upload via memory storage**: `multer.memoryStorage()` holds entire files in RAM — risk of OOM on large uploads on an 8 GB VPS.
3. **Bulk upload**: `upload.array("files", 50)` and `upload.array("files", 20)` — multiple large files could exhaust memory.
4. **No rate limiting confirmed**: No express-rate-limit observed in read excerpts (unverified).
5. **No authentication/authorization confirmed**: File sharing appears open (code-based access only).
6. **CORS origin allowlist**: Present but allowlist contents not fully verified.
7. **`proxy-file/route.ts` allowlist**: Only allows `supabase.co` / `supabase.in` hostnames — reasonable restriction.
8. **PDF signature validation**: `convert-pdf-to-docx/route.ts` validates `%PDF-` header (good).
9. **DOCX magic byte check**: `convert-to-html/route.ts` checks ZIP magic bytes `PK` (good).
10. **No CSRF protection confirmed**: unverified.
11. **No helmet/security headers confirmed**: unverified (helmet listed as possible dependency but not confirmed in use).

### Positive
- Input validation on PDF/DOCX uploads
- Structured error codes
- CORS restricted to allowlist
- robots.txt disallows `/api/`

---

## 22. Performance Characteristics

### Strengths
- Memory storage (`multer.memoryStorage()`) avoids disk I/O for small files
- Concurrency limiter for Python workers prevents oversubscription
- Compression stats returned in response headers (X-Original-Size, etc.)
- Bulk ZIP output for multiple images

### Risks / Unknowns
- Memory-based uploads risk OOM under concurrent large uploads (8 GB RAM VPS)
- Python worker startup overhead (rembg downloads ONNX models on first run)
- LibreOffice spawn for office conversions is heavy
- No CDN confirmed; single VPS in one region
- No image optimization/CDN for static assets confirmed
- No database connection pooling details confirmed (Mongoose default)

---

## 23. Error Handling

### Backend (`server.js`)
- Global error handler: sets CORS headers, responds `{ error, code }` with appropriate status
- 404 handler: sets CORS headers, responds `{ error: "Not found", code: "NOT_FOUND" }`
- Per-endpoint try/catch with status mapping:
  - `INVALID_INPUT` / `UNSUPPORTED_FORMAT` → 400
  - `FILE_TOO_LARGE` → 413
  - `PASSWORD_PROTECTED` / `CORRUPTED_FILE` → 400
  - `MISSING_DEPENDENCY` → 503
  - `ZIP_CREATION_FAILED` → 500
  - default → 500
- Compression error responses include optional `detail` field

### Frontend (`utils/api.ts`)
- Each client function throws `Error(errorData.error || \`Failed: \${status}\`)`
- API routes return `NextResponse.json({ error }, { status })`

### Inconsistency
- `stats/route.ts` returns `{ visible: false }` on failure rather than throwing (intentional, for UI conditional display)

---

## 24. Testing & Quality Assareness

### Test files found
| File | Purpose |
|------|---------|
| `backend/compression/BaseCompressor.test.js` | BaseCompressor unit tests |
| `backend/pdf_organizer_test.js` | PDF organizer tests |

### Coverage assessment
- **Minimal**: only 2 test files identified across backend + frontend
- No frontend component/page tests found
- No API integration tests found
- No Python worker tests found
- No test runner config confirmed (jest/vitest not verified)

### Test fixtures
`backend/` contains test files: `test_upload.txt`, `test.txt`, `test.html`, `test.csv`, `test.rtf`, `test.xls`, `test.xlsx`, `test_single.xlsx`, `test_image.jpg`, `test_image.webp`, `test_logo_white_bg.jpg`, `test_docx.docx`, `test_rtf_output.docx`, `test_output.txt`, `test_output.xlsx`, `test_bulk_compressed.zip`, `test_csv_api.zip`, `test_html_api.zip`, `out_test.pdf`, `api_output.pdf`, plus "bad" PDFs (`bad_corrupt.pdf`, `bad_empty.pdf`, `bad_notpdf.pdf`, `bad_protected.pdf`) for error-case testing.

---

## 25. CI/CD & DevOps

### CI/CD
- No `.github/workflows/`, no `.gitlab-ci.yml`, no `Jenkinsfile` found
- No CI pipeline configured in repository

### Deployment configs
- `nixpacks.toml` - Nixpacks (Render target)
- `railway.json` - Nixpacks builder (Railway target)
- `backend/nodemon.json` - dev auto-restart

### Containerization
- No `Dockerfile`, no `docker-compose.yml` found
- VPS deployment would require manual provisioning or Nixpacks on AlmaLinux 9

### Process management
- `nodemon.json` suggests development-only auto-restart; no PM2/systemd config confirmed

---

## 26. Technical Debt & Risks

| # | Issue | Severity | Evidence |
|---|-------|----------|----------|
| 1 | No `.env.example`; secrets in `.env` | High | File inspection |
| 2 | No test coverage (2 test files only) | High | File inventory |
| 3 | No CI/CD pipeline | Medium | No workflow files |
| 4 | Memory-based file uploads (multer.memoryStorage) | High | server.js multer config |
| 5 | No Dockerfiles for VPS deployment | Medium | File inventory |
| 6 | `convert-to-pdf/` and `convert/` API dirs lack route.ts | Low | Empty/missing route files |
| 7 | Frontend API base defaults to render.com URL; `.env` says localhost:5000 | Medium | api.ts, send/route.ts |
| 8 | "Coming Soon" UI items without backend parity confirmed | Medium | compression/page.tsx |
| 9 | Secrets potentially committed (repo status clean but .env present) | High | .env present in working tree |
| 10 | No rate limiting confirmed | Medium | Not observed in server.js excerpts |
| 11 | No authN/authZ layer confirmed | Medium | Code-based sharing only |

---

## 27. Strengths

| # | Strength | Evidence |
|---|----------|----------|
| 1 | Broad feature set (share, convert, compress, PDF tools, background removal, editor) | Route inventory, pages |
| 2 | Structured error codes and HTTP status mapping | server.js error handlers |
| 3 | Input validation (PDF signature, DOCX magic bytes) | convert-pdf-to-docx, convert-to-html |
| 4 | CORS allowlist with credentials | server.js global handler |
| 5 | Compression stats in response headers | server.js, api.ts |
| 6 | robots.txt + sitemap + Bing verification | public/ |
| 7 | Dual storage (Supabase + R2) | config/ |
| 8 | Concurrency limiter for Python workers | utils/concurrencyLimiter.js |
| 9 | Test fixtures for error cases (bad PDFs) | backend/ |
| 10 | Next.js 14 App Router (modern frontend) | frontend/package.json |

---

## 28. Recommendations

### Immediate (before VPS deployment)
1. **Create `.env.example`** with placeholder values; ensure `backend/.env` and `frontend/.env` are in `.gitignore`; rotate any secrets already committed.
2. **Add rate limiting** (express-rate-limit) on upload/convert/compression endpoints.
3. **Switch multer to disk storage or streaming** for large files to avoid OOM on 8 GB VPS.
4. **Add test coverage** targeting conversion/compression endpoints and Python workers.
5. **Add CI pipeline** (GitHub Actions) running lint + tests.
6. **Add Dockerfile + docker-compose.yml** for reproducible VPS deployment.
7. **Add process manager** (PM2 or systemd) config for production.
8. **Add security headers** (helmet) and verify CORS allowlist contents.
9. **Implement authentication** if user accounts / private sharing are required.

### Short-term
10. **Implement missing route.ts files** in `convert/` and `convert-to-pdf/` API dirs or remove empty dirs.
11. **Align frontend API base URL** between `.env` (localhost:5000) and `api.ts` default (render.com).
12. **Add `.env.production`** for VPS environment variables.
13. **Document API** with OpenAPI/Swagger or maintain this API_REFERENCE.
14. **Add health check endpoints** for database and storage connectivity.
15. **Add monitoring/logging** (structured logs, request IDs).

### Long-term
16. **User accounts & authentication** (email/password or OAuth).
17. **File expiration / deletion policy** for shared files.
18. **Usage analytics** beyond simple file/transfer counts.
19. **Async job queue** (BullMQ/Redis) for long-running conversions.
20. **File size limits** enforced at both frontend and backend.

---

## 29. File Inventory

### Backend (key files)
`server.js` (2080 lines), `package.json`, `requirements.txt`, `nodemon.json`, `config/supabase.js`, `config/r2.js`, `models/FileModel.js`, `utils/concurrencyLimiter.js`, `converters/index.js`, `converters/types.js`, `converters/base.js`, `converters/libreoffice.js`, `converters/office-to-pdf.js`, `converters/pdf-to-word.js`, `converters/word-to-pdf.js`, `converters/pdf-to-image.js`, `converters/image-to-pdf.js`, `converters/image-to-image.js`, `converters/html-to-pdf.js`, `converters/text-to-pdf.js`, `converters/csv-to-xlsx.js`, `converters/excel-to-csv.js`, `converters/rtf-to-docx.js`, `converters/word-to-text.js`, `converters/word-to-html.js`, `converters/pdf-to-excel.js`, `converters/pdf-to-pptx.js`, `converters/pdf-to-text.js`, `converters/pdf-to-html.js`, `converters/pdf-to-pdfa.js`, `converters/pdf-merger.js`, `converters/pdf-splitter.js`, `converters/pdf-organizer.js`, `compression/index.js`, `compression/types.js`, `compression/BaseCompressor.js`, `compression/BaseCompressor.test.js`, `compression/PDFCompressor.js`, `compression/JPGCompressor.js`, `compression/PNGCompressor.js`, `compression/WEBPCompressor.js`, `compression/BulkImageCompressor.js`, `compression/pdf_compressor.py`, `compression/image_compressor.py`, `pdf_converter.py`, `pdf_merger.py`, `pdf_splitter.py`, `pdf_organizer.py`, `pdf_organizer_test.js`, `background_remover.py`, `background_remover_worker.py`, `libreoffice_worker.py`, `scripts/setup-python.mjs`, `scripts/setup-libreoffice.mjs`, `.env`, `.gitignore`

### Frontend (key files)
`package.json`, `next.config.js`, `app/layout.tsx`, `app/page.tsx`, `app/sitemap.ts`, `app/api/send/route.ts`, `app/api/share-edited/route.ts`, `app/api/stats/route.ts`, `app/api/proxy-file/route.ts`, `app/api/convert-pdf-to-docx/route.ts`, `app/api/convert-to-docx/route.ts`, `app/api/convert-to-html/route.ts`, `app/conversion/page.tsx`, `app/compression/page.tsx`, `app/image-tools/background-remover/page.tsx`, `components/Navbar.tsx`, `components/UploadCard.tsx`, `components/ReceiveCard.tsx`, `components/FileUpload.tsx`, `lib/site.ts`, `lib/pdf/to-docx.ts`, `lib/editor/extensions.ts`, `lib/editor/html-to-docx.ts`, `lib/editor/page-editor-adapter.ts`, `lib/editor/paginated-types.ts`, `lib/exports/index.ts`, `lib/parsers/index.ts`, `utils/api.ts`, `public/robots.txt`, `public/BingSiteAuth.xml`, `.env`, `.gitignore`

### Root
`package.json`, `package-lock.json`, `nixpacks.toml`, `railway.json`, `.gitignore`, `docs/technical-audit/` (empty - target for this audit), `test_pdfs/`

---

## 30. Unverified / Estimate Claims

The following items were not directly verified from source code and are marked as owner-provided, estimate, or unverified:

- Domain `getzipdrop.com`, registrar Spaceship, monetization Google AdSense — owner-provided
- BigRock NVMe 8 VPS specs (4 vCPU, 8 GB RAM, 200 GB NVMe, AlmaLinux 9) — owner-provided
- `MAX_FILES_PER_TRANSFER=10` — from `frontend/lib/site.ts` but value not directly confirmed in read excerpt
- `helmet` usage — listed as possible dependency but not confirmed in server.js excerpts
- Rate limiting — not observed in server.js excerpts; unverified
- Authentication/authorization layer — not confirmed; code-based sharing only
- CORS allowlist contents — mechanism confirmed, contents not fully read
- `frontend/.env` exact value — reported as `http://localhost:5000` but not exposed
- `backend/.env` exact values — not exposed (secrets)
- Test runner (jest/vitest) — not confirmed
- `convert/` API subdirs lacking `route.ts` — directories exist, no route.ts found
- `convert-to-pdf/` empty directory — confirmed empty
- Blog post count (38) — directory count observed, content not read
- `nodemon.json` contents — not read
- `.gitignore` contents — not read (assumed excludes node_modules, .env, .venv, temp/)

---

## 31. Conclusion

ZipDrop is a feature-rich, early-stage production codebase with a solid foundation: Express backend, Next.js 14 frontend, Python workers for heavy processing, dual cloud storage, structured error handling, and a broad feature set covering sharing, conversion, compression, PDF tools, background removal, and document editing.

**Critical gaps before VPS deployment:** secrets management (`.env.example` + gitignore), test coverage, CI/CD, containerization (Dockerfile), memory-based upload risks, and rate limiting. The codebase is functionally usable for core sharing and conversion but requires hardening, security review, and operational tooling to be production-ready on the planned BigRock AlmaLinux 9 VPS.

---

*End of report. Generated by Kilo automated technical audit. All claims sourced from repository inspection unless marked owner-provided/unverified/estimate.*

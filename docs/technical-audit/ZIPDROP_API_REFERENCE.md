# ZipDrop API Reference

**Project:** ZipDrop  
**Generated:** 2026-11-25  
**Source:** `backend/server.js` (Express) and `frontend/app/api/` (Next.js routes)  
**Base URL:** Backend default `https://zipdrop.onrender.com` (frontend `api.ts`); dev `http://localhost:5000` (frontend `.env` reported). Actual value not exposed — check `frontend/.env` and `backend/.env`.  
**Status:** Evidence-backed unless marked estimate/unverified

---

## Table of Contents

1. [Authentication & Security](#1-authentication--security)
2. [Common Error Codes](#2-common-error-codes)
3. [Response Headers (Compression)](#3-response-headers-compression)
4. [File Sharing API](#4-file-sharing-api)
5. [Conversion API](#5-conversion-api)
6. [Compression API](#6-compression-api)
7. [PDF Tools API](#7-pdf-tools-api)
8. [Image Tools API](#8-image-tools-api)
9. [Stats API](#9-stats-api)
10. [Frontend API Routes (Next.js)](#10-frontend-api-routes-nextjs)
11. [Frontend API Client (`utils/api.ts`)](#11-frontend-api-client-utilsapi-ts)
12. [Error Response Format](#12-error-response-format)
13. [Examples](#13-examples)

---

## 1. Authentication & Security

- **Authentication:** None confirmed. File sharing is code-based (public-by-code). Anyone with a `file_id` code can `GET /receive/:code`.
- **CORS:** Origin allowlist (`allowedOriginSet`) with `Access-Control-Allow-Credentials: true`. Exposed headers include compression stats headers.
- **Proxy allowlist:** `proxy-file/route.ts` only proxies URLs ending in `supabase.co` or `supabase.in`.
- **Input validation:** PDF signature (`%PDF-`) validated in `convert-pdf-to-docx/route.ts`; DOCX ZIP magic bytes (`PK`) validated in `convert-to-html/route.ts`.
- **Rate limiting:** Not confirmed present in `server.js` excerpts.

---

## 2. Common Error Codes

| Code | HTTP Status | Meaning |
|------|-------------|---------|
| `INVALID_INPUT` | 400 | Invalid or missing input |
| `UNSUPPORTED_FORMAT` | 400 | File format not supported |
| `FILE_TOO_LARGE` | 413 | File exceeds size limit |
| `PASSWORD_PROTECTED` | 400 | File is password-protected |
| `CORRUPTED_FILE` | 400 | File is corrupted |
| `MISSING_DEPENDENCY` | 503 | Required tool/library missing |
| `ZIP_CREATION_FAILED` | 500 | ZIP archive creation failed |
| `NOT_FOUND` | 404 | Route or resource not found |
| (generic) | 500 | Internal server error |

---

## 3. Response Headers (Compression Endpoints)

Compression endpoints return file body + stats in headers:

| Header | Description |
|--------|-------------|
| `Content-Type` | MIME type of output |
| `Content-Disposition` | `attachment; filename="..."` |
| `Content-Length` | Output body length |
| `X-Original-Size` | Original file size (bytes) |
| `X-Compressed-Size` | Compressed file size (bytes) |
| `X-Bytes-Saved` | Bytes saved |
| `X-Reduction-Percent` | Reduction percentage |
| `X-Compression-Level` | Level used (PDF/JPG/etc.) |
| `X-Compression-Mode` | Mode used |
| `X-Quality` | Quality setting |
| `X-Compression-Method` | Method used |
| `X-Warning` | Non-fatal warning |
| `X-Page-Count` | Page count (PDF) |
| `X-Width` / `X-Height` | Image dimensions |
| `X-Total-Files` / `X-Successful` / `X-Failed` | Bulk operation counts |
| `X-Total-Original-Size` / `X-Total-Compressed-Size` / `X-Total-Bytes-Saved` / `X-Total-Reduction-Percent` | Bulk aggregates |

---

## 4. File Sharing API

### 4.1 POST /upload

Upload file(s) and receive a share code.

**Request:** `multipart/form-data`, field `file`  
**Response:** JSON `{ code, file_url, ... }` (exact shape inferred from FileModel + handler)

### 4.2 POST /share-text

Share plain text and receive a share code.

**Request:** `application/json`, body `{ text: string }`  
**Response:** JSON `{ code, ... }`

### 4.3 POST /resend

Re-share a file (used by frontend `/api/send` and `/api/share-edited`).

**Request:** `multipart/form-data`, fields `file`, optional `recipientCode`  
**Response:** JSON `{ code, file_url, ... }`

### 4.4 GET /receive/:code

Retrieve file(s) or text by share code. Increments `download_count`.

**Path params:** `code` (string)

**Success response:**
```json
{
  "type": "files",
  "files": [ { ...file objects... } ]
}
```
or for text:
```json
{
  "type": "text",
  "text": "<text content>"
}
```

**Error:** `404 { message: "Invalid code" }` if not found; `500` on server error.

---

## 5. Conversion API

All conversion endpoints use `upload.single("file")` except `/convert/images-to-pdf` which uses `upload.array("files", 20)`.

**Request:** `multipart/form-data`, field `file` (+ optional body options)  
**Response:** Output file body with `Content-Type` and `Content-Disposition` headers  
**Errors:** `400` / `413` / `503` / `500` with `{ error, code }`

### 5.1 Endpoint Table

| Endpoint | Converter Type | From → To |
|----------|---------------|-----------|
| `POST /convert/pdf-to-word` | pdf-to-docx | PDF → DOCX |
| `POST /convert/word-to-pdf` | docx-to-pdf | DOCX → PDF |
| `POST /convert/excel-to-pdf` | xlsx-to-pdf | XLSX → PDF |
| `POST /convert/powerpoint-to-pdf` | pptx-to-pdf | PPTX → PDF |
| `POST /convert/pdf-to-jpg` | pdf-to-jpg | PDF → JPG |
| `POST /convert/pdf-to-png` | pdf-to-png | PDF → PNG |
| `POST /convert/pdf-to-excel` | pdf-to-xlsx | PDF → XLSX |
| `POST /convert/pdf-to-powerpoint` | pdf-to-pptx | PDF → PPTX |
| `POST /convert/pdf-to-text` | pdf-to-txt | PDF → TXT |
| `POST /convert/pdf-to-html` | pdf-to-html | PDF → HTML |
| `POST /convert/pdf-to-pdfa` | pdf-to-pdfa | PDF → PDF/A |
| `POST /convert/word-to-text` | docx-to-txt | DOCX → TXT |
| `POST /convert/word-to-html` | docx-to-html | DOCX → HTML |
| `POST /convert/excel-to-csv` | xlsx-to-csv | XLSX → CSV |
| `POST /convert/text-to-pdf` | txt-to-pdf | TXT → PDF |
| `POST /convert/html-to-pdf` | html-to-pdf | HTML → PDF |
| `POST /convert/csv-to-excel` | csv-to-xlsx | CSV → XLSX |
| `POST /convert/rtf-to-word` | rtf-to-docx | RTF → DOCX |
| `POST /convert/jpg-to-pdf` | jpg-to-pdf | JPG → PDF |
| `POST /convert/png-to-pdf` | png-to-pdf | PNG → PDF |
| `POST /convert/images-to-pdf` | convertMultiple | Images → PDF (≤20 files) |
| `POST /convert/jpg-to-png` | jpg-to-png | JPG → PNG |
| `POST /convert/png-to-jpg` | png-to-jpg | PNG → JPG |
| `POST /convert/webp-to-jpg` | webp-to-jpg | WEBP → JPG |
| `POST /convert/jpg-to-webp` | jpg-to-webp | JPG → WEBP |
| `POST /convert/png-to-webp` | png-to-webp | PNG → WEBP |
| `POST /convert/svg-to-png` | svg-to-png | SVG → PNG |

Total: **27 conversion endpoints**

### 5.2 images-to-pdf (multi-file)

**Request:** `multipart/form-data`, field `files` (array, max 20), optional body `pageSize`, `orientation`, `margin`  
**Response:** `application/pdf`, filename `converted.pdf`

---

## 6. Compression API

All compression endpoints use `upload.single("file")` except bulk which uses `upload.array("files", 50)`.

### 6.1 Single File Compression

| Endpoint | Format | Options |
|----------|--------|---------|
| `POST /compress/pdf` | pdf | `level` (low/medium/high) |
| `POST /compress/jpg` | jpg | `quality`, `progressive` |
| `POST /compress/png` | png | `mode` (lossless/optimized), `useOxipng` |
| `POST /compress/webp` | webp | `mode` (lossy/lossless), `quality`, `allowAnimated` |

**Request:** `multipart/form-data`, field `file`, body options  
**Response:** Output file body + compression stats headers (see section 3)

### 6.2 Bulk Image Compression

**Endpoint:** `POST /compress/images/bulk`  
**Request:** `multipart/form-data`, field `files` (array, max 50, mixed formats), body options  
**Response:** `application/zip`, filename `compressed_images.zip` + bulk stats headers

**Supported formats:** returned by `compressionRouter.getBulkSupportedFormats()` (inferred: jpg, png, webp)

### 6.3 Compression Health Check

**Endpoint:** `GET /health/compression`  
**Response:** `200 { ok: true, pdf: {ok:true}, image: {ok:true}, bulk: {ok:true} }`  
**Error:** `503 { ok: false, error: string }`

---

## 7. PDF Tools API

Inferred from frontend client (`utils/api.ts`) and backend modules (`pdf-merger.js`, `pdf-splitter.js`, `pdf-organizer.js`). Route definitions in `server.js` not fully verified in read excerpts.

### 7.1 POST /pdf/merge

Merge multiple PDFs into one.

**Request:** `multipart/form-data`, field `files` (array)  
**Response:** `application/pdf` + headers: `X-Input-Files`, `X-Page-Count`, `X-Original-Size`, `X-Output-Size`

### 7.2 POST /pdf/split

Split a PDF into per-page files (ZIP).

**Request:** `multipart/form-data`, field `file`, field `splitConfig` (JSON string: `{ mode: "ranges"|"every_n"|"every_page", ranges?: [...], everyN?: number }`)  
**Response:** `application/zip` + headers: `X-Input-Pages`, `X-Output-Files`, `X-Split-Mode`, `X-Original-Size`, `X-Output-Size`, `X-Total-Output-Size`, `X-Split-Outputs` (JSON array)

### 7.3 POST /pdf/organize

Reorder, rotate, or delete pages.

**Request:** `multipart/form-data`, field `file`, field `organizeConfig` (JSON string: `{ pages: [{ originalPage, rotation }] }`)  
**Response:** `application/pdf` + headers: `X-Organize-Input-Pages`, `X-Organize-Output-Pages`, `X-Organize-Deleted-Pages`, `X-Organize-Rotated-Pages`, `X-Original-Size`, `X-Output-Size`

---

## 8. Image Tools API

### 8.1 POST /image-tools/remove-background

Remove image background using rembg/onnxruntime.

**Request:** `multipart/form-data`, field `file`, field `mode` (default "auto")  
**Response:** Image body (PNG) + headers: `X-Original-Width`, `X-Original-Height`, `X-Model-Used`, `X-Processing-Mode`

**Route definition:** Referenced by frontend `removeBackground()` but not verified in `server.js` read excerpts — may be inline or in a separate route registration.

### 8.2 GET /health/background-remover

Referenced by frontend `checkBackgroundRemoverHealth()` — not verified in `server.js` excerpts.

---

## 9. Stats API

### 9.1 GET /stats (Backend)

**Response:** `200 { files: number, transfers: number }`  
Frontend `/api/stats` only displays stats when `files >= 100 && transfers >= 50`, otherwise returns `{ visible: false }`.

---

## 10. Frontend API Routes (Next.js)

All under `frontend/app/api/`. Base URL varies by route (`NEXT_PUBLIC_API_URL`, `BACKEND_URL`, or hardcoded defaults).

| Route | Method | Purpose | Backend Target |
|-------|--------|---------|----------------|
| `send/route.ts` | POST | Proxy file upload to share | `BACKEND/resend` |
| `share-edited/route.ts` | POST | HTML→DOCX, then share | `BACKEND/resend` |
| `stats/route.ts` | GET | Proxy site stats (conditional visibility) | `BACKEND/stats` |
| `proxy-file/route.ts` | GET/HEAD | Proxy Supabase file URLs | Supabase (allowlist) |
| `convert-pdf-to-docx/route.ts` | POST | PDF→DOCX (≤50 MB, signature-validated) | — (runs in-edge via `@/lib/pdf/to-docx`) |
| `convert-to-docx/route.ts` | POST | HTML→DOCX | — (runs in-edge via `htmlToDocx`) |
| `convert-to-html/route.ts` | POST | DOCX→HTML (via mammoth) | — (fetches fileUrl, converts) |
| `convert-to-pdf/` | — | Empty directory, no route | — |
| `convert/<7 subdirs>/` | — | Directories exist, no `route.ts` found | — |

### 10.1 proxy-file/route.ts — Allowed Hosts

`supabase.co`, `supabase.in` (hostname suffix match)

---

## 11. Frontend API Client (`utils/api.ts`)

Base: `process.env.NEXT_PUBLIC_API_URL || "https://zipdrop.onrender.com"`

### File Sharing
- `uploadFile(formData) → Promise<any>` — `POST /upload`
- `shareText(text) → Promise<any>` — `POST /share-text`
- `receiveData(code) → Promise<any>` — `GET /receive/:code`

### Compression
- `compressPdf(file, { level }) → Promise<CompressionResult>` — `POST /compress/pdf`
- `compressJpg(file, { quality, progressive }) → Promise<CompressionResult>` — `POST /compress/jpg`
- `compressPng(file, { mode, useOxipng }) → Promise<CompressionResult>` — `POST /compress/png`
- `compressWebp(file, { mode, quality, allowAnimated }) → Promise<CompressionResult>` — `POST /compress/webp`
- `compressBulkImages(files[], options) → Promise<BulkCompressionResult>` — `POST /compress/images/bulk`
- `checkCompressionHealth() → Promise<any>` — `GET /health/compression`
- `checkPdfCompressionHealth() → Promise<any>` — `GET /health/compression` (duplicate alias)

### Background Removal
- `removeBackground(file, options) → Promise<BackgroundRemovalResult>` — `POST /image-tools/remove-background`
- `checkBackgroundRemoverHealth() → Promise<any>` — `GET /health/background-remover`

### PDF Tools
- `mergePdf(files[]) → Promise<MergeResult>` — `POST /pdf/merge`
- `splitPdf(file, config) → Promise<SplitResult>` — `POST /pdf/split`
- `organizePdf(file, pages) → Promise<OrganizeResult>` — `POST /pdf/organize`

### Result Interfaces

`CompressionResult`: `{ blob, filename, stats: { originalSize, compressedSize, bytesSaved, reductionPercent, pageCount?, width?, height?, level?, mode?, quality?, method?, warning? } }`

`BulkCompressionResult`: `{ blob, filename, stats: { totalFiles, successful, failed, totalOriginalSize, totalCompressedSize, totalBytesSaved, totalReductionPercent }, results: { successful: [], failed: [] } }`

`BackgroundRemovalResult`: `{ blob, filename, stats: { originalWidth?, originalHeight?, modelUsed, processingMode } }`

`MergeResult`: `{ blob, filename, stats: { inputFiles, pageCount, originalTotalSize, outputSize } }`

`SplitResult`: `{ blob, filename, stats: {...}, outputs: SplitOutput[] }`

`OrganizeResult`: `{ blob, filename, stats: { inputPages, pageCount, deletedPages, rotatedPages, originalTotalSize, outputSize } }`

---

## 12. Error Response Format

Backend standard:
```json
{
  "error": "Human-readable message",
  "code": "ERROR_CODE"
}
```

Optional detail field:
```json
{
  "error": "...",
  "code": "...",
  "detail": "..."
}
```

Frontend routes return `NextResponse.json({ error, ... }, { status })`.

---

## 13. Examples

### Upload a file (via frontend client)
```ts
import { uploadFile } from "@/utils/api";
const formData = new FormData();
formData.append("file", file);
const result = await uploadFile(formData);
// result: { code: "ABCD1234", file_url: "https://..." }
```

### Receive a file by code
```ts
import { receiveData } from "@/utils/api";
const data = await receiveData("ABCD1234");
// data: { type: "files", files: [...] } or { type: "text", text: "..." }
```

### Compress a PDF
```ts
import { compressPdf } from "@/utils/api";
const result = await compressPdf(file, { level: "high" });
// result.stats: { originalSize, compressedSize, bytesSaved, reductionPercent }
```

### Convert PDF to DOCX (frontend route)
```ts
const formData = new FormData();
formData.append("file", pdfFile);
const res = await fetch("/api/convert-pdf-to-docx", { method: "POST", body: formData });
const blob = await res.blob();
// download blob as .docx
```

### Split a PDF
```ts
import { splitPdf } from "@/utils/api";
const result = await splitPdf(file, {
  mode: "ranges",
  ranges: [{ start: 1, end: 3 }, { start: 5, end: 7 }]
});
// result.blob is a ZIP containing per-page PDFs
```

---

## 14. Unverified / Estimate Items

| Item | Status | Reason |
|------|--------|--------|
| Exact backend base URL | Unverified | `frontend/.env` not exposed; defaults differ between `api.ts` (render.com) and `send/route.ts` (localhost:5000) |
| `/receive/:code`, `/upload`, `/share-text`, `/resend` response shapes | Estimate | Handler bodies not fully read; inferred from FileModel and frontend client |
| `/pdf/merge`, `/pdf/split`, `/pdf/organize`, `/image-tools/remove-background` route definitions | Unverified | Not in server.js excerpts read; inferred from frontend client and backend modules |
| `convert-to-pdf/` route | Missing | Directory exists but empty, no `route.ts` |
| `convert/<7 subdirs>/` routes | Missing | Directories exist but no `route.ts` found |
| Compression health `/health/background-remover` | Unverified | Referenced by frontend, not confirmed in server.js |
| Exact error response fields for share endpoints | Estimate | Inferred from FileModel |

---

*End of API reference.*

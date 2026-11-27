const DATABASE_NAME = "zipdrop-editor-handoff";
const STORE_NAME = "generated-files";
const DATABASE_VERSION = 2;
const DEFAULT_HANDOFF_TTL_MS = 30 * 60 * 1000;

function getHandoffTtlMs(): number {
  const configured = Number(process.env.NEXT_PUBLIC_EDITOR_HANDOFF_TTL_MS);
  return Number.isFinite(configured) && configured > 0
    ? configured
    : DEFAULT_HANDOFF_TTL_MS;
}

export const HANDOFF_TTL_MS = getHandoffTtlMs();

export type EditorTarget = "pdf" | "word";

export type TransferErrorCode =
  | "missing-transfer"
  | "expired-transfer"
  | "storage-unavailable"
  | "storage-failure"
  | "invalid-document"
  | "unsupported-format";

export interface GeneratedFile {
  blob: Blob;
  filename: string;
}

export interface GeneratedFileTransfer extends GeneratedFile {
  id: string;
  mimeType: string;
  extension: string;
  size: number;
  sourceTool: string;
  target: EditorTarget;
  createdAt: number;
  expiresAt: number;
}

type StoredHandoff = Partial<GeneratedFileTransfer> &
  Pick<GeneratedFileTransfer, "id" | "blob" | "filename" | "createdAt">;

interface HandoffDatabase {
  db: IDBDatabase;
  store: IDBObjectStore;
  done: Promise<void>;
}

export class DocumentTransferError extends Error {
  readonly code: TransferErrorCode;

  constructor(code: TransferErrorCode, message: string) {
    super(message);
    this.name = "DocumentTransferError";
    this.code = code;
  }
}

function getExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || "";
}

function getMimeType(target: EditorTarget): string {
  return target === "pdf"
    ? "application/pdf"
    : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
}

export function getEditorTarget(file: GeneratedFile): EditorTarget | null {
  const extension = getExtension(file.filename);
  const mimeType = (file.blob.type || "").toLowerCase();

  if (
    extension === "pdf" ||
    mimeType === "application/pdf" ||
    mimeType === "application/x-pdf"
  ) {
    return "pdf";
  }

  if (
    extension === "docx" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return "word";
  }

  return null;
}

export function getEditorTargetLabel(target: EditorTarget): string {
  return target === "pdf" ? "Edit PDF" : "Edit Word Document";
}

export function describeTransferError(error: unknown): string {
  if (error instanceof DocumentTransferError) {
    switch (error.code) {
      case "missing-transfer":
        return "This editor link is invalid or the transfer record was removed. Return to the tool and use Edit again.";
      case "expired-transfer":
        return `This temporary document transfer expired after ${Math.round(
          HANDOFF_TTL_MS / 60000
        )} minutes. Return to the tool and use Edit again.`;
      case "storage-unavailable":
        return "Browser document storage is unavailable. Your generated document is still available on the tool page; please try again.";
      case "storage-failure":
        return "Browser document storage could not save the generated document. Your result is still available on the tool page; please try again.";
      case "invalid-document":
        return "The generated document could not be validated. Return to the tool and try again.";
      case "unsupported-format":
        return "This output format cannot be opened in the editor.";
    }
  }

  return error instanceof Error
    ? error.message
    : "The generated document could not be opened. Please try again.";
}

function isStorageUnavailable(): boolean {
  return typeof indexedDB === "undefined";
}

function toStorageError(error: unknown): DocumentTransferError {
  if (error instanceof DocumentTransferError) return error;

  const name =
    error && typeof error === "object" && "name" in error
      ? String((error as { name?: unknown }).name)
      : "";
  const code =
    error && typeof error === "object" && "code" in error
      ? Number((error as { code?: unknown }).code)
      : 0;

  if (name === "QuotaExceededError" || code === 22) {
    return new DocumentTransferError(
      "storage-failure",
      "Browser document storage is full."
    );
  }

  return new DocumentTransferError(
    "storage-failure",
    error instanceof Error ? error.message : "Document storage failed."
  );
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (isStorageUnavailable()) {
      reject(
        new DocumentTransferError(
          "storage-unavailable",
          "Browser document storage is unavailable."
        )
      );
      return;
    }

    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(
        new DocumentTransferError(
          "storage-unavailable",
          request.error?.message || "Could not open document storage."
        )
      );
  });
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error || new Error("Document storage request failed."));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error || new Error("Document storage transaction failed."));
    transaction.onabort = () =>
      reject(transaction.error || new Error("Document storage transaction was aborted."));
  });
}

async function getStore(mode: IDBTransactionMode): Promise<HandoffDatabase> {
  const db = await openDatabase();
  const transaction = db.transaction(STORE_NAME, mode);
  return {
    db,
    store: transaction.objectStore(STORE_NAME),
    done: transactionDone(transaction),
  };
}

function getRecordExpiration(record: StoredHandoff): number {
  if (typeof record.expiresAt === "number" && Number.isFinite(record.expiresAt)) {
    return record.expiresAt;
  }
  const createdAt = Number(record.createdAt);
  return Number.isFinite(createdAt) ? createdAt + HANDOFF_TTL_MS : 0;
}

function normalizeTransfer(record: StoredHandoff): GeneratedFileTransfer {
  const target = getEditorTarget({
    blob: record.blob,
    filename: record.filename,
  });

  if (!target) {
    throw new DocumentTransferError(
      "unsupported-format",
      "The stored document format is not supported by the editor."
    );
  }

  const createdAt = Number(record.createdAt);
  const safeCreatedAt = Number.isFinite(createdAt) ? createdAt : Date.now();

  return {
    id: record.id,
    blob: record.blob,
    filename: record.filename,
    mimeType:
      record.mimeType || record.blob.type || getMimeType(target),
    extension: record.extension || getExtension(record.filename),
    size: typeof record.size === "number" ? record.size : record.blob.size,
    sourceTool: record.sourceTool || "unknown-tool",
    target: record.target || target,
    createdAt: safeCreatedAt,
    expiresAt: getRecordExpiration(record),
  };
}

async function removeExpiredRecords(store: IDBObjectStore): Promise<void> {
  const cutoff = Date.now();
  const keys = await requestToPromise(store.getAllKeys());

  for (const key of keys) {
    const record = (await requestToPromise(store.get(key))) as
      | StoredHandoff
      | undefined;
    if (record && getRecordExpiration(record) <= cutoff) {
      store.delete(key);
    }
  }
}

async function validateGeneratedFile(
  file: GeneratedFile,
  target: EditorTarget
): Promise<void> {
  if (!file || !file.blob || typeof file.blob.arrayBuffer !== "function") {
    throw new DocumentTransferError(
      "invalid-document",
      "The generated document is missing or invalid."
    );
  }

  if (file.blob.size === 0) {
    throw new DocumentTransferError(
      "invalid-document",
      "The generated document is empty."
    );
  }

  if (target === "pdf") {
    const header = new TextDecoder().decode(
      await file.blob.slice(0, 1024).arrayBuffer()
    );
    if (!header.includes("%PDF-")) {
      throw new DocumentTransferError(
        "invalid-document",
        "The generated PDF is not a valid PDF document."
      );
    }
    return;
  }

  const header = new Uint8Array(await file.blob.slice(0, 4).arrayBuffer());
  const isZip = header[0] === 0x50 && header[1] === 0x4b;
  if (!isZip) {
    throw new DocumentTransferError(
      "invalid-document",
      "The generated Word document is not a valid DOCX document."
    );
  }
}

function getSourceTool(sourceTool?: string): string {
  if (sourceTool) return sourceTool;
  if (typeof window !== "undefined") {
    return window.location.pathname.replace(/^\/+/, "") || "unknown-tool";
  }
  return "unknown-tool";
}

function createTransferId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function cleanupExpiredTransfers(): Promise<void> {
  if (isStorageUnavailable()) return;

  const { db, store, done } = await getStore("readwrite");
  try {
    await removeExpiredRecords(store);
    await done;
  } catch (error) {
    await done.catch(() => undefined);
    throw toStorageError(error);
  } finally {
    db.close();
  }
}

export async function createGeneratedFileTransfer(
  file: GeneratedFile,
  sourceTool?: string
): Promise<GeneratedFileTransfer> {
  const target = getEditorTarget(file);
  if (!target) {
    throw new DocumentTransferError(
      "unsupported-format",
      "This output format cannot be opened in the editor."
    );
  }

  await validateGeneratedFile(file, target);

  const createdAt = Date.now();
  const transfer: GeneratedFileTransfer = {
    id: createTransferId(),
    blob: file.blob,
    filename: file.filename,
    mimeType: file.blob.type || getMimeType(target),
    extension: getExtension(file.filename),
    size: file.blob.size,
    sourceTool: getSourceTool(sourceTool),
    target,
    createdAt,
    expiresAt: createdAt + HANDOFF_TTL_MS,
  };

  const { db, store, done } = await getStore("readwrite");
  try {
    await removeExpiredRecords(store);
    await requestToPromise(store.put(transfer satisfies StoredHandoff));
    await done;
    return transfer;
  } catch (error) {
    await done.catch(() => undefined);
    throw toStorageError(error);
  } finally {
    db.close();
  }
}

export async function getGeneratedFileTransfer(
  id: string
): Promise<GeneratedFileTransfer> {
  if (!id) {
    throw new DocumentTransferError(
      "missing-transfer",
      "No document transfer ID was provided."
    );
  }

  const { db, store, done } = await getStore("readwrite");
  try {
    const record = (await requestToPromise(store.get(id))) as
      | StoredHandoff
      | undefined;

    if (!record) {
      await done;
      throw new DocumentTransferError(
        "missing-transfer",
        "The generated document could not be found."
      );
    }

    const transfer = normalizeTransfer(record);

    if (Date.now() >= transfer.expiresAt) {
      store.delete(id);
      await done;
      throw new DocumentTransferError(
        "expired-transfer",
        "The generated document transfer expired."
      );
    }

    await done;
    return transfer;
  } catch (error) {
    await done.catch(() => undefined);
    throw toStorageError(error);
  } finally {
    db.close();
  }
}

export async function deleteGeneratedFileTransfer(id: string): Promise<void> {
  if (!id || isStorageUnavailable()) return;

  const { db, store, done } = await getStore("readwrite");
  try {
    store.delete(id);
    await done;
  } catch (error) {
    await done.catch(() => undefined);
    throw toStorageError(error);
  } finally {
    db.close();
  }
}

let pendingOpen: Promise<void> | null = null;

export function openGeneratedFileInEditor(
  file: GeneratedFile,
  sourceTool?: string
): Promise<void> {
  if (pendingOpen) return pendingOpen;

  pendingOpen = (async () => {
    const targetWindow =
      typeof window !== "undefined" ? window.open("", "_blank") : null;

    try {
      const transfer = await createGeneratedFileTransfer(file, sourceTool);
      const editorUrl = `/editor?transfer=${encodeURIComponent(transfer.id)}`;

      if (targetWindow && !targetWindow.closed) {
        targetWindow.location.replace(editorUrl);
        targetWindow.focus();
      } else if (typeof window !== "undefined") {
        window.location.assign(editorUrl);
      }
    } catch (error) {
      if (targetWindow && !targetWindow.closed) targetWindow.close();
      throw error;
    }
  })().finally(() => {
    pendingOpen = null;
  });

  return pendingOpen;
}

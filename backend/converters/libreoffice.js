/**
 * Shared LibreOffice discovery and headless execution.
 *
 * LibreOffice on Windows is a GUI-subsystem launcher (soffice.exe): when its
 * stdio is piped it can stay alive indefinitely, so version probes use the
 * console wrapper (soffice.com) when available and are always non-fatal.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const { pathToFileURL } = require('url');
const { ConversionError, ERROR_CODES } = require('./types');
const { getLimiter } = require('../utils/concurrencyLimiter');

const IS_WINDOWS = process.platform === 'win32';
const IS_LINUX = process.platform === 'linux';
const VERSION_TIMEOUT_MS = 15000;
const CONVERSION_TIMEOUT_MS = 180000;
const PORTABLE_DIR = path.join(__dirname, '..', '.libreoffice');
const PORTABLE_DEPS_DIR = path.join(PORTABLE_DIR, 'deps');
const PORTABLE_MANIFEST = path.join(PORTABLE_DIR, 'manifest.json');

let cached = null;
let portableManifestCache;

function readPortableManifest() {
  if (portableManifestCache !== undefined) return portableManifestCache;
  try {
    portableManifestCache = JSON.parse(fs.readFileSync(PORTABLE_MANIFEST, 'utf8'));
  } catch {
    portableManifestCache = null;
  }
  return portableManifestCache;
}

function findPortableExecutable() {
  const manifest = readPortableManifest();
  if (manifest && manifest.executable && executableExists(manifest.executable)) {
    return manifest.executable;
  }

  const optDirectory = path.join(PORTABLE_DIR, 'squashfs-root', 'opt');
  try {
    for (const entry of fs.readdirSync(optDirectory)) {
      const candidate = path.join(optDirectory, entry, 'program', 'soffice');
      if (executableExists(candidate)) return candidate;
    }
  } catch {
    // portable runtime is not installed
  }
  return null;
}

function isPortableExecutable(executable) {
  if (!executable) return false;
  const portableRoot = path.resolve(PORTABLE_DIR) + path.sep;
  try {
    return fs.realpathSync(executable).startsWith(portableRoot);
  } catch {
    return path.resolve(executable).startsWith(portableRoot);
  }
}

function getPortableDepsDir(executable) {
  if (!executable || !isPortableExecutable(executable)) return null;
  const manifest = readPortableManifest();
  for (const candidate of [manifest && manifest.depsDir, PORTABLE_DEPS_DIR]) {
    if (candidate && fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function findNixStoreLibreOffice() {
  if (IS_WINDOWS) return null;
  try {
    const entries = fs
      .readdirSync('/nix/store')
      .filter((entry) => /-libreoffice-[\d]/.test(entry))
      .sort()
      .reverse();
    for (const entry of entries) {
      for (const candidate of [
        path.join('/nix/store', entry, 'bin', 'soffice'),
        path.join('/nix/store', entry, 'lib', 'libreoffice', 'program', 'soffice'),
      ]) {
        if (executableExists(candidate)) return candidate;
      }
    }
  } catch {
    // /nix/store is absent outside Nix environments
  }
  return null;
}

function executableExists(candidate) {
  try {
    const stat = fs.statSync(candidate);
    if (!stat.isFile()) return false;
    if (!IS_WINDOWS) fs.accessSync(candidate, fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function resolveExecutable(candidate) {
  if (!candidate) return null;
  const absolute = path.resolve(candidate);
  if (!executableExists(absolute)) return null;
  try {
    return fs.realpathSync.native(absolute);
  } catch {
    return absolute;
  }
}

function getPathDirectories() {
  const raw = process.env.PATH || "";
  const delimiter = IS_WINDOWS ? ";" : ":";
  return raw.split(delimiter).map((entry) => entry.trim().replace(/^"|"$/g, "")).filter(Boolean);
}

function getSearchNames() {
  if (IS_WINDOWS) {
    return ["soffice.exe", "soffice.com"];
  }
  return ["soffice", "libreoffice"];
}

function getCommonPaths() {
  if (IS_WINDOWS) {
    const programFiles = process.env.ProgramFiles || "C:\\Program Files";
    const programFilesX86 = process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)";
    const localAppData = process.env.LOCALAPPDATA || "";
    return [
      path.join(programFiles, "LibreOffice", "program", "soffice.exe"),
      path.join(programFilesX86, "LibreOffice", "program", "soffice.exe"),
      localAppData && path.join(localAppData, "Programs", "LibreOffice", "program", "soffice.exe"),
    ].filter(Boolean);
  }

  return [
    "/usr/bin/soffice",
    "/usr/bin/libreoffice",
    "/usr/local/bin/soffice",
    "/snap/bin/libreoffice",
    "/opt/libreoffice/program/soffice",
    "/nix/var/nix/profiles/default/bin/soffice",
    path.join(os.homedir(), ".nix-profile", "bin", "soffice"),
    "/run/current-system/sw/bin/soffice",
    path.join(__dirname, "..", ".libreoffice", "squashfs-root", "AppRun"),
    path.join(__dirname, "..", ".libreoffice", "program", "soffice"),
  ];
}

function collectCandidates() {
  const candidates = [];
  const seen = new Set();
  const push = (candidate, source) => {
    if (!candidate) return;
    const key = IS_WINDOWS ? candidate.toLowerCase() : candidate;
    if (seen.has(key)) return;
    seen.add(key);
    candidates.push({ path: candidate, source });
  };

  const envPath = process.env.LIBREOFFICE_PATH;
  if (envPath) {
    if (executableExists(path.resolve(envPath))) {
      push(envPath, "LIBREOFFICE_PATH");
    } else {
      console.warn(
        `[LibreOffice] LIBREOFFICE_PATH is set but does not point to an executable file: ${envPath}`
      );
    }
  }

  const names = getSearchNames();
  const pathDirectories = getPathDirectories();
  for (const name of names) {
    for (const directory of pathDirectories) {
      push(path.join(directory, name), "PATH");
    }
  }

  const portable = findPortableExecutable();
  if (portable) {
    push(portable, "portable");
  }

  const nixStore = findNixStoreLibreOffice();
  if (nixStore) {
    push(nixStore, "nix store");
  }

  for (const candidate of getCommonPaths()) {
    push(candidate, "common path");
  }

  return candidates;
}

function detectLibreOffice({ force = false } = {}) {
  if (cached && !force) return cached;

  const candidates = collectCandidates();
  const checked = [];
  let found = null;

  for (const candidate of candidates) {
    checked.push(candidate.path);
    const resolved = resolveExecutable(candidate.path);
    if (!resolved) continue;
    if (IS_WINDOWS && /soffice\.com$/i.test(resolved)) {
      const exeSibling = path.join(path.dirname(resolved), "soffice.exe");
      if (executableExists(exeSibling)) continue;
    }
    found = { executable: resolved, source: candidate.source };
    break;
  }

  cached = {
    ...(found || { executable: null, source: null }),
    checked,
  };
  return cached;
}

function getVersionProbeExecutable(executable) {
  if (!IS_WINDOWS) return executable;
  const consoleWrapper = path.join(path.dirname(executable), "soffice.com");
  if (executableExists(consoleWrapper)) return consoleWrapper;
  return executable;
}

function ensureWritableDirectory(preferred, fallback) {
  const candidates = [preferred, fallback, path.join(os.tmpdir(), "zipdrop-lo-home")].filter(Boolean);
  for (const directory of candidates) {
    try {
      fs.mkdirSync(directory, { recursive: true });
      fs.accessSync(directory, fs.constants.W_OK);
      return directory;
    } catch {
      // try the next candidate
    }
  }
  return os.tmpdir();
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function writeRuntimeFontConfig(depsDir, baseDir) {
  const confDirectory = path.join(depsDir, "etc", "fonts", "conf.d");
  const fontDirectories = [
    path.join(depsDir, "usr", "share", "fonts"),
    path.join(depsDir, "usr", "local", "share", "fonts"),
    "/usr/share/fonts",
    "/usr/local/share/fonts",
  ].filter((directory) => fs.existsSync(directory));

  if (!fontDirectories.length && !fs.existsSync(confDirectory)) return null;

  try {
    const configDirectory = path.join(baseDir, "fontconfig");
    const cacheDirectory = path.join(configDirectory, "cache");
    fs.mkdirSync(cacheDirectory, { recursive: true });

    const lines = ['<?xml version="1.0"?>', "<fontconfig>"];
    for (const directory of fontDirectories) {
      lines.push(`  <dir>${escapeXml(directory)}</dir>`);
    }
    lines.push(`  <cachedir>${escapeXml(cacheDirectory)}</cachedir>`);
    if (fs.existsSync(confDirectory)) {
      lines.push(`  <include ignore_missing="yes">${escapeXml(confDirectory)}</include>`);
    }
    lines.push("</fontconfig>", "");

    const configFile = path.join(configDirectory, "fonts.conf");
    fs.writeFileSync(configFile, lines.join("\n"));
    return configFile;
  } catch (error) {
    console.warn(`[LibreOffice] Could not prepare font configuration: ${error.message}`);
    return null;
  }
}

function getPortableLibraryDirectories(depsDir, executable) {
  const programDir = path.dirname(executable);
  return [
    path.join(depsDir, "usr", "lib", "x86_64-linux-gnu"),
    path.join(depsDir, "lib", "x86_64-linux-gnu"),
    path.join(depsDir, "usr", "lib", "x86_64-linux-gnu", "nss"),
    path.join(depsDir, "lib", "x86_64-linux-gnu", "nss"),
    path.join(depsDir, "usr", "lib"),
    path.join(depsDir, "lib"),
    programDir,
    path.join(programDir, "..", "ure", "lib"),
  ].filter((directory) => fs.existsSync(directory));
}

function buildProcessEnv(executable, profileDir) {
  const env = { ...process.env };

  if (process.platform === "linux") {
    env.SAL_USE_VCLPLUGIN = "svp";
    env.LANG = env.LANG || "C.UTF-8";
  }

  if (IS_WINDOWS) return env;

  const baseDir = profileDir
    ? path.dirname(profileDir)
    : path.join(os.tmpdir(), "zipdrop-lo");
  const depsDir = getPortableDepsDir(executable);
  const home = depsDir
    ? ensureWritableDirectory(path.join(baseDir, "home"), env.HOME)
    : ensureWritableDirectory(env.HOME, path.join(baseDir, "home"));
  const cacheHome = path.join(home, ".cache");

  env.HOME = home;
  env.XDG_CACHE_HOME = cacheHome;
  env.TMPDIR = ensureWritableDirectory(env.TMPDIR, os.tmpdir());

  try {
    fs.mkdirSync(cacheHome, { recursive: true });
  } catch {
    // non-fatal; LibreOffice falls back to its own defaults
  }

  if (depsDir) {
    const libraryDirectories = getPortableLibraryDirectories(depsDir, executable);
    env.LD_LIBRARY_PATH = [...libraryDirectories, env.LD_LIBRARY_PATH]
      .filter(Boolean)
      .join(":");

    const fontConfig = writeRuntimeFontConfig(depsDir, baseDir);
    if (fontConfig) {
      env.FONTCONFIG_FILE = fontConfig;
      env.FONTCONFIG_PATH = path.dirname(fontConfig);
    }
  }

  return env;
}

function extractMissingLibraries(stderr = "") {
  const missing = new Set();
  const pattern = /error while loading shared libraries: ([^:\s]+)/g;
  let match;
  while ((match = pattern.exec(stderr))) {
    missing.add(match[1]);
  }
  return [...missing];
}

/* ---------------------------------------------------------------
   Resource + phase instrumentation
   These read-only probes run only for document conversions, never
   for version/font probes, so normal subprocess logging is unchanged.
---------------------------------------------------------------- */

function readTrimmedFile(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8").trim();
  } catch {
    return null;
  }
}

function parseKeyValueFile(filePath) {
  try {
    const values = {};
    for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
      const [key, value] = line.trim().split(/\s+/);
      if (key) values[key] = value;
    }
    return values;
  } catch {
    return null;
  }
}

function toFiniteNumber(value) {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function difference(after, before) {
  const a = toFiniteNumber(after);
  const b = toFiniteNumber(before);
  return a === null || b === null ? null : a - b;
}

function readCgroupSnapshot() {
  if (!IS_LINUX) return null;
  const snapshot = {
    cpuMax: readTrimmedFile("/sys/fs/cgroup/cpu.max"),
    cpuStat: parseKeyValueFile("/sys/fs/cgroup/cpu.stat"),
    memoryMax: readTrimmedFile("/sys/fs/cgroup/memory.max"),
    memoryCurrent: readTrimmedFile("/sys/fs/cgroup/memory.current"),
    memoryPeak: readTrimmedFile("/sys/fs/cgroup/memory.peak"),
    memoryEvents: parseKeyValueFile("/sys/fs/cgroup/memory.events"),
  };
  if (!snapshot.cpuMax && !snapshot.cpuStat && !snapshot.memoryCurrent) return null;
  return snapshot;
}

function summarizeCgroup(before, after) {
  if (!before && !after) return null;
  return {
    cpuMax: (after && after.cpuMax) || (before && before.cpuMax) || null,
    cpuUsageUsec: difference(after && after.cpuStat && after.cpuStat.usage_usec, before && before.cpuStat && before.cpuStat.usage_usec),
    nrPeriods: difference(after && after.cpuStat && after.cpuStat.nr_periods, before && before.cpuStat && before.cpuStat.nr_periods),
    nrThrottled: difference(after && after.cpuStat && after.cpuStat.nr_throttled, before && before.cpuStat && before.cpuStat.nr_throttled),
    throttledUsec: difference(after && after.cpuStat && after.cpuStat.throttled_usec, before && before.cpuStat && before.cpuStat.throttled_usec),
    memoryMaxBytes: toFiniteNumber((after && after.memoryMax) || (before && before.memoryMax)),
    memoryPeakBytes: toFiniteNumber((after && after.memoryPeak) || (before && before.memoryPeak)),
    memoryCurrentBytes: toFiniteNumber(after && after.memoryCurrent),
    oomEvents: difference(after && after.memoryEvents && after.memoryEvents.oom, before && before.memoryEvents && before.memoryEvents.oom),
    oomKillEvents: difference(after && after.memoryEvents && after.memoryEvents.oom_kill, before && before.memoryEvents && before.memoryEvents.oom_kill),
    highEvents: difference(after && after.memoryEvents && after.memoryEvents.high, before && before.memoryEvents && before.memoryEvents.high),
  };
}

function readProcessTable() {
  const table = new Map();
  if (!IS_LINUX) return table;
  let entries;
  try {
    entries = fs.readdirSync("/proc");
  } catch {
    return table;
  }
  for (const entry of entries) {
    if (!/^\d+$/.test(entry)) continue;
    const pid = Number(entry);
    let status;
    try {
      status = fs.readFileSync(`/proc/${pid}/status`, "utf8");
    } catch {
      continue;
    }
    const ppidMatch = status.match(/^PPid:\s+(\d+)/m);
    const rssMatch = status.match(/^VmRSS:\s+(\d+)\s+kB/m);
    const stateMatch = status.match(/^State:\s+(\S)/m);
    let cpuTicks = 0;
    let blockIoTicks = 0;
    try {
      const stat = fs.readFileSync(`/proc/${pid}/stat`, "utf8");
      const closingParen = stat.lastIndexOf(")");
      if (closingParen !== -1) {
        // Fields after comm: state=0, ppid=1 ... utime=11, stime=12, blkio=39
        const fields = stat.slice(closingParen + 2).split(" ");
        cpuTicks = (Number(fields[11]) || 0) + (Number(fields[12]) || 0);
        blockIoTicks = Number(fields[39]) || 0;
      }
    } catch {
      continue;
    }
    let ioReadBytes = 0;
    let ioWriteBytes = 0;
    try {
      const io = fs.readFileSync(`/proc/${pid}/io`, "utf8");
      const readMatch = io.match(/^read_bytes:\s+(\d+)/m);
      const writeMatch = io.match(/^write_bytes:\s+(\d+)/m);
      ioReadBytes = readMatch ? Number(readMatch[1]) : 0;
      ioWriteBytes = writeMatch ? Number(writeMatch[1]) : 0;
    } catch {
      // /proc/<pid>/io requires the same owner; ignore when unavailable
    }
    table.set(pid, {
      pid,
      ppid: ppidMatch ? Number(ppidMatch[1]) : 0,
      rssKb: rssMatch ? Number(rssMatch[1]) : 0,
      state: stateMatch ? stateMatch[1] : "?",
      cpuTicks,
      blockIoTicks,
      ioReadBytes,
      ioWriteBytes,
    });
  }
  return table;
}

function sampleProcessTree(rootPid) {
  if (!IS_LINUX || !rootPid) return null;
  const table = readProcessTable();
  const childrenByParent = new Map();
  for (const proc of table.values()) {
    if (!childrenByParent.has(proc.ppid)) childrenByParent.set(proc.ppid, []);
    childrenByParent.get(proc.ppid).push(proc);
  }

  const stack = [rootPid];
  const seen = new Set();
  const pids = [];
  const states = { R: 0, S: 0, D: 0, Z: 0, other: 0 };
  let cpuTicks = 0;
  let rssKb = 0;
  let blockIoTicks = 0;
  let ioReadBytes = 0;
  let ioWriteBytes = 0;
  while (stack.length > 0) {
    const pid = stack.pop();
    if (seen.has(pid)) continue;
    seen.add(pid);
    const proc = table.get(pid);
    if (!proc) continue;
    pids.push(pid);
    cpuTicks += proc.cpuTicks;
    rssKb += proc.rssKb;
    blockIoTicks += proc.blockIoTicks;
    ioReadBytes += proc.ioReadBytes;
    ioWriteBytes += proc.ioWriteBytes;
    if (proc.state in states) states[proc.state] += 1;
    else states.other += 1;
    for (const child of childrenByParent.get(pid) || []) stack.push(child.pid);
  }

  // Linux USER_HZ is 100 on the kernels used by Render; ticks -> ms is *10.
  return {
    pids,
    processCount: pids.length,
    cpuMs: Math.round(cpuTicks * 10 * 100) / 100,
    rssMb: Math.round((rssKb / 1024) * 100) / 100,
    blockIoWaitMs: Math.round(blockIoTicks * 10 * 100) / 100,
    ioReadBytes,
    ioWriteBytes,
    states,
  };
}

function createResourceSampler(rootPid) {
  let samples = 0;
  let nonEmptySamples = 0;
  let maxCpuMs = null;
  let peakRssMb = 0;
  let peakProcessCount = 0;
  let lastProcessCount = 0;
  let maxBlockIoWaitMs = null;
  let maxIoReadBytes = 0;
  let maxIoWriteBytes = 0;
  let lastStates = null;

  const sample = () => {
    const current = sampleProcessTree(rootPid);
    if (!current) return;
    samples += 1;
    lastProcessCount = current.processCount;
    if (current.processCount === 0) return;
    nonEmptySamples += 1;
    maxCpuMs = maxCpuMs === null ? current.cpuMs : Math.max(maxCpuMs, current.cpuMs);
    peakRssMb = Math.max(peakRssMb, current.rssMb);
    peakProcessCount = Math.max(peakProcessCount, current.processCount);
    maxBlockIoWaitMs =
      maxBlockIoWaitMs === null
        ? current.blockIoWaitMs
        : Math.max(maxBlockIoWaitMs, current.blockIoWaitMs);
    maxIoReadBytes = Math.max(maxIoReadBytes, current.ioReadBytes);
    maxIoWriteBytes = Math.max(maxIoWriteBytes, current.ioWriteBytes);
    lastStates = current.states;
  };

  return {
    sample,
    snapshot: () => ({
      samples,
      nonEmptySamples,
      childCpuMs: maxCpuMs,
      peakRssMb: peakRssMb || null,
      peakProcessCount: peakProcessCount || null,
      lastProcessCount,
      blockIoWaitMs: maxBlockIoWaitMs,
      ioReadBytes: maxIoReadBytes || null,
      ioWriteBytes: maxIoWriteBytes || null,
      states: lastStates,
    }),
  };
}

function createOutputWatcher(outputPath) {
  if (!outputPath) return null;
  const started = process.hrtime.bigint();
  const toMs = (instant) => Number(instant - started) / 1_000_000;
  let firstSeenMs = null;
  let lastChangeMs = null;
  let size = -1;
  let timer = null;

  const poll = () => {
    let currentSize = -1;
    try {
      currentSize = fs.statSync(outputPath).size;
    } catch {
      currentSize = -1;
    }
    if (currentSize >= 0) {
      const now = process.hrtime.bigint();
      if (firstSeenMs === null) {
        firstSeenMs = toMs(now);
        lastChangeMs = firstSeenMs;
      } else if (currentSize !== size) {
        lastChangeMs = toMs(now);
      }
      size = currentSize;
    }
    timer = setTimeout(poll, 100);
  };
  timer = setTimeout(poll, 100);

  return {
    stop() {
      if (timer) clearTimeout(timer);
      timer = null;
      try {
        size = fs.statSync(outputPath).size;
        const now = process.hrtime.bigint();
        if (firstSeenMs === null) {
          firstSeenMs = toMs(now);
          lastChangeMs = firstSeenMs;
        }
      } catch {
        // output never appeared
      }
      const stableMs = lastChangeMs === null ? null : toMs(process.hrtime.bigint()) - lastChangeMs;
      return {
        firstSeenMs,
        lastChangeMs,
        stableMs,
        size: size >= 0 ? size : null,
      };
    },
  };
}

function countDirectoryEntries(directory) {
  if (!directory) return null;
  try {
    return fs.readdirSync(directory, { recursive: true }).length;
  } catch {
    return null;
  }
}

function fileSize(filePath) {
  try {
    return fs.statSync(filePath).size;
  } catch {
    return null;
  }
}

function roundTimings(timings) {
  const rounded = {};
  for (const [key, value] of Object.entries(timings)) {
    if (value === null || value === undefined) continue;
    rounded[key] = typeof value === "number" ? Math.round(value * 100) / 100 : value;
  }
  return rounded;
}

function runProcess(command, args, { timeoutMs, profileDir, outputPath, collectResources = false } = {}) {
  return new Promise((resolve, reject) => {
    let proc;
    const env = buildProcessEnv(command, profileDir);
    const cpuUsageStart = collectResources ? process.cpuUsage() : null;
    const cgroupBefore = collectResources ? readCgroupSnapshot() : null;

    const subprocessTimings = {
      spawnInitiated: process.hrtime.bigint(),
      spawnCallReturned: null,
      spawnEventReceived: null,
      firstStdoutData: null,
      firstStderrData: null,
      exitEventReceived: null,
      closeEventReceived: null,
      totalDurationMs: null,
    };

    try {
      proc = spawn(command, args, {
        env,
        windowsHide: true,
        detached: !IS_WINDOWS,
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (error) {
      reject(error);
      return;
    }
    subprocessTimings.spawnCallReturned = process.hrtime.bigint();

    let stdout = "";
    let stderr = "";
    let settled = false;
    let sampler = null;
    let samplerInterval = null;
    const outputWatcher = createOutputWatcher(outputPath);

    const collectResourceSummary = () => {
      if (!collectResources) return null;
      if (sampler) sampler.sample();
      const parentCpu = process.cpuUsage(cpuUsageStart);
      const processSamples = sampler ? sampler.snapshot() : null;
      return {
        parentCpuMs: Math.round(((parentCpu.user + parentCpu.system) / 1000) * 100) / 100,
        childCpuMs: processSamples ? processSamples.childCpuMs : null,
        peakRssMb: processSamples ? processSamples.peakRssMb : null,
        peakProcessCount: processSamples ? processSamples.peakProcessCount : null,
        lastProcessCount: processSamples ? processSamples.lastProcessCount : null,
        blockIoWaitMs: processSamples ? processSamples.blockIoWaitMs : null,
        ioReadBytes: processSamples ? processSamples.ioReadBytes : null,
        ioWriteBytes: processSamples ? processSamples.ioWriteBytes : null,
        states: processSamples ? processSamples.states : null,
        samples: processSamples ? processSamples.samples : 0,
        cgroup: summarizeCgroup(cgroupBefore, readCgroupSnapshot()),
      };
    };

    const settle = (fn, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (samplerInterval) clearInterval(samplerInterval);
      const output = outputWatcher ? outputWatcher.stop() : null;
      const resources = collectResourceSummary();
      if (value && typeof value === "object") {
        value.subprocessTimings = subprocessTimings;
        value.output = output;
        if (collectResources) value.resources = resources;
      }
      fn(value);
    };

    const timer = setTimeout(() => {
      killProcessTree(proc.pid);
      const cmdName = path.basename(command);
      const error = new Error(`${cmdName} timed out after ${Math.round(timeoutMs / 1000)}s`);
      error.timedOut = true;
      error.stderr = stderr;
      settle(reject, error);
    }, timeoutMs);

    proc.on("spawn", () => {
      subprocessTimings.spawnEventReceived = process.hrtime.bigint();
      if (collectResources) {
        sampler = createResourceSampler(proc.pid);
        sampler.sample();
        samplerInterval = setInterval(() => sampler.sample(), 1000);
        if (samplerInterval.unref) samplerInterval.unref();
      }
    });

    proc.stdout.on("data", (data) => {
      if (subprocessTimings.firstStdoutData === null) {
        subprocessTimings.firstStdoutData = process.hrtime.bigint();
      }
      stdout += data.toString();
    });
    proc.stderr.on("data", (data) => {
      if (subprocessTimings.firstStderrData === null) {
        subprocessTimings.firstStderrData = process.hrtime.bigint();
      }
      stderr += data.toString();
    });

    proc.on("error", (error) => {
      settle(reject, error);
    });

    proc.on("exit", (code, signal) => {
      subprocessTimings.exitEventReceived = process.hrtime.bigint();
      if (sampler) sampler.sample();
    });

    proc.on("close", (code, signal) => {
      subprocessTimings.closeEventReceived = process.hrtime.bigint();
      subprocessTimings.totalDurationMs =
        Number(subprocessTimings.closeEventReceived - subprocessTimings.spawnInitiated) / 1_000_000;
      settle(resolve, {
        code,
        signal,
        stdout,
        stderr,
        subprocessTimings,
      });
    });
  });
}

/**
 * Generic command runner for non-LibreOffice commands (fc-list, fc-cache, etc.)
 * Returns structured result with timing and logs execution details.
 */
async function runCommand(commandName, commandArgs, options = {}) {
  const { timeoutMs = 15000, logger = console } = options;
  const startTime = process.hrtime.bigint();
  
  try {
    const result = await runProcess(commandName, commandArgs, { timeoutMs });
    const durationMs = Number(process.hrtime.bigint() - startTime) / 1_000_000;
    
    // Convert BigInt values in subprocessTimings to numbers for JSON serialization
    const sanitizeTimings = (timings) => {
      const out = {};
      for (const [k, v] of Object.entries(timings)) {
        if (v === null || v === undefined) {
          out[k] = null;
        } else if (typeof v === 'bigint') {
          out[k] = Math.round(Number(v) / 1_000_000 * 100) / 100; // Convert to ms
        } else if (typeof v === 'number') {
          out[k] = Math.round(v * 100) / 100;
        } else {
          out[k] = v;
        }
      }
      return out;
    };
    
    logger.log(JSON.stringify({
      type: "fontconfig_command",
      command: commandName,
      args: commandArgs,
      exitCode: result.code,
      signal: result.signal,
      durationMs: Math.round(durationMs * 100) / 100,
      subprocessTimings: result.subprocessTimings ? sanitizeTimings(result.subprocessTimings) : null,
      stdoutLength: result.stdout.length,
      stderrLength: result.stderr.length,
    }));
    
    return result;
  } catch (error) {
    const durationMs = Number(process.hrtime.bigint() - startTime) / 1_000_000;
    logger.warn(JSON.stringify({
      type: "fontconfig_command",
      command: commandName,
      args: commandArgs,
      error: error.message,
      timedOut: error.timedOut === true,
      durationMs: Math.round(durationMs * 100) / 100,
    }));
    throw error;
  }
}

function killProcessTree(pid) {
  if (!pid) return;
  if (IS_WINDOWS) {
    spawnSync("taskkill", ["/PID", String(pid), "/T", "/F"], {
      windowsHide: true,
      stdio: "ignore",
    });
    return;
  }
  try {
    process.kill(-pid, "SIGKILL");
  } catch {
    try {
      process.kill(pid, "SIGKILL");
    } catch {
      // process already exited
    }
  }
}

function parseVersion(output) {
  const match = output.match(/LibreOffice\s+([\d.]+)/i);
  return match ? match[1] : null;
}

async function queryVersion(executable) {
  const probeExecutable = getVersionProbeExecutable(executable);
  try {
    const result = await runProcess(probeExecutable, ["--version"], {
      timeoutMs: VERSION_TIMEOUT_MS,
    });
    const version = parseVersion(result.stdout) || parseVersion(result.stderr);
    return {
      ok: result.code === 0 && Boolean(version),
      version,
      exitCode: result.code,
      stderr: result.stderr,
      error: result.code === 0 ? null : `version command exited with code ${result.code}`,
    };
  } catch (error) {
    return {
      ok: false,
      version: null,
      exitCode: null,
      stderr: error.stderr || "",
      error: error.message,
    };
  }
}

async function verifyConversion() {
  const detection = detectLibreOffice();
  if (!detection.executable) {
    return { ok: false, error: "LibreOffice is not available" };
  }

  const fixture = path.resolve(
    __dirname,
    "..",
    "..",
    "eval-word2pdf",
    "fixtures",
    "01_simple_text.docx"
  );
  if (!fs.existsSync(fixture)) {
    return { ok: null, error: null };
  }

  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), "zipdrop-lo-smoke-"));
  const profileDir = path.join(workDir, "profile");
  const inputPath = path.join(workDir, "smoke.docx");

  try {
    fs.copyFileSync(fixture, inputPath);
    await convertToPdf({
      executable: detection.executable,
      inputPath,
      outputDir: workDir,
      profileDir,
      timeoutMs: 120000,
    });
    validatePdfBuffer(fs.readFileSync(path.join(workDir, "smoke.pdf")));
    return { ok: true, error: null };
  } catch (error) {
    const detail =
      error && error.details && error.details.safeDetail
        ? error.details.safeDetail
        : "Conversion smoke test failed";
    return { ok: false, error: detail };
  } finally {
    fs.rmSync(workDir, { recursive: true, force: true });
  }
}

async function investigateFonts(executable, logger) {
  const fontInfo = {
    fontconfigAvailable: false,
    fontconfigVersion: null,
    fontDirs: [],
    fontCacheDir: null,
    fontCacheWritable: false,
    fcListOutput: null,
    fcListError: null,
    fcCacheOutput: null,
    fcCacheError: null,
    systemFonts: [],
  };

  // Check fontconfig
  try {
    const fcVersion = await runCommand("fc-cache", ["--version"], { timeoutMs: 5000, logger });
    fontInfo.fontconfigAvailable = fcVersion.code === 0;
    fontInfo.fontconfigVersion = fcVersion.stdout.trim() || fcVersion.stderr.trim();
    logger.log(`[LibreOffice] Fontconfig available: ${fontInfo.fontconfigAvailable}, version: ${fontInfo.fontconfigVersion}`);
  } catch (e) {
    logger.warn(`[LibreOffice] Fontconfig check failed: ${e.message}`);
  }

  // Check font directories
  const commonFontDirs = [
    "/usr/share/fonts",
    "/usr/local/share/fonts",
    "/usr/share/fonts/truetype",
    "/usr/share/fonts/opentype",
    "/usr/share/fonts/type1",
    path.join(os.homedir(), ".fonts"),
    path.join(os.homedir(), ".local", "share", "fonts"),
  ];
  
  for (const dir of commonFontDirs) {
    if (fs.existsSync(dir)) {
      fontInfo.fontDirs.push(dir);
      try {
        const files = fs.readdirSync(dir);
        logger.log(`[LibreOffice] Font dir: ${dir} (${files.length} entries)`);
      } catch (e) {
        logger.warn(`[LibreOffice] Cannot read font dir ${dir}: ${e.message}`);
      }
    }
  }

  // Check font cache
  const cacheDirs = [
    path.join(os.homedir(), ".cache", "fontconfig"),
    "/var/cache/fontconfig",
    path.join(os.tmpdir(), "fontconfig"),
  ];
  
  for (const dir of cacheDirs) {
    if (fs.existsSync(dir)) {
      fontInfo.fontCacheDir = dir;
      try {
        fs.accessSync(dir, fs.constants.W_OK);
        fontInfo.fontCacheWritable = true;
        logger.log(`[LibreOffice] Font cache dir: ${dir} (writable: true)`);
      } catch (e) {
        logger.log(`[LibreOffice] Font cache dir: ${dir} (writable: false)`);
      }
      break;
    }
  }

  // Run fc-list to see available fonts
  try {
    const fcList = await runCommand("fc-list", [":family"], { timeoutMs: 10000, logger });
    if (fcList.code === 0) {
      fontInfo.fcListOutput = fcList.stdout.trim();
      const families = new Set();
      for (const line of fcList.stdout.split("\n")) {
        const family = line.split(":")[0]?.trim();
        if (family) families.add(family);
      }
      fontInfo.systemFonts = Array.from(families).sort();
      logger.log(`[LibreOffice] Available font families: ${fontInfo.systemFonts.length}`);
    } else {
      fontInfo.fcListError = fcList.stderr.trim();
      logger.warn(`[LibreOffice] fc-list failed: ${fontInfo.fcListError}`);
    }
  } catch (e) {
    fontInfo.fcListError = e.message;
    logger.warn(`[LibreOffice] fc-list error: ${e.message}`);
  }

  // Run fc-cache to check cache status
  try {
    const fcCache = await runCommand("fc-cache", ["-v"], { timeoutMs: 15000, logger });
    fontInfo.fcCacheOutput = fcCache.stdout.trim();
    fontInfo.fcCacheError = fcCache.stderr.trim();
    logger.log(`[LibreOffice] fc-cache completed (code: ${fcCache.code})`);
  } catch (e) {
    fontInfo.fcCacheError = e.message;
    logger.warn(`[LibreOffice] fc-cache error: ${e.message}`);
  }

  return fontInfo;
}

async function logDiagnostics(logger = console) {
  const detection = detectLibreOffice();
  const diagnostics = {
    version: null,
    versionOk: false,
    conversionOk: null,
    conversionError: null,
    portable: isPortableExecutable(detection.executable),
    depsDir: getPortableDepsDir(detection.executable),
    fontInfo: null,
  };

  logger.log(`[LibreOffice] OS: ${process.platform} ${process.arch}`);
  logger.log(`[LibreOffice] Temp directory: ${os.tmpdir()}`);

  if (!detection.executable) {
    logger.error("[LibreOffice] Executable not found. Checked:");
    for (const candidate of detection.checked) logger.error(`[LibreOffice]   - ${candidate}`);
    logger.error(
      "[LibreOffice] Set LIBREOFFICE_PATH or install LibreOffice (soffice) on the server."
    );
    cached.diagnostics = diagnostics;
    return { ok: false, version: null };
  }

  logger.log(
    `[LibreOffice] Executable: ${detection.executable} (found via ${detection.source})`
  );
  if (diagnostics.portable) {
    logger.log(
      `[LibreOffice] Portable runtime; bundled libraries: ${diagnostics.depsDir || "none"}`
    );
  }

  // NOTE: Font investigation skipped during normal startup to avoid fc-list timeout.
  // Run manually via /health/word-to-pdf-font-diagnostic
  diagnostics.fontInfo = { skipped_on_startup: true };

  const version = await queryVersion(detection.executable);
  diagnostics.version = version.version;
  diagnostics.versionOk = version.ok;

  if (version.ok) {
    logger.log(`[LibreOffice] Version: ${version.version}`);
  } else {
    const firstErrorLine = (version.stderr || "").trim().split(/\r?\n/)[0];
    logger.warn(
      `[LibreOffice] Version check failed (${version.error}${
        firstErrorLine ? `: ${firstErrorLine}` : ""
      })`
    );
  }

  // NOTE: Smoke conversion test is now run manually via /health/word-to-pdf-diagnostic
  // to avoid 60+ second startup delays on Render free tier.
  diagnostics.conversionOk = "skipped_on_startup";

  cached.diagnostics = diagnostics;
  return { ok: true, version: version.version };
}

function getStatus() {
  const detection = detectLibreOffice();
  const diagnostics = cached && cached.diagnostics ? cached.diagnostics : {};
  return {
    available: Boolean(detection.executable),
    version: diagnostics.version || null,
    versionOk: Boolean(diagnostics.versionOk),
    conversionOk:
      diagnostics.conversionOk === undefined ? null : diagnostics.conversionOk,
    conversionError: diagnostics.conversionError || null,
    portable: Boolean(diagnostics.portable),
    source: detection.source,
    checkedCount: detection.checked.length,
  };
}

function buildProfileArgument(profileDir) {
  const profileUrl = pathToFileURL(path.resolve(profileDir)).href;
  return `-env:UserInstallation=${profileUrl}`;
}

function requireLibreOffice(conversionName) {
  const detection = detectLibreOffice();
  if (detection.executable) return detection.executable;

  console.error(
    `[LibreOffice] ${conversionName}: no executable found. Checked ${detection.checked.length} path(s):\n` +
      detection.checked.map((candidate) => `  - ${candidate}`).join("\n")
  );
  throw new ConversionError(
    `LibreOffice not available for ${conversionName} conversion`,
    ERROR_CODES.MISSING_DEPENDENCY
  );
}

function extractSubprocessTimings(subprocessTimings, output) {
  const st = subprocessTimings || {};
  const span = (later, earlier) =>
    later && earlier ? Number(later - earlier) / 1_000_000 : null;

  const timings = {
    spawnCallMs: span(st.spawnCallReturned, st.spawnInitiated),
    spawnInitToEventMs: span(st.spawnEventReceived, st.spawnInitiated),
    firstStdoutMs: span(st.firstStdoutData, st.spawnEventReceived),
    firstStderrMs: span(st.firstStderrData, st.spawnEventReceived),
    processRuntimeMs: span(st.exitEventReceived, st.spawnEventReceived),
    exitToCloseMs: span(st.closeEventReceived, st.exitEventReceived),
    subprocessTotalMs: st.totalDurationMs ?? null,
  };

  if (output) {
    timings.outputFileFirstSeenMs = output.firstSeenMs ?? null;
    timings.outputFileLastChangeMs = output.lastChangeMs ?? null;
    timings.outputFileStableMs = output.stableMs ?? null;
    timings.outputFileBytes = output.size ?? null;
  }
  return timings;
}

function withCpuPercent(resources, timings) {
  if (!resources) return null;
  const summary = { ...resources };
  if (summary.childCpuMs !== null && summary.childCpuMs !== undefined && timings.processRuntimeMs) {
    summary.childCpuPct = Math.round((summary.childCpuMs / timings.processRuntimeMs) * 1000) / 10;
  }
  if (summary.blockIoWaitMs !== null && summary.blockIoWaitMs !== undefined && timings.processRuntimeMs) {
    summary.blockIoWaitPct =
      Math.round((summary.blockIoWaitMs / timings.processRuntimeMs) * 1000) / 10;
  }
  return summary;
}

async function convertToPdf({ executable, inputPath, outputDir, profileDir, timeoutMs = CONVERSION_TIMEOUT_MS }) {
  const timings = {};
  const totalStartTime = process.hrtime.bigint();
  const outputPath = path.join(outputDir, path.basename(inputPath).replace(/\.[^.]+$/, ".pdf"));

  // 1. Profile directory creation
  const profileCreateStart = process.hrtime.bigint();
  try {
    fs.mkdirSync(profileDir, { recursive: true });
  } catch (e) {
    // Ignore - will fail later if needed
  }
  timings.profileCreateMs = Number(process.hrtime.bigint() - profileCreateStart) / 1_000_000;

  const args = [
    "--headless",
    "--nologo",
    "--nodefault",
    "--norestore",
    "--nolockcheck",
    "--nofirststartwizard",
    buildProfileArgument(profileDir),
    "--convert-to",
    "pdf",
    "--outdir",
    outputDir,
    inputPath,
  ];

  // 2. LibreOffice process startup + conversion (serialized; limiter maxConcurrent=1)
  const conversionStartTime = process.hrtime.bigint();
  const queueStart = process.hrtime.bigint();
  let queueWaitMs = null;
  let result;
  try {
    result = await getLimiter("libreoffice").run(async () => {
      queueWaitMs = Number(process.hrtime.bigint() - queueStart) / 1_000_000;
      return runProcess(executable, args, {
        timeoutMs,
        profileDir,
        outputPath,
        collectResources: true,
      });
    });
  } catch (error) {
    timings.queueWaitMs = queueWaitMs;
    timings.conversionMs = Number(process.hrtime.bigint() - conversionStartTime) / 1_000_000;
    timings.profileEntryCount = countDirectoryEntries(profileDir);
    Object.assign(timings, extractSubprocessTimings(error.subprocessTimings, error.output));
    timings.totalMs = Number(process.hrtime.bigint() - totalStartTime) / 1_000_000;

    const rounded = roundTimings(timings);
    const resources = withCpuPercent(error.resources, rounded);

    console.error(
      JSON.stringify({
        type: "libreoffice_conversion",
        success: false,
        phase: error.timedOut ? "timeout" : "spawn_or_runner",
        timings: rounded,
        resources,
        output: error.output || null,
        inputFile: path.basename(inputPath),
        inputBytes: fileSize(inputPath),
        error: error.message,
        errorCode: error.code || null,
        stdoutLength: (error.stdout || "").length,
        stderrTail: (error.stderr || "").slice(-1000),
      })
    );
    process.stderr.write("\n");

    error.timings = rounded;
    error.resources = resources;

    if (error.timedOut) {
      throw new ConversionError(
        "PDF conversion timed out",
        ERROR_CODES.CONVERSION_FAILED,
        { stderr: error.stderr, safeDetail: "LibreOffice timed out" }
      );
    }
    throw new ConversionError(
      "PDF conversion service unavailable",
      ERROR_CODES.MISSING_DEPENDENCY,
      { error: error.message, safeDetail: "LibreOffice could not be started" }
    );
  }

  timings.queueWaitMs = queueWaitMs;
  timings.conversionMs = Number(process.hrtime.bigint() - conversionStartTime) / 1_000_000;
  Object.assign(timings, extractSubprocessTimings(result.subprocessTimings, result.output));

  // 3. Output PDF validation
  const validationStart = process.hrtime.bigint();
  try {
    validatePdfBuffer(fs.readFileSync(outputPath));
  } catch (e) {
    throw e;
  }
  timings.validationMs = Number(process.hrtime.bigint() - validationStart) / 1_000_000;

  // Profile/font-cache volume proves whether each conversion rebuilt a unique profile.
  timings.profileEntryCount = countDirectoryEntries(profileDir);
  timings.fontCacheEntryCount = countDirectoryEntries(
    path.join(path.dirname(profileDir), "fontconfig", "cache")
  );
  timings.inputBytes = fileSize(inputPath);
  timings.outputBytes = fileSize(outputPath);
  timings.totalMs = Number(process.hrtime.bigint() - totalStartTime) / 1_000_000;

  const rounded = roundTimings(timings);
  const resources = withCpuPercent(result.resources, rounded);
  result.timings = rounded;
  result.resources = resources;

  if (result.code !== 0) {
    const missingLibraries = extractMissingLibraries(result.stderr);
    const safeDetail = missingLibraries.length
      ? `Missing runtime library: ${missingLibraries.join(", ")}`
      : `LibreOffice exited with code ${result.code}`;

    console.error(
      JSON.stringify({
        type: "libreoffice_conversion",
        success: false,
        phase: "exit_code",
        timings: rounded,
        resources,
        output: result.output || null,
        code: result.code,
        signal: result.signal,
        missingLibraries,
        inputFile: path.basename(inputPath),
        stderrTail: (result.stderr || "").slice(-1000),
      })
    );
    process.stderr.write("\n");
    throw new ConversionError(
      missingLibraries.length
        ? "Document conversion is temporarily unavailable"
        : "PDF conversion failed",
      missingLibraries.length ? ERROR_CODES.MISSING_DEPENDENCY : ERROR_CODES.CONVERSION_FAILED,
      {
        code: result.code,
        signal: result.signal,
        stderr: result.stderr,
        safeDetail,
      }
    );
  }

  console.log(
    JSON.stringify({
      type: "libreoffice_conversion",
      success: true,
      timings: rounded,
      resources,
      output: result.output || null,
      inputFile: path.basename(inputPath),
      stdoutLength: result.stdout.length,
      stderrLength: result.stderr.length,
    })
  );
  // Force flush to ensure logs appear in real-time
  process.stdout.write("\n");

  return result;
}

function validatePdfBuffer(buffer) {
  if (!buffer || buffer.length === 0) {
    throw new ConversionError("Conversion produced an empty PDF", ERROR_CODES.CONVERSION_FAILED);
  }
  if (buffer.subarray(0, 5).toString("latin1") !== "%PDF-") {
    throw new ConversionError("Conversion produced an invalid PDF", ERROR_CODES.CONVERSION_FAILED);
  }
  const trailer = buffer.subarray(Math.max(0, buffer.length - 2048)).toString("latin1");
  if (!trailer.includes("%%EOF")) {
    throw new ConversionError("Conversion produced a truncated PDF", ERROR_CODES.CONVERSION_FAILED);
  }
}

module.exports = {
  detectLibreOffice,
  logDiagnostics,
  getStatus,
  verifyConversion,
  requireLibreOffice,
  convertToPdf,
  validatePdfBuffer,
  buildProfileArgument,
  CONVERSION_TIMEOUT_MS,
  investigateFonts,
};

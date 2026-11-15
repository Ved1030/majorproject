/**
 * Concurrency Limiter
 * Limits simultaneous execution of heavy operations to prevent memory exhaustion
 */

class ConcurrencyLimiter {
  constructor(options = {}) {
    this.maxConcurrent = options.maxConcurrent || 1;
    this.queue = [];
    this.running = 0;
    this.timeout = options.timeout || 300000; // 5 minutes default
    this.name = options.name || 'limiter';
  }

  /**
   * Execute a function with concurrency limiting
   * @param {Function} fn - Async function to execute
   * @returns {Promise} Result of the function
   */
  async run(fn) {
    return new Promise((resolve, reject) => {
      const task = { fn, resolve, reject, startTime: Date.now() };
      this.queue.push(task);
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    const task = this.queue.shift();
    this.running++;

    // Set up timeout
    const timeoutId = setTimeout(() => {
      this.running--;
      task.reject(new Error(`${this.name} operation timed out after ${this.timeout}ms`));
      this.processQueue();
    }, this.timeout);

    try {
      const result = await task.fn();
      clearTimeout(timeoutId);
      task.resolve(result);
    } catch (err) {
      clearTimeout(timeoutId);
      task.reject(err);
    } finally {
      this.running--;
      // Process next in queue
      this.processQueue();
    }
  }

  /**
   * Get current queue status
   * @returns {Object} Status info
   */
  getStatus() {
    return {
      name: this.name,
      maxConcurrent: this.maxConcurrent,
      running: this.running,
      queued: this.queue.length,
    };
  }

  /**
   * Clear the queue (rejects all waiting tasks)
   */
  clear() {
    for (const task of this.queue) {
      task.reject(new Error(`${this.name} queue cleared`));
    }
    this.queue = [];
  }
}

// Create limiters for different heavy operations
const limiters = {
  // Background removal - very memory intensive (AI model)
  backgroundRemoval: new ConcurrencyLimiter({
    maxConcurrent: 1, // Only 1 at a time to prevent OOM
    timeout: 300000, // 5 minutes
    name: 'background-removal',
  }),

  // PDF to DOCX conversion - memory intensive
  pdfToDocx: new ConcurrencyLimiter({
    maxConcurrent: 2,
    timeout: 300000,
    name: 'pdf-to-docx',
  }),

  // LibreOffice conversions - CPU intensive, spawns processes
  libreoffice: new ConcurrencyLimiter({
    maxConcurrent: 1,
    timeout: 300000,
    name: 'libreoffice',
  }),

  // PDF compression - can be memory intensive for large PDFs
  pdfCompression: new ConcurrencyLimiter({
    maxConcurrent: 2,
    timeout: 300000,
    name: 'pdf-compression',
  }),

  // Image compression - moderate memory usage
  imageCompression: new ConcurrencyLimiter({
    maxConcurrent: 3,
    timeout: 180000,
    name: 'image-compression',
  }),

  // PDF to image - memory intensive for high DPI
  pdfToImage: new ConcurrencyLimiter({
    maxConcurrent: 2,
    timeout: 300000,
    name: 'pdf-to-image',
  }),

  // Image to PDF - moderate memory usage
  imageToPdf: new ConcurrencyLimiter({
    maxConcurrent: 3,
    timeout: 180000,
    name: 'image-to-pdf',
  }),
};

/**
 * Get a limiter by name
 * @param {string} name - Limiter name
 * @returns {ConcurrencyLimiter}
 */
function getLimiter(name) {
  return limiters[name];
}

/**
 * Get status of all limiters
 * @returns {Object} Status of all limiters
 */
function getAllLimiterStatus() {
  const status = {};
  for (const [name, limiter] of Object.entries(limiters)) {
    status[name] = limiter.getStatus();
  }
  return status;
}

module.exports = {
  ConcurrencyLimiter,
  limiters,
  getLimiter,
  getAllLimiterStatus,
};
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
   * @param {Function} fn - Async function to execute, receives AbortSignal as argument
   * @param {AbortSignal} [signal] - Optional abort signal for cancellation
   * @returns {Promise} Result of the function
   */
  async run(fn, signal) {
    return new Promise((resolve, reject) => {
      const task = { fn, resolve, reject, startTime: Date.now(), aborted: false, completed: false, started: false, slotReleased: false, abortHandler: null, signal };
      this.queue.push(task);
      
      // Handle external abort signal
      if (signal) {
        if (signal.aborted) {
          task.aborted = true;
          this._removeTaskFromQueue(task);
          reject(new Error('Operation aborted'));
          return;
        }
        task.abortHandler = () => {
          if (!task.completed && !task.aborted) {
            task.aborted = true;
            if (task.started) {
              // If already running, we can't stop it but we can reject the promise
              // The slot will be released when the operation actually finishes
              this._settleCaller(task, new Error('Operation aborted'), true);
            } else {
              this._removeTaskFromQueue(task);
              this._settleCaller(task, new Error('Operation aborted'), true);
            }
          }
        };
        signal.addEventListener('abort', task.abortHandler, { once: true });
      }
      
      // Process queue asynchronously to allow abort to be handled before task starts
      setImmediate(() => this.processQueue());
    });
  }

  _removeTaskFromQueue(task) {
    const index = this.queue.indexOf(task);
    if (index !== -1) {
      this.queue.splice(index, 1);
    }
  }

  _releaseSlot(task) {
    // Only release if the task was actually running
    if (task.started && !task.slotReleased) {
      task.slotReleased = true;
      this.running--;
      this.processQueue();
    }
  }

  _settleCaller(task, result, isError) {
    if (task.callerSettled) return;
    task.callerSettled = true;

    // Clean up abort handler
    if (task.abortHandler && task.signal) {
      task.signal.removeEventListener('abort', task.abortHandler);
    }

    if (isError) {
      task.reject(result);
    } else {
      task.resolve(result);
    }
  }

  async processQueue() {
    if (
      this.running >= this.maxConcurrent ||
      this.queue.length === 0
    ) {
      return;
    }

    const task = this.queue.shift();

    if (task.aborted) {
      this.processQueue();
      return;
    }

    this.running++;
    task.started = true;
    task.callerSettled = false;

    let timeoutId = null;

    const settleCaller = (result, isError) => {
      if (task.callerSettled) return;
      task.callerSettled = true;

      // Clean up abort handler
      if (task.abortHandler && task.signal) {
        task.signal.removeEventListener('abort', task.abortHandler);
      }

      if (isError) {
        task.reject(result);
      } else {
        task.resolve(result);
      }
    };

    timeoutId = setTimeout(() => {
      settleCaller(
        new Error(
          `${this.name} operation timed out after ${this.timeout}ms`
        ),
        true
      );

      // IMPORTANT:
      // Do not release the slot here.
      // The actual operation may still be running.
    }, this.timeout);

    try {
      // Pass AbortSignal to task function if it accepts one
      const result = await task.fn(task.signal);
      settleCaller(result, false);
    } catch (err) {
      settleCaller(err, true);
    } finally {
      clearTimeout(timeoutId);

      task.completed = true;

      // Release the slot only when the actual operation settles.
      this._releaseSlot(task);
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
      if (!task.completed && !task.aborted) {
        task.aborted = true;
        // Clean up abort handler
        if (task.abortHandler && task.signal) {
          task.signal.removeEventListener('abort', task.abortHandler);
        }
        this._settleCaller(task, new Error(`${this.name} queue cleared`), true);
      }
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
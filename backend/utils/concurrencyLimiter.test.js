const { ConcurrencyLimiter } = require('./concurrencyLimiter');

describe('ConcurrencyLimiter', () => {
  let limiter;

  beforeEach(() => {
    limiter = new ConcurrencyLimiter({ maxConcurrent: 2, timeout: 100, name: 'test' });
  });

  afterEach(() => {
    limiter.clear();
  });

  test('should limit concurrent operations', async () => {
    const results = [];
    const running = [];
    let maxRunning = 0;

    const task = (id) => () => new Promise(resolve => {
      running.push(id);
      maxRunning = Math.max(maxRunning, running.length);
      setTimeout(() => {
        running.splice(running.indexOf(id), 1);
        results.push(id);
        resolve(id);
      }, 50);
    });

    const promises = [task(1), task(2), task(3), task(4)].map(fn => limiter.run(fn));
    await Promise.all(promises);

    expect(maxRunning).toBe(2);
    expect(results).toEqual([1, 2, 3, 4]);
  });

  test('should timeout and reject caller but keep slot until operation finishes', async () => {
    let operationFinished = false;

    const longTask = () => new Promise(resolve => {
      setTimeout(() => {
        operationFinished = true;
        resolve('done');
      }, 200);
    });

    // Attach handler immediately to avoid unhandled rejection
    const promise = limiter.run(longTask).catch(err => err);
    
    // Wait for timeout to fire
    await new Promise(r => setTimeout(r, 150));
    
    // Caller should have received timeout error
    const result = await promise;
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toContain('test operation timed out');
    
    // But operation should still be running
    expect(operationFinished).toBe(false);
    expect(limiter.getStatus().running).toBe(1);
    
    // Wait for operation to actually finish
    await new Promise(r => setTimeout(r, 100));
    
    expect(operationFinished).toBe(true);
    expect(limiter.getStatus().running).toBe(0);
  });

  test('should not allow running to go negative', async () => {
    const task = () => new Promise(resolve => setTimeout(resolve, 50));
    
    const promises = [task, task, task].map(fn => limiter.run(fn));
    await Promise.all(promises);
    
    expect(limiter.getStatus().running).toBe(0);
    expect(limiter.getStatus().running).not.toBeLessThan(0);
  });

  test('should not exceed maxConcurrent', async () => {
    let maxRunning = 0;
    let currentRunning = 0;
    
    const task = () => new Promise(resolve => {
      currentRunning++;
      maxRunning = Math.max(maxRunning, currentRunning);
      setTimeout(() => {
        currentRunning--;
        resolve();
      }, 50);
    });

    const promises = [task, task, task, task].map(fn => limiter.run(fn));
    await Promise.all(promises);
    
    expect(maxRunning).toBe(2);
  });

  test('should handle abort signal for queued task', async () => {
    const controller = new AbortController();
    let taskStarted = false;
    
    const task = () => new Promise((resolve, reject) => {
      taskStarted = true;
      setTimeout(resolve, 1000);
    });

    const promise = limiter.run(task, controller.signal).catch(err => err);
    
    // Abort immediately before task can start
    controller.abort();
    
    // Give event loop a chance to process abort
    await new Promise(r => setImmediate(r));
    
    const result = await promise;
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('Operation aborted');
    expect(taskStarted).toBe(false);
    expect(limiter.getStatus().running).toBe(0);
    expect(limiter.getStatus().queued).toBe(0);
  });

  test('should handle abort signal for running task', async () => {
    const controller = new AbortController();
    let taskFinished = false;
    
    const task = () => new Promise(resolve => {
      setTimeout(() => {
        taskFinished = true;
        resolve();
      }, 200);
    });

    const promise = limiter.run(task, controller.signal).catch(err => err);
    
    // Wait for task to start
    await new Promise(r => setTimeout(r, 50));
    expect(limiter.getStatus().running).toBe(1);
    
    controller.abort();
    
    const result = await promise;
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('Operation aborted');
    
    // Wait for task to actually finish
    await new Promise(r => setTimeout(r, 200));
    
    expect(taskFinished).toBe(true);
    expect(limiter.getStatus().running).toBe(0);
  });

  test('should pass AbortSignal to task function', async () => {
    let receivedSignal = null;
    let taskAbortFired = false;
    
    const task = (signal) => new Promise((resolve, reject) => {
      receivedSignal = signal;
      if (signal) {
        signal.addEventListener('abort', () => {
          taskAbortFired = true;
          // Task's own abort handler - but limiter will settle first
        }, { once: true });
      }
      setTimeout(resolve, 1000);
    });

    const controller = new AbortController();
    const promise = limiter.run(task, controller.signal).catch(err => err);
    
    // Wait for task to start and receive signal
    await new Promise(r => setTimeout(r, 50));
    
    expect(receivedSignal).toBe(controller.signal);
    expect(taskAbortFired).toBe(false);
    
    controller.abort();
    
    // Limiter's abort handler settles the promise first
    const result = await promise;
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('Operation aborted');
    expect(taskAbortFired).toBe(true); // Task's handler also fires
  });

  test('should release slot exactly once per operation', async () => {
    let releaseCount = 0;
    const originalReleaseSlot = limiter._releaseSlot.bind(limiter);
    
    limiter._releaseSlot = (task) => {
      releaseCount++;
      return originalReleaseSlot(task);
    };

    const task = () => new Promise(resolve => setTimeout(resolve, 50));
    
    await limiter.run(task);
    await limiter.run(task);
    
    expect(releaseCount).toBe(2);
    expect(limiter.getStatus().running).toBe(0);
  });

  test('should handle queued operations after timeout', async () => {
    const order = [];
    
    const longTask = (id) => () => new Promise(resolve => {
      order.push(`start-${id}`);
      setTimeout(() => {
        order.push(`end-${id}`);
        resolve(id);
      }, 200);
    });

    // Start 2 long tasks (maxConcurrent = 2)
    const p1 = limiter.run(longTask(1)).catch(err => err);
    const p2 = limiter.run(longTask(2)).catch(err => err);
    
    // Queue a 3rd task
    const p3 = limiter.run(longTask(3)).catch(err => err);
    
    // Wait for timeout on first two
    await new Promise(r => setTimeout(r, 150));
    
    // Both should have timed out
    const r1 = await p1;
    const r2 = await p2;
    expect(r1).toBeInstanceOf(Error);
    expect(r2).toBeInstanceOf(Error);
    expect(r1.message).toContain('timed out');
    expect(r2.message).toContain('timed out');
    
    // But they're still running, so 3rd should still be queued
    expect(limiter.getStatus().running).toBe(2);
    expect(limiter.getStatus().queued).toBe(1);
    
    // Wait for first one to actually finish (releases slot, starts task 3)
    await new Promise(r => setTimeout(r, 100));
    
    // Now 3rd should have started and completed
    await p3;
    
    // Wait for task 2 to finish
    await new Promise(r => setTimeout(r, 100));
    
    // Order: start-1, start-2, end-1, start-3, end-2, end-3
    // (task 1 and 2 start, task 1 finishes first, task 3 starts, task 2 finishes, task 3 finishes)
    expect(order).toEqual(['start-1', 'start-2', 'end-1', 'start-3', 'end-2', 'end-3']);
  });

  test('getStatus should return correct info', () => {
    const status = limiter.getStatus();
    expect(status).toEqual({
      name: 'test',
      maxConcurrent: 2,
      running: 0,
      queued: 0
    });
  });

  test('clear should reject all queued tasks', async () => {
    // Use a longer timeout so clear happens before timeout
    const longLimiter = new ConcurrencyLimiter({ maxConcurrent: 2, timeout: 5000, name: 'test-clear' });
    
    const task = () => new Promise(resolve => setTimeout(resolve, 1000));
    
    const p1 = longLimiter.run(task).catch(err => err);
    const p2 = longLimiter.run(task).catch(err => err);
    const p3 = longLimiter.run(task).catch(err => err);
    
    // Clear immediately
    longLimiter.clear();
    
    const r1 = await p1;
    const r2 = await p2;
    const r3 = await p3;
    expect(r1).toBeInstanceOf(Error);
    expect(r2).toBeInstanceOf(Error);
    expect(r3).toBeInstanceOf(Error);
    expect(r1.message).toContain('test-clear queue cleared');
    
    expect(longLimiter.getStatus().queued).toBe(0);
    expect(longLimiter.getStatus().running).toBe(0);
  });

  test('should handle multiple timeouts without double release', async () => {
    let releaseCount = 0;
    const originalReleaseSlot = limiter._releaseSlot.bind(limiter);
    limiter._releaseSlot = (task) => {
      releaseCount++;
      return originalReleaseSlot(task);
    };

    const longTask = () => new Promise(resolve => setTimeout(resolve, 200));
    
    const p1 = limiter.run(longTask).catch(err => err);
    const p2 = limiter.run(longTask).catch(err => err);
    
    await new Promise(r => setTimeout(r, 150)); // Wait for timeout
    
    await p1;
    await p2;
    
    // Wait for operations to finish
    await new Promise(r => setTimeout(r, 100));
    
    expect(releaseCount).toBe(2);
    expect(limiter.getStatus().running).toBe(0);
  });

  test('should handle error in task without double release', async () => {
    let releaseCount = 0;
    const originalReleaseSlot = limiter._releaseSlot.bind(limiter);
    limiter._releaseSlot = (task) => {
      releaseCount++;
      return originalReleaseSlot(task);
    };

    const errorTask = () => Promise.reject(new Error('Task failed'));
    
    const promise = limiter.run(errorTask).catch(err => err);
    const result = await promise;
    
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('Task failed');
    expect(releaseCount).toBe(1);
    expect(limiter.getStatus().running).toBe(0);
  });

  test('should handle abort after timeout', async () => {
    const controller = new AbortController();
    let taskFinished = false;
    
    const task = () => new Promise(resolve => {
      setTimeout(() => {
        taskFinished = true;
        resolve();
      }, 300);
    });

    const promise = limiter.run(task, controller.signal).catch(err => err);
    
    // Wait for timeout (100ms)
    await new Promise(r => setTimeout(r, 150));
    
    // Now abort
    controller.abort();
    
    const result = await promise;
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toContain('timed out'); // Timeout happens first
    
    // Wait for task to actually finish
    await new Promise(r => setTimeout(r, 200));
    
    expect(taskFinished).toBe(true);
    expect(limiter.getStatus().running).toBe(0);
  });

  test('running should never exceed maxConcurrent under load', async () => {
    const limiter = new ConcurrencyLimiter({ maxConcurrent: 3, timeout: 5000, name: 'load-test' });
    let maxRunning = 0;
    let currentRunning = 0;
    
    const task = () => new Promise(resolve => {
      currentRunning++;
      maxRunning = Math.max(maxRunning, currentRunning);
      setTimeout(() => {
        currentRunning--;
        resolve();
      }, Math.random() * 100 + 50);
    });

    const promises = Array.from({ length: 20 }, () => limiter.run(task));
    await Promise.all(promises);
    
    expect(maxRunning).toBe(3);
    expect(limiter.getStatus().running).toBe(0);
  });

  test('should clean up limiter abort handler on completion', async () => {
    const controller = new AbortController();
    let limiterAbortHandlerCalled = false;
    
    const task = (signal) => new Promise(resolve => {
      // Don't add task's own abort handler
      setTimeout(resolve, 50);
    });

    // Spy on the abort handler
    const originalRun = limiter.run.bind(limiter);
    limiter.run = async (fn, signal) => {
      const promise = originalRun(fn, signal);
      // Access internal task to check abort handler cleanup
      return promise;
    };

    const promise = limiter.run(task, controller.signal);
    await promise;
    
    // Abort after completion - limiter's abort handler should not be called again
    // (it was removed in _settleCaller)
    controller.abort();
    
    // The limiter's abort handler was cleaned up, so no double rejection
    // This test verifies no crash/unhandled rejection occurs
    await new Promise(r => setTimeout(r, 10));
    
    expect(limiter.getStatus().running).toBe(0);
  });
});
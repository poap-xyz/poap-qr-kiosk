/**
 * @typedef {Object} V1runtimes
 * @property {string} high_memory - Allocate high memory to function
 * @property {string} long_timeout - Set long timeout to function
 * @property {string} keep_warm - Keep function warm
 */
exports.v1_runtimes = {
    high_memory: { memory: '4GB' },
    long_timeout: { timeoutSeconds: 540 },
    keep_warm: { minInstances: 1 },
}

/**
 * @typedef {Object} V2runtimes
 * @property {string} protected - Enforce appcheck
 * @property {string} long_timeout - Set long timeout to function
 * @property {string} high_memory - Allocate high memory to function
 * @property {string} keep_warm - Keep function warm with min instances
 * @property {string} max_concurrency - Set max concurrency
 */
exports.v2_runtimes = {
    protected: { enforceAppCheck: true },
    long_timeout: { timeoutSeconds: 540 },
    high_memory: { memory: '4GiB' }, // Note: memory also increases compute power
    keep_warm: { minInstances: 1 },
    max_concurrency: { concurrency: 1000 }
}
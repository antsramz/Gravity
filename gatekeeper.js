// Gravity Core Gatekeeper - M2M Enforcement Engine
// No Add-ons. No Drift.

const env = require('./env.json');
const schema = require('./schema.json');

class Gatekeeper {
    constructor() {
        this.roots = env.ROOT_WALLETS;
        this.fees = env.FEES_USDC_M2M;
        this.ttl = env.PHYSICS.TTL_SECONDS;
    }

    validateTransition(currentState, nextState, payment) {
        // Enforce Linear Path (T0 -> T6)
        const currentIdx = Object.keys(schema.STATES).indexOf(currentState);
        const nextIdx = Object.keys(schema.STATES).indexOf(nextState);

        if (nextIdx !== currentIdx + 1) return { status: "REJECTED", reason: "NON_LINEAR_TRANSITION" };

        // T5 Revenue Lock Enforcement
        if (nextState === "T5") {
            if (payment < this.fees.BASE_FEE) {
                return { status: "REJECTED", reason: "INSUFFICIENT_M2M_FEE" };
            }
        }

        return { status: "ACCEPTED", target_root: this.selectOptimalRail() };
    }

    selectOptimalRail() {
        // Logic defaults to SOL for high-velocity unless otherwise specified by agent
        return this.roots.SOLANA_MAINNET;
    }

    purgeEntropy(tasks) {
        // Purge any task older than TTL_SECONDS
        const now = Date.now() / 1000;
        return tasks.filter(task => (now - task.timestamp) < this.ttl);
    }
}

module.exports = Gatekeeper;

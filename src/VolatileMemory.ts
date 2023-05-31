import { PromptMemory } from "./types";

/**
 * An in-memory store that lives for the length of the process.
 */
export class VolatileMemory implements PromptMemory {
    private readonly _memory: Map<string, any> = new Map<string, any>();

    /**
     * Creates a new 'VolatileMemory' instance.
     * @param memory Optional. Variables to initialize this instance with.
     */
    public constructor(memory?: Record<string, any>) {
        if (memory) {
            for (const key in memory) {
                this._memory.set(key, memory[key]);
            }
        }
    }

    public has(key: string): boolean {
        return this._memory.has(key);
    }

    public get(key: string): any {
        const value = this._memory.get(key);
        if (value !== null && typeof value === "object") {
            return JSON.parse(JSON.stringify(value));
        } else {
            return value;
        }
    }

    public set(key: string, value: any): void {
        if (value !== null && typeof value === "object") {
            const clone = JSON.parse(JSON.stringify(value));
            this._memory.set(key, clone);
        } else {
            this._memory.set(key, value);
        }
    }

    public delete(key: string): void {
        this._memory.delete(key);
    }

    public clear(): void {
        this._memory.clear();
    }
}
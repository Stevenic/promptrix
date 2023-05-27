import { PromptMemory } from "./types";

export class VolatileMemory implements PromptMemory {
    private readonly _memory: Map<string, any> = new Map<string, any>();

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
        return JSON.parse(JSON.stringify(value));

    }

    public set(key: string, value: any): void {
        const clone = JSON.parse(JSON.stringify(value));
        this._memory.set(key, clone);
    }

    public delete(key: string): void {
        this._memory.delete(key);
    }

    public clear(): void {
        this._memory.clear();
    }
}
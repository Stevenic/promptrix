import { PromptMemory } from "./types";

export class VolatileMemory implements PromptMemory {
    private readonly _memory: Map<string, any> = new Map<string, any>();

    public has(key: string): boolean {
        return this._memory.has(key);
    }

    public get(key: string): any {
        return this._memory.get(key);
    }

    public set(key: string, value: any): void {
        this._memory.set(key, value);
    }

    public delete(key: string): void {
        this._memory.delete(key);
    }

    public clear(): void {
        this._memory.clear();
    }
}
import { PromptFunctions, PromptFunction, PromptMemory, Tokenizer } from "./types";

export class FunctionRegistry implements PromptFunctions {
    private readonly _functions: Map<string, PromptFunction> = new Map<string, PromptFunction>();

    public has(name: string): boolean {
        return this._functions.has(name);
    }

    public get(name: string): PromptFunction {
        const fn = this._functions.get(name);
        if (!fn) {
            throw new Error(`Function '${name}' not found.`);
        }

        return fn;
    }

    public add(name: string, value: PromptFunction): void {
        if (this._functions.has(name)) {
            throw new Error(`Function '${name}' already exists.`);
        }

        this._functions.set(name, value);
    }

    public invoke(key: string, memory: PromptMemory, functions: PromptFunctions, tokenizer: Tokenizer, args: string[]): Promise<any> {
        const fn = this.get(key);
        return fn(memory, functions, tokenizer, args);
    }
}
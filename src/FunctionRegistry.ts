import { PromptFunctions, PromptFunction, PromptMemory, Tokenizer } from "./types";

/**
 * Registry of functions that can be invoked from a prompt template.
 */
export class FunctionRegistry implements PromptFunctions {
    private readonly _functions: Map<string, PromptFunction> = new Map<string, PromptFunction>();

    /**
     * Creates a new 'FunctionRegistry' instance.
     * @param functions Optional. Functions to add to this registry.
     */
    public constructor(functions?: Record<string, PromptFunction>) {
        if (functions) {
            for (const key in functions) {
                this._functions.set(key, functions[key]);
            }
        }
    }

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

    public addFunction(name: string, value: PromptFunction): void {
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
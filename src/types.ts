
export interface PromptSection {
    /**
     * If true the section is mandatory otherwise it can be safely dropped.
     */
    readonly required: boolean;

    /**
     * The requested token budget for this section.
     * - Values between 0.0 and 1.0 represent a percentage of the total budget and the section will be layed out proportionally to all other sections.
     * - Values greater than 1.0 represent the max number of tokens the section should be allowed to consume.
     */
    readonly tokens: number;

    /**
     * Renders the section as a string of text.
     * @param memory Memory that can be referenced by the section.
     * @param functions Registry of functions that can be used by the section.
     * @param tokenizer Tokenizer to use when rendering the section.
     * @param maxTokens Maximum number of tokens allowed to be rendered.
     */
    renderAsText(memory: PromptMemory, functions: PromptFunctions, tokenizer: Tokenizer, maxTokens: number): Promise<RenderedPromptSection<string>>;

    /**
     * Renders the section as a list of messages.
     * @param memory Memory that can be referenced by the section.
     * @param functions Registry of functions that can be used by the section.
     * @param tokenizer Tokenizer to use when rendering the section.
     * @param maxTokens Maximum number of tokens allowed to be rendered.
     */
    renderAsMessages(memory: PromptMemory, functions: PromptFunctions, tokenizer: Tokenizer, maxTokens: number): Promise<RenderedPromptSection<Message[]>>;
}

export interface RenderedPromptSection<T> {
    /**
     * The section that was rendered.
     */
    output: T;

    /**
     * The number of tokens that were rendered.
     */
    length: number;

    /**
     * If true the section was truncated because it exceeded the maxTokens budget.
     */
    tooLong: boolean;
}

export interface Message<TContent = string> {
    /**
     * The messages role. Typically 'system', 'user', 'assistant', 'function'.
     */
    role: string;

    /**
     * Text of the message.
     */
    content: TContent|null;

    /**
     * @deprecated
     * Optional. A named function to call.
     */
    function_call?: FunctionCall;

    /**
     * Optional. Name of the participant.
     */
    name?: string;

    /**
     * Optional. Refusal message from the model.
     */
    refusal?: string;

    /**
     * Optional. Array of tools to call.
     */
    tool_calls?: ToolCall[];

    /**
     * Optional. ID of the tool that was called.
     */
    tool_call_id?: string;
}

export interface ToolCall {
    id: string;
    type: 'function';
    function: FunctionCall;
}

export interface FunctionCall {
    name?: string;
    arguments?: string;
}

export interface PromptMemory {
    has(key: string): boolean;
    get<TValue = any>(key: string): TValue;
    set<TValue = any>(key: string, value: TValue): void;
    delete(key: string): void;
    clear(): void;
}

export interface PromptFunctions {
    has(name: string): boolean;
    get(name: string): PromptFunction;
    invoke(name: string, memory: PromptMemory, functions: PromptFunctions, tokenizer: Tokenizer, args: string[]): Promise<any>;
}

export interface Tokenizer {
    decode(tokens: number[]): string;
    encode(text: string): number[];
}

export type PromptFunction<TArgs = any> = (memory: PromptMemory, functions: PromptFunctions, tokenizer: Tokenizer, args: TArgs) => Promise<any>;
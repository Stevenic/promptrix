import { Message, PromptFunctions, PromptMemory, PromptSection, RenderedPromptSection, Tokenizer } from "./types";

export abstract class PromptSectionBase implements PromptSection {
    public readonly required: boolean;
    public readonly tokens: number;
    public readonly separator: string;
    public readonly textPrefix: string;

    public constructor(tokens: number = 1.0, required: boolean = true, separator: string = '\n', textPrefix: string = '') {
        this.required = required;
        this.tokens = tokens;
        this.separator = separator;
        this.textPrefix = textPrefix;
    }

    public async renderAsText(memory: PromptMemory, functions: PromptFunctions, tokenizer: Tokenizer, maxTokens: number): Promise<RenderedPromptSection<string>> {
        // Render as messages
        const asMessages = await this.renderAsMessages(memory, functions, tokenizer, maxTokens);

        // Convert to text
        const text = asMessages.output.map((message) => message.content).join(this.separator);

        // Calculate length
        const prefixLength = tokenizer.encode(this.textPrefix).length;
        const separatorLength = tokenizer.encode(this.separator).length;
        const length = prefixLength + asMessages.length + ((asMessages.output.length - 1) * separatorLength);

        return { output: this.textPrefix + text, length: length, tooLong: length > maxTokens };
    }

    public abstract renderAsMessages(memory: PromptMemory, functions: PromptFunctions, tokenizer: Tokenizer, maxTokens: number): Promise<RenderedPromptSection<Message[]>>;
}
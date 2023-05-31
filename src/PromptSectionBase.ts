import { Message, PromptFunctions, PromptMemory, PromptSection, RenderedPromptSection, Tokenizer } from "./types";

/**
 * Abstract Base class for most prompt sections.
 */
export abstract class PromptSectionBase implements PromptSection {
    public readonly required: boolean;
    public readonly tokens: number;
    public readonly separator: string;
    public readonly textPrefix: string;

    /**
     * Creates a new 'PromptSectionBase' instance.
     * @param tokens Optional. Sizing strategy for this section. Defaults to `auto`.
     * @param required Optional. Indicates if this section is required. Defaults to `true`.
     * @param separator Optional. Separator to use between sections when rendering as text. Defaults to `\n`.
     * @param textPrefix Optional. Prefix to use for text output. Defaults to `undefined`.
     */
    public constructor(tokens: number = -1, required: boolean = true, separator: string = '\n', textPrefix: string = '') {
        this.required = required;
        this.tokens = tokens;
        this.separator = separator;
        this.textPrefix = textPrefix;
    }

    public async renderAsText(memory: PromptMemory, functions: PromptFunctions, tokenizer: Tokenizer, maxTokens: number): Promise<RenderedPromptSection<string>> {
        // Render as messages
        const asMessages = await this.renderAsMessages(memory, functions, tokenizer, maxTokens);

        // Convert to text
        let text = asMessages.output.map((message) => message.content).join(this.separator);

        // Calculate length
        const prefixLength = tokenizer.encode(this.textPrefix).length;
        const separatorLength = tokenizer.encode(this.separator).length;
        let length = prefixLength + asMessages.length + ((asMessages.output.length - 1) * separatorLength);

        // Truncate if fixed length
        text = this.textPrefix + text;
        if (this.tokens > 1.0 && length > this.tokens) {
            const encoded = tokenizer.encode(text);
            text = tokenizer.decode(encoded.slice(0, this.tokens));
            length = this.tokens;
        }

        return { output: text, length: length, tooLong: length > maxTokens };
    }

    public abstract renderAsMessages(memory: PromptMemory, functions: PromptFunctions, tokenizer: Tokenizer, maxTokens: number): Promise<RenderedPromptSection<Message[]>>;

    protected returnMessages(output: Message[], length: number, tokenizer: Tokenizer, maxTokens: number): RenderedPromptSection<Message[]> {
        // Truncate if fixed length
        if (this.tokens > 1.0) {
            while (length > this.tokens) {
                const msg = output.pop();
                const encoded = tokenizer.encode(msg!.content);
                length -= encoded.length;
                if (length < this.tokens) {
                    const delta = this.tokens - length;
                    const truncated = tokenizer.decode(encoded.slice(0, delta));
                    output.push({ role: msg!.role, content: truncated });
                    length += delta;
                }
            }
        }

        return { output: output, length: length, tooLong: length > maxTokens };
    }
}
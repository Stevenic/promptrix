import { Message, PromptFunctions, PromptMemory, PromptSection, RenderedPromptSection, Tokenizer } from "./types";

/**
 * Abstract Base class for most prompt sections.
 */
export abstract class PromptSectionBase implements PromptSection {
    public readonly required: boolean;
    public readonly size: number;
    public readonly separator: string;
    public readonly textPrefix: string;

    /**
     * Creates a new 'PromptSectionBase' instance.
     * @param size Optional. Sizing strategy for this section. Defaults to `auto`.
     * @param required Optional. Indicates if this section is required. Defaults to `true`.
     * @param separator Optional. Separator to use between sections when rendering as text. Defaults to `\n`.
     * @param textPrefix Optional. Prefix to use for text output. Defaults to `undefined`.
     */
    public constructor(size: number = -1, required: boolean = true, separator: string = '\n', textPrefix: string = '') {
        this.required = required;
        this.size = size;
        this.separator = separator;
        this.textPrefix = textPrefix;
    }

    public async renderAsText(memory: PromptMemory, functions: PromptFunctions, tokenizer: Tokenizer, maxTokens: number): Promise<RenderedPromptSection<string>> {
        // Render as messages
        const asMessages = await this.renderAsMessages(memory, functions, tokenizer, maxTokens);
        if (asMessages.output.length === 0) {
            return { output: '', length: 0, tooLong: false };
        }

        // Convert to text
        let text = asMessages.output.map((message) => PromptSectionBase.getMessageText(message)).join(this.separator);

        // Calculate length
        const prefixLength = tokenizer.encode(this.textPrefix).length;
        const separatorLength = tokenizer.encode(this.separator).length;
        let length = prefixLength + asMessages.length + ((asMessages.output.length - 1) * separatorLength);

        // Truncate if fixed length
        text = this.textPrefix + text;
        if (this.size > 1.0 && length > this.size) {
            const encoded = tokenizer.encode(text);
            text = tokenizer.decode(encoded.slice(0, this.size));
            length = this.size;
        }

        return { output: text, length: length, tooLong: length > maxTokens };
    }

    public abstract renderAsMessages(memory: PromptMemory, functions: PromptFunctions, tokenizer: Tokenizer, maxTokens: number): Promise<RenderedPromptSection<Message[]>>;

    protected returnMessages(output: Message[], length: number, tokenizer: Tokenizer, maxTokens: number): RenderedPromptSection<Message[]> {
        // Truncate if fixed length
        if (this.size > 1.0) {
            while (length > this.size) {
                const msg = output.pop();
                const encoded = tokenizer.encode(PromptSectionBase.getMessageText(msg!));
                length -= encoded.length;
                if (length < this.size) {
                    const delta = this.size - length;
                    const truncated = tokenizer.decode(encoded.slice(0, delta));
                    output.push({ role: msg!.role, content: truncated });
                    length += delta;
                }
            }
        }

        return { output: output, length: length, tooLong: length > maxTokens };
    }

    public static getMessageText(message: Message): string {
        let text = message.content ?? '';
        if (message.function_call) {
            text = JSON.stringify(message.function_call);
        } else if (message.name) {
            text = `${message.name} returned ${text}`;
        }

        return text;
    }

}
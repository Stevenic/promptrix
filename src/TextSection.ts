import { Message, PromptFunctions, PromptMemory, RenderedPromptSection, Tokenizer } from "./types";
import { PromptSectionBase } from "./PromptSectionBase";

export class TextSection extends PromptSectionBase {
    private _length: number = -1;

    public readonly text: string;
    public readonly role: string;

    public constructor(text: string, role: string, tokens: number = 1.0, required: boolean = true, separator: string = '\n', textPrefix?: string) {
        super(tokens, required, separator, textPrefix);
        this.text = text;
        this.role = role;
    }

    public async renderAsMessages(memory: PromptMemory, functions: PromptFunctions, tokenizer: Tokenizer, maxTokens: number): Promise<RenderedPromptSection<Message[]>> {
        // Calculate and cache length
        if (this._length < 0) {
            this._length = tokenizer.encode(this.text).length;
        }

        return { output: [{ role: this.role, content: this.text }], length: this._length, tooLong: this._length > maxTokens };
    }
}
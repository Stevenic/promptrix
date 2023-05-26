import { Message, PromptFunctions, PromptMemory, RenderedPromptSection, Tokenizer } from "./types";
import { PromptSectionBase } from "./PromptSectionBase";

export class TextSection extends PromptSectionBase {
    private _length: number = -1;

    public readonly text: string;
    public readonly type: string;

    public constructor(text: string, type: string, tokens: number = 1.0, required: boolean = true, separator: string = '/n') {
        super(tokens, required, separator);
        this.text = text;
        this.type = type;
    }

    public async renderAsMessages(memory: PromptMemory, functions: PromptFunctions, tokenizer: Tokenizer, maxTokens: number): Promise<RenderedPromptSection<Message[]>> {
        // Calculate and cache length
        if (this._length < 0) {
            this._length = tokenizer.encode(this.text).length;
        }

        return { output: [{ type: this.type, content: this.text }], length: this._length, tooLong: this._length > maxTokens };
    }
}
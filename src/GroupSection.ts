import { Message, PromptFunctions, PromptMemory, PromptSection, RenderedPromptSection, Tokenizer } from "./types";
import { PromptSectionBase } from "./PromptSectionBase";
import { LayoutEngine } from "./LayoutEngine";

export class GroupSection extends PromptSectionBase {
    private readonly _layoutEngine: LayoutEngine;

    public readonly sections: PromptSection[];
    public readonly role: string;

    public constructor(sections: PromptSection[], role: string = 'system', tokens: number = -1, required: boolean = true, separator: string = '\n\n', textPrefix?: string) {
        super(tokens, required, separator, textPrefix);
        this._layoutEngine = new LayoutEngine(sections, tokens, required, separator);
        this.sections = sections;
        this.role = role;
    }

    public async renderAsMessages(memory: PromptMemory, functions: PromptFunctions, tokenizer: Tokenizer, maxTokens: number): Promise<RenderedPromptSection<Message[]>> {
        // Render sections to text
        const { output, length, tooLong } = await this._layoutEngine.renderAsText(memory, functions, tokenizer, maxTokens);

        // Return output as a single message
        return this.returnMessages([{ role: this.role, content: output }], length, tokenizer, maxTokens);
    }
}
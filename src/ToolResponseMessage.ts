import { Message, PromptFunctions, PromptMemory, RenderedPromptSection, Tokenizer } from "./types";
import { PromptSectionBase } from "./PromptSectionBase";
import { Utilities } from "./Utilities";

/**
 * Message containing the response to a tool call.
 */
export class ToolResponseMessage extends PromptSectionBase {
    private _text: string = '';
    private _length: number = -1;

    public readonly tool_call_id: string;
    public readonly response: any;

    /**
     * Creates a new 'ToolResponseMessage' instance.
     * @param tool_call_id ID of the tool that was called.
     * @param response The response returned by the called function.
     * @param tokens Optional. Sizing strategy for this section. Defaults to `auto`.
     * @param functionPrefix Optional. Prefix to use for function messages when rendering as text. Defaults to `user: ` to simulate the response coming from the user.
     */
    public constructor(tool_call_id: string, response: any, tokens: number = -1, functionPrefix: string = 'user: ') {
        super(tokens, true, '\n', functionPrefix);
        this.tool_call_id = tool_call_id;
        this.response = response;
    }

    public async renderAsMessages(memory: PromptMemory, functions: PromptFunctions, tokenizer: Tokenizer, maxTokens: number): Promise<RenderedPromptSection<Message[]>> {
        // Calculate and cache response text and length
        if (this._length < 0) {
            this._text = Utilities.toString(tokenizer, this.response);
            this._length = tokenizer.encode(this.tool_call_id).length + tokenizer.encode(this._text).length;
        }

        // Return output
        return this.returnMessages([{ role: 'tool', tool_call_id: this.tool_call_id, content: this._text }], this._length, tokenizer, maxTokens);
    }
}
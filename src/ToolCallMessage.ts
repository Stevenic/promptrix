import { FunctionCall, Message, PromptFunctions, PromptMemory, RenderedPromptSection, Tokenizer, ToolCall } from "./types";
import { PromptSectionBase } from "./PromptSectionBase";

/**
 * An `assistant` message containing a list of tools to call.
 * @remarks
 * The tool call information is returned by the model so we use an "assistant" message to
 * represent it in conversation history.
 */
export class ToolCallMessage extends PromptSectionBase {
    private _length: number = -1;

    public readonly tool_calls: ToolCall[];

    /**
     * Creates a new 'ToolCallMessage' instance.
     * @param tool_calls List of tools to call.
     * @param tokens Optional. Sizing strategy for this section. Defaults to `auto`.
     * @param assistantPrefix Optional. Prefix to use for assistant messages when rendering as text. Defaults to `assistant: `.
     */
    public constructor(tool_calls: ToolCall[], tokens: number = -1, assistantPrefix: string = 'assistant: ') {
        super(tokens, true, '\n', assistantPrefix);
        this.tool_calls = tool_calls;
    }

    public async renderAsMessages(memory: PromptMemory, functions: PromptFunctions, tokenizer: Tokenizer, maxTokens: number): Promise<RenderedPromptSection<Message[]>> {
        // Calculate and cache response text and length
        if (this._length < 0) {
            this._length = tokenizer.encode(JSON.stringify(this.tool_calls)).length;
        }

        // Return output
        return this.returnMessages([{ role: 'assistant', content: null, tool_calls: this.tool_calls }], this._length, tokenizer, maxTokens);
    }
}
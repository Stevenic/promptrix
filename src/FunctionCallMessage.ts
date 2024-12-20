import { FunctionCall, Message, PromptFunctions, PromptMemory, RenderedPromptSection, Tokenizer } from "./types";
import { PromptSectionBase } from "./PromptSectionBase";

/**
 * @deprecated
 * An `assistant` message containing a function to call.
 * @remarks
 * The function call information is returned by the model so we use an "assistant" message to
 * represent it in conversation history.
 */
export class FunctionCallMessage extends PromptSectionBase {
    private _length: number = -1;

    public readonly function_call: FunctionCall;

    /**
     * Creates a new 'FunctionCallMessage' instance.
     * @param function_call name and arguments of the function to call.
     * @param tokens Optional. Sizing strategy for this section. Defaults to `auto`.
     * @param assistantPrefix Optional. Prefix to use for assistant messages when rendering as text. Defaults to `assistant: `.
     */
    public constructor(function_call: FunctionCall, tokens: number = -1, assistantPrefix: string = 'assistant: ') {
        super(tokens, true, '\n', assistantPrefix);
        this.function_call = function_call;
    }

    public async renderAsMessages(memory: PromptMemory, functions: PromptFunctions, tokenizer: Tokenizer, maxTokens: number): Promise<RenderedPromptSection<Message[]>> {
        // Calculate and cache response text and length
        if (this._length < 0) {
            this._length = tokenizer.encode(JSON.stringify(this.function_call)).length;
        }

        // Return output
        return this.returnMessages([{ role: 'assistant', content: null, function_call: this.function_call }], this._length, tokenizer, maxTokens);
    }
}
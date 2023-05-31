import { Message, PromptFunctions, PromptMemory, RenderedPromptSection, Tokenizer } from "./types";
import { PromptSectionBase } from "./PromptSectionBase";

export class ConversationHistory extends PromptSectionBase {
    public readonly variable: string;
    public readonly userPrefix: string;
    public readonly assistantPrefix: string;

    public constructor(variable: string, tokens: number, required: boolean = false, userPrefix: string = 'user: ', assistantPrefix: string = 'assistant: ', separator: string = '\n') {
        super(tokens, required, separator);
        this.variable = variable;
        this.userPrefix = userPrefix;
        this.assistantPrefix = assistantPrefix;
    }

    public async renderAsText(memory: PromptMemory, functions: PromptFunctions, tokenizer: Tokenizer, maxTokens: number): Promise<RenderedPromptSection<string>> {
      // Get messages from memory
      const history: Message[] = memory.has(this.variable) ? (memory.get(this.variable) as Message[]).slice() : [];

      // Populate history and stay under the token budget
      let tokens = 0;
      const budget = this.tokens > 1.0 ? Math.min(this.tokens, maxTokens) : maxTokens;
      const separatorLength = tokenizer.encode(this.separator).length;
      const lines: string[] = [];
      for (let i = history.length - 1; i >= 0; i--) {
          const message = history[i];
          const prefix = message.role === 'user' ? this.userPrefix : this.assistantPrefix;
          const line = prefix + message.content;
          const length = tokenizer.encode(line).length + (lines.length > 0 ? separatorLength : 0);

          // Add initial line if required
          if (lines.length === 0 && this.required) {
              tokens += length;
              lines.unshift(line);
          }

          // Stop if we're over the token budget
          if (tokens + length > budget) {
              break;
          }

          // Add line
          tokens += length;
          lines.unshift(line);
      }

      return { output: lines.join(this.separator), length: tokens, tooLong: tokens > maxTokens };
   }

    public async renderAsMessages(memory: PromptMemory, functions: PromptFunctions, tokenizer: Tokenizer, maxTokens: number): Promise<RenderedPromptSection<Message[]>> {
        // Get messages from memory
        const history: Message[] = memory.has(this.variable) ? (memory.get(this.variable) as Message[]).slice() : [];

        // Populate messages and stay under the token budget
        let tokens = 0;
        const budget = this.tokens > 1.0 ? Math.min(this.tokens, maxTokens) : maxTokens;
        const messages: Message[] = [];
        for (let i = history.length - 1; i >= 0; i--) {
            const message = history[i];
            const length = tokenizer.encode(message.content).length;

            // Add initial message if required
            if (messages.length === 0 && this.required) {
                tokens += length;
                messages.unshift(message);
            }

            // Stop if we're over the token budget
            if (tokens + length > budget) {
                break;
            }

            // Add message
            tokens += length;
            messages.unshift(message);
        }

        return { output: messages, length: tokens, tooLong: tokens > maxTokens };
    }
}
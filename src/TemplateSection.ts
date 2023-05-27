import { Message, PromptFunctions, PromptMemory, RenderedPromptSection, Tokenizer } from "./types";
import { PromptSectionBase } from "./PromptSectionBase";
import { Utilities } from "./Utilities";

export class TemplateSection extends PromptSectionBase {
    private _parts: PartRenderer[] = [];

    public readonly template: string;
    public readonly role: string;

    public constructor(template: string, role: string, tokens: number = 1.0, required: boolean = true, separator: string = '\n') {
        super(tokens, required, separator);
        this.template = template;
        this.role = role;
        this.parseTemplate();
    }

    public async renderAsMessages(memory: PromptMemory, functions: PromptFunctions, tokenizer: Tokenizer, maxTokens: number): Promise<RenderedPromptSection<Message[]>> {
        // Render parts in parallel
        const renderedParts = await Promise.all(this._parts.map((part) => part(memory, functions, tokenizer, maxTokens)));

        // Join all parts
        const text = renderedParts.join('');
        const length = tokenizer.encode(text).length;

        return { output: [{ role: this.role, content: text }], length: length, tooLong: length > maxTokens };
    }

    private parseTemplate(): void {
        // Parse template
        let part = '';
        let state = ParseState.inText;
        let stringDelim = '';
        for (let i = 0; i < this.template.length; i++) {
            const char = this.template[i];
            switch (state) {
                default:
                case ParseState.inText:
                    if (char === '{' && this.template[i + 1] === '{') {
                        if (part.length > 0) {
                            this._parts.push(this.createTextRenderer(part));
                            part = '';
                        }

                        state = ParseState.inParameter;
                        i++;
                    } else {
                        part += char;
                    }
                    break;
                case ParseState.inParameter:
                    if (char === '}' && this.template[i + 1] === '}') {
                        if (part.length > 0) {
                            if (part[0] === '$') {
                                this._parts.push(this.createVariableRenderer(part.substring(1)));
                            } else {
                                this._parts.push(this.createFunctionRenderer(part));
                            }
                            part = '';
                        }

                        state = ParseState.inText;
                        i++;
                    } else if (["'", '"', '`'].includes(char)) {
                        stringDelim = char;
                        state = ParseState.inString;
                        part += char;
                    } else {
                        part += char;
                    }
                    break;
                case ParseState.inString:
                    part += char;
                    if (char === stringDelim) {
                        state = ParseState.inParameter;
                    }
                    break;
            }
        }

        // Ensure we ended in the correct state
        if (state !== ParseState.inText) {
            throw new Error(`Invalid template: ${this.template}`);
        }

        // Add final part
        if (part.length > 0) {
            this._parts.push(this.createTextRenderer(part));
        }
    }

    private createTextRenderer(text: string): PartRenderer {
        return (memory: PromptMemory, functions: PromptFunctions, tokenizer: Tokenizer, maxTokens: number): Promise<string> => {
            return Promise.resolve(text);
        };
    }

    private createVariableRenderer(name: string): PartRenderer {
        return (memory: PromptMemory, functions: PromptFunctions, tokenizer: Tokenizer, maxTokens: number): Promise<string> => {
            const vaue = memory.get(name);
            return Promise.resolve(Utilities.toString(tokenizer, vaue));
        };
    }

    private createFunctionRenderer(param: string): PartRenderer {
        let name = '';
        let args: string[] = [];
        function savePart() {
            if (part.length > 0) {
                if (!name) {
                    name = part;
                } else {
                    args.push(part);
                }
                part = '';
            }
        }

        // Parse function name and args
        let part = '';
        let state = ParseState.inText;
        let stringDelim = '';
        for (let i = 0; i < param.length; i++) {
            const char = param[i];
            switch (state) {
                default:
                case ParseState.inText:
                    if (["'", '"', '`'].includes(char)) {
                        savePart();
                        stringDelim = char;
                        state = ParseState.inString;
                    } else if (char == ' ') {
                        savePart();
                    }
                    break;
                case ParseState.inString:
                    if (char === stringDelim) {
                        savePart();
                        state = ParseState.inText;
                    }
                    break;
            }
        }

        // Ensure we ended in the correct state
        if (state !== ParseState.inText) {
            throw new Error(`Invalid function parameter: ${param}`);
        }

        // Add final part
        savePart();

        // Return renderer
        return async (memory: PromptMemory, functions: PromptFunctions, tokenizer: Tokenizer, maxTokens: number): Promise<string> => {
            const value = await functions.invoke(name, memory, functions, tokenizer, args);
            return Utilities.toString(tokenizer, value);
        };
    }

}

type PartRenderer = (memory: PromptMemory, functions: PromptFunctions, tokenizer: Tokenizer, maxTokens: number) => Promise<string>;

enum ParseState {
    inText,
    inParameter,
    inString
}
import { TemplateSection } from "./TemplateSection";

export class AssistantMessage extends TemplateSection {
    public constructor(template: string, tokens: number = -1, assistantPrefix: string = 'assistant: ') {
        super(template, 'assistant', tokens, true, '\n', assistantPrefix);
    }
}
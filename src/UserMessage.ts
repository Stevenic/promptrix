import { TemplateSection } from "./TemplateSection";

export class UserMessage extends TemplateSection {
    public constructor(template: string, tokens: number = 1.0, userPrefix: string = 'user: ') {
        super(template, 'user', tokens, true, userPrefix);
    }
}
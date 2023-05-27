import { Message, PromptFunctions, PromptMemory, PromptSection, RenderedPromptSection, Tokenizer } from "./types";

export class Prompt implements PromptSection {
    public readonly sections: PromptSection[];
    public readonly required: boolean;
    public readonly tokens: number;
    public readonly separator: string;

    public constructor(sections: PromptSection[], required: boolean = true, tokens: number = 1.0, separator: string = '/n/n') {
        this.sections = sections;
        this.required = required;
        this.tokens = tokens;
        this.separator = separator;
    }

    public async renderAsText(memory: PromptMemory, functions: PromptFunctions, tokenizer: Tokenizer, maxTokens: number): Promise<RenderedPromptSection<string>> {
        // Start a new layout
        const layout: PromptSectionLayout<string>[] = this.sections.map((section) => {
            return { section: section };
        });

        // Layout sections
        const remaining = await this.layoutSections(
            layout,
            maxTokens,
            (section) => section.renderAsText(memory, functions, tokenizer, maxTokens),
            (section, remaining) => section.renderAsText(memory, functions, tokenizer, remaining)
        );

        // Build output
        const output: string[] = [];
        for (let i = 0; i < layout.length; i++) {
            const section = layout[i];
            if (section.layout) {
                output.push(section.layout.output);
            }
        }

        return { output: output.join(this.separator), length: this.getLayoutLength(layout), tooLong: remaining < 0 };
    }

    public async renderAsMessages(memory: PromptMemory, functions: PromptFunctions, tokenizer: Tokenizer, maxTokens: number): Promise<RenderedPromptSection<Message[]>> {
        // Start a new layout
        const layout: PromptSectionLayout<string>[] = this.sections.map((section) => {
            return { section: section };
        });

        // Layout sections
        const remaining = await this.layoutSections(
            layout,
            maxTokens,
            (section) => section.renderAsText(memory, functions, tokenizer, maxTokens),
            (section, remaining) => section.renderAsText(memory, functions, tokenizer, remaining)
        );

        // Build output
        const output: Message[] = [];
        for (let i = 0; i < layout.length; i++) {
            const section = layout[i];
            if (section.layout) {
                output.push({ role: 'text', content: section.layout.output });
            }
        }

        return { output: output, length: this.getLayoutLength(layout), tooLong: remaining < 0 };
    }

    private async layoutSections<T>(layout: PromptSectionLayout<T>[], maxTokens: number, cbFixed: (section: PromptSection) => Promise<RenderedPromptSection<T>>, cbProportional: (section: PromptSection, remaining: number) => Promise<RenderedPromptSection<T>>): Promise<number> {
        // Layout fixed sections
        await this.layoutFixedSections(layout, cbFixed);

        // Get tokens remaining and drop optional sections if too long
        let remaining = maxTokens - this.getLayoutLength(layout);
        while (remaining < 0 && this.dropLastOptionalSection(layout)) {
            remaining = maxTokens - this.getLayoutLength(layout);
        }

        // Layout proportional sections
        if (this.needsMoreLayout(layout) && remaining > 0) {
            // Layout proportional sections
            await this.layoutProportionalSections(layout, (section) => cbProportional(section, remaining));

            // Get tokens remaining and drop optional sections if too long
            remaining = maxTokens - this.getLayoutLength(layout);
            while (remaining < 0 && this.dropLastOptionalSection(layout)) {
                remaining = maxTokens - this.getLayoutLength(layout);
            }
        }

        return remaining;
    }

    private async layoutFixedSections<T>(layout: PromptSectionLayout<T>[], callback: (section: PromptSection) => Promise<RenderedPromptSection<T>>): Promise<void> {
        const promises: Promise<RenderedPromptSection<T>>[] = [];
        for (let i = 0; i < layout.length; i++) {
            const section = layout[i];
            if (section.section.tokens > 1.0) {
                promises.push(callback(section.section).then((output) => section.layout = output));
            }
        }

        await Promise.all(promises);
    }

    private async layoutProportionalSections<T>(layout: PromptSectionLayout<T>[], callback: (section: PromptSection) => Promise<RenderedPromptSection<T>>): Promise<void> {
        const promises: Promise<RenderedPromptSection<T>>[] = [];
        for (let i = 0; i < layout.length; i++) {
            const section = layout[i];
            if (section.section.tokens <= 1.0) {
                promises.push(callback(section.section).then((output) => section.layout = output));
            }
        }

        await Promise.all(promises);
    }

    private getLayoutLength<T>(layout: PromptSectionLayout<T>[]): number {
        let length = 0;
        for (let i = 0; i < layout.length; i++) {
            const section = layout[i];
            if (section.layout) {
                length += section.layout.length;
            }
        }

        return length;
    }

    private dropLastOptionalSection<T>(layout: PromptSectionLayout<T>[]): boolean {
        for (let i = layout.length - 1; i >= 0; i--) {
            const section = layout[i];
            if (!section.section.required) {
                layout.splice(i, 1);
                return true;
            }
        }

        return false;
    }

    private needsMoreLayout<T>(layout: PromptSectionLayout<T>[]): boolean {
        for (let i = 0; i < layout.length; i++) {
            const section = layout[i];
            if (!section.layout) {
                return true;
            }
        }

        return false;
    }
}

interface PromptSectionLayout<T> {
    section: PromptSection;
    layout?: RenderedPromptSection<T>;
}
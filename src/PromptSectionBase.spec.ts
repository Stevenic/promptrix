import { strict as assert } from "assert";
import { Message, PromptFunctions, PromptMemory, RenderedPromptSection, Tokenizer } from "./types";
import { PromptSectionBase } from "./PromptSectionBase";
import { VolatileMemory } from "./VolatileMemory";
import { FunctionRegistry } from "./FunctionRegistry";
import { GPT3Tokenizer } from "./GPT3Tokenizer";


export class TestSection extends PromptSectionBase {
    public async renderAsMessages(memory: PromptMemory, functions: PromptFunctions, tokenizer: Tokenizer, maxTokens: number): Promise<RenderedPromptSection<Message[]>> {
        return { output: [{ role: 'test', content: 'Hello World' }], length: 2, tooLong: false };
    }
}

describe("PromptSectionBase", () => {
    const memory = new VolatileMemory();
    const functions = new FunctionRegistry();
    const tokenizer = new GPT3Tokenizer();

    describe("constructor", () => {
        it("should create a TestSection", () => {
            const section = new TestSection();
            assert.equal(section.tokens, -1);
            assert.equal(section.required, true);
            assert.equal(section.separator, "\n");
            assert.equal(section.textPrefix, "");
        });

    });

    describe("renderAsMessages", () => {
        it("should render a TestSection to an array of messages", async () => {
            const section = new TestSection();
            const rendered = await section.renderAsMessages(memory, functions, tokenizer, 100);
            assert.deepEqual(rendered.output, [{ role: "test", content: "Hello World" }]);
            assert.equal(rendered.length, 2);
            assert.equal(rendered.tooLong, false);
        });
    });

    describe("renderAsText", () => {
        it("should render a TestSection to a string", async () => {
            const section = new TestSection();
            const rendered = await section.renderAsText(memory, functions, tokenizer, 100);
            assert.equal(rendered.output, "Hello World");
            assert.equal(rendered.length, 2);
            assert.equal(rendered.tooLong, false);
        });
    });
});

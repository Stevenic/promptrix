import { strict as assert } from "assert";
import { ConversationHistory } from "./ConversationHistory";
import { VolatileMemory } from "./VolatileMemory";
import { FunctionRegistry } from "./FunctionRegistry";
import { GPT3Tokenizer } from "./GPT3Tokenizer";

describe("ConversationHistory", () => {
    const memory = new VolatileMemory({
        "history": [
            { role: "user", content: "Hello" },
            { role: "assistant", content: "Hi" },
        ]
    });
    const functions = new FunctionRegistry();
    const tokenizer = new GPT3Tokenizer();

    describe("constructor", () => {
        it("should create a ConversationHistory", () => {
            const section = new ConversationHistory('history', 100);
            assert.equal(section.variable, 'history');
            assert.equal(section.tokens, 100);
            assert.equal(section.required, false);
            assert.equal(section.separator, "\n");
            assert.equal(section.userPrefix, "user: ");
            assert.equal(section.assistantPrefix, "assistant: ");
            assert.equal(section.textPrefix, "");
        });

    });

    describe("renderAsMessages", () => {
        it("should render a ConversationHistory to an array of messages", async () => {
            const section = new ConversationHistory('history', 100);
            const rendered = await section.renderAsMessages(memory, functions, tokenizer, 100);
            assert.deepEqual(rendered.output, [
                { role: "user", content: "Hello" },
                { role: "assistant", content: "Hi" },
            ]);
            assert.equal(rendered.length, 2);
            assert.equal(rendered.tooLong, false);
        });

        it("should truncate its output to match available budget", async () => {
            const section = new ConversationHistory('history', 1);
            const rendered = await section.renderAsMessages(memory, functions, tokenizer, 1);
            assert.deepEqual(rendered.output, [
                { role: "assistant", content: "Hi" },
            ]);
            assert.equal(rendered.length, 1);
            assert.equal(rendered.tooLong, false);
        });
    });

    describe("renderAsText", () => {
        it("should render a ConversationHistory to a string", async () => {
            const section = new ConversationHistory('history', 100);
            const rendered = await section.renderAsText(memory, functions, tokenizer, 100);
            assert.equal(rendered.output, "user: Hello\nassistant: Hi");
            assert.equal(rendered.length, 7);
            assert.equal(rendered.tooLong, false);
        });

        it("should truncate its output to match available budget", async () => {
            const section = new ConversationHistory('history', 1);
            const rendered = await section.renderAsText(memory, functions, tokenizer, 4);
            assert.equal(rendered.output, "assistant: Hi");
            assert.equal(rendered.length, 4);
            assert.equal(rendered.tooLong, false);
        });
    });
});

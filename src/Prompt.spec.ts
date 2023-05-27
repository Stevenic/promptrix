import { strict as assert } from "assert";
import { Prompt } from "./Prompt";
import { TextSection } from "./TextSection";
import { VolatileMemory } from "./VolatileMemory";
import { FunctionRegistry } from "./FunctionRegistry";
import { GPT3Tokenizer } from "./GPT3Tokenizer";

describe("Prompt", () => {
    const memory = new VolatileMemory();
    const functions = new FunctionRegistry();
    const tokenizer = new GPT3Tokenizer();

    describe("constructor", () => {
        it("should create a Prompt", () => {
            const prompt = new Prompt([
                new TextSection("Hello World", "user")
            ]);
            assert.equal(prompt.sections.length, 1);
            assert.equal(prompt.tokens, 1.0);
            assert.equal(prompt.required, true);
            assert.equal(prompt.separator, "\n\n");
        });
    });

    describe("renderAsMessages", () => {
        it("should render a TextSection to an array of messages", async () => {
            const prompt = new Prompt([
                new TextSection("Hello World", "user")
            ]);
            const rendered = await prompt.renderAsMessages(memory, functions, tokenizer, 100);
            assert.deepEqual(rendered.output, [{ role: "user", content: "Hello World" }]);
            assert.equal(rendered.length, 2);
            assert.equal(rendered.tooLong, false);
        });

        it("should identify a output as being too long", async () => {
            const prompt = new Prompt([
                new TextSection("Hello World", "user")
            ]);
            const rendered = await prompt.renderAsMessages(memory, functions, tokenizer, 1);
            assert.deepEqual(rendered.output, [{ role: "user", content: "Hello World" }]);
            assert.equal(rendered.length, 2);
            assert.equal(rendered.tooLong, true);
        });

        it("should render multiple TextSections to an array of messages", async () => {
            const prompt = new Prompt([
                new TextSection("Hello", "user"),
                new TextSection("World", "user")
            ]);
            const rendered = await prompt.renderAsMessages(memory, functions, tokenizer, 100);
            assert.deepEqual(rendered.output, [{ role: "user", content: "Hello" }, { role: "user", content: "World" }]);
            assert.equal(rendered.length, 2);
            assert.equal(rendered.tooLong, false);
        });
    });

    describe("renderAsText", () => {
        it("should render a TextSection to a string", async () => {
            const prompt = new Prompt([
                new TextSection("Hello World", "user")
            ]);
            const rendered = await prompt.renderAsText(memory, functions, tokenizer, 100);
            assert.equal(rendered.output, "Hello World");
            assert.equal(rendered.length, 2);
            assert.equal(rendered.tooLong, false);
        });

        it("should identify a text output as being too long", async () => {
            const prompt = new Prompt([
                new TextSection("Hello World", "user")
            ]);
            const rendered = await prompt.renderAsText(memory, functions, tokenizer, 1);
            assert.equal(rendered.output, "Hello World");
            assert.equal(rendered.length, 2);
            assert.equal(rendered.tooLong, true);
        });

        it("should render multiple TextSections to a string", async () => {
            const prompt = new Prompt([
                new TextSection("Hello", "user"),
                new TextSection("World", "user")
            ]);
            const rendered = await prompt.renderAsText(memory, functions, tokenizer, 100);
            assert.equal(rendered.output, "Hello\n\nWorld");
            assert.equal(rendered.length, 4);
            assert.equal(rendered.tooLong, false);
        });
    });

    describe("proportional rendering", () => {
        it("should render both fixed and proportional sections", async () => {
            const prompt = new Prompt([
                new TextSection("Hello", "user", 10, true),
                new TextSection("There Big", "user", 1.0, false),
                new TextSection("World", "user", 10, true)
            ]);
            const rendered = await prompt.renderAsText(memory, functions, tokenizer, 100);
            assert.equal(rendered.output, "Hello\n\nThere Big\n\nWorld");
            assert.equal(rendered.length, 8);
            assert.equal(rendered.tooLong, false);
        });

        it("should drop optional sections as needed", async () => {
            const prompt = new Prompt([
                new TextSection("Hello", "user", 0.25, true),
                new TextSection("There Big", "user", 0.50, false),
                new TextSection("World", "user", 0.25, true)
            ]);
            const rendered = await prompt.renderAsText(memory, functions, tokenizer, 4);
            assert.equal(rendered.output, "Hello\n\nWorld");
            assert.equal(rendered.length, 4);
            assert.equal(rendered.tooLong, false);
        });

        it("should keep required sections even if too long", async () => {
            const prompt = new Prompt([
                new TextSection("Hello", "user", 0.25, true),
                new TextSection("There Big", "user", 0.50, false),
                new TextSection("World", "user", 0.25, true)
            ]);
            const rendered = await prompt.renderAsText(memory, functions, tokenizer, 2);
            assert.equal(rendered.output, "Hello\n\nWorld");
            assert.equal(rendered.length, 4);
            assert.equal(rendered.tooLong, true);
        });
    });
});

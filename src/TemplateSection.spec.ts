import { strict as assert } from "assert";
import { TemplateSection } from "./TemplateSection";
import { VolatileMemory } from "./VolatileMemory";
import { FunctionRegistry } from "./FunctionRegistry";
import { GPT3Tokenizer } from "./GPT3Tokenizer";

describe("TemplateSection", () => {
    const memory = new VolatileMemory({
        foo: 'bar'
    });
    const functions = new FunctionRegistry({
        'test': async (memory, functions, tokenizer, args) => 'Hello World',
        'test2': async (memory, functions, tokenizer, args) => args[0],
        'test3': async (memory, functions, tokenizer, args) => args.join(' '),
    });
    const tokenizer = new GPT3Tokenizer();

    describe("constructor", () => {
        it("should create a TemplateSection", () => {
            const section = new TemplateSection("Hello World", "user");
            assert.equal(section.template, "Hello World");
            assert.equal(section.role, "user");
            assert.equal(section.tokens, 1.0);
            assert.equal(section.required, true);
            assert.equal(section.separator, "\n");
        });

        it("should create a TemplateSection with other params", () => {
            const section = new TemplateSection("Hello World", "system", 2.0, false);
            assert.equal(section.template, "Hello World");
            assert.equal(section.role, "system");
            assert.equal(section.tokens, 2.0);
            assert.equal(section.required, false);
            assert.equal(section.separator, "\n");
        });
    });

    describe("renderAsMessages", () => {
        it("should render a TemplateSection to an array of messages", async () => {
            const section = new TemplateSection("Hello World", "user");
            const rendered = await section.renderAsMessages(memory, functions, tokenizer, 100);
            assert.deepEqual(rendered.output, [{ role: "user", content: "Hello World" }]);
            assert.equal(rendered.length, 2);
            assert.equal(rendered.tooLong, false);
        });

        it("should identify a output as being too long", async () => {
            const section = new TemplateSection("Hello World", "user");
            const rendered = await section.renderAsMessages(memory, functions, tokenizer, 1);
            assert.deepEqual(rendered.output, [{ role: "user", content: "Hello World" }]);
            assert.equal(rendered.length, 2);
            assert.equal(rendered.tooLong, true);
        });
    });

    describe("renderAsText", () => {
        it("should render a TemplateSection to a string", async () => {
            const section = new TemplateSection("Hello World", "user");
            const rendered = await section.renderAsText(memory, functions, tokenizer, 100);
            assert.equal(rendered.output, "Hello World");
            assert.equal(rendered.length, 2);
            assert.equal(rendered.tooLong, false);
        });

        it("should identify a text output as being too long", async () => {
            const section = new TemplateSection("Hello World", "user");
            const rendered = await section.renderAsText(memory, functions, tokenizer, 1);
            assert.equal(rendered.output, "Hello World");
            assert.equal(rendered.length, 2);
            assert.equal(rendered.tooLong, true);
        });
    });

    describe("template syntax", () => {
        it("should render a template with a {{$variable}}", async () => {
            const section = new TemplateSection("Hello {{$foo}}", "user");
            const rendered = await section.renderAsText(memory, functions, tokenizer, 100);
            assert.equal(rendered.output, "Hello bar");
            assert.equal(rendered.length, 2);
            assert.equal(rendered.tooLong, false);
        });

        it("should render a template with a {{$variable}} and a {{function}}", async () => {
            const section = new TemplateSection("Hello {{$foo}} {{test}}", "user");
            const rendered = await section.renderAsText(memory, functions, tokenizer, 100);
            assert.equal(rendered.output, "Hello bar Hello World");
            assert.equal(rendered.length, 4);
            assert.equal(rendered.tooLong, false);
        });

        it("should render a template with a {{function}} and arguments", async () => {
            const section = new TemplateSection("Hello {{test2 World}}", "user");
            const rendered = await section.renderAsText(memory, functions, tokenizer, 100);
            assert.equal(rendered.output, "Hello World");
            assert.equal(rendered.length, 2);
            assert.equal(rendered.tooLong, false);
        });

        it("should render a template with a {{function}} and quoted arguments", async () => {
            const section = new TemplateSection("Hello {{test2 'Big World'}}", "user");
            const rendered = await section.renderAsText(memory, functions, tokenizer, 100);
            assert.equal(rendered.output, "Hello Big World");
            assert.equal(rendered.length, 3);
            assert.equal(rendered.tooLong, false);
        });

        it("should render a template with a {{function}} and backtick arguments", async () => {
            const section = new TemplateSection("Hello {{test2 `Big World`}}", "user");
            const rendered = await section.renderAsText(memory, functions, tokenizer, 100);
            assert.equal(rendered.output, "Hello Big World");
            assert.equal(rendered.length, 3);
            assert.equal(rendered.tooLong, false);
        });

        it("should render a template with a {{function}} and multiple arguments", async () => {
            const section = new TemplateSection("Hello {{test3 'Big' World}}", "user");
            const rendered = await section.renderAsText(memory, functions, tokenizer, 100);
            assert.equal(rendered.output, "Hello Big World");
            assert.equal(rendered.length, 3);
            assert.equal(rendered.tooLong, false);
        });

        it("should throw an error for an invalid template", () => {
            try {
                const section = new TemplateSection("Hello {{test3 'Big' World}", "user");
                assert.fail("Should have thrown an error");
            } catch (e: unknown) {
                assert.equal((e as Error).message, "Invalid template: Hello {{test3 'Big' World}");
            }
        });

        it("should throw an error for an invalid {{function 'arg}}", () => {
            try {
                const section = new TemplateSection("Hello {{test3 'Big}}", "user");
                assert.fail("Should have thrown an error");
            } catch (e: unknown) {
                assert.equal((e as Error).message, "Invalid template: Hello {{test3 'Big}}");
            }
        });
    });
});

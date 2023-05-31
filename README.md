# Promptrix
Promptrix is a a prompt layout engine for Large Language Models. It approaches laying out a fixed length prompt the same way a UI engine would approach laying out a fixed width set of columns for a UI. Replace token with character and the same exact concepts and algorithms apply. Promptrix breaks a prompt into sections and each section can be given a token budget that's either a fixed set of tokens, or proportional to the overall remaining tokens.

All prompt sections are potentially asynchronous and rendered in parallel. Fixed length sections are rendered first and then proportional sections are rendered second so they can proportionally divide up the remaining token budget. Sections can also be marked as optional and will be automatically dropped should the token budget get constrained.

Promptrix also supports generating prompts for both Text Completion and Chat Completion style API's. It will automatically convert from one style prompt to the other while maintaining accurate token counting.

## Installation
To install Promptrix using NPM:

```Bash
npm install promptrix
```

Or to install using Yarn:

```Bash
yarn add promptrix
```

## Basic Usage
It's best to think of Promptrix prompts as a stack of Chat Completion messages as Promptix will automatically convert from messages to text when rendering for a Text Completion style API. So with that in mind a super simple Promptrix prompt would look like:

```JS
import { Prompt, SystemMessage, UserMessage } from "promptrix";

const prompt = new Prompt([
  new SystemMessage(`The following is a conversation with an AI assistant. The assistant is helpful, creative, clever, and very friendly.`),
  new UserMessage(`{{$input}}`)
]);
```

The `SystemMessage`, `UserMessage`, and `AssistantMessage` sections all derive from a class called `TemplateSection` which means they all support a rich templating syntax capable of passing in `{{$variables}}` or calling asyncronous `{{functions}}`. Functions can even take arguments like this `{{readSomeFiles 5 "c:/my/folder path"}}`. And everything is geared towards performance so not only are sections rendered in parallel, all template functions are rendered in parallel.

We can render the prompt above by creating a memory store, function registry, and tokenizer.

```JS
import { VolatileMemory, FunctionRegistry, GPT3Tokenizer } from "promptrix";

const memory = new VolatileMemory({ input: "hello" });
const functions = new FunctionRegistry();
const tokenizer = new GPT3Tokenizer();
const maxTokens = 2000;

// Render the prompt for a Chat Completion call
const asMessages = await prompt.renderAsMessages(memory, function, tokenizer, maxTokens);
if (!asMessages.tooLong) {
  const messages = asMessages.output;
}

// Render the prompt for a Text Completion call
const asText = await prompt.renderAsText(memory, function, tokenizer, maxTokens);
if (!asText.tooLong) {
  const text = asText.output;
}
```

Each render call returns the "output" as either a `message[]|string`, the "length" in tokens, and "tooLong" flag indicating whether the prompt was truncated or not.

## Adding Conversation History
We can easily add conversation history to our original prompt:

```JS
import { Prompt, SystemMessage, UserMessage, ConversationHistory, VolatileMemory } from "promptrix";

const prompt = new Prompt([
  new SystemMessage(`The following is a conversation with an AI assistant. The assistant is helpful, creative, clever, and very friendly.`),
  new ConversationHistory('history'),
  new UserMessage(`{{$input}}`)
]);

const memory = new VolatileMemory({
  history: [
    { type: 'user', 'hello' },
    { type: 'assistant', 'Hello how are you?' }
  ],
  input: "I'm doing ok"
});

```

The `ConversationHistory` section needs to be told the name of the memory variable to use and is an optional section by default so it will be automatically dropped should the prompt start getting to big.

## Proportional Sizing
All sections 3 different sizing strategies; `auto`, `proportional`, or `fixed`. Strategy selection is done by passing in a numerical value for the sections `tokens` parameter and breaks down as follows:

- **-1**: This indicates an `auto` length section and is the default for most sections. The section will be rendered as normal but will be flagged as being `tooLong` if the rendered length is greater then the remaining token budget.
- **0.0 - 1.0**: This indicates a `proportional` length section and is the percentage of remaining tokens to use. Proportional sections are rendered after `fixed` & `auto` length sections and the render budget they're passed in is a percentage of the remaining tokens.
- **> 1.0**: Any value greater then 1 is considered a `fixed` length sections. Fixed length sections render similarly to `auto` length sections but any tokens over the specified token length will be truncated.

It's easiest to think of this as being similar to column sizing in UI layouts. You can have as many proportional sections as you want but the total distribution of those sections should add up to 1.0. Fixed length sections make it less likely that you'll run out of tokens and are useful for capping things like the users message. We can update our to explicitly set the sizing strategy for each section:

```JS
const prompt = new Prompt([
  new SystemMessage(`The following is a conversation with an AI assistant. The assistant is helpful, creative, clever, and very friendly.`, -1),
  new ConversationHistory('history', 1.0),
  new UserMessage(`{{$input}}`, 100)
]);
```

This basically says that the `SystemMessage` should be rendered as an `auto` length section, the `UserMessage` should be rendered as a `fixed` length section that's capped at 100 tokens, and any remaining tokens can be used by `ConversationHistory` section. In this example the SystemMessage is 23 tokens and lets say the users message is 7 tokens. That's a total of 30 tokens consumed during the initial phase of rendering. So with an overall `maxTokens` of 2000, the `ConversationHistory` will be allowed to use up to 1970 tokens.

## Optional Sections
Most sections are required by default but they can be marked as optional by settings the prompts `required` parameter to `false`. Optional sections will start being dropped should the prompt begin running out of available input tokens. The `ConversationHistory` sections is optional by default so lets imagine a prompt that does a 50/50 split between the `ConversationHistory` and `UserMessage` sections:

```JS
const prompt = new Prompt([
  new SystemMessage(`The following is a conversation with an AI assistant. The assistant is helpful, creative, clever, and very friendly.`),
  new ConversationHistory('history', 0.5),
  new UserMessage(`{{$input}}`, 0.5)
]);
```

The `ConversationHistory` section has built in token budgeting so it will never use more the 50% of the remaining tokens. The `UserMessage` section has no such budgeting logic to it will happily go over the 50% budget. If the combined token usage is less then the remaining tokens then fine, but if it's over, the prompt will still try to make things work by dropping optional section. Since the `ConversationHistory` is optional by default (you can mark it as required) this section will get dropped. If the prompt is still over budget and there are no more optional sections to drop, it will be flagged as `tooLong`.

Optional sections are dropped in reverse order so the last optional section is always dropped first. Keep that in mind when ordering your prompts and place more important, but optional, sections towards the top of the prompt.

## Custom Sections
So what if we wanted to call a function to inject some semantic memory into a prompt:

```JS
class PineconeMemory extends PromptSectionBase {
  constructor(settings, tokens) {
    super(tokens);
    this.settings = settings;
  }

  async renderAsMessages(memory, functions, tokenizer, maxTokens) {
    const input = memory.get('input');

    // ... fetch up to maxTokens worth of snippets from pinecone.

    return { output: `memory:\n` + snippets, length: snippetsLength, tooLong: fale };
  }
}

const prompt = new Prompt([
  new PineconeMemory({pinecone settings}, 0.8),
  new ConversationHistory('history', 0.2),
  new SystemMessage(`Answer the users question only if you can find it in the memory above.`, 100),
  new UserMessage(`{{$input}}`, 100)
]);
```

We defined a new custom section that retrieves memories from pinecone and then we did an 80/20 split of the remaining token budget betwoen our PineconeMemory section and our ConversationHistory section. That means that if the other two fixed sections consume a combined 20 tokens, PineconeMemory will get a budget of 1584 tokens and ConversationHistory will get a budget of 396 tokens.

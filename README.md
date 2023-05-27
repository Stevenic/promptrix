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
All sections can be given a token budget. This can either be a fixed number of tokens to try and stay under or a proportional size from 0.0 - 1.0. This works very similar to column sizing in UI. the default sizing for all sections is `1.0` so they're all basically set to stretch and just like in UI layout, you typically only want a single stretch column so we can update our prompt definition to look like this:

```JS
const prompt = new Prompt([
  new SystemMessage(`The following is a conversation with an AI assistant. The assistant is helpful, creative, clever, and very friendly.`, 500),
  new ConversationHistory('history', 1.0),
  new UserMessage(`{{$input}}`, 100)
]);
```

This basically says the SystemMessage is budgeted up to 500 tokens, the UserMessage is allowed up to 100 tokens, and any remaining tokens can be used by ConversationHistory. The fixed token caps are just that, they're caps. In this example the SystemMessage is 23 tokens and lets say the Usermessage is 7 tokens. That's only 7 tokens consumed at render time so with an overall maxTokens of 2000, the ConversationHistory will be allowed to use up to 1970 tokens.

And just because an individual section goes over its cap doesn't mean the prompt will be considered too long. The prompt will try to start dropping optional sections and as long as all required sections are rendered and the combined token lengths are under maxTokens, then the prompt won't be marked as being tooLong.

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
  new PineconeMemory(<pinecone settings>, 0.8),
  new ConversationHistory('history', 0.2),
  new SystemMessage(`Answer the users question only if you can find it in the memory above.`, 100),
  new UserMessage(`{{$input}}`, 100)
]);
```

We defined a new custom section that retrieves memories from pinecone and then we did an 80/20 split of the remaining token budget betwoen our PineconeMemory section and our ConversationHistory section. That means that if the other two fixed sections consume a combined 20 tokens, PineconeMemory will get a budget of 1584 tokens and ConversationHistory will get a budget of 396 tokens.

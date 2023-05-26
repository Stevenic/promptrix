# Promptrix
Promptrix is a a prompt layout engine for Large Language Models. It approaches laying out a fixed length prompt the same way a UI engine would approach laying out a fixed width set of columns for a UI. Replace token with character and the same exact concepts and algorithms apply. Promptrix breaks a prompt into sections and each section can be given a token budget that's either a fixed set of tokens, or proportional to the overall remaining tokens.

All prompt sections are potentially asynchronous and rendered in parallel. Fixed length sections are rendered first and then proportional sections are rendered second so they can proportionally divide up the remaining token budget. Sections can also be marked as optional and will be automatically dropped should the token budget get constrained.

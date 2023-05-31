import { Tokenizer } from "./types";
import { stringify } from "yaml";

/**
 * Utility functions.
 */
export class Utilities {
    /**
     * Converts a value to a string.
     * @remarks
     * Dates are converted to ISO strings and Objects are converted to JSON or YAML, whichever is shorter.
     * @param tokenizer Tokenizer to use for encoding.
     * @param value Value to convert.
     * @returns Converted value.
     */
    public static toString(tokenizer: Tokenizer, value: any): string {
        if (value === undefined || value === null) {
            return '';
        } else if (typeof value === "object") {
            if (typeof value.toISOString == "function") {
                return value.toISOString();
            } else {
                // Return shorter version of object
                const asYaml = stringify(value);
                const asJSON = JSON.stringify(value);
                if (tokenizer.encode(asYaml).length < tokenizer.encode(asJSON).length) {
                    return asYaml;
                } else {
                    return asJSON;
                }
            }
        } else {
            return value.toString();
        }
    }
}
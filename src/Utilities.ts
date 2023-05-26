import { Tokenizer } from "./types";
import { stringify } from "yaml";

export class Utilities {
    public static toString(tokenizer: Tokenizer, value: any): string {
        if (typeof value === "object") {
            // Return shorter version of object
            const asYaml = stringify(value);
            const asJSON = JSON.stringify(value);
            if (tokenizer.encode(asYaml).length < tokenizer.encode(asJSON).length) {
                return asYaml;
            } else {
                return asJSON;
            }
        } else if (value === undefined || value === null) {
            return '';
        } else {
            return value.toString();
        }
    }
}
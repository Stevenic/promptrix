import { strict as assert } from "assert";
import { VolatileMemory } from "./VolatileMemory";

describe("VolatileMemory", () => {
    describe("constructor", () => {
        it("should create a VolatileMemory", () => {
            const memory = new VolatileMemory();
            assert.notEqual(memory, null);
        });

        it("should create a VolatileMemory with initial values", () => {
            const memory = new VolatileMemory({
                "test": 123
            });
            assert.notEqual(memory, null);
            assert.equal(memory.has("test"), true);
        });
    });

    const memory = new VolatileMemory();
    describe("set", () => {
        it("should set a value", () => {
            memory.set("test", 123);
            assert.equal(memory.has("test"), true);
        });
    });

    describe("get", () => {
        it("should get a value", () => {
            const value = memory.get("test");
            assert.equal(value, 123);
        });

        it("should throw when getting a value that doesn't exist", () => {
            assert.throws(() => memory.get("test2"));
        });
    });

    describe("has", () => {
        it("should return false when a value doesn't exist", () => {
            assert.equal(memory.has("test2"), false);
        });

        it("should return true when a value exists", () => {
            assert.equal(memory.has("test"), true);
        });
    });

    describe("delete", () => {
        it("should delete a value", () => {
            memory.delete("test");
            assert.equal(memory.has("test"), false);
        });
    });

    describe("clear", () => {
        it("should clear all values", () => {
            memory.set("test", 123);
            memory.set("test2", 456);
            memory.clear();
            assert.equal(memory.has("test"), false);
            assert.equal(memory.has("test2"), false);
        });
    });
});

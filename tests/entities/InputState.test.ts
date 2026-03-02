import { describe, it, expect } from "vitest";
import { readInputState, EMPTY_INPUT } from "@/entities/InputState";

describe("EMPTY_INPUT", () => {
  it("has all axes at zero", () => {
    expect(EMPTY_INPUT).toEqual({ moveX: 0, moveY: 0, shootX: 0, shootY: 0 });
  });
});

describe("readInputState", () => {
  it("reads no input when no keys are held", () => {
    expect(readInputState(new Set())).toEqual({ moveX: 0, moveY: 0, shootX: 0, shootY: 0 });
  });

  it("reads left movement from 'a'", () => {
    const s = readInputState(new Set(["a"]));
    expect(s.moveX).toBe(-1);
    expect(s.moveY).toBe(0);
  });

  it("reads right movement from 'd'", () => {
    expect(readInputState(new Set(["d"])).moveX).toBe(1);
  });

  it("reads up movement from 'w'", () => {
    expect(readInputState(new Set(["w"])).moveY).toBe(-1);
  });

  it("reads down movement from 's'", () => {
    expect(readInputState(new Set(["s"])).moveY).toBe(1);
  });

  it("reads left movement from ArrowLeft", () => {
    expect(readInputState(new Set(["ArrowLeft"])).moveX).toBe(-1);
  });

  it("reads right movement from ArrowRight", () => {
    expect(readInputState(new Set(["ArrowRight"])).moveX).toBe(1);
  });

  it("reads up movement from ArrowUp", () => {
    expect(readInputState(new Set(["ArrowUp"])).moveY).toBe(-1);
  });

  it("reads down movement from ArrowDown", () => {
    expect(readInputState(new Set(["ArrowDown"])).moveY).toBe(1);
  });

  it("reads shoot left from 'j'", () => {
    expect(readInputState(new Set(["j"])).shootX).toBe(-1);
  });

  it("reads shoot right from 'l'", () => {
    expect(readInputState(new Set(["l"])).shootX).toBe(1);
  });

  it("reads shoot up from 'i'", () => {
    expect(readInputState(new Set(["i"])).shootY).toBe(-1);
  });

  it("reads shoot down from 'k'", () => {
    expect(readInputState(new Set(["k"])).shootY).toBe(1);
  });

  it("respects uppercase shoot keys", () => {
    expect(readInputState(new Set(["J"])).shootX).toBe(-1);
    expect(readInputState(new Set(["L"])).shootX).toBe(1);
    expect(readInputState(new Set(["I"])).shootY).toBe(-1);
    expect(readInputState(new Set(["K"])).shootY).toBe(1);
  });

  it("cancels opposing axes", () => {
    const s = readInputState(new Set(["a", "d"]));
    expect(s.moveX).toBe(0);
  });
});

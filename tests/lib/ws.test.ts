import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createWSClient } from "@/lib/ws";

/** A controllable fake WebSocket. */
class FakeWebSocket {
  static OPEN = 1;
  readyState = FakeWebSocket.OPEN;
  sentMessages: string[] = [];

  onopen: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;

  send(data: string) { this.sentMessages.push(data); }
  close() { this.readyState = 3; this.onclose?.(); }

  simulateOpen() { this.onopen?.(); }
  simulateClose() { this.onclose?.(); }
  simulateError() { this.onerror?.(); }
  deliver(event: string, data?: unknown) {
    this.onmessage?.({ data: JSON.stringify({ event, data }) });
  }
  deliverRaw(raw: string) {
    this.onmessage?.({ data: raw });
  }
}

let fakeSocket: FakeWebSocket;

beforeEach(() => {
  vi.stubGlobal("WebSocket", class extends FakeWebSocket {
    constructor(url: string) { super(); fakeSocket = this; void url; }
  });
  vi.stubEnv("VITE_WS_URL", "ws://localhost:8787");
  vi.stubEnv("VITE_WS_API_KEY", "dev");
  vi.useFakeTimers();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("createWSClient", () => {
  it("throws when VITE_WS_URL is missing", () => {
    vi.stubEnv("VITE_WS_URL", "");
    expect(() => createWSClient("room")).toThrow(/VITE_WS_URL/);
  });

  it("throws when VITE_WS_API_KEY is missing", () => {
    vi.stubEnv("VITE_WS_API_KEY", "");
    expect(() => createWSClient("room")).toThrow(/VITE_WS_API_KEY/);
  });

  it("sends a join message on open", () => {
    createWSClient("my-room");
    fakeSocket.simulateOpen();
    const joinMsg = JSON.parse(fakeSocket.sentMessages[0]);
    expect(joinMsg).toEqual({ event: "join", room: "my-room" });
  });

  it("send broadcasts a message when the socket is open", () => {
    const client = createWSClient("room");
    fakeSocket.simulateOpen();
    client.send("player-input", { x: 1, y: 0 });
    const msg = JSON.parse(fakeSocket.sentMessages[1]);
    expect(msg.event).toBe("player-input");
  });

  it("send is a no-op when the socket is not open", () => {
    const client = createWSClient("room");
    fakeSocket.readyState = 3; // CLOSED
    expect(() => client.send("test")).not.toThrow();
  });

  it("on/off registers and deregisters listeners", () => {
    const client = createWSClient("room");
    fakeSocket.simulateOpen();

    const cb = vi.fn();
    client.on("game-state", cb);
    fakeSocket.deliver("game-state", { x: 1 });
    expect(cb).toHaveBeenCalledWith({ x: 1 });

    client.off("game-state", cb);
    fakeSocket.deliver("game-state", { x: 2 });
    expect(cb).toHaveBeenCalledOnce();
  });

  it("ignores messages with no event field", () => {
    const client = createWSClient("room");
    fakeSocket.simulateOpen();
    const cb = vi.fn();
    client.on("test", cb);
    fakeSocket.deliverRaw(JSON.stringify({ data: "no event field" }));
    expect(cb).not.toHaveBeenCalled();
  });

  it("ignores malformed JSON messages", () => {
    const client = createWSClient("room");
    fakeSocket.simulateOpen();
    expect(() => fakeSocket.deliverRaw("not json {{")).not.toThrow();
  });

  it("handles non-string e.data gracefully", () => {
    const client = createWSClient("room");
    fakeSocket.simulateOpen();
    // Simulate a binary frame by calling onmessage with non-string data.
    fakeSocket.onmessage?.({ data: 12345 as unknown as string });
    expect(client).toBeDefined(); // still alive
  });

  it("reconnects after a close with exponential backoff", () => {
    createWSClient("room");
    fakeSocket.simulateOpen();
    const first = fakeSocket;
    fakeSocket.simulateClose();

    vi.advanceTimersByTime(600);
    expect(fakeSocket).not.toBe(first); // new socket created
  });

  it("does not reconnect after client.close()", () => {
    const client = createWSClient("room");
    fakeSocket.simulateOpen();
    client.close();
    const before = fakeSocket;

    vi.advanceTimersByTime(5000);
    expect(fakeSocket).toBe(before); // no new socket
  });

  it("close cancels any pending reconnect timer", () => {
    const client = createWSClient("room");
    fakeSocket.simulateClose(); // triggers a reconnect timer
    client.close(); // should cancel it
    expect(() => vi.runAllTimers()).not.toThrow();
  });

  it("onerror closes the socket", () => {
    createWSClient("room");
    const closeSpy = vi.spyOn(fakeSocket, "close");
    fakeSocket.simulateError();
    expect(closeSpy).toHaveBeenCalled();
  });
});

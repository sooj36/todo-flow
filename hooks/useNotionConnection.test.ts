import { describe, it, expect, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useNotionConnection } from "./useNotionConnection";

const createStorage = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
};

describe("useNotionConnection", () => {
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", {
      value: createStorage(),
      configurable: true,
    });
  });

  it("loads stored connection on mount", async () => {
    const payload = {
      apiKey: "secret_test",
      templateDbId: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      stepDbId: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      instanceDbId: "cccccccccccccccccccccccccccccccc",
    };

    window.localStorage.setItem("notion-connection", JSON.stringify(payload));

    const { result } = renderHook(() => useNotionConnection());

    await waitFor(() => {
      expect(result.current.connection).toEqual(payload);
    });
  });

  it("saves and clears connection", async () => {
    const payload = {
      apiKey: "secret_test",
      templateDbId: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      stepDbId: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      instanceDbId: "cccccccccccccccccccccccccccccccc",
    };

    const { result } = renderHook(() => useNotionConnection());

    act(() => {
      result.current.saveConnection(payload);
    });

    expect(JSON.parse(window.localStorage.getItem("notion-connection") || "{}")).toEqual(payload);
    expect(result.current.connection).toEqual(payload);

    act(() => {
      result.current.clearConnection();
    });

    expect(window.localStorage.getItem("notion-connection")).toBeNull();
    expect(result.current.connection).toBeNull();
  });
});

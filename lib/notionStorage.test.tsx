import { describe, it, expect, beforeEach } from "vitest";
import {
  clearNotionConnection,
  loadNotionConnection,
  saveNotionConnection,
} from "./notionStorage";

describe("notionStorage", () => {
  beforeEach(() => {
    if (typeof window !== "undefined") {
      Object.defineProperty(window, "localStorage", {
        value: (() => {
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
        })(),
        configurable: true,
      });
    }
    window.localStorage.clear();
  });

  it("returns null when nothing is stored", () => {
    expect(loadNotionConnection()).toBeNull();
  });

  it("saves and loads the connection values", () => {
    const payload = {
      apiKey: "secret_test",
      templateDbId: "template-db-id",
      stepDbId: "step-db-id",
      instanceDbId: "instance-db-id",
    };

    saveNotionConnection(payload);

    expect(loadNotionConnection()).toEqual(payload);
  });

  it("clears invalid stored data", () => {
    localStorage.setItem("notion-connection", "{not-valid-json}");

    expect(loadNotionConnection()).toBeNull();
    expect(localStorage.getItem("notion-connection")).toBeNull();
  });

  it("clears stored data", () => {
    saveNotionConnection({
      apiKey: "secret_test",
      templateDbId: "template-db-id",
      stepDbId: "step-db-id",
      instanceDbId: "instance-db-id",
    });

    clearNotionConnection();

    expect(loadNotionConnection()).toBeNull();
  });
});

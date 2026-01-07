export interface NotionConnectionValues {
  apiKey: string;
  templateDbId: string;
  stepDbId: string;
  instanceDbId: string;
}

const STORAGE_KEY = "notion-connection";

const getStorage = (): Storage | null => {
  if (typeof window === "undefined") return null;
  return window.localStorage;
};

const isValidPayload = (value: unknown): value is NotionConnectionValues => {
  if (!value || typeof value !== "object") return false;
  const payload = value as Record<string, unknown>;
  return (
    typeof payload.apiKey === "string" &&
    typeof payload.templateDbId === "string" &&
    typeof payload.stepDbId === "string" &&
    typeof payload.instanceDbId === "string"
  );
};

export const loadNotionConnection = (): NotionConnectionValues | null => {
  const storage = getStorage();
  if (!storage) return null;
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (!isValidPayload(parsed)) {
      storage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    storage.removeItem(STORAGE_KEY);
    return null;
  }
};

export const saveNotionConnection = (values: NotionConnectionValues): void => {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(STORAGE_KEY, JSON.stringify(values));
};

export const clearNotionConnection = (): void => {
  const storage = getStorage();
  if (!storage) return;
  storage.removeItem(STORAGE_KEY);
};

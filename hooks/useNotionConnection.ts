import { useCallback, useEffect, useState } from "react";
import {
  clearNotionConnection,
  loadNotionConnection,
  saveNotionConnection,
  NotionConnectionValues,
} from "@/lib/notionStorage";

interface UseNotionConnectionReturn {
  connection: NotionConnectionValues | null;
  saveConnection: (values: NotionConnectionValues) => void;
  clearConnection: () => void;
}

export const useNotionConnection = (): UseNotionConnectionReturn => {
  const [connection, setConnection] = useState<NotionConnectionValues | null>(null);

  useEffect(() => {
    setConnection(loadNotionConnection());
  }, []);

  const saveConnection = useCallback((values: NotionConnectionValues) => {
    saveNotionConnection(values);
    setConnection(values);
  }, []);

  const clearConnection = useCallback(() => {
    clearNotionConnection();
    setConnection(null);
  }, []);

  return { connection, saveConnection, clearConnection };
};

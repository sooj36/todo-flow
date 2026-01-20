import { TaskInstance, TaskStatus } from "@/types";

export function applyInstanceStatusOverrides(
  instances: TaskInstance[],
  overrides?: Record<string, TaskStatus>
): TaskInstance[] {
  if (!overrides || Object.keys(overrides).length === 0) {
    return instances;
  }

  return instances.map((instance) => {
    const overrideStatus = overrides[instance.id];
    if (!overrideStatus) return instance;
    return {
      ...instance,
      status: overrideStatus,
    };
  });
}

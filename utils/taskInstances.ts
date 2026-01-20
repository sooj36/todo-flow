import { TaskInstance, TaskStatus } from "@/types";
import { calculateTemplateProgress } from "./flowNodes";

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

export function aggregateDayStepProgress(
  instances: TaskInstance[],
  templateProgress: Record<string, { done: number; total: number }>
): { completed: number; total: number } {
  return instances.reduce(
    (acc, instance) => {
      const progress =
        templateProgress[instance.templateId] ||
        calculateTemplateProgress(instance.template, {});

      acc.completed += progress.done;
      acc.total += progress.total;
      return acc;
    },
    { completed: 0, total: 0 }
  );
}

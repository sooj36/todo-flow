"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { X, Plus, Trash2, Loader2, AlertCircle, RefreshCw, ChevronDown } from "lucide-react";
import {
  TASK_COLORS,
  FREQUENCIES,
  WEEKDAYS,
  DEFAULT_ICON,
  DEFAULT_COLOR,
  MOOD_EMOJIS,
  DEFAULT_MOOD,
  CreateTaskTemplateSchema,
  type TaskColor,
  type MoodEmoji,
  type Frequency,
  type Weekday,
  type FlowStepInput,
  type RepeatOptions,
} from "@/lib/schema/templates";
import { formatLocalDate } from "@/lib/utils/dateTransform";

// Popular icons for quick selection
const POPULAR_ICONS = ['📋', '✅', '📝', '🎯', '💡', '🔥', '⭐', '📚', '💪', '🏃', '🧘', '🍎'];
const MOOD_SCALE = MOOD_EMOJIS.map((emoji, index) => ({
  emoji,
  score: 5 - index,
}));

interface CreateTaskDialogProps {
  isOpen: boolean;
  selectedDate: Date;
  onClose: () => void;
  onSubmit: (data: CreateTaskFormData) => Promise<CreateTaskResult>;
  onSuccess?: () => void;
}

export interface CreateTaskFormData {
  name: string;
  icon: string;
  color: TaskColor;
  mood: MoodEmoji;
  isRepeating: boolean;
  repeatOptions?: RepeatOptions;
  steps: FlowStepInput[];
  instanceDate: string;
}

export interface CreateTaskResult {
  success: boolean;
  templateId?: string;
  stepIds?: string[];
  instanceId?: string;
  cleanupIds?: string[];
  partialCleanup?: boolean;
  error?: string;
}

type FormTouched = {
  name: boolean;
  icon: boolean;
  color: boolean;
  frequency: boolean;
  weekdays: boolean;
  repeatEnd: boolean;
  repeatLimit: boolean;
  steps: boolean;
};

const initialTouched: FormTouched = {
  name: false,
  icon: false,
  color: false,
  frequency: false,
  weekdays: false,
  repeatEnd: false,
  repeatLimit: false,
  steps: false,
};

export const CreateTaskDialog: React.FC<CreateTaskDialogProps> = ({
  isOpen,
  selectedDate,
  onClose,
  onSubmit,
  onSuccess,
}) => {
  // Form state
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(DEFAULT_ICON);
  const [color, setColor] = useState<TaskColor>(DEFAULT_COLOR);
  const [mood, setMood] = useState<MoodEmoji>(DEFAULT_MOOD);
  const [isRepeating, setIsRepeating] = useState(false);
  const [frequency, setFrequency] = useState<Frequency>("daily");
  const [weekdays, setWeekdays] = useState<Weekday[]>([]);
  const [repeatEnd, setRepeatEnd] = useState("");
  const [repeatLimit, setRepeatLimit] = useState("");
  const [steps, setSteps] = useState<FlowStepInput[]>([]);
  const [newStepName, setNewStepName] = useState("");

  // UI state
  const [touched, setTouched] = useState<FormTouched>(initialTouched);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [partialFailure, setPartialFailure] = useState<{
    message: string;
    cleanupIds: string[];
    partialCleanup: boolean;
  } | null>(null);

  const firstInputRef = useRef<HTMLInputElement>(null);
  const focusTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setName("");
      setIcon(DEFAULT_ICON);
      setColor(DEFAULT_COLOR);
      setMood(DEFAULT_MOOD);
      setIsRepeating(false);
      setFrequency("daily");
      setWeekdays([]);
      setRepeatEnd("");
      setRepeatLimit("");
      setSteps([]);
      setNewStepName("");
      setTouched(initialTouched);
      setIsSubmitting(false);
      setSubmitError(null);
      setPartialFailure(null);
    }
  }, [isOpen]);

  // Focus first input when dialog opens
  useEffect(() => {
    if (isOpen && firstInputRef.current) {
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }
      focusTimeoutRef.current = setTimeout(() => {
        if (!document.activeElement || document.activeElement === document.body) {
          firstInputRef.current?.focus();
        }
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }
    };
  }, []);

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, isSubmitting, onClose]);

  // Build form data for validation/submission
  const formData = useMemo((): CreateTaskFormData => {
    const data: CreateTaskFormData = {
      name: name.trim(),
      icon,
      color,
      mood,
      isRepeating,
      steps,
      instanceDate: formatLocalDate(selectedDate),
    };

    if (isRepeating) {
      const repeatOptions: RepeatOptions = {
        frequency,
        ...(frequency === "custom" && weekdays.length > 0 && { weekdays }),
        ...(repeatEnd && { repeatEnd }),
        ...(repeatLimit && { repeatLimit: parseInt(repeatLimit, 10) }),
      };
      data.repeatOptions = repeatOptions;
    }

    return data;
  }, [name, icon, color, mood, isRepeating, frequency, weekdays, repeatEnd, repeatLimit, steps, selectedDate]);

  // Validation errors
  const errors = useMemo(() => {
    const result = CreateTaskTemplateSchema.safeParse(formData);
    if (result.success) {
      return {};
    }

    const errorMap: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join(".");
      if (!errorMap[path]) {
        errorMap[path] = issue.message;
      }
    }
    return errorMap;
  }, [formData]);

  const isFormValid = Object.keys(errors).length === 0;

  // Handlers
  const handleBlur = (field: keyof FormTouched) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      onClose();
    }
  };

  const handleWeekdayToggle = (day: Weekday) => {
    setWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleAddStep = () => {
    const trimmed = newStepName.trim();
    if (trimmed && steps.length < 20) {
      setSteps((prev) => [...prev, { name: trimmed }]);
      setNewStepName("");
    }
  };

  const handleRemoveStep = (index: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStepKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddStep();
    }
  };

  const handleSubmit = async () => {
    // Touch all fields
    setTouched({
      name: true,
      icon: true,
      color: true,
      frequency: true,
      weekdays: true,
      repeatEnd: true,
      repeatLimit: true,
      steps: true,
    });

    if (!isFormValid) return;

    setIsSubmitting(true);
    setSubmitError(null);
    setPartialFailure(null);

    try {
      const result = await onSubmit(formData);

      if (result.success) {
        onSuccess?.();
        onClose();
      } else {
        if (result.cleanupIds && result.cleanupIds.length > 0) {
          setPartialFailure({
            message: result.error || "일부 생성 중 오류 발생",
            cleanupIds: result.cleanupIds,
            partialCleanup: result.partialCleanup ?? false,
          });
        } else {
          setSubmitError(result.error || "태스크 생성에 실패했습니다.");
        }
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setPartialFailure(null);
    setSubmitError(null);
    handleSubmit();
  };

  const handleCancel = () => {
    setPartialFailure(null);
    setSubmitError(null);
  };

  const handleMoodDoubleClick = (selectedMood: MoodEmoji) => {
    if (isSubmitting) return;
    setMood(selectedMood);
    setName((prev) => (prev.trim() ? prev : "Mood"));
    setTimeout(() => {
      handleSubmit();
    }, 0);
  };

  if (!isOpen) return null;

  const dateLabel = selectedDate.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-6"
      onClick={handleOverlayClick}
    >
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-[#ececeb] bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#ececeb] bg-white px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-[#37352f]">새 태스크 만들기</h2>
            <p className="text-xs text-[#37352f]/60">{dateLabel}</p>
          </div>
          <button
            aria-label="Close"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-full p-1 text-[#37352f]/50 hover:bg-[#efefed] hover:text-[#37352f] transition-all disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-5 px-5 py-5">
          {/* Mood */}
          <div>
            <label className="text-xs font-semibold text-[#37352f]">기분</label>
            <div className="mt-2 flex gap-1">
              {MOOD_SCALE.map(({ emoji, score }) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setMood(emoji)}
                  onDoubleClick={() => handleMoodDoubleClick(emoji)}
                  disabled={isSubmitting}
                  aria-label={`Mood ${score}`}
                  className={`w-10 h-10 rounded-md transition-all flex flex-col items-center justify-center ${
                    mood === emoji
                      ? "bg-[#f0f0f0] ring-1 ring-[#5f5b55]"
                      : "bg-[#fbfbfa] hover:bg-[#efefed]"
                  } disabled:opacity-50`}
                >
                  <span className="text-lg">{emoji}</span>
                  <span className="text-[9px] text-[#37352f]/60">{score}</span>
                </button>
              ))}
            </div>
          </div>
          {/* Template Name */}
          <div>
            <label htmlFor="task-name" className="text-xs font-semibold text-[#37352f]">
              템플릿 이름 <span className="text-red-500">*</span>
            </label>
            <input
              ref={firstInputRef}
              id="task-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => handleBlur("name")}
              placeholder="예: 아침 루틴, 운동 계획"
              disabled={isSubmitting}
              className="mt-2 w-full rounded-md border border-[#ececeb] px-3 py-2 text-sm text-[#37352f] placeholder:text-[#37352f]/30 focus:border-[#37352f] focus:outline-none disabled:bg-gray-50"
            />
            {touched.name && errors.name && (
              <p className="mt-1 text-[11px] text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Icon & Color Row */}
          <div className="flex gap-4">
            {/* Icon */}
            <div className="flex-1">
              <label className="text-xs font-semibold text-[#37352f]">아이콘</label>
              <div className="mt-2 flex flex-wrap gap-1">
                {POPULAR_ICONS.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setIcon(ic)}
                    disabled={isSubmitting}
                    className={`w-8 h-8 rounded-md text-lg transition-all ${
                      icon === ic
                        ? "bg-blue-100 ring-2 ring-blue-500"
                        : "bg-[#fbfbfa] hover:bg-[#efefed]"
                    } disabled:opacity-50`}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div className="flex-1">
              <label className="text-xs font-semibold text-[#37352f]">색상</label>
              <div className="mt-2 flex flex-wrap gap-1">
                {TASK_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    disabled={isSubmitting}
                    className={`w-8 h-8 rounded-md transition-all ${
                      color === c ? "ring-2 ring-offset-1 ring-[#37352f]" : ""
                    } disabled:opacity-50`}
                    style={{
                      backgroundColor:
                        c === "blue" ? "#dbeafe" :
                        c === "green" ? "#dcfce7" :
                        c === "yellow" ? "#fef9c3" :
                        c === "red" ? "#fee2e2" :
                        c === "purple" ? "#f3e8ff" :
                        "#f3f4f6",
                    }}
                    aria-label={c}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Repeat Toggle */}
          <div className="flex items-center justify-between py-2 border-y border-[#ececeb]">
            <span className="text-xs font-semibold text-[#37352f]">반복 설정</span>
            <button
              type="button"
              onClick={() => setIsRepeating(!isRepeating)}
              disabled={isSubmitting}
              aria-label="반복 설정 토글"
              className={`relative w-10 h-6 rounded-full transition-colors ${
                isRepeating ? "bg-blue-500" : "bg-gray-300"
              } disabled:opacity-50`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  isRepeating ? "translate-x-4" : ""
                }`}
              />
            </button>
          </div>

          {/* Repeat Options (conditional) */}
          {isRepeating && (
            <div className="space-y-4 p-4 bg-[#fbfbfa] rounded-lg">
              {/* Frequency */}
              <div>
                <label className="text-xs font-semibold text-[#37352f]">반복 주기</label>
                <div className="mt-2 flex gap-2">
                  {FREQUENCIES.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFrequency(f)}
                      disabled={isSubmitting}
                      className={`px-3 py-1.5 text-xs rounded-md transition-all ${
                        frequency === f
                          ? "bg-blue-500 text-white"
                          : "bg-white border border-[#ececeb] text-[#37352f] hover:bg-[#efefed]"
                      } disabled:opacity-50`}
                    >
                      {f === "daily" ? "매일" : f === "weekly" ? "매주" : "사용자 지정"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Weekdays (only for custom) */}
              {frequency === "custom" && (
                <div>
                  <label className="text-xs font-semibold text-[#37352f]">
                    요일 선택 <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-2 flex gap-1">
                    {WEEKDAYS.map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleWeekdayToggle(day)}
                        onBlur={() => handleBlur("weekdays")}
                        disabled={isSubmitting}
                        className={`w-8 h-8 text-xs rounded-md transition-all ${
                          weekdays.includes(day)
                            ? "bg-blue-500 text-white"
                            : "bg-white border border-[#ececeb] text-[#37352f] hover:bg-[#efefed]"
                        } disabled:opacity-50`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                  {touched.weekdays && errors["repeatOptions.weekdays"] && (
                    <p className="mt-1 text-[11px] text-red-500">
                      {errors["repeatOptions.weekdays"]}
                    </p>
                  )}
                </div>
              )}

              {/* Repeat End & Limit */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label htmlFor="repeat-end" className="text-xs font-semibold text-[#37352f]">
                    종료일 (선택)
                  </label>
                  <input
                    id="repeat-end"
                    type="date"
                    value={repeatEnd}
                    onChange={(e) => setRepeatEnd(e.target.value)}
                    onBlur={() => handleBlur("repeatEnd")}
                    disabled={isSubmitting}
                    className="mt-2 w-full rounded-md border border-[#ececeb] px-3 py-2 text-sm text-[#37352f] focus:border-[#37352f] focus:outline-none disabled:bg-gray-50"
                  />
                  {touched.repeatEnd && errors["repeatOptions.repeatEnd"] && (
                    <p className="mt-1 text-[11px] text-red-500">
                      {errors["repeatOptions.repeatEnd"]}
                    </p>
                  )}
                </div>
                <div className="flex-1">
                  <label htmlFor="repeat-limit" className="text-xs font-semibold text-[#37352f]">
                    반복 횟수 (선택)
                  </label>
                  <input
                    id="repeat-limit"
                    type="number"
                    min="1"
                    max="365"
                    value={repeatLimit}
                    onChange={(e) => setRepeatLimit(e.target.value)}
                    onBlur={() => handleBlur("repeatLimit")}
                    placeholder="최대 365"
                    disabled={isSubmitting}
                    className="mt-2 w-full rounded-md border border-[#ececeb] px-3 py-2 text-sm text-[#37352f] placeholder:text-[#37352f]/30 focus:border-[#37352f] focus:outline-none disabled:bg-gray-50"
                  />
                  {touched.repeatLimit && errors["repeatOptions.repeatLimit"] && (
                    <p className="mt-1 text-[11px] text-red-500">
                      {errors["repeatOptions.repeatLimit"]}
                    </p>
                  )}
                </div>
              </div>

              {/* repeatOptions required error */}
              {touched.frequency && errors.repeatOptions && (
                <p className="text-[11px] text-red-500">{errors.repeatOptions}</p>
              )}
            </div>
          )}

          {/* Flow Steps */}
          <div>
            <label className="text-xs font-semibold text-[#37352f]">
              플로우 스텝 ({steps.length}/20)
            </label>
            <div className="mt-2 space-y-2">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 bg-[#fbfbfa] rounded-md"
                >
                  <span className="text-xs text-[#37352f]/60 w-5">{index + 1}.</span>
                  <span className="flex-1 text-sm text-[#37352f]">{step.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveStep(index)}
                    disabled={isSubmitting}
                    className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-all disabled:opacity-50"
                    aria-label={`Remove step ${index + 1}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newStepName}
                  onChange={(e) => setNewStepName(e.target.value)}
                  onKeyDown={handleStepKeyDown}
                  onBlur={() => handleBlur("steps")}
                  placeholder="새 스텝 이름"
                  disabled={isSubmitting || steps.length >= 20}
                  className="flex-1 rounded-md border border-[#ececeb] px-3 py-2 text-sm text-[#37352f] placeholder:text-[#37352f]/30 focus:border-[#37352f] focus:outline-none disabled:bg-gray-50"
                />
                <button
                  type="button"
                  onClick={handleAddStep}
                  disabled={isSubmitting || !newStepName.trim() || steps.length >= 20}
                  className="px-3 py-2 bg-[#efefed] text-[#37352f] rounded-md hover:bg-[#e5e5e5] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Error Messages */}
          {submitError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-red-700">{submitError}</p>
              </div>
            </div>
          )}

          {partialFailure && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800">부분 생성 오류</p>
                  <p className="text-xs text-yellow-700 mt-1">{partialFailure.message}</p>
                  {partialFailure.partialCleanup ? (
                    <p className="text-xs text-yellow-600 mt-1">
                      일부 생성물이 정리되었습니다. (정리 ID: {partialFailure.cleanupIds.length}개)
                    </p>
                  ) : (
                    <p className="text-xs text-yellow-600 mt-1">
                      일부 생성물이 남아 있을 수 있습니다. Notion에서 확인해 주세요.
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleRetry}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200 transition-all"
                >
                  <RefreshCw size={12} />
                  다시 시도
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-3 py-1.5 text-xs font-medium text-yellow-700 hover:bg-yellow-100 rounded-md transition-all"
                >
                  취소
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-[#ececeb] bg-white px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-md border border-[#ececeb] px-3 py-2 text-xs font-semibold text-[#37352f]/70 hover:text-[#37352f] transition-all disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-xs font-semibold text-white transition-all ${
              isFormValid && !isSubmitting
                ? "bg-black hover:bg-[#333]"
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            {isSubmitting && <Loader2 size={14} className="animate-spin" />}
            {isSubmitting ? "생성 중..." : "태스크 생성"}
          </button>
        </div>
      </div>
    </div>
  );
};

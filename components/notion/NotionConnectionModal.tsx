"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";

export interface NotionConnectionConfig {
  apiKey: string;
  templateDbId: string;
  stepDbId: string;
  instanceDbId: string;
}

interface NotionConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (config: NotionConnectionConfig) => void;
}

const emptyConfig: NotionConnectionConfig = {
  apiKey: "",
  templateDbId: "",
  stepDbId: "",
  instanceDbId: "",
};

const isValidApiKey = (value: string) => {
  const trimmed = value.trim();
  return (
    (trimmed.startsWith("secret_") || trimmed.startsWith("ntn_")) &&
    trimmed.length >= 12
  );
};

const isValidNotionId = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return false;
  const compact = trimmed.replace(/-/g, "");
  return /^[0-9a-fA-F]{32}$/.test(compact);
};

export const NotionConnectionModal: React.FC<NotionConnectionModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [values, setValues] = useState<NotionConnectionConfig>(emptyConfig);
  const [touched, setTouched] = useState<Record<keyof NotionConnectionConfig, boolean>>({
    apiKey: false,
    templateDbId: false,
    stepDbId: false,
    instanceDbId: false,
  });
  const firstInputRef = useRef<HTMLInputElement>(null);

  const errors = useMemo(() => {
    return {
      apiKey: values.apiKey
        ? isValidApiKey(values.apiKey)
          ? ""
          : "API key must start with secret_ or ntn_."
        : "API key is required.",
      templateDbId: values.templateDbId
        ? isValidNotionId(values.templateDbId)
          ? ""
          : "Template DB ID must be a 32-char Notion ID."
        : "Template DB ID is required.",
      stepDbId: values.stepDbId
        ? isValidNotionId(values.stepDbId)
          ? ""
          : "Step DB ID must be a 32-char Notion ID."
        : "Step DB ID is required.",
      instanceDbId: values.instanceDbId
        ? isValidNotionId(values.instanceDbId)
          ? ""
          : "Instance DB ID must be a 32-char Notion ID."
        : "Instance DB ID is required.",
    };
  }, [values]);

  const isFormValid =
    !errors.apiKey && !errors.templateDbId && !errors.stepDbId && !errors.instanceDbId;

  const handleChange = (field: keyof NotionConnectionConfig) => {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setValues((prev) => ({ ...prev, [field]: value }));
    };
  };

  const handleBlur = (field: keyof NotionConnectionConfig) => {
    return () => {
      setTouched((prev) => ({ ...prev, [field]: true }));
    };
  };

  const handleClose = () => {
    setValues(emptyConfig);
    setTouched({
      apiKey: false,
      templateDbId: false,
      stepDbId: false,
      instanceDbId: false,
    });
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSave = () => {
    setTouched({
      apiKey: true,
      templateDbId: true,
      stepDbId: true,
      instanceDbId: true,
    });

    if (!isFormValid) return;
    onSave?.({
      apiKey: values.apiKey.trim(),
      templateDbId: values.templateDbId.trim(),
      stepDbId: values.stepDbId.trim(),
      instanceDbId: values.instanceDbId.trim(),
    });
    handleClose();
  };

  const inputFields: Array<{
    key: keyof NotionConnectionConfig;
    label: string;
    id: string;
    type: string;
    placeholder: string;
  }> = [
    {
      key: "apiKey",
      label: "Notion API Key",
      id: "notion-api-key",
      type: "password",
      placeholder: "secret_...",
    },
    {
      key: "templateDbId",
      label: "Template DB ID",
      id: "template-db-id",
      type: "text",
      placeholder: "32-char Notion ID",
    },
    {
      key: "stepDbId",
      label: "Step DB ID",
      id: "step-db-id",
      type: "text",
      placeholder: "32-char Notion ID",
    },
    {
      key: "instanceDbId",
      label: "Instance DB ID",
      id: "instance-db-id",
      type: "text",
      placeholder: "32-char Notion ID",
    },
  ];

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-6"
      onClick={handleOverlayClick}
    >
      <div className="w-full max-w-lg rounded-xl border border-[#ececeb] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#ececeb] px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-[#37352f]">Notion 연결</h2>
            <p className="text-xs text-[#37352f]/60">
              API 키와 데이터베이스 ID를 입력하세요.
            </p>
          </div>
          <button
            aria-label="Close"
            onClick={handleClose}
            className="rounded-full p-1 text-[#37352f]/50 hover:bg-[#efefed] hover:text-[#37352f] transition-all"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          {inputFields.map((field, index) => (
            <div key={field.key}>
              <label htmlFor={field.id} className="text-xs font-semibold text-[#37352f]">
                {field.label}
              </label>
              <input
                ref={index === 0 ? firstInputRef : undefined}
                id={field.id}
                type={field.type}
                value={values[field.key]}
                onChange={handleChange(field.key)}
                onBlur={handleBlur(field.key)}
                placeholder={field.placeholder}
                className="mt-2 w-full rounded-md border border-[#ececeb] px-3 py-2 text-sm text-[#37352f] placeholder:text-[#37352f]/30 focus:border-[#37352f] focus:outline-none"
              />
              {touched[field.key] && errors[field.key] && (
                <p className="mt-1 text-[11px] text-red-500">{errors[field.key]}</p>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[#ececeb] px-5 py-4">
          <button
            onClick={handleClose}
            className="rounded-md border border-[#ececeb] px-3 py-2 text-xs font-semibold text-[#37352f]/70 hover:text-[#37352f] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!isFormValid}
            className={`rounded-md px-3 py-2 text-xs font-semibold text-white transition-all ${
              isFormValid
                ? "bg-black hover:bg-[#333]"
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            Save connection
          </button>
        </div>
      </div>
    </div>
  );
};

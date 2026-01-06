"use client";

import React, { useMemo, useState } from "react";
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
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-6">
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
            onClick={onClose}
            className="rounded-full p-1 text-[#37352f]/50 hover:bg-[#efefed] hover:text-[#37352f] transition-all"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div>
            <label htmlFor="notion-api-key" className="text-xs font-semibold text-[#37352f]">
              Notion API Key
            </label>
            <input
              id="notion-api-key"
              type="password"
              value={values.apiKey}
              onChange={handleChange("apiKey")}
              onBlur={handleBlur("apiKey")}
              placeholder="secret_..."
              className="mt-2 w-full rounded-md border border-[#ececeb] px-3 py-2 text-sm text-[#37352f] placeholder:text-[#37352f]/30 focus:border-[#37352f] focus:outline-none"
            />
            {touched.apiKey && errors.apiKey && (
              <p className="mt-1 text-[11px] text-red-500">{errors.apiKey}</p>
            )}
          </div>

          <div>
            <label htmlFor="template-db-id" className="text-xs font-semibold text-[#37352f]">
              Template DB ID
            </label>
            <input
              id="template-db-id"
              type="text"
              value={values.templateDbId}
              onChange={handleChange("templateDbId")}
              onBlur={handleBlur("templateDbId")}
              placeholder="32-char Notion ID"
              className="mt-2 w-full rounded-md border border-[#ececeb] px-3 py-2 text-sm text-[#37352f] placeholder:text-[#37352f]/30 focus:border-[#37352f] focus:outline-none"
            />
            {touched.templateDbId && errors.templateDbId && (
              <p className="mt-1 text-[11px] text-red-500">{errors.templateDbId}</p>
            )}
          </div>

          <div>
            <label htmlFor="step-db-id" className="text-xs font-semibold text-[#37352f]">
              Step DB ID
            </label>
            <input
              id="step-db-id"
              type="text"
              value={values.stepDbId}
              onChange={handleChange("stepDbId")}
              onBlur={handleBlur("stepDbId")}
              placeholder="32-char Notion ID"
              className="mt-2 w-full rounded-md border border-[#ececeb] px-3 py-2 text-sm text-[#37352f] placeholder:text-[#37352f]/30 focus:border-[#37352f] focus:outline-none"
            />
            {touched.stepDbId && errors.stepDbId && (
              <p className="mt-1 text-[11px] text-red-500">{errors.stepDbId}</p>
            )}
          </div>

          <div>
            <label htmlFor="instance-db-id" className="text-xs font-semibold text-[#37352f]">
              Instance DB ID
            </label>
            <input
              id="instance-db-id"
              type="text"
              value={values.instanceDbId}
              onChange={handleChange("instanceDbId")}
              onBlur={handleBlur("instanceDbId")}
              placeholder="32-char Notion ID"
              className="mt-2 w-full rounded-md border border-[#ececeb] px-3 py-2 text-sm text-[#37352f] placeholder:text-[#37352f]/30 focus:border-[#37352f] focus:outline-none"
            />
            {touched.instanceDbId && errors.instanceDbId && (
              <p className="mt-1 text-[11px] text-red-500">{errors.instanceDbId}</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[#ececeb] px-5 py-4">
          <button
            onClick={onClose}
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

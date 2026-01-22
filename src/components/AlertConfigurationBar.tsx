import React, { useEffect, useRef, useState } from "react";
import { apiGet } from "../services/api"; 
import { normalizeErrors } from "../utils/normalizeErrors";
import { useTheme } from "../context/ThemeContext";
import { lightModalTheme, darkModalTheme, type ModalTheme } from "../themes/modalTheme";

interface FileAssociation {
  id: number;
  algo_name: string;
  group_name?: string;
  interval_name: string;
  file_name: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<Record<string, string[]> | null>;
}

const CONDITION_OPTIONS = [
  { value: "change", label: "🔄 Any Change" },
  { value: "increase", label: ">" },
  { value: "decrease", label: "<" },
  { value: "equals", label: "=" },
  { value: "threshold_cross", label: "⚡ Threshold Cross" },
];

const AlertConfigurationBar: React.FC<Props> = ({ isOpen, onClose, onSave }) => {
  const { theme } = useTheme();
  const currentStyle: ModalTheme = theme === "dark" ? darkModalTheme : lightModalTheme;
  
  const firstSelectRef = useRef<HTMLSelectElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  const [files, setFiles] = useState<FileAssociation[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvSymInt, setCsvSymInt] = useState<string[]>([]);
  const [dropdownLoading, setDropdownLoading] = useState(false);
  const [modalErrors, setModalErrors] = useState<Record<string, string[]> | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    file_association: null as number | null,
    symbol_interval: "",
    field_name: "",
    condition_type: "change",
    compare_value: "",
  });

  // Fetch file associations when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchFileAssociations();
      setTimeout(() => firstSelectRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const fetchFileAssociations = async () => {
    try {
      const data: FileAssociation[] = await apiGet("/ttscanner/file-associations/");
      setFiles(data);
      if (data.length > 0) {
        const firstFileId = data[0].id;
        handleFileChange(firstFileId);
      }
    } catch (err) {
      setModalErrors(normalizeErrors(err));
    }
  };

  const fetchDropdownData = async (fileId: number) => {
    setDropdownLoading(true);
    try {
      const [headers, symInt] = await Promise.all([
        apiGet<string[]>(`/ttscanner/csv-headers/${fileId}/`),
        apiGet<string[]>(`/ttscanner/sym-int/${fileId}/`)
      ]);
      setCsvHeaders(headers || []);
      setCsvSymInt(symInt || []);
      setForm(prev => ({
        ...prev,
        file_association: fileId,
        symbol_interval: symInt?.[0] || "",
        field_name: headers?.[0] || "",
      }));
    } catch (err) {
      setModalErrors(normalizeErrors(err));
    } finally {
      setDropdownLoading(false);
    }
  };

  const handleFileChange = (fileId: number) => {
    setCsvHeaders([]);
    setCsvSymInt([]);
    fetchDropdownData(fileId);
  };

  const isNumericField = (fieldName: string) => {
    if (!fieldName) return false;
    const numericKeywords = [
      "price","volume","amount","value","pct","percent",
      "rate","change","high","low","open","close"
    ];
    return numericKeywords.some(k => fieldName.toLowerCase().includes(k));
  };

  const handleSave = async () => {
    if (!form.file_association) {
      setModalErrors({ general: ["Please select a valid file association"] });
      return;
    }
    if (!form.symbol_interval || !form.field_name) {
      setModalErrors({ general: ["Symbol/Interval and Field Name are required"] });
      return;
    }
    if (isNumericField(form.field_name) && form.compare_value && isNaN(Number(form.compare_value))) {
      setModalErrors({ compare_value: ["This field requires a numeric value"] });
      return;
    }

    setSaving(true);
    const errors = await onSave(form);
    if (errors) setModalErrors(errors);
    else onClose();
    setSaving(false);
  };

  // Close modal on ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  // Scroll to errors if they appear
  useEffect(() => {
    if (modalErrors && scrollRef.current && errorRef.current) {
      scrollRef.current.scrollTo({
        top: errorRef.current.offsetTop - 10,
        behavior: "smooth",
      });
    }
  }, [modalErrors]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 px-4 animate-fadeIn"
      style={{ backgroundColor: theme === "light" ? "rgba(0, 0, 0, 0.3)" : "rgba(0, 0, 0, 0.5)" }}
    >
      <div 
        className="p-6 rounded-2xl shadow-2xl w-full max-w-lg relative transform transition-all scale-100 md:scale-100 overflow-y-auto max-h-[90vh] scrollbar-thin scrollbar-thumb-rounded-full scrollbar-track-rounded-full animate-scaleIn"
        style={{ 
          backgroundColor: currentStyle.background,
          color: currentStyle.text,
          scrollbarColor: theme === "light" ? "#6b5bff #f3f4f6" : "#6b5bff #1f2937",
        }}
      >

        {/* Header */}
        <div 
          className="flex justify-between items-center mb-4 pb-4"
          style={{ borderBottom: `1px solid ${currentStyle.border}` }}
        >
          <h2 
            className="text-2xl font-bold"
            style={{ color: currentStyle.text }}
          >
            Create New Alert
          </h2>
          <button 
            onClick={onClose} 
            className="text-2xl transition-opacity hover:opacity-70"
            style={{ color: currentStyle.textSecondary }}
          >
            ✕
          </button>
        </div>

        <div ref={scrollRef} className="space-y-4">
          {/* File Association */}
          <div className="flex flex-col">
            <label 
              className="font-medium mb-1"
              style={{ color: currentStyle.textSecondary }}
            >
              Select Table
            </label>
            <select
              ref={firstSelectRef}
              value={form.file_association || ""}
              onChange={e => handleFileChange(+e.target.value)}
              className="px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:opacity-50"
              style={{
                backgroundColor: currentStyle.inputBg,
                borderColor: currentStyle.inputBorder,
                color: currentStyle.inputText,
              }}
            >
              <option value="" disabled>Select File Association</option>
              {files.map(f => (
                <option key={f.id} value={f.id}>
                  {f.algo_name} {f.group_name ? `- ${f.group_name}` : ""} ({f.interval_name})
                </option>
              ))}
            </select>
          </div>

          {/* Symbol/Interval */}
          <div className="flex flex-col">
            <label 
              className="font-medium mb-1"
              style={{ color: currentStyle.textSecondary }}
            >
              Symbol / Interval
            </label>
            <select
              value={form.symbol_interval}
              onChange={e => setForm({ ...form, symbol_interval: e.target.value })}
              disabled={dropdownLoading || csvSymInt.length === 0}
              className="px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:opacity-50"
              style={{
                backgroundColor: currentStyle.inputBg,
                borderColor: currentStyle.inputBorder,
                color: currentStyle.inputText,
              }}
            >
              <option value="">Select Symbol/Interval</option>
              {csvSymInt.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Field Name */}
          <div className="flex flex-col">
            <label 
              className="font-medium mb-1"
              style={{ color: currentStyle.textSecondary }}
            >
              Field Name
            </label>
            <select
              value={form.field_name}
              onChange={e => setForm({ ...form, field_name: e.target.value })}
              disabled={dropdownLoading || csvHeaders.length === 0}
              className="px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:opacity-50"
              style={{
                backgroundColor: currentStyle.inputBg,
                borderColor: currentStyle.inputBorder,
                color: currentStyle.inputText,
              }}
            >
              <option value="">Select Field</option>
              {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>

          {/* Condition */}
          <div className="flex flex-col">
            <label 
              className="font-medium mb-1"
              style={{ color: currentStyle.textSecondary }}
            >
              Condition
            </label>
            <select
              value={form.condition_type}
              onChange={e => setForm({ ...form, condition_type: e.target.value })}
              className="px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              style={{
                backgroundColor: currentStyle.inputBg,
                borderColor: currentStyle.inputBorder,
                color: currentStyle.inputText,
              }}
            >
              {CONDITION_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>

          {/* Compare Value */}
          <div className="flex flex-col">
            <label 
              className="font-medium mb-1"
              style={{ color: currentStyle.textSecondary }}
            >
              Compare Value
            </label>
            <input
              type={isNumericField(form.field_name) ? "number" : "text"}
              value={form.condition_type === "change" ? "" : form.compare_value}
              onChange={e => setForm({ ...form, compare_value: e.target.value })}
              placeholder={form.condition_type === "change" ? "Not required for 'Any Change'" : "Enter value"}
              disabled={form.condition_type === "change"}
              className={`px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                form.condition_type === "change" ? "opacity-50 cursor-not-allowed" : ""
              }`}
              style={{
                backgroundColor: currentStyle.inputBg,
                borderColor: currentStyle.inputBorder,
                color: currentStyle.inputText,
              }}
            />
          </div>

          {/* Errors */}
          {modalErrors && (
            <div 
              ref={errorRef} 
              className="mt-4 p-4 rounded-lg border"
              style={{
                backgroundColor: currentStyle.errorBg,
                borderColor: currentStyle.errorBorder,
                color: currentStyle.errorText,
              }}
            >
              <ul className="list-disc list-inside space-y-1 text-sm">
                {Object.entries(modalErrors).map(([key, vals]) => (
                  <li key={key}>
                    {key !== "general" && <span className="font-semibold">{key.charAt(0).toUpperCase() + key.slice(1)}: </span>}
                    {vals.join(", ")}
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>

        {/* Footer */}
        <div 
          className="mt-6 pt-4 flex justify-end space-x-3"
          style={{ borderTop: `1px solid ${currentStyle.border}` }}
        >
          <button
            className="px-5 py-2 rounded-lg font-medium transition hover:opacity-90 disabled:opacity-50"
            onClick={onClose}
            disabled={saving}
            style={{
              backgroundColor: currentStyle.buttonSecondaryBg,
              color: currentStyle.buttonSecondaryText,
            }}
          >
            Cancel
          </button>
          <button
            className="px-5 py-2 rounded-lg font-medium transition hover:opacity-90 disabled:opacity-50 flex items-center justify-center"
            onClick={handleSave}
            disabled={saving || dropdownLoading || !form.file_association}
            style={{
              backgroundColor: currentStyle.buttonPrimaryBg,
              color: "#ffffff",
            }}
          >
            {saving ? "Saving..." : "Save Alert"}
          </button>
        </div>

      </div>
    </div>
  );
};

export default AlertConfigurationBar;
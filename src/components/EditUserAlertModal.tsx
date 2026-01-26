import React, { useState, useEffect, useRef } from "react";
import { lightModalTheme, darkModalTheme, type ModalTheme } from "../themes/modalTheme";
import { apiGet } from "../services/api";
import { normalizeErrors } from "../utils/normalizeErrors";
import { useTheme } from "../context/ThemeContext";
import { type UserAlert } from "../services/UserAlert";

interface FileAssociation {
  id: number;
  algo: string;
  group?: string;
  interval: string;
}

interface Props {
  alert: UserAlert;
  files: FileAssociation[];
  onClose: () => void;
  onSave: (alert: UserAlert) => Promise<Record<string, any> | null>;
}

const CONDITION_OPTIONS = [
  { value: "change", label: "🔄 Any Change" },
  { value: "increase", label: ">" },
  { value: "decrease", label: "<" },
  { value: "equals", label: "=" },
  { value: "threshold_cross", label: "⚡ Threshold Cross" },
];

const EditUserAlertModal: React.FC<Props> = ({ alert, files, onClose, onSave }) => {
  const { theme } = useTheme();
  const [updatedAlert, setUpdatedAlert] = useState<UserAlert>(alert);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvSymInt, setCsvSymInt] = useState<string[]>([]);
  const [dropdownLoading, setDropdownLoading] = useState(false);
  const [modalErrors, setModalErrors] = useState<Record<string, any> | null>(null);
  
  const currentFile = files.find(f => f.id === alert.file_association_id) || null;
  const currentStyle: ModalTheme = theme === "dark" ? darkModalTheme : lightModalTheme;
  const scrollRef = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentFile) fetchDropdownData(currentFile.id);
  }, [currentFile]);

  useEffect(() => {
    if (modalErrors && errorRef.current && scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [modalErrors]);

  const fetchDropdownData = async (fileId: number) => {
    setDropdownLoading(true);
    try {
      const [headers, symInt] = await Promise.all([
        apiGet<string[]>(`/ttscanner/csv-headers/${fileId}/`),
        apiGet<string[]>(`/ttscanner/sym-int/${fileId}/`)
      ]);
      setCsvHeaders(headers || []);
      setCsvSymInt(symInt || []);
    } catch (err) {
      setModalErrors(normalizeErrors(err));
    } finally {
      setDropdownLoading(false);
    }
  };

  const isNumericField = (fieldName: string): boolean => {
    if (!fieldName) return false;
    const numericKeywords = ['price', 'volume', 'amount', 'value', 'pct', 'percent', 'rate', 'change', 'high', 'low', 'open', 'close', 'bars', 'entry'];
    return numericKeywords.some(k => fieldName.toLowerCase().includes(k));
  };

  const handleSave = async () => {
    setModalErrors(null);
    try {
      const errors = await onSave(updatedAlert);
      if (errors) {
        setModalErrors(errors);
      } else {
        onClose();
      }
    } catch (err) {
      setModalErrors(normalizeErrors(err));
    }
  };

  // Helper to check if condition is "Any Change"
  const isChangeCondition = updatedAlert.condition_type === "change";

  // Handle condition change and clear compare_value if "change" is selected
  const handleConditionChange = (val: string) => {
    setUpdatedAlert(prev => ({
      ...prev,
      condition_type: val,
      // CRITICAL: If 'change', wipe the value so it doesn't send old data to backend
      compare_value: val === "change" ? "" : prev.compare_value
    }));
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center px-4 z-50" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
      <div className="rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden" style={{ backgroundColor: currentStyle.background, color: currentStyle.text }}>
        
        <div className="flex justify-between items-center px-6 py-4" style={{ backgroundColor: currentStyle.headerBg, color: currentStyle.headerText, borderBottom: `1px solid ${currentStyle.border}` }}>
          <h2 className="text-xl font-bold">Edit Alert</h2>
          <button onClick={onClose} className="hover:opacity-70 text-2xl">✕</button>
        </div>

        <div ref={scrollRef} className="overflow-y-auto px-6 py-4 flex-1 space-y-4">
          
          <div>
            <label className="text-sm mb-1 block opacity-70">File Association (Fixed)</label>
            <div 
              className="px-3 py-2 rounded border w-full font-medium" 
              style={{ backgroundColor: currentStyle.inputBg, borderColor: currentStyle.border, opacity: 0.8, cursor: 'not-allowed' }}
            >
              {currentFile ? `${currentFile.algo} ${currentFile.group ? `- ${currentFile.group}` : ""} (${currentFile.interval})` : "N/A"}
            </div>
          </div>

          {!dropdownLoading ? (
            <>
              <div>
                <label className="text-sm mb-1 block opacity-70">Symbol/Interval</label>
                <select 
                  value={updatedAlert.symbol_interval} 
                  onChange={e => setUpdatedAlert({ ...updatedAlert, symbol_interval: e.target.value })} 
                  className="px-3 py-2 rounded border w-full focus:ring-2 focus:ring-blue-500 outline-none" 
                  style={{ backgroundColor: currentStyle.inputBg, borderColor: currentStyle.inputBorder, color: currentStyle.inputText }}
                >
                  {csvSymInt.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm mb-1 block opacity-70">Field Name</label>
                <select 
                  value={updatedAlert.field_name} 
                  onChange={e => setUpdatedAlert({ ...updatedAlert, field_name: e.target.value })} 
                  className="px-3 py-2 rounded border w-full focus:ring-2 focus:ring-blue-500 outline-none" 
                  style={{ backgroundColor: currentStyle.inputBg, borderColor: currentStyle.inputBorder, color: currentStyle.inputText }}
                >
                  {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            </>
          ) : (
            <div className="text-center py-4 text-sm opacity-70">Loading options...</div>
          )}

          <div>
            <label className="text-sm mb-1 block opacity-70">Condition</label>
            <select 
              value={updatedAlert.condition_type} 
              onChange={e => handleConditionChange(e.target.value)} 
              className="px-3 py-2 rounded border w-full focus:ring-2 focus:ring-blue-500 outline-none" 
              style={{ backgroundColor: currentStyle.inputBg, borderColor: currentStyle.inputBorder, color: currentStyle.inputText }}
            >
              {CONDITION_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm mb-1 block opacity-70">
              Compare Value {isChangeCondition}
            </label>
            <input
              type={isNumericField(updatedAlert.field_name) ? "number" : "text"}
              value={updatedAlert.compare_value || ""}
              onChange={e => setUpdatedAlert({ ...updatedAlert, compare_value: e.target.value })}
              disabled={isChangeCondition}
              placeholder={isChangeCondition ? "Value cleared" : "Enter value..."}
              className="px-3 py-2 rounded border w-full focus:ring-2 focus:ring-blue-500 outline-none"
              style={{ 
                backgroundColor: currentStyle.inputBg, 
                borderColor: (modalErrors?.compare_value || (modalErrors?.errors && modalErrors.errors.compare_value)) ? "#ef4444" : currentStyle.inputBorder, 
                color: currentStyle.inputText,
                opacity: isChangeCondition ? 0.5 : 1,
                cursor: isChangeCondition ? 'not-allowed' : 'text'
              }}
            />
          </div>

          {modalErrors && (
            <div ref={errorRef} className="mt-2 rounded-lg p-3 border" style={{ backgroundColor: currentStyle.errorBg, borderColor: currentStyle.errorBorder, color: currentStyle.errorText }}>
              <ul className="list-inside list-disc space-y-1 text-sm">
                {Object.entries(modalErrors).map(([key, value]) => {
                  if (key === 'detail') return null;
                  if (key === 'errors' && typeof value === 'object') {
                    return Object.entries(value).map(([field, messages]) => (
                      <li key={field}>
                        <span className="font-medium capitalize">{field.replace('_', ' ')}:</span>{" "}
                        {Array.isArray(messages) ? messages.join(", ") : String(messages)}
                      </li>
                    ));
                  }
                  return (
                    <li key={key}>
                      <span className="font-medium capitalize">{key.replace('_', ' ')}:</span>{" "}
                      {Array.isArray(value) ? value.join(", ") : String(value)}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2 px-6 py-4" style={{ borderTop: `1px solid ${currentStyle.border}` }}>
          <button onClick={onClose} className="px-4 py-2 rounded transition hover:bg-gray-100 dark:hover:bg-gray-800" style={{ color: currentStyle.text }}>Cancel</button>
          <button onClick={handleSave} disabled={dropdownLoading} className="px-4 py-2 rounded transition hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: currentStyle.buttonPrimaryBg, color: "#ffffff" }}>Save</button>
        </div>
      </div>
    </div>
  );
};

export default EditUserAlertModal;
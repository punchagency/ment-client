import React, { useState, useEffect, useRef } from "react";
import { apiGet } from "../services/api";
import { normalizeErrors } from "../utils/normalizeErrors";

interface FileAssociation {
  id: number;
  algo: string;
  group?: string;
  interval: string;
}

interface UserAlert {
  file_association_id: number;
  id: number;
  file_name: string;
  symbol_interval: string;
  field_name: string;
  condition_type: string;
  compare_value: string;
  last_value: string | null;
  is_active: boolean;
}

interface Props {
  alert: UserAlert;
  files: FileAssociation[];
  onClose: () => void;
  onSave: (updatedAlert: UserAlert) => Promise<Record<string, string[]> | null>; 
}

const CONDITION_OPTIONS = [
  { value: "change", label: "🔄 Any Change" },
  { value: "increase", label: ">" },
  { value: "decrease", label: "<" },
  { value: "equals", label: "=" },
  { value: "threshold_cross", label: "⚡ Threshold Cross" },
];

const EditUserAlertModal: React.FC<Props> = ({ alert, files, onClose, onSave }) => {
  const [updatedAlert, setUpdatedAlert] = useState<UserAlert>(alert);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvSymInt, setCsvSymInt] = useState<string[]>([]);
  const [dropdownLoading, setDropdownLoading] = useState(false);
  const [modalErrors, setModalErrors] = useState<Record<string, string[]> | null>(null);
  const [currentFile, setCurrentFile] = useState<FileAssociation | null>(
    files.find(f => f.id === alert.file_association_id) || null
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentFile) fetchDropdownData(currentFile.id);
  }, [currentFile]);

  useEffect(() => {
    if (modalErrors && errorRef.current && scrollRef.current) {
      const scrollContainer = scrollRef.current;
      const errorElement = errorRef.current;
      scrollContainer.scrollTo({
        top: errorElement.offsetTop - 10,
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

      setUpdatedAlert(prev => {
        const updatedSymbolInterval = prev.symbol_interval || symInt?.[0] || "";
        const updatedFieldName = prev.field_name || headers?.[0] || "";

        return {
          ...prev,
          symbol_interval: updatedSymbolInterval,
          field_name: updatedFieldName
        };
      });
    } catch (err) {
      console.error("Error fetching dropdown data:", err);
      setModalErrors(normalizeErrors(err));
    } finally {
      setDropdownLoading(false);
    }
  };


  const handleFileChange = (fileId: number) => {
    const selectedFile = files.find(f => f.id === fileId) || null;
    setCurrentFile(selectedFile);
    setUpdatedAlert(prev => ({ ...prev, file_association_id: fileId }));
    setCsvHeaders([]);
    setCsvSymInt([]);
  };

  const isNumericField = (fieldName: string): boolean => {
    if (!fieldName) return false;
    const numericKeywords = ['price','volume','amount','value','pct','percent','rate','change','high','low','open','close'];
    return numericKeywords.some(k => fieldName.toLowerCase().includes(k));
  };

  const handleSave = async () => {
    if (!updatedAlert.symbol_interval || !updatedAlert.field_name) {
      setModalErrors({ general: ["Symbol/Interval and Field Name are required"] });
      return;
    }

    const errors = await onSave(updatedAlert); 
    if (errors) {
      setModalErrors(errors); 
    } else {
      onClose(); 
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 px-4 z-50 animate-fadeIn">
      <div className="bg-[#111827] rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden animate-scaleIn">

        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-white/20">
          <h2 className="text-xl font-bold text-white">Edit Alert</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div ref={scrollRef} className="overflow-y-auto px-6 py-4 flex-1 space-y-4 max-h-[calc(90vh-120px)]">

          <p className="text-gray-300">ID: {alert.id}</p>

          {/* File Association */}
          <div>
            <label className="text-gray-300 text-sm mb-1 block">File Association</label>
            <select
              value={updatedAlert.file_association_id}
              onChange={e => handleFileChange(parseInt(e.target.value))}
              className="bg-[#1f2937] text-white px-3 py-2 rounded border border-white/20 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            >
              <option value="" disabled>Select File Association</option>
              {files.map(f => (
                <option key={f.id} value={f.id}>{f.algo} {f.group ? `- ${f.group}` : ""} ({f.interval})</option>
              ))}
            </select>
          </div>

          {/* Symbol/Interval */}
          {!dropdownLoading && (
            <div>
              <label className="text-gray-300 text-sm mb-1 block">Symbol/Interval</label>
              <select
                value={updatedAlert.symbol_interval}
                onChange={e => setUpdatedAlert({ ...updatedAlert, symbol_interval: e.target.value })}
                className="bg-[#1f2937] text-white px-3 py-2 rounded border border-white/20 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                disabled={csvSymInt.length === 0}
              >
                <option value="">Select Sym/Int</option>
                {csvSymInt.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}

          {/* Field Name */}
          {!dropdownLoading && (
            <div>
              <label className="text-gray-300 text-sm mb-1 block">Field Name</label>
              <select
                value={updatedAlert.field_name}
                onChange={e => setUpdatedAlert({ ...updatedAlert, field_name: e.target.value })}
                className="bg-[#1f2937] text-white px-3 py-2 rounded border border-white/20 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                disabled={csvHeaders.length === 0}
              >
                <option value="">Select Field</option>
                {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          )}

          {/* Condition */}
          <div>
            <label className="text-gray-300 text-sm mb-1 block">Condition</label>
            <select
              value={updatedAlert.condition_type}
              onChange={e => setUpdatedAlert({ ...updatedAlert, condition_type: e.target.value })}
              className="bg-[#1f2937] text-white px-3 py-2 rounded border border-white/20 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            >
              {CONDITION_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>

          {/* Compare Value */}
          <div>
            <label className="text-gray-300 text-sm mb-1 block">Compare Value</label>
            <input
              type={isNumericField(updatedAlert.field_name) ? "number" : "text"}
              value={updatedAlert.condition_type === "change" ? "" : updatedAlert.compare_value}
              onChange={e => {
                if (isNumericField(updatedAlert.field_name)) {
                  const value = e.target.value;
                  if (value === '' || /^-?\d*\.?\d*$/.test(value)) setUpdatedAlert({ ...updatedAlert, compare_value: value });
                } else {
                  setUpdatedAlert({ ...updatedAlert, compare_value: e.target.value });
                }
              }}
              placeholder={updatedAlert.condition_type === "change"
                ? "Not required for 'Any Change'"
                : isNumericField(updatedAlert.field_name) ? "Enter a number" : "Enter text"
              }
              disabled={updatedAlert.condition_type === "change"}
              className={`bg-[#1f2937] text-white px-3 py-2 rounded border border-white/20 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${updatedAlert.condition_type === "change" ? "opacity-50 cursor-not-allowed" : ""}`}
            />
          </div>

          {/* Error Messages */}
          {modalErrors && (
            <div ref={errorRef} className="mb-4 rounded-lg bg-red-600/20 p-3 text-red-100 border border-red-500 overflow-auto max-h-32 animate-slideDown">
              <div className="flex items-center mb-2">
                <span className="mr-2 text-red-500">⚠️</span>
                <strong>Error:</strong>
              </div>
              <ul className="list-inside list-disc space-y-1 text-sm">
                {Object.entries(modalErrors).map(([key, vals]) => (
                  <li key={key}><span className="font-medium">{key}:</span> {vals.join(", ")}</li>
                ))}
              </ul>
            </div>
          )}

        </div>

        {/* Footer Buttons */}
        <div className="flex justify-end space-x-2 px-6 py-4 border-t border-white/20">
          <button className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded transition" onClick={onClose}>Cancel</button>
          <button className="bg-[#6b5bff] hover:bg-[#8b65ff] text-white px-4 py-2 rounded transition" onClick={handleSave} disabled={dropdownLoading}>Save</button>
        </div>

      </div>
    </div>
  );
};

export default EditUserAlertModal;

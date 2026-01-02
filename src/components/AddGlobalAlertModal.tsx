import React, { useState } from "react";  
import { apiGet, apiPost } from "../services/api";
import { normalizeErrors } from "../utils/normalizeErrors";

interface FileAssociation {
  id: number;
  algo: string;
  group?: string;
  interval: string;
}

interface AddGlobalAlertModalProps {
  files: FileAssociation[];
  onClose: () => void;
  onAlertAdded: (alert: any) => void;
}

const CONDITION_OPTIONS = [
  { value: "change", label: "🔄 Any Change" },
  { value: "increase", label: ">" },
  { value: "decrease", label: "<" },
  { value: "equals", label: "=" },
  { value: "threshold_cross", label: "⚡ Threshold Cross" },
];

const AddGlobalAlertModal: React.FC<AddGlobalAlertModalProps> = ({ files, onClose, onAlertAdded }) => {
  const [currentFile, setCurrentFile] = useState<FileAssociation | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvSymInt, setCsvSymInt] = useState<string[]>([]);
  const [dropdownLoading, setDropdownLoading] = useState(false);
  const [modalErrors, setModalErrors] = useState<Record<string, string[]> | null>(null);
  const [saving, setSaving] = useState(false);

  const [newAlert, setNewAlert] = useState({
    symbol_interval: "",
    field_name: "",
    condition_type: CONDITION_OPTIONS[0].value,
    compare_value: "",
  });

  const fetchCsvHeaders = async (fileId: number): Promise<string[]> => {
    try {
      const headers = await apiGet<string[]>(`/ttscanner/csv-headers/${fileId}/`);
      setCsvHeaders(headers || []);
      return headers || [];
    } catch (err) {
      console.error("Error fetching CSV headers:", err);
      setCsvHeaders([]);
      return [];
    }
  };

  const fetchSymInt = async (fileId: number): Promise<string[]> => {
    try {
      const symInt = await apiGet<string[]>(`/ttscanner/sym-int/${fileId}/`);
      setCsvSymInt(symInt || []);
      return symInt || [];
    } catch (err) {
      console.error("Error fetching sym/int:", err);
      setCsvSymInt([]);
      return [];
    }
  };

  const handleFileChange = async (fileId: number) => {
    const selected = files.find(f => f.id === fileId) || null;
    setCurrentFile(selected);
    setDropdownLoading(true);
    setCsvHeaders([]);
    setCsvSymInt([]);

    if (selected) {
      const [headers, symInt] = await Promise.all([
        fetchCsvHeaders(selected.id),
        fetchSymInt(selected.id)
      ]);

      setNewAlert(prev => ({
        ...prev,
        symbol_interval: symInt[0] || "",
        field_name: headers[0] || "",
      }));
    }

    setDropdownLoading(false);
  };

  const saveAlert = async () => {
    if (!currentFile) return;
    setSaving(true);
    setModalErrors(null);

    try {
      const payload = {
        ...newAlert,
        file_association: currentFile.id,
      };

      const createdAlert = await apiPost<any>(`/ttscanner/global-alert/create/${currentFile.id}/`, payload);

      if (!createdAlert || typeof createdAlert !== "object") {
        throw new Error("Invalid response from API");
      }

      if (typeof onAlertAdded === "function") onAlertAdded(createdAlert);
      if (typeof onClose === "function") onClose();

      window.location.href = '/dashboard/global-alerts';

    } catch (err: any) {
      console.error("Error creating alert:", err);
      const errors = normalizeErrors(err); 
      setModalErrors(errors);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 px-4">
      <div className="bg-[#111827] p-6 rounded-2xl shadow-2xl w-full max-w-md relative transform transition-all scale-100 md:scale-100 overflow-y-auto max-h-[90vh] scrollbar-thin scrollbar-thumb-[#6b5bff] scrollbar-track-[#1f2937] scrollbar-thumb-rounded-full scrollbar-track-rounded-full">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl transition-colors"
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold mb-6 text-white text-center">Add Global Alert</h2>

        <div className="space-y-4">
          <div className="flex flex-col">
            <label className="text-gray-300 font-medium mb-1">File Association</label>
            <select
              value={currentFile?.id || ""}
              onChange={e => handleFileChange(parseInt(e.target.value))}
              className="bg-[#2a2a40] text-white px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#6b5bff] transition"
            >
              <option value="" disabled>Select File Association</option>
              {files.map(f => (
                <option key={f.id} value={f.id}>
                  {f.algo} {f.group ? `- ${f.group}` : ""} ({f.interval})
                </option>
              ))}
            </select>
          </div>


          <div className="flex flex-col">
            <label className="text-gray-300 font-medium mb-1">Symbols / Interval</label>
            <select
              value={newAlert.symbol_interval}
              onChange={e => setNewAlert({ ...newAlert, symbol_interval: e.target.value })}
              className="bg-[#2a2a40] text-white px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#6b5bff] transition"
              disabled={dropdownLoading || csvSymInt.length === 0}
            >
              <option value="">Select Sym/Int</option>
              {csvSymInt.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>


          <div className="flex flex-col">
            <label className="text-gray-300 font-medium mb-1">Field Name</label>
            <select
              value={newAlert.field_name}
              onChange={e => setNewAlert({ ...newAlert, field_name: e.target.value })}
              className="bg-[#2a2a40] text-white px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#6b5bff] transition"
              disabled={dropdownLoading || csvHeaders.length === 0}
            >
              <option value="">Select Field</option>
              {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-gray-300 font-medium mb-1">Condition</label>
            <select
              value={newAlert.condition_type}
              onChange={e => setNewAlert({ ...newAlert, condition_type: e.target.value })}
              className="bg-[#2a2a40] text-white px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#6b5bff] transition"
            >
              {CONDITION_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>


          <div className="flex flex-col">
            <label className="text-gray-300 font-medium mb-1">Compare Value</label>
            <input
              type="text"
              value={newAlert.condition_type === "change" ? "" : newAlert.compare_value}
              onChange={e => setNewAlert({ ...newAlert, compare_value: e.target.value })}
              placeholder={newAlert.condition_type === "change" ? "Not required for 'Any Change'" : "Enter value"}
              disabled={newAlert.condition_type === "change"}
              className={`bg-[#2a2a40] text-white px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#6b5bff] transition ${
                newAlert.condition_type === "change" ? "opacity-50 cursor-not-allowed" : ""
              }`}
            />
          </div>
        </div>


        {modalErrors && (
          <div className="mt-4 bg-red-900/30 border border-red-500 p-4 rounded-lg text-red-200">
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


        <div className="mt-6 flex justify-end space-x-3">
          <button
            className="bg-gray-700 hover:bg-gray-600 text-white px-5 py-2 rounded-lg font-medium transition"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            className="bg-[#6b5bff] hover:bg-[#8b65ff] text-white px-5 py-2 rounded-lg font-medium transition flex items-center justify-center"
            onClick={saveAlert}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddGlobalAlertModal;
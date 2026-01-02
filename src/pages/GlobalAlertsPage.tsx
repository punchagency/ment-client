import React, { useState, useEffect } from 'react';
import { apiGet, apiPatch, apiDelete } from '../services/api';
import { normalizeErrors } from '../utils/normalizeErrors';
import AddGlobalAlertModal from "../components/AddGlobalAlertModal";

interface FileAssociation {
  id: number;
  algo: string;
  group?: string;
  interval: string;
}

interface GlobalAlert {
  file_association_id: number;
  id: number;
  file_name: string;
  symbol_interval: string;
  field_name: string;
  condition_type: string;
  compare_value: string;
  last_value: string;
  is_active: boolean;
}

const GlobalAlertsPage: React.FC = () => {
    const CONDITION_OPTIONS = [
        { value: "change", label: "🔄 Any Change" },
        { value: "increase", label: ">" },
        { value: "decrease", label: "<" },
        { value: "equals", label: "=" },
        { value: "threshold_cross", label: "⚡ Threshold Cross" },
    ];

    const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [csvSymInt, setCsvSymInt] = useState<string[]>([]);
    const [alerts, setAlerts] = useState<GlobalAlert[]>([]);
    const [files, setFiles] = useState<FileAssociation[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [currentAlert, setCurrentAlert] = useState<GlobalAlert | null>(null);
    const [currentFileAssociation, setCurrentFileAssociation] = useState<FileAssociation | null>(null);
    const [search, setSearch] = useState('');
    const [modalErrors, setModalErrors] = useState<Record<string, string[]> | null>(null);
    const [alertToDelete, setAlertToDelete] = useState<GlobalAlert | null>(null);
    const [loading, setLoading] = useState(true);
    const [dropdownLoading, setDropdownLoading] = useState(false); 

    useEffect(() => {
        fetchAlertsAndFiles();
    }, []);


    const fetchAlertsAndFiles = async () => {
        try {
            const [alertsData, filesData] = await Promise.all([
                apiGet<GlobalAlert[]>('/ttscanner/global-alert/all/'),
                apiGet<any[]>('/ttscanner/file-associations/')
            ]);

            const normalizedFiles: FileAssociation[] = filesData.map(f => ({
                id: f.id,
                algo: f.algo_name,
                group: f.group_name === '-- No Group --' ? '' : f.group_name,
                interval: f.interval_name,
            }));

            setAlerts(alertsData);
            setFiles(normalizedFiles);
        } catch (error) {
            console.error('Error fetching alerts or files:', error);
        } finally {
            setLoading(false);
        }
    };

    const openEditModal = (alert: GlobalAlert) => {
        setCurrentAlert(alert);
        setModalOpen(true);
        setModalErrors(null);
        setCsvSymInt([]);
        setCsvHeaders([]);
        setDropdownLoading(true);

        const matchingFile = files.find(
            f => f.id === alert.file_association_id || 
                 `${f.algo}${f.group}${f.interval}` === alert.file_name.replace('.csv', '')
        ) || null;

        setCurrentFileAssociation(matchingFile);

        if (matchingFile) {
            Promise.all([
                fetchCsvHeaders(matchingFile.id),
                fetchSymInt(matchingFile.id)
            ]).then(([headers, symInt]) => {
                setCurrentAlert(prev => prev ? {
                    ...prev,
                    symbol_interval: symInt.length > 0 ? symInt[0] : '',
                    field_name: headers.length > 0 ? headers[0] : ''
                } : prev);
            }).catch(error => {
                console.error('Error fetching dropdown data:', error);
            }).finally(() => {
                setDropdownLoading(false);
            });
        } else {
            setDropdownLoading(false);
        }
    };

    const fetchCsvHeaders = async (fileId: number) => {
        try {
            const headers = await apiGet<string[]>(`/ttscanner/csv-headers/${fileId}/`);
            setCsvHeaders(headers);
            console.log('Fetched headers:', headers); 
            return headers;
        } catch (error) {
            console.error("Failed to fetch CSV headers:", error);
            setCsvHeaders([]);
            return [];
        }
    };

    const fetchSymInt = async (fileId: number) => {
        try {
            const symbol_interval = await apiGet<string[]>(`/ttscanner/sym-int/${fileId}/`);
            setCsvSymInt(symbol_interval);
            console.log('Fetched symInt:', symbol_interval);
            return symbol_interval;
        } catch (err) {
            console.error("Failed to fetch Symbol/Interval:", err);
            setCsvSymInt([]);
            return [];
        }
    };

    const closeModal = () => {
        setModalOpen(false);
        setCurrentAlert(null);
        setCurrentFileAssociation(null);
        setModalErrors(null);
        setCsvHeaders([]); 
        setCsvSymInt([]); 
        setDropdownLoading(false);
    };

    const saveAlert = async () => {
        if (!currentAlert || !currentFileAssociation) return;

        try {
            setModalErrors(null);

            const payload = {
                symbol_interval: currentAlert.symbol_interval,
                field_name: currentAlert.field_name,
                condition_type: currentAlert.condition_type,
                compare_value: currentAlert.compare_value,
                file_association: currentFileAssociation.id,
            };

            const updated = await apiPatch(
                `/ttscanner/global-alert/update/${currentAlert.id}/`,
                payload
            );

            setAlerts(prev =>
                prev.map(a => (a.id === currentAlert.id ? { ...a, ...updated } : a))
            );

            closeModal();
        } catch (err) {
            setModalErrors(normalizeErrors(err));
            console.error('Error updating alert:', err);
        }
    };

    const filteredAlerts = alerts.filter(
        a =>
        a.file_name.toLowerCase().includes(search.toLowerCase()) ||
        a.symbol_interval.toLowerCase().includes(search.toLowerCase()) ||
        a.field_name.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return (
        <div className="flex items-center justify-center h-64 text-gray-400">
            Loading...
        </div>
    );

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Global Alerts</h1>

            <button
                onClick={() => setAddModalOpen(true)}
                className="px-4 py-2 bg-[#6b5bff] hover:bg-[#8b65ff] text-white rounded-lg transition-colors"
            >
                + Add Global Alert
            </button>

            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search Alerts..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="bg-[#111827] text-white px-2 py-1 rounded border border-white/20 w-full"
                />
            </div>

            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0B1220]">
                <table className="min-w-full divide-y divide-white/5">
                    <thead>
                        <tr className="bg-[#111827] border-b border-white/10">
                            <th className="px-3 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider sm:px-6">ID</th>
                            <th className="px-3 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider sm:px-6">File Association</th>
                            <th className="px-3 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider sm:px-6">Sym/Int</th>
                            <th className="px-3 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider sm:px-6">Field Name</th>
                            <th className="px-3 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider sm:px-6">Condition</th>
                            <th className="px-3 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider sm:px-6">Compare Value</th>
                            <th className="px-3 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider sm:px-6">Last Value</th>
                            <th className="px-3 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider sm:px-6">Status</th>
                            <th className="px-3 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider sm:px-6">Actions</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-white/5">
                        {filteredAlerts.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="px-3 py-12 text-center text-gray-400 sm:px-6">No alerts found</td>
                            </tr>
                        ) : (
                            filteredAlerts.map(alert => (
                                <tr key={alert.id} className="hover:bg-white/5">
                                    <td className="px-3 py-4 text-sm text-white sm:px-6">{alert.id}</td>
                                    <td className="px-3 py-4 text-sm text-white sm:px-6">{alert.file_name}</td>
                                    <td className="px-3 py-4 text-sm text-white sm:px-6">{alert.symbol_interval}</td>
                                    <td className="px-3 py-4 text-sm text-white sm:px-6">{alert.field_name}</td>
                                    <td className="px-3 py-4 text-sm text-white sm:px-6">{alert.condition_type}</td>
                                    <td className="px-3 py-4 text-sm text-white sm:px-6">{alert.compare_value}</td>
                                    <td className="px-3 py-4 text-sm text-white sm:px-6">{alert.last_value || '-'}</td>
                                    <td className="px-3 py-4 text-sm text-white sm:px-6">{alert.is_active ? 'Active' : 'Inactive'}</td>
                                    <td className="px-3 py-4 sm:px-6">
                                        <div className="flex justify-end space-x-2">
                                            <button
                                                onClick={() => openEditModal(alert)}
                                                className="w-7 h-7 rounded flex items-center justify-center bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
                                            >
                                                <span className="text-blue-400 text-sm">✏</span>
                                            </button>
                                            <button
                                                onClick={() => setAlertToDelete(alert)}
                                                className="w-7 h-7 rounded flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 transition-colors"
                                            >
                                                <span className="text-red-400 text-sm">🗑</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {modalOpen && currentAlert && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 px-4">
                    <div className="bg-[#111827] p-6 rounded-lg shadow-xl w-full max-w-md relative">
                        <button
                            onClick={closeModal}
                            className="absolute top-3 right-3 text-gray-400 hover:text-white text-xl"
                        >
                            ✕
                        </button>

                        <h2 className="text-xl font-bold mb-4 text-white">Edit Alert</h2>
                        <p className="mb-3 text-gray-300">ID: {currentAlert.id}</p>

                        <select
                            value={currentFileAssociation ? String(currentFileAssociation.id) : ""}
                            onChange={async e => {
                                const id = parseInt(e.target.value);
                                const selectedFile = files.find(f => f.id === id) || null;
                                setCurrentFileAssociation(selectedFile);
                                setCsvSymInt([]);
                                setCsvHeaders([]);
                                setDropdownLoading(true);

                                if (selectedFile) {
                                    const [headers, symInt] = await Promise.all([
                                        fetchCsvHeaders(selectedFile.id),
                                        fetchSymInt(selectedFile.id)
                                    ]);

                                    setCurrentAlert(prev => prev ? {
                                        ...prev,
                                        symbol_interval: symInt.length > 0 ? symInt[0] : '',
                                        field_name: headers.length > 0 ? headers[0] : ''
                                    } : prev);
                                }

                                setDropdownLoading(false);
                            }}
                            className="bg-[#1f2937] text-white px-2 py-2 rounded border border-white/20 w-full mb-3"
                        >
                            <option value="" disabled>Select File Association</option>
                            {files.map(f => (
                                <option key={f.id} value={String(f.id)}>
                                    {f.algo} {f.group ? `- ${f.group}` : ''} ({f.interval})
                                </option>
                            ))}
                        </select>

                        {dropdownLoading ? (
                            <div className="text-gray-400 mb-3">Loading Sym/Int...</div>
                        ) : csvSymInt.length === 0 ? (
                            <div className="text-red-400 mb-3">No Sym/Int available for this file</div>
                        ) : null}
                        <select
                            value={currentAlert.symbol_interval}
                            onChange={e =>
                                setCurrentAlert({ ...currentAlert, symbol_interval: e.target.value })
                            }
                            className="bg-[#1f2937] text-white px-2 py-2 rounded border border-white/20 w-full mb-3"
                            disabled={dropdownLoading || csvSymInt.length === 0}
                        >
                            <option value="">Select Sym/Int</option>
                            {csvSymInt.map(h => (
                                <option key={h} value={h}>{h}</option>
                            ))}
                        </select>

                        {dropdownLoading ? (
                            <div className="text-gray-400 mb-3">Loading Fields...</div>
                        ) : csvHeaders.length === 0 ? (
                            <div className="text-red-400 mb-3">No fields available for this file</div>
                        ) : null}
                        <select
                            value={currentAlert.field_name}
                            onChange={e =>
                                setCurrentAlert({ ...currentAlert, field_name: e.target.value })
                            }
                            className="bg-[#1f2937] text-white px-2 py-2 rounded border border-white/20 w-full mb-3"
                            disabled={dropdownLoading || csvHeaders.length === 0}
                        >
                            <option value="">Select Field</option>
                            {csvHeaders.map(h => (
                                <option key={h} value={h}>{h}</option>
                            ))}
                        </select>

                        <select
                            value={currentAlert.condition_type}
                            onChange={e =>
                                setCurrentAlert({ ...currentAlert, condition_type: e.target.value })
                            }
                            className="bg-[#1f2937] text-white px-2 py-2 rounded border border-white/20 w-full mb-3"
                        >
                            {CONDITION_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>

                        <input
                            type="text"
                            value={currentAlert.condition_type === "change" ? "" : currentAlert.compare_value}
                            onChange={e =>
                                setCurrentAlert({ ...currentAlert, compare_value: e.target.value })
                            }
                            placeholder={
                                currentAlert.condition_type === "change"
                                    ? "Not required for 'Any Change'"
                                    : "Compare Value"
                            }
                            disabled={currentAlert.condition_type === "change"}
                            className={`bg-[#1f2937] text-white px-2 py-2 rounded border border-white/20 w-full mb-4 ${
                                currentAlert.condition_type === "change" ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                        />


                        {modalErrors && (
                            <div className="mb-4 rounded-lg bg-red-500/10 p-4 text-red-400">
                                <div className="mb-2 flex items-center">
                                    <span className="mr-2 text-red-500">⚠️</span>
                                    <strong>Error:</strong>
                                </div>
                                <ul className="list-inside list-disc space-y-1">
                                    {Object.entries(modalErrors).map(([key, vals]) => (
                                        <li key={key}>
                                            <span className="font-medium">{key.charAt(0).toUpperCase() + key.slice(1)}:</span> {vals.join(", ")}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="flex justify-end space-x-2">
                            <button
                                className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded"
                                onClick={closeModal}
                            >
                                Cancel
                            </button>
                            <button
                                className="bg-[#6b5bff] hover:bg-[#8b65ff] text-white px-4 py-2 rounded"
                                onClick={saveAlert}
                                disabled={dropdownLoading}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {alertToDelete && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 px-4">
                    <div className="bg-[#111827] p-6 rounded-lg shadow-lg w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Confirm Deletion</h2>
                        <p className="mb-4 text-white">
                            Are you sure you want to delete alert ID "{alertToDelete.id}"?
                        </p>
                        <div className="flex justify-end space-x-2">
                            <button
                                className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded"
                                onClick={() => setAlertToDelete(null)}
                            >
                                Cancel
                            </button>
                            <button
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                                onClick={async () => {
                                    try {
                                        await apiDelete(`/ttscanner/global-alert/delete/${alertToDelete.id}/`);
                                        setAlerts(prev => prev.filter(a => a.id !== alertToDelete.id));
                                    } catch (err) {
                                        console.error("Delete failed:", err);
                                    } finally {
                                        setAlertToDelete(null);
                                    }
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {addModalOpen && (
                <AddGlobalAlertModal
                    files={files}
                    onClose={() => setAddModalOpen(false)}
                    onAlertAdded={(newAlert) => {
                        setAlerts(prev => [...prev, newAlert]);
                        setAddModalOpen(false);
                    }}
                />
            )}

        </div>
    );
};

export default GlobalAlertsPage;
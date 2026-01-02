import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiPatch, apiDelete } from "../services/api";
import DeleteConfirmation from "../components/DeleteConfirmation";
import ServerErrors from "../components/ServerErrors";
import { useFileAssociationData } from "../hooks/useFileAssociationData";
import { normalizeErrors } from "../utils/normalizeErrors";


interface FileRowProps {
  file: any;
  isEditing: boolean;
  editedValues: any;
  algos: string[];
  groups: string[];
  intervals: string[];
  handleChange: (field: string, value: string | null) => void;
  startEdit: (file: any) => void;
  saveEdit: () => void;
  cancelEdit: () => void;
  setFileToDelete: (file: any) => void;
}

const FileRow: React.FC<FileRowProps> = ({
  file,
  isEditing,
  editedValues,
  algos,
  groups,
  intervals,
  handleChange,
  startEdit,
  saveEdit,
  cancelEdit,
  setFileToDelete,
}) => (
  <tr key={file.id} className="hover:bg-white/5">
    <td className="px-6 py-4 text-sm text-white">
      {isEditing ? (
        <input
          type="text"
          value={editedValues.file_name ?? file.file_name}
          onChange={(e) => handleChange("file_name", e.target.value)}
          className="bg-[#111827] text-white px-2 py-1 rounded border border-white/20 w-full"
          autoFocus
        />
      ) : (
        file.file_name
      )}
    </td>

    <td className="px-6 py-4 text-sm text-white">
      {isEditing ? (
        <select
          value={editedValues.algo_name ?? file.algo_name}
          onChange={(e) => handleChange("algo_name", e.target.value)}
          className="bg-[#111827] text-white px-2 py-1 rounded border border-white/20 w-full"
        >
          {algos.map((algo) => (
            <option key={algo} value={algo}>{algo}</option>
          ))}
        </select>
      ) : (
        file.algo_name
      )}
    </td>

    <td className="px-6 py-4 text-sm text-white">
      {isEditing ? (
        <select
          value={editedValues.group_name ?? (file.group_name ?? "No Group")}
          onChange={(e) => handleChange("group_name", e.target.value)}
          className="bg-[#111827] text-white px-2 py-1 rounded border border-white/20 w-full"
        >
          <option value="No Group">No Group</option>
          {groups.map((group) => (
            <option key={group} value={group}>{group}</option>
          ))}
        </select>
      ) : (
        file.group_name ?? "No Group"
      )}
    </td>

    <td className="px-6 py-4 text-sm text-white">
      {isEditing ? (
        <select
          value={editedValues.interval_name ?? file.interval_name}
          onChange={(e) => handleChange("interval_name", e.target.value)}
          className="bg-[#111827] text-white px-2 py-1 rounded border border-white/20 w-full"
        >
          {intervals.map((interval) => (
            <option key={interval} value={interval}>{interval}</option>
          ))}
        </select>
      ) : (
        file.interval_name
      )}
    </td>

    <td className="px-6 py-4 text-sm text-white">
      {isEditing ? (
        <input
          type="text"
          value={editedValues.file_path ?? file.file_path}
          onChange={(e) => handleChange("file_path", e.target.value)}
          className="bg-[#111827] text-white px-2 py-1 rounded border border-white/20 w-full"
        />
      ) : (
        file.file_path
      )}
    </td>

    <td className="px-6 py-4">
      <div className="flex justify-end space-x-2">
        {isEditing ? (
          <>
            <button
              onClick={saveEdit}
              className="w-7 h-7 rounded flex items-center justify-center bg-green-500/10 hover:bg-green-500/20 transition-colors"
            >
              <span className="text-green-400 text-sm">✔</span>
            </button>
            <button
              onClick={cancelEdit}
              className="w-7 h-7 rounded flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 transition-colors"
            >
              <span className="text-red-400 text-sm">✖</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => startEdit(file)}
              className="w-7 h-7 rounded flex items-center justify-center bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
            >
              <span className="text-blue-400 text-sm">✏</span>
            </button>
            <button
              onClick={() => setFileToDelete(file)}
              className="w-7 h-7 rounded flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 transition-colors"
            >
              <span className="text-red-400 text-sm">🗑</span>
            </button>
          </>
        )}
      </div>
    </td>
  </tr>
);


const FileAssociations: React.FC = () => {
  const navigate = useNavigate();
  const { files, setFiles, algos, groups, intervals, loading } = useFileAssociationData();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editedValues, setEditedValues] = useState<any>({});
  const [serverErrors, setServerErrors] = useState<Record<string, string[]> | null>(null);
  const [fileToDelete, setFileToDelete] = useState<any>(null);

  const startEdit = (file: any) => {
    setEditingId(file.id);
    setEditedValues({ ...file, group_name: file.group_name ?? "No Group" });
    setServerErrors(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditedValues({});
    setServerErrors(null);
  };

  const saveEdit = async () => {
    if (editingId === null) return;

    try {
      setServerErrors(null);
      const payload = { ...editedValues };
      if (payload.group_name === "No Group") payload.group_name = null;

      if (payload.file_path) {
        const lastSlashIndex = payload.file_path.lastIndexOf("/");
        payload.file_path = payload.file_path.substring(lastSlashIndex);
      }
      console.log(payload);
      const updated = await apiPatch(`/ttscanner/file-associations/update/${editingId}/`, payload);

      setFiles(files.map(f => (f.id === editingId ? { ...f, ...updated } : f)));
      cancelEdit();
    } catch (err) {
      setServerErrors(normalizeErrors(err));
      console.error("Update failed:", err);
    }
  };


  const handleChange = (field: string, value: string | null) => {
    if (field === "file_path" && value) {
      const lastSlashIndex = value.lastIndexOf("/");
      value = value.substring(lastSlashIndex); 
    }
    setEditedValues((prev: any) => ({ ...prev, [field]: value }));
  };


  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">File Associations</h1>
      <button
        onClick={() => navigate("/create-file-association")}
        className="px-4 py-2 bg-[#6b5bff] hover:bg-[#8b65ff] text-white rounded-lg transition-colors"
      >
        + Add New File
      </button>

      {serverErrors && <ServerErrors errors={serverErrors} />}

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0B1220]">
        <div className="min-w-[800px]" >
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-[#111827] border-b border-white/10">
              <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Algo</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Group</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Interval</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">File Path</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {files.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                  No file associations found
                </td>
              </tr>
            ) : (
              files.map(file => (
                <FileRow
                  key={file.id}
                  file={file}
                  isEditing={editingId === file.id}
                  editedValues={editedValues}
                  algos={algos}
                  groups={groups}
                  intervals={intervals}
                  handleChange={handleChange}
                  startEdit={startEdit}
                  saveEdit={saveEdit}
                  cancelEdit={cancelEdit}
                  setFileToDelete={setFileToDelete}
                />
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {fileToDelete && (
        <DeleteConfirmation
          onConfirm={async () => {
            try {
              await apiDelete(`/ttscanner/file-associations/delete/${fileToDelete.id}/`);
              setFiles(prev => prev.filter(f => f.id !== fileToDelete.id));
            } catch (err: any) {
              console.error("Delete failed:", err.data || err);
            } finally {
              setFileToDelete(null);
            }
          }}
          onCancel={() => setFileToDelete(null)}
          message={`Are you sure you want to delete "${fileToDelete.file_name}"?`}
        />
      )}
    </div>
  );
};

export default FileAssociations;

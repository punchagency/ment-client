import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiPost } from "../services/api";
import { normalizeErrors } from "../utils/normalizeErrors";

interface FileAssociation {
  id: number;
  algo: string;
  group?: string;
  interval: string;
}

const CreateFileAssociation = () => {
  const navigate = useNavigate();
  const [algo, setAlgo] = useState("");
  const [group, setGroup] = useState("");
  const [interval, setInterval] = useState("1min"); 
  const [fullPath, setFullPath] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]> | null>(null);
  const [loading, setLoading] = useState(false);

  const extractFilePath = (text: string) => {
    try {
      const url = new URL(text);
      return url.pathname;
    } catch {
      const lastSlash = text.lastIndexOf("/");
      return lastSlash !== -1 ? text.substring(lastSlash) : text;
    }
  };

  // interval validation (min, h, or daily)
  const isValidInterval = (value: string) => {
    const v = value.trim().toLowerCase();
    return /^\d+(min|h)$/.test(v) || v === "daily";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors(null);
    setLoading(true);

    if (!isValidInterval(interval)) {
      setErrors({
        interval: ["Interval must be like 1min, 5min, 1h, 4h, or daily"],
      });
      setLoading(false);
      return;
    }

    const shortPath = extractFilePath(fullPath);
    const createPayload = {
      algo_name: algo,
      group_name: group,
      interval_name: interval.trim(),
    };

    try {
      const created = await apiPost<FileAssociation>(
        "/ttscanner/file-associations/create/",
        createPayload
      );

      const newId = created.id;
      if (!newId) throw new Error("Backend did not return ID.");

      await apiPost(`/ttscanner/file-associations/upload/${newId}/`, {
        ftp_path: shortPath,
      });

      navigate("/dashboard/file-associations");
    } catch (err: any) {
      const normalized = normalizeErrors(err);
      setErrors(normalized);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-white">
        Create File Association
      </h1>

      {errors && (
        <div className="bg-red-900/30 border border-red-500 p-4 rounded-lg text-red-200">
          <h3 className="font-bold mb-2">Error</h3>
          <ul className="list-disc pl-6 space-y-1">
            {Object.entries(errors).map(([field, msgs]) => (
              <li key={field}>{msgs.join(", ")}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm text-gray-300 mb-1">
            Algo Name
          </label>
          <input
            type="text"
            value={algo}
            onChange={(e) => setAlgo(e.target.value)}
            className="w-full bg-[#111827] border border-white/20 text-white rounded-lg px-3 py-2"
            placeholder="Enter algo name"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">
            Group Name
          </label>
          <input
            type="text"
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            className="w-full bg-[#111827] border border-white/20 text-white rounded-lg px-3 py-2"
            placeholder="Enter group name"
          />
        </div>

        {/* ✅ Interval is now free input */}
        <div>
          <label className="block text-sm text-gray-300 mb-1">
            Interval
          </label>
          <input
            type="text"
            value={interval}
            onChange={(e) => setInterval(e.target.value)}
            className="w-full bg-[#111827] border border-white/20 text-white rounded-lg px-3 py-2"
            placeholder="e.g. 5min, 1h or daily"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">
            Full File Path
          </label>
          <input
            type="text"
            value={fullPath}
            onChange={(e) => setFullPath(e.target.value)}
            className="w-full bg-[#111827] border border-white/20 text-white rounded-lg px-3 py-2"
            placeholder="ftp://user@domain/path/filename.csv"
            required
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate("/dashboard/file-associations")}
            className="px-4 py-2 bg-gray-600 rounded-lg text-white hover:bg-gray-500"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-[#6b5bff] hover:bg-[#8b65ff] rounded-lg text-white disabled:opacity-50"
          >
            {loading ? "Saving..." : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateFileAssociation;

import { useState, useEffect } from "react";
import RichTextEditor from "./RichTextEditor";
import { apiPost, apiGet } from "../services/api";
import Toast from "./Toast";

type AlertType = "Email" | "SMS" | "Email & SMS";

interface Announcement {
  id: number;
  message: string;
  type: AlertType;
  created_at: string;
}

interface ToastItem {
  id: number;
  message: string;
  type?: "success" | "error";
}

export default function SendMessage() {
  const [message, setMessage] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [logs, setLogs] = useState<Announcement[]>([]);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Fetch logs
  const fetchLogs = async () => {
    try {
      const data = await apiGet<Announcement[]>("/ttscanner/announcement/log/");
      setLogs(data);
    } catch (err) {
      console.error("Error fetching announcement logs:", err);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleSend = async (type: AlertType) => {
    if (!message.trim()) {
      setStatus("⚠️ Please write an announcement before sending.");
      return;
    }
    try {
      setLoading(true);
      setStatus(`📨 Sending ${type}...`);
      const data = await apiPost<{message?: string}>("/ttscanner/announcement/send/", { message, type });
      setStatus(`✅ ${data?.message || `${type} sent successfully!`}`);
      setMessage("");
      fetchLogs();
    } catch (err: any) {
      console.error("SendMessage error:", err);
      const errorData = err.response?.data || {};
      setStatus(`❌ Error: ${errorData.detail || errorData.non_field_errors?.[0] || "Something went wrong"}`);
    } finally {
      setLoading(false);
    }
  };

  // Convert HTML to plain text
  const htmlToText = (html: string) => {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  };

  // Get first sentence for preview
  const getPreviewText = (html: string) => {
    const text = htmlToText(html);
    const match = text.match(/^(.*?[.!?])\s/);
    return match ? match[1] + "..." : text.length > 100 ? text.slice(0, 100) + "..." : text;
  };

  // Copy plain text to clipboard with toast
  const copyMessage = async (html: string) => {
    try {
      const text = htmlToText(html);
      await navigator.clipboard.writeText(text);
      setMessage(text); // optional: populate editor with copied text
      setToasts((prev) => [...prev, { id: Date.now(), message: "Message copied!", type: "success" }]);
    } catch (err) {
      console.error("Failed to copy:", err);
      setToasts((prev) => [...prev, { id: Date.now(), message: "Failed to copy", type: "error" }]);
    }
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-[#0B1220] p-6">
      <div className="bg-[#141a28] border border-gray-700/40 rounded-xl shadow-2xl p-8 max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-center text-gray-100 mb-4 tracking-wide">Announcement Center</h1>
        <RichTextEditor value={message} onChange={setMessage} />
        <div className="grid grid-cols-3 gap-4 mt-5">
          <button
            disabled={loading}
            onClick={() => handleSend("Email")}
            className={`py-3 rounded-lg text-white font-semibold shadow-md transition ${loading ? "opacity-50 cursor-not-allowed" : "bg-[#5561ff] hover:bg-[#6e78ff]"}`}
          >
            Send Email
          </button>
          <button
            disabled={loading}
            onClick={() => handleSend("SMS")}
            className={`py-3 rounded-lg text-white font-semibold shadow-md transition ${loading ? "opacity-50 cursor-not-allowed" : "bg-[#0ea5e9] hover:bg-[#38bdf8]"}`}
          >
            Send SMS
          </button>
          <button
            disabled={loading}
            onClick={() => handleSend("Email & SMS")}
            className={`py-3 rounded-lg text-white font-semibold shadow-md transition ${loading ? "opacity-50 cursor-not-allowed" : "bg-[#9b59ff] hover:bg-[#b985ff]"}`}
          >
            Send Both
          </button>
        </div>
        {status && <p className="text-center text-gray-200 font-medium mt-4 text-base">{status}</p>}
      </div>

      {/* Announcement Logs */}
      <div className="bg-[#141a28] border border-gray-700/40 rounded-xl shadow-2xl p-6 mt-6 max-w-2xl w-full">
        <h2 className="text-2xl font-semibold text-gray-100 mb-4">Previous Announcements</h2>
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {logs.map((ann) => (
            <div
              key={ann.id}
              className="bg-[#1f2638] p-4 rounded-lg flex justify-between items-start hover:bg-[#2a3245] transition"
            >
              <div>
                <p className="text-gray-200 break-words">{getPreviewText(ann.message)}</p>
                <p className="text-gray-400 text-sm mt-1">{new Date(ann.created_at).toLocaleString()}</p>
              </div>
              <button
                onClick={() => copyMessage(ann.message)}
                className="ml-4 py-1 px-3 bg-[#5561ff] hover:bg-[#6e78ff] text-white rounded-lg text-sm font-medium"
              >
                Copy
              </button>
            </div>
          ))}
          {logs.length === 0 && <p className="text-gray-400 text-center">No previous announcements</p>}
        </div>
      </div>

      {/* Toasts */}
      {toasts.map((t) => (
        <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
      ))}
    </div>
  );
}

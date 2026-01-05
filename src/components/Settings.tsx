import React, { useEffect, useState } from "react";
import { fetchUserSettings, updateUserSettings } from "../services/settings";
import { getUserID } from "../services/auth";
import Toast from "../components/Toast";
import TopBar from "./TopBar";
import { useTheme } from "../context/ThemeContext";

interface SettingsData {
  alerts_enabled: boolean;
  delivery_methods: string[];
  alert_email: string | null;
  alert_phone: string | null;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+[1-9]\d{7,14}$/;

const SettingsPage: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [externalUserId, setExternalUserId] = useState<string | null>(null);
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);

  const [editingEmail, setEditingEmail] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");

  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const defaultSettings: SettingsData = {
    alerts_enabled: false,
    delivery_methods: [],
    alert_email: null,
    alert_phone: null,
  };

  useEffect(() => {
    const id = getUserID();
    setExternalUserId(id ? id.toString() : null);
  }, []);

  useEffect(() => {
    if (!externalUserId) return;

    fetchUserSettings(Number(externalUserId))
      .then((res) => {
        const data = res[0] || defaultSettings; 
        setSettings(data);
        setEmailInput(data.alert_email ?? "");
        setPhoneInput(data.alert_phone ?? "");
      })
      .finally(() => setLoading(false));
  }, [externalUserId]);

  const toggleMethod = (method: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      delivery_methods: settings.delivery_methods.includes(method)
        ? settings.delivery_methods.filter((m) => m !== method)
        : [...settings.delivery_methods, method],
    });
  };

  const saveSettings = async () => {
    if (!externalUserId || !settings) return;

    if (emailError || phoneError) {
      setToast({ text: "Fix validation errors first", type: "error" });
      return;
    }

    try {
      await updateUserSettings(Number(externalUserId), settings);
      setToast({ text: "Settings saved successfully", type: "success" });
    } catch {
      setToast({ text: "Failed to save settings", type: "error" });
    }
  };

  // Always render the layout
  return (
    <>
      <TopBar />
      <div className="max-w-6xl mx-auto px-10 py-8 space-y-10 text-gray-900 dark:text-gray-100">
        {loading && (
          <div className="text-sm text-gray-500 dark:text-gray-400">Loading settings…</div>
        )}

        {/* Use current settings or default if missing */}
        {!loading && settings && (
          <>
            {/* Theme Section */}
            <div className="bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-2xl p-7 space-y-4 animate-slide-in">
              <div>
                <h3 className="text-lg font-semibold">Theme</h3>
                <p className="text-sm text-gray-700 dark:text-gray-400 mt-0.5">
                  Select your preferred interface appearance
                </p>
              </div>
              <div className="inline-flex bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden shadow-md">
                {["dark", "light"].map((mode) => {
                  const isActive = theme === mode;
                  return (
                    <button
                      key={mode}
                      onClick={() => setTheme(mode as "light" | "dark")}
                      className={`px-6 py-2 text-sm font-medium transition relative overflow-hidden
                        ${isActive
                          ? "bg-blue-600 dark:bg-blue-500 text-white shadow-[0_0_15px_#6b5bff] dark:shadow-[0_0_15px_#4fa3ff]"
                          : "text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white hover:bg-gray-300 dark:hover:bg-gray-700"
                        }`}
                    >
                      {mode === "dark" ? "🌙 Dark" : "☀️ Light"}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Alerts Section */}
            <div className="bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-2xl p-7 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Alerts</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-400 mt-0.5">
                    Control system notifications
                  </p>
                </div>

                <button
                  onClick={() =>
                    setSettings({ ...settings, alerts_enabled: !settings.alerts_enabled })
                  }
                  className={`w-11 h-5 rounded-full transition relative ${
                    settings.alerts_enabled ? "bg-blue-600 dark:bg-blue-500" : "bg-gray-400 dark:bg-gray-700"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 transition-all w-4 h-4 rounded-full bg-white ${
                      settings.alerts_enabled ? "right-0.5" : "left-0.5"
                    }`}
                  />
                </button>
              </div>

              <div className="space-y-3">
                <p className="uppercase text-sm tracking-wider text-gray-500 dark:text-gray-400">
                  Delivery Channels
                </p>

                <div className="flex gap-2">
                  {["dashboard", "email", "sms"].map((method) => {
                    return (
                      <button
                          key={method}
                          onClick={() => toggleMethod(method)}
                          className={`px-3 py-1.5 rounded-md text-sm font-medium border transition
                            ${settings.delivery_methods.includes(method)
                              ? "bg-blue-600 dark:bg-blue-500 border-blue-500 dark:border-blue-400 text-white"
                              : "bg-gray-200 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                            }
                            hover:border-blue-400 dark:hover:border-blue-500
                          `}
                        >

                        {method.toUpperCase()}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Email & Phone Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Email */}
              <div className="bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-semibold">Email Alerts</h3>
                {!settings.alert_email && !editingEmail && (
                  <button
                    onClick={() => setEditingEmail(true)}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500"
                  >
                    + Add email
                  </button>
                )}
                {settings.alert_email && !editingEmail && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-900 dark:text-gray-100 truncate">{settings.alert_email}</span>
                    <button
                      onClick={() => setEditingEmail(true)}
                      className="text-sm text-blue-600 dark:text-blue-400"
                    >
                      Edit
                    </button>
                  </div>
                )}
                {editingEmail && (
                  <div className="flex flex-col gap-1">
                    <input
                      value={emailInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEmailInput(val);
                        setEmailError(val && !EMAIL_REGEX.test(val) ? "Invalid email format" : null);
                      }}
                      className="bg-gray-200 dark:bg-gray-800 border border-gray-400 dark:border-gray-700 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400"
                    />
                    {emailError && <p className="text-xs text-red-500">{emailError}</p>}
                    <button
                      disabled={!!emailError}
                      onClick={() => {
                        if (emailError) return;
                        setSettings({ ...settings, alert_email: emailInput });
                        setEditingEmail(false);
                      }}
                      className="text-xs text-blue-600 dark:text-blue-400 disabled:opacity-40 self-start"
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>

              {/* Phone */}
              <div className="bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-semibold">SMS Alerts</h3>
                {!settings.alert_phone && !editingPhone && (
                  <button
                    onClick={() => setEditingPhone(true)}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500"
                  >
                    + Add phone
                  </button>
                )}
                {settings.alert_phone && !editingPhone && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-900 dark:text-gray-100 truncate">{settings.alert_phone}</span>
                    <button
                      onClick={() => setEditingPhone(true)}
                      className="text-sm text-blue-600 dark:text-blue-400"
                    >
                      Edit
                    </button>
                  </div>
                )}
                {editingPhone && (
                  <div className="flex flex-col gap-1">
                    <input
                      value={phoneInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPhoneInput(val);
                        setPhoneError(val && !PHONE_REGEX.test(val) ? "Use country code e.g. +92xxxxxxxxxx" : null);
                      }}
                      className="bg-gray-200 dark:bg-gray-800 border border-gray-400 dark:border-gray-700 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400"
                    />
                    {phoneError && <p className="text-xs text-red-500">{phoneError}</p>}
                    <button
                      disabled={!!phoneError}
                      onClick={() => {
                        if (phoneError) return;
                        setSettings({ ...settings, alert_phone: phoneInput });
                        setEditingPhone(false);
                      }}
                      className="text-xs text-blue-600 dark:text-blue-400 disabled:opacity-40 self-start"
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={saveSettings}
            className="px-6 py-2 rounded-lg bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 font-medium text-sm"
          >
            Save Changes
          </button>
        </div>

        {/* Toast */}
        {toast && <Toast message={toast.text} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    </>
  );
};

export default SettingsPage;

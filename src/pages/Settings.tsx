import React, { useEffect, useState } from "react";
import { fetchUserSettings, updateUserSettings } from "../services/settings";
import { getUserID } from "../services/auth";
import Toast from "../components/Toast";
import TopBar from "../components/TopBar";
import { useTheme } from "../context/ThemeContext";

interface SettingsData {
  alerts_enabled: boolean;
  delivery_methods: string[];
  alert_email: string | null;
  alert_phone: string | null;
  color_mappings?: Record<string, string>; 
}

// Define common color blindness types
const COLOR_BLINDNESS_TYPES = [
  { id: "normal", name: "Normal Vision", description: "Original colors from CSV" },
  { id: "deuteranomaly", name: "Red-Green", description: "Most common type" },
  { id: "protanopia", name: "Red-Blind", description: "Difficulty seeing red" },
  { id: "tritanopia", name: "Blue-Yellow", description: "Difficulty seeing blue" },
  { id: "achromatopsia", name: "Monochrome", description: "Black & white only" },
  { id: "custom", name: "Custom", description: "Your own choices" }
];

// Default color alternatives for different color blindness types
const DEFAULT_COLOR_PALETTES: Record<string, Record<string, string>> = {
  normal: {
    red: "#FF0000",
    green: "#00FF00",
    blue: "#0000FF",
    yellow: "#FFFF00",
    orange: "#FFA500",
    purple: "#800080"
  },
  deuteranomaly: {
    red: "#FF6B6B",    // Bright coral
    green: "#4ECDC4",  // Teal
    blue: "#556270",   // Dark blue-gray
    yellow: "#FFD166", // Golden yellow
    orange: "#FF8C42", // Dark orange
    purple: "#6A0572"  // Deep purple
  },
  protanopia: {
    red: "#E74C3C",    // Brick red
    green: "#27AE60",  // Forest green
    blue: "#3498DB",   // Bright blue
    yellow: "#F1C40F", // Vivid yellow
    orange: "#E67E22", // Carrot orange
    purple: "#8E44AD"  // Medium purple
  },
  tritanopia: {
    red: "#E74C3C",
    green: "#2ECC71",  // Emerald green
    blue: "#9B59B6",   // Purple instead of blue
    yellow: "#F39C12", // Orange-yellow
    orange: "#D35400", // Pumpkin orange
    purple: "#5D3FD3"  // Violet blue
  },
  achromatopsia: {
    red: "#D3D3D3",    // Light gray
    green: "#A9A9A9",  // Medium gray
    blue: "#696969",   // Dark gray
    yellow: "#808080", // Medium-dark gray
    orange: "#B0B0B0", // Light-medium gray
    purple: "#505050"  // Dark gray
  },
  custom: {} // Will be filled with user's custom choices
};

// Colors that commonly appear in CSV files (you should detect these dynamically)
const COMMON_CSV_COLORS = [
  { id: "red", label: "SHORT / Negative", description: "Used for short positions or negative values" },
  { id: "green", label: "LONG / Positive", description: "Used for long positions or positive values" },
  { id: "blue", label: "NEUTRAL / Info", description: "Used for neutral or informational cells" },
  { id: "yellow", label: "WARNING / Caution", description: "Used for warnings or attention needed" },
  { id: "orange", label: "ALERT / Medium Risk", description: "Used for alerts or medium risk" },
  { id: "purple", label: "SPECIAL / Custom", description: "Used for special categories" }
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+[1-9]\d{7,14}$/;

const Settings: React.FC = () => {
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

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedColorBlindType, setSelectedColorBlindType] = useState<string>("deuteranomaly");
  const [customColorMap, setCustomColorMap] = useState<Record<string, string>>({});

  const defaultSettings: SettingsData = {
    alerts_enabled: false,
    delivery_methods: [],
    alert_email: null,
    alert_phone: null,
    color_mappings: {}
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
        
        // Load saved color mappings
        if (data.color_mappings) {
          setCustomColorMap(data.color_mappings);
        }
      })
      .finally(() => setLoading(false));
  }, [externalUserId]);

  // Get available alternatives for a specific CSV color
  const getColorAlternatives = (colorId: string) => {
    const alternatives = COLOR_BLINDNESS_TYPES.map(type => ({
      type: type.id,
      name: type.name,
      color: DEFAULT_COLOR_PALETTES[type.id][colorId] || "#CCCCCC"
    }));
    
    // Add custom color if user has chosen one
    if (customColorMap[colorId]) {
      alternatives.push({
        type: "custom",
        name: "Your Choice",
        color: customColorMap[colorId]
      });
    }
    
    return alternatives;
  };

  // Handle color selection
  const handleColorSelect = (csvColorId: string, selectedColor: string, type: string) => {
    if (type === "custom") {
      // Open color picker for custom selection
      const newColor = prompt("Enter hex color (e.g., #FF5733) or choose:", selectedColor);
      if (newColor && /^#[0-9A-F]{6}$/i.test(newColor)) {
        const updatedMap = { ...customColorMap, [csvColorId]: newColor };
        setCustomColorMap(updatedMap);
        
        // Update settings with new color mappings
        if (settings) {
          setSettings({
            ...settings,
            color_mappings: updatedMap
          });
        }
      }
    } else {
      // Use predefined color from palette
      const updatedMap = { ...customColorMap, [csvColorId]: selectedColor };
      setCustomColorMap(updatedMap);
      
      if (settings) {
        setSettings({
          ...settings,
          color_mappings: updatedMap
        });
      }
    }
  };

  // Get current display color for a CSV color
  const getCurrentColor = (colorId: string) => {
    // If user has custom mapping, use it
    if (customColorMap[colorId]) {
      return customColorMap[colorId];
    }
    
    // Otherwise use the selected color blindness type's palette
    return DEFAULT_COLOR_PALETTES[selectedColorBlindType][colorId] || 
           DEFAULT_COLOR_PALETTES.normal[colorId];
  };

  // Apply a color blindness preset
  const applyColorBlindPreset = (presetId: string) => {
    setSelectedColorBlindType(presetId);
    
    if (presetId !== "custom") {
      // Apply all colors from this preset
      const newMap = { ...DEFAULT_COLOR_PALETTES[presetId] };
      setCustomColorMap(newMap);
      
      if (settings) {
        setSettings({
          ...settings,
          color_mappings: newMap
        });
      }
    }
  };

  // Toggle color picker and initialize with current theme
  const toggleColorPicker = () => {
    if (!showColorPicker && (theme as string) === "colorblind") {
      // When opening, set to current theme's color blindness type
      const savedType = localStorage.getItem("colorBlindType") || "deuteranomaly";
      setSelectedColorBlindType(savedType);
    }
    setShowColorPicker(!showColorPicker);
  };

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
      // Save color blind type preference
      if ((theme as string) === "colorblind") {
        localStorage.setItem("colorBlindType", selectedColorBlindType);
      }
      
      await updateUserSettings(Number(externalUserId), settings);
      setToast({ text: "Settings saved successfully", type: "success" });
    } catch {
      setToast({ text: "Failed to save settings", type: "error" });
    }
  };

  return (
    <>
      <TopBar />
      <div className="max-w-6xl mx-auto px-10 py-8 space-y-10 text-gray-900 dark:text-gray-100">
        {loading && (
          <div className="text-sm text-gray-500 dark:text-gray-400">Loading settings…</div>
        )}

        {!loading && settings && (
          <>
            {/* Theme Section */}
            <div className="bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-2xl p-7 space-y-4 animate-slide-in">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Theme</h3>
                <p className="text-sm text-gray-700 dark:text-gray-400 mt-0.5">
                  Select your preferred interface appearance
                </p>
              </div>
              <div className="inline-flex bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden shadow-md">
                {["dark", "light", "colorblind"].map((mode) => {
                const isActive = String(theme) === mode;
                const isDisabled = mode === "light" || mode === "colorblind"; 
                const tooltipText = isDisabled ? "Under development!" : "";

                return (
                  <button
                    key={mode}
                    onClick={() => !isDisabled && setTheme(mode as "light" | "dark" | "colorblind")}
                    disabled={isDisabled}
                    title={tooltipText}
                    className={`px-6 py-2 text-sm font-medium transition relative overflow-hidden
                      ${isActive
                        ? "bg-blue-600 dark:bg-blue-500 text-white shadow-[0_0_15px_#6b5bff] dark:shadow-[0_0_15px_#4fa3ff]"
                        : "text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white hover:bg-gray-300 dark:hover:bg-gray-700"
                      }
                      ${isDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
                    `}
                  >
                    {mode === "dark" ? "🌙 Dark" : mode === "light" ? "☀️ Light" : "🌈 Color Blind"}
                  </button>
                );
              })}
              </div>
              
              {/* Color Picker Section (only shown for colorblind theme) */}
              {(theme as string) === "colorblind" && (
                <div className="mt-6 pt-6 border-t border-gray-300 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100">
                        Color Accessibility Settings
                      </h4>
                      <p className="text-sm text-gray-700 dark:text-gray-400 mt-0.5">
                        Choose colors that work best for your vision
                      </p>
                    </div>
                    <button
                      onClick={toggleColorPicker}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                    >
                      {showColorPicker ? "Hide Settings" : "Customize Colors"}
                    </button>
                  </div>
                  
                  {showColorPicker && (
                    <div className="space-y-6">
                      {/* Color Blindness Type Selection */}
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          Color Vision Type
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {COLOR_BLINDNESS_TYPES.map((type) => (
                            <button
                              key={type.id}
                              onClick={() => applyColorBlindPreset(type.id)}
                              className={`px-4 py-2 rounded-lg text-sm border transition-all ${
                                selectedColorBlindType === type.id
                                  ? "bg-blue-600 border-blue-500 text-white shadow-md"
                                  : "bg-gray-200 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700"
                              }`}
                              title={type.description}
                            >
                              {type.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Color Mapping Grid */}
                      <div className="space-y-4">
                        <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          Map CSV Colors to Your Preferred Alternatives
                        </label>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {COMMON_CSV_COLORS.map((csvColor) => {
                            const currentColor = getCurrentColor(csvColor.id);
                            const alternatives = getColorAlternatives(csvColor.id);
                            
                            return (
                              <div 
                                key={csvColor.id} 
                                className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3"
                              >
                                {/* Original CSV Color */}
                                <div className="flex items-center space-x-3">
                                  <div 
                                    className="w-10 h-10 rounded-lg border-2 border-gray-300 dark:border-gray-600 shadow-sm flex-shrink-0"
                                    style={{ backgroundColor: DEFAULT_COLOR_PALETTES.normal[csvColor.id] }}
                                    title="Original CSV color"
                                  />
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-900 dark:text-gray-100">
                                      {csvColor.label}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      {csvColor.description}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Arrow indicating transformation */}
                                <div className="flex justify-center">
                                  <span className="text-gray-400 dark:text-gray-500">↓</span>
                                </div>
                                
                                {/* Current Selected Color (Large) */}
                                <div className="space-y-2">
                                  <div className="text-center">
                                    <div 
                                      className="w-16 h-16 rounded-lg mx-auto border-2 border-gray-300 dark:border-gray-600 shadow-lg cursor-pointer hover:scale-105 transition-transform"
                                      style={{ backgroundColor: currentColor }}
                                      onClick={() => handleColorSelect(csvColor.id, currentColor, "custom")}
                                      title="Click to choose custom color"
                                    />
                                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                      Current choice
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Alternative Options */}
                                <div className="space-y-1">
                                  <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                    Quick alternatives:
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {alternatives.slice(0, 4).map((alt) => (
                                      <button
                                        key={`${csvColor.id}-${alt.type}`}
                                        onClick={() => handleColorSelect(csvColor.id, alt.color, alt.type)}
                                        className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600 hover:scale-110 transition-transform"
                                        style={{ backgroundColor: alt.color }}
                                        title={`${alt.name}: ${alt.color}`}
                                      />
                                    ))}
                                    <button
                                      onClick={() => handleColorSelect(csvColor.id, currentColor, "custom")}
                                      className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600 flex items-center justify-center text-xs hover:bg-gray-200 dark:hover:bg-gray-700"
                                      title="Choose custom color"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* Preview Section */}
                        <div className="mt-6 pt-4 border-t border-gray-300 dark:border-gray-700">
                          <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                            Preview of Your Choices
                          </h5>
                          <div className="flex flex-wrap gap-2">
                            {COMMON_CSV_COLORS.slice(0, 4).map((color) => (
                              <div
                                key={`preview-${color.id}`}
                                className="px-3 py-2 rounded-lg text-sm font-medium shadow-sm"
                                style={{ 
                                  backgroundColor: getCurrentColor(color.id),
                                  color: "#000" // You might want to calculate contrast color
                                }}
                              >
                                {color.label}
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            These colors will replace the original CSV colors in all data tables
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Alerts Section */}
            <div className="bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-2xl p-7 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Alerts</h3>
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
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Email Alerts</h3>
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
                      className="bg-gray-200 dark:bg-gray-800 border border-gray-400 dark:border-gray-700 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 text-gray-900 dark:text-gray-100"
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
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">SMS Alerts</h3>
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
                      className="bg-gray-200 dark:bg-gray-800 border border-gray-400 dark:border-gray-700 rounded-md px-3 py 1.5 text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 text-gray-900 dark:text-gray-100"
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
            className="px-6 py-2 rounded-lg bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 font-medium text-sm text-white transition-colors"
          >
            Save Changes
          </button>
        </div>

        {toast && <Toast message={toast.text} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    </>
  );
};

export default Settings;
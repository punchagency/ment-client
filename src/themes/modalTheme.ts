// themes/modalTheme.ts - Make sure this exists
export interface ModalTheme {
  background: string;
  text: string;
  textSecondary: string;
  border: string;
  inputBg: string;
  inputBorder: string;
  inputText: string;
  headerBg: string;
  headerText: string;
  buttonPrimaryBg: string;
  buttonPrimaryHover: string;
  buttonSecondaryBg: string;
  buttonSecondaryText: string;
  buttonSecondaryHover: string;
  errorBg: string;
  errorBorder: string;
  errorText: string;
}

export const lightModalTheme: ModalTheme = {
  background: "#ffffff",
  text: "#111827",
  textSecondary: "#6b7280",
  border: "#d1d5db",
  inputBg: "#f9fafb",
  inputBorder: "#d1d5db",
  inputText: "#111827",
  headerBg: "#164e63",
  headerText: "#f9fafb",
  buttonPrimaryBg: "#6b5bff",
  buttonPrimaryHover: "#8b65ff",
  buttonSecondaryBg: "#e5e7eb",
  buttonSecondaryText: "#374151",
  buttonSecondaryHover: "#d1d5db",
  errorBg: "rgba(239, 68, 68, 0.1)",
  errorBorder: "#fca5a5",
  errorText: "#991b1b",
};

export const darkModalTheme: ModalTheme = {
  background: "#111827",
  text: "#f9fafb",
  textSecondary: "#9ca3af",
  border: "#374151",
  inputBg: "#1f2937",
  inputBorder: "#4b5563",
  inputText: "#f9fafb",
  headerBg: "#1f2937",
  headerText: "#e5e7eb",
  buttonPrimaryBg: "#6b5bff",
  buttonPrimaryHover: "#8b65ff",
  buttonSecondaryBg: "#4b5563",
  buttonSecondaryText: "#f9fafb",
  buttonSecondaryHover: "#6b7280",
  errorBg: "rgba(239, 68, 68, 0.2)",
  errorBorder: "#dc2626",
  errorText: "#fca5a5",
};
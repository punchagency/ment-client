// src/config/tableTheme.ts
export interface TableTheme {
  headerBg: string;
  headerText: string;
  rowBg: string;
  rowText: string;
  rowHoverBg: string;
  borderColor: string;
}

// Light mode (optional, you can keep your previous colors)
export const lightTheme: TableTheme = {
  headerBg: "#333333",
  headerText: "#f8f8f8",
  rowBg: "#ffffff",
  rowText: "#111111",
  rowHoverBg: "#f2f2f2",
  borderColor: "#ccc",
};

// Dark mode (matches your app's current dark styling)
export const darkTheme: TableTheme = {
  headerBg: "#111827",     // dark header like UserAlertsPage
  headerText: "#ffffff",   // white text
  rowBg: "#0B1220",        // dark row background
  rowText: "#ffffff",      // white row text
  rowHoverBg: "rgba(255,255,255,0.05)", // hover like UserAlertsPage
  borderColor: "rgba(255,255,255,0.1)", // border like UserAlertsPage
};

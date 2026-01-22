export interface TableTheme {
  headerBg: string;
  headerText: string;
  rowBg: string;
  rowText: string;
  rowHoverBg: string;   
  borderColor: string;
  rowFontWeight?: "normal" | "semibold" | "bold";
}

export const lightTheme: TableTheme = {
  headerBg: "#164e63",    
  headerText: "#f9fafb", 
  rowBg: "#ffffff",
  rowText: "#111827",
  rowHoverBg: "#f3f4f6",
  borderColor: "#d1d5db",
  rowFontWeight: "semibold",
};

export const darkTheme: TableTheme = {
  headerBg: "#1f2937",
  headerText: "#e5e7eb",
  rowBg: "#111827",
  rowText: "#f9fafb",
  rowHoverBg: "#1f2937",   
  borderColor: "#374151",
};

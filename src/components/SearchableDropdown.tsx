import React from "react";
import Select from "react-select";
import { useTheme } from "../context/ThemeContext";

interface Option {
  label: string;
  value: number | null;
}

interface Props {
  options: Option[];
  value: Option | null;
  onChange: (option: Option | null) => void;
  placeholder?: string;
}

const SearchableDropdown: React.FC<Props> = ({ options, value, onChange, placeholder }) => {
  const { theme } = useTheme(); // get current theme

  // --- theme-based colors ---
  const colors = {
    dark: {
      controlBg: "#1f2937",
      controlBorder: "#374151",
      menuBg: "#1f2937",
      optionHover: "#374151",
      text: "white",
      placeholder: "#9ca3af",
    },
    light: {
      controlBg: "white",
      controlBorder: "#d1d5db",
      menuBg: "white",
      optionHover: "#e5e7eb",
      text: "black",
      placeholder: "#6b7280",
    },
  };

  const themeColors = theme === "light" ? colors.light : colors.dark;

  return (
    <Select
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder || "Select..."}
      isSearchable
      menuPortalTarget={document.body}
      getOptionLabel={(option) => option.label}
      styles={{
        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
        control: (base) => ({
          ...base,
          backgroundColor: themeColors.controlBg,
          borderColor: themeColors.controlBorder,
          color: themeColors.text,
        }),
        menu: (base) => ({
          ...base,
          backgroundColor: themeColors.menuBg,
          color: themeColors.text,
        }),
        option: (base, state) => ({
          ...base,
          backgroundColor: state.isFocused ? themeColors.optionHover : themeColors.menuBg,
          color: themeColors.text,
        }),
        singleValue: (base) => ({ ...base, color: themeColors.text }),
        input: (base) => ({ ...base, color: themeColors.text }),
        placeholder: (base) => ({ ...base, color: themeColors.placeholder }),
      }}
    />
  );
};

export default SearchableDropdown;

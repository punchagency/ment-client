import React from "react";
import Select from "react-select";

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
        control: (base) => ({ ...base, backgroundColor: "#1f2937", borderColor: "#374151", color: "white" }),
        menu: (base) => ({ ...base, backgroundColor: "#1f2937", color: "white" }),
        option: (base, state) => ({ ...base, backgroundColor: state.isFocused ? "#374151" : "#1f2937", color: "white" }),
        singleValue: (base) => ({ ...base, color: "white" }),
        input: (base) => ({ ...base, color: "white" }),
        placeholder: (base) => ({ ...base, color: "#9ca3af" }),
      }}
    />
  );
};

export default SearchableDropdown;

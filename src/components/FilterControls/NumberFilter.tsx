import React from "react";

interface Props {
  field: string;
  filters: Record<string, any>;
  setFilters: React.Dispatch<React.SetStateAction<Record<string, any>>>;
}

const NumberFilter: React.FC<Props> = ({ field, filters, setFilters }) => {
  const filter = filters[field] || { min: "", max: "" };

  const handleChange = (type: "min" | "max", value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: { ...prev[field], [type]: value === "" ? undefined : parseFloat(value) }
    }));
  };

  return (
    <div className="mb-4">
      <h3 className="text-gray-200 font-semibold">{field}</h3>
      <input
        type="number"
        placeholder="Min"
        className="w-full p-1 mb-1 text-gray-900 rounded"
        value={filter.min ?? ""}
        onChange={(e) => handleChange("min", e.target.value)}
      />
      <input
        type="number"
        placeholder="Max"
        className="w-full p-1 text-gray-900 rounded"
        value={filter.max ?? ""}
        onChange={(e) => handleChange("max", e.target.value)}
      />
    </div>
  );
};

export default NumberFilter;

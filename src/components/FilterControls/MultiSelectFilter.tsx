import React from "react";

interface Props {
  field: string;
  data: any[];
  filters: Record<string, any>;
  setFilters: React.Dispatch<React.SetStateAction<Record<string, any>>>;
}

const MultiSelectFilter: React.FC<Props> = ({ field, data, filters, setFilters }) => {
  const uniqueValues = Array.from(new Set(data.map(row => row[field]).filter(v => v !== null && v !== undefined && v !== "")));
  const selected = filters[field] || [];

  const toggleValue = (val: any) => {
    setFilters(prev => {
      const arr = prev[field] || [];
      if (arr.includes(val)) return { ...prev, [field]: arr.filter((v: any) => v !== val) };
      return { ...prev, [field]: [...arr, val] };
    });
  };

  return (
    <div className="mb-4">
      <h3 className="text-gray-200 font-semibold">{field}</h3>
      <div className="flex flex-wrap gap-2 mt-1">
        {uniqueValues.map((val) => (
          <button
            key={val}
            className={`px-2 py-1 rounded ${selected.includes(val) ? "bg-blue-500 text-white" : "bg-gray-700 text-gray-200"}`}
            onClick={() => toggleValue(val)}
          >
            {val}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MultiSelectFilter;

import React from "react";

interface Props {
  field: string;
  filters: Record<string, any>;
  setFilters: React.Dispatch<React.SetStateAction<Record<string, any>>>;
}

const BooleanFilter: React.FC<Props> = ({ field, filters, setFilters }) => {
  const value = filters[field];

  return (
    <div className="mb-4">
      <h3 className="text-gray-200 font-semibold">{field}</h3>
      <div className="flex space-x-2">
        <button
          className={`px-2 py-1 rounded ${value === true ? "bg-green-500" : "bg-gray-700 text-gray-200"}`}
          onClick={() => setFilters(prev => ({ ...prev, [field]: true }))}
        >
          True
        </button>
        <button
          className={`px-2 py-1 rounded ${value === false ? "bg-red-500" : "bg-gray-700 text-gray-200"}`}
          onClick={() => setFilters(prev => ({ ...prev, [field]: false }))}
        >
          False
        </button>
        <button
          className="px-2 py-1 rounded bg-gray-700 text-gray-200"
          onClick={() => {
            const newFilters = { ...filters };
            delete newFilters[field];
            setFilters(newFilters);
          }}
        >
          Clear
        </button>
      </div>
    </div>
  );
};

export default BooleanFilter;

import React from "react";

interface FilterSidebarProps {
  filters: Record<string, any>;
  setFilters: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  onClearFilters: () => void;
  onTargetChange: (target1?: boolean, target2?: boolean) => void;
  target1?: boolean | undefined;
  target2?: boolean | undefined;
  fileType?: "TTScanner" | "FSOptions" | "MENTFib" | null;
  setVisibleColumns?: React.Dispatch<React.SetStateAction<string[]>>;
}

const FilterFields: Record<string, { key: string; type: string; options?: string[] }[]> = {
  TTScanner: [
    { key: "Direction", type: "string", options: ["LONG", "SHORT", "FLAT"] },  //Needs Changes 
    { key: "Bars Since Entry", type: "number" },
    { key: "Target #1 Hit", type: "boolean" },
    { key: "Target #2 Hit", type: "boolean" },
    { key: "Thrust", type: "number" },
    { key: "Profit Factor", type: "number" },
    { key: "Win Rate", type: "number" },
    { key: "BulBear Shift", type: "number" },
    { key: "BulBear Rank", type: "number" },
  ],
  FSOptions: [
    { key: "Trend Dir", type: "string", options: ["Bullish", "Bearish", "BULLISH", "BEARISH"] },
    { key: "Call Level", type: "number" },
    { key: "Put Level", type: "number" },
  ],
  MENTFib: [
    { key: "Last Price", type: "number" },
    { key: "Fib Pivot Trend", type: "string", options: ["Bullish", "Bearish", "BULLISH", "BEARISH"] },
    { key: "Bull Fib Trigger Level", type: "number" },
    { key: "Bear Fib Trigger Level", type: "number" },
  ],
};

const FilterSidebar: React.FC<FilterSidebarProps> = ({
  filters,
  setFilters,
  onClearFilters,
  onTargetChange,
  target1,
  target2,
  fileType,
  setVisibleColumns,
}) => {
  if (!fileType || !FilterFields[fileType]) return <div className="text-gray-400">No filters available</div>;

  const fields = FilterFields[fileType];

  const handleStringFilterChange = (key: string, value: string) => {
    setFilters(prev => {
      const currentArr = prev[key]?.value || [];
      const newArr = currentArr.includes(value) ? currentArr.filter((v: string) => v !== value) : [...currentArr, value];
      if (newArr.length === 0) {
        const { [key]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: { type: "string", value: newArr } };
    });
  };

  const handleNumberChange = (key: string, minOrMax: "min" | "max", value: number | "") => {
    setFilters(prev => {
      const current = prev[key] || {};
      const updated = { ...current, type: "number", [minOrMax]: value === "" ? undefined : value };
      if (!updated.min && !updated.max) {
        const { [key]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: updated };
    });
  };

  const handleBooleanFilter = (key: string, val: boolean | undefined) => {
    setFilters(prev => {
      if (val === undefined) {
        const { [key]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: { type: "boolean", value: val } };
    });
  };

  return (
    <div className="h-full bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-gray-200 p-6 rounded-r-xl shadow-2xl flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white tracking-wide">Filters</h2>
        <button
          onClick={() => {
            onClearFilters();
            setVisibleColumns?.([]);
          }}
          className="text-sm px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold"
        >
          Clear All
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 pr-1">
        {fields.map(field => {
          const current = filters[field.key] || {};

          if (field.type === "string" && field.options) {
            return (
              <div key={field.key}>
                <label className="block mb-2 font-medium">{field.key}</label>
                <div className="flex gap-2 flex-wrap">
                  {field.options!.map(opt => {
                    const selected = current.value?.includes(opt);
                    return (
                      <button
                        key={opt}
                        onClick={() => handleStringFilterChange(field.key, opt)}
                        className={`px-3 py-1 rounded-full ${selected ? "bg-blue-500 text-white" : "bg-gray-800 text-gray-200"}`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          }

          if (field.type === "number") {
            return (
              <div key={field.key}>
                <label className="block mb-2 font-medium">{field.key}</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="<"
                    value={current.min ?? ""}
                    onChange={e => handleNumberChange(field.key, "min", e.target.value === "" ? "" : +e.target.value)}
                    className="w-1/2 p-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
                  />
                  <input
                    type="number"
                    placeholder=">"
                    value={current.max ?? ""}
                    onChange={e => handleNumberChange(field.key, "max", e.target.value === "" ? "" : +e.target.value)}
                    className="w-1/2 p-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
                  />
                </div>
              </div>
            );
          }

          if (field.type === "boolean") {
            const boolValMapping = ["True", "False", "All"];
            return (
              <div key={field.key}>
                <label className="block mb-2 font-medium">{field.key}</label>
                <div className="flex gap-2">
                  {boolValMapping.map(opt => {
                    const boolVal = opt === "True" ? true : opt === "False" ? false : undefined;
                    const isSelected =
                      field.key === "Target #1 Hit"
                        ? (target1 === undefined && opt === "All") || target1 === boolVal
                        : field.key === "Target #2 Hit"
                        ? (target2 === undefined && opt === "All") || target2 === boolVal
                        : (current.value === undefined && opt === "All") || current.value === boolVal;

                    return (
                      <button
                        key={opt}
                        onClick={() => {
                          if (field.key === "Target #1 Hit") {
                            onTargetChange(boolVal, target2); 
                          } else if (field.key === "Target #2 Hit") {
                            onTargetChange(target1, boolVal); 
                          } else {
                            handleBooleanFilter(field.key, boolVal); 
                          }
                        }}
                        className={`px-3 py-1 rounded-full ${isSelected ? "bg-blue-500 text-white" : "bg-gray-800 text-gray-200"}`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
};

export default FilterSidebar;

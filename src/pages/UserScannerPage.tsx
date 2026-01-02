import React, { useEffect, useState, useMemo, useRef } from "react";
import TopBar from "../components/TopBar";
import FileDataTable from "../components/FileDataTable";
import SearchableDropdown from "../components/SearchableDropdown";
import FilterSidebar from "../components/FilterSidebar";
import {
  fetchAlgos,
  fetchGroups,
  fetchIntervals,
  lookupFileAssociation,
} from "../services/fileAssociationApi";

interface Option {
  label: string;
  value: number | null;
}

interface UserScannerPageProps {
  onLogout: () => void;
}

const MAX_RETRIES = 3;

const UserScannerPage: React.FC<UserScannerPageProps> = ({ onLogout })=> {
  const [algos, setAlgos] = useState<Option[]>([]);
  const [groups, setGroups] = useState<Option[]>([]);
  const [intervals, setIntervals] = useState<Option[]>([]);

  const [selectedAlgo, setSelectedAlgo] = useState<Option | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Option | null>(null);
  const [selectedInterval, setSelectedInterval] = useState<Option | null>(null);

  const [fullTableData, setFullTableData] = useState<any[]>([]);
  const [dataVersion, setDataVersion] = useState<number>(0);
  const [currentFileId, setCurrentFileId] = useState<number | null>(null);
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);

  const [target1, setTarget1] = useState<boolean | undefined>();
  const [target2, setTarget2] = useState<boolean | undefined>();
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const sseRef = useRef<EventSource | null>(null);
  const firstLoadRef = useRef(true); 

  const fileType = useMemo(() => {
    if (!currentFileName) return null;
    if (currentFileName.includes("TTScanner")) return "TTScanner";
    if (currentFileName.includes("FSOptions")) return "FSOptions";
    if (currentFileName.includes("MENTFib")) return "MENTFib";
    return null;
  }, [currentFileName]);

  const fetchWithRetry = async (fn: () => Promise<any>, retries = MAX_RETRIES): Promise<any> => {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        return await fn();
      } catch (err) {
        if (attempt < retries - 1) await new Promise(res => setTimeout(res, 500 * (attempt + 1)));
        else throw err;
      }
    }
  };

  // Load Algos
  useEffect(() => {
    fetchWithRetry(fetchAlgos)
      .then(data => {
        const options = data.map((a: any) => ({ label: `${a.algo_name} Algo`, value: a.id }));
        setAlgos(options);
        if (options.length > 0) setSelectedAlgo(options[0]); 
      })
      .catch(console.error);
  }, []);

  // Load Groups
  useEffect(() => {
    if (!selectedAlgo) return;

    fetchWithRetry(() => fetchGroups(selectedAlgo.value!))
      .then(data => {
        const options: Option[] = [];
        data.forEach((g: any) => g.group_name && options.push({ label: g.group_name, value: g.id }));
        setGroups(options);

        if (firstLoadRef.current) {
          setSelectedGroup(options[0]); 
        } else {
          setSelectedGroup({ label: "Select Group...", value: null });
          setSelectedInterval({ label: "Select Interval...", value: null });
        }
      })
      .catch(console.error);
  }, [selectedAlgo]);

  // Load Intervals
  useEffect(() => {
    if (!selectedAlgo || !selectedGroup || selectedGroup.value == null) return;

    fetchWithRetry(() => fetchIntervals(selectedAlgo.value!, selectedGroup.value))
      .then(data => {
        const options = data.map((i: any) => ({ label: i.interval_name, value: i.id }));
        setIntervals(options);

        if (firstLoadRef.current) {
          setSelectedInterval(options.length > 0 ? options[0] : null);
          firstLoadRef.current = false; 
        } else {
          setSelectedInterval({ label: "Select Interval...", value: null });
        }
      })
      .catch(console.error);
  }, [selectedGroup, selectedAlgo]);

  useEffect(() => {
    if (!selectedAlgo || !selectedGroup || selectedGroup.value == null || !selectedInterval || selectedInterval.value == null) {
      setFullTableData([]);
      setCurrentFileId(null);
      setCurrentFileName(null);
      return;
    }

    setLoading(true);
    setFullTableData([]);
    setCurrentFileId(null);
    setCurrentFileName(null);

    if (sseRef.current) {
      sseRef.current.close();
      sseRef.current = null;
    }

    fetchWithRetry(() =>
      lookupFileAssociation(selectedAlgo.value!, selectedGroup.value!, selectedInterval.value!)
    )
      .then(lookup => {
        setCurrentFileId(lookup.file_association_id);
        console.log("Full Data Table: " + JSON.stringify(fullTableData, null, 2));
        const algoName = selectedAlgo?.label.replace(" Algo", "") || "UnknownAlgo";
        const groupName = selectedGroup?.label || "NoGroup";
        const intervalName = selectedInterval?.label || "UnknownInterval";
        setCurrentFileName(
          groupName === "No Group"
            ? `${algoName} ${intervalName} Swing Trades`
            : `${algoName} ${groupName} ${intervalName} Swing Trades`
        );
        setFullTableData(lookup.rows ?? []);
        setDataVersion(lookup.data_version ?? 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedAlgo, selectedGroup, selectedInterval]);

  // SSE for auto-update
  useEffect(() => {
    if (!currentFileId) return;

    const sse = new EventSource(`${import.meta.env.VITE_API_URL}/ttscanner/sse/${currentFileId}/`);
    sseRef.current = sse;

    sse.onmessage = event => {
      try {
        const payload = JSON.parse(event.data);
        console.log(payload);
        if (payload.data_version > dataVersion) {
          setFullTableData(payload.rows ?? []);
          setDataVersion(payload.data_version ?? 0);
        }
      } catch (err) {
        console.error("Failed to parse SSE data:", err);
      }
    };

    sse.onerror = err => {
      console.error("SSE error:", err);
      sse.close();
    };

    return () => sse.close();
  }, [currentFileId, dataVersion]);

  const handleTargetChange = (t1?: boolean, t2?: boolean) => {
    setTarget1(t1);
    setTarget2(t2);
  };

  const targetColumns = useMemo(() => {
    if (!fullTableData.length) return [];
    return Object.keys(fullTableData[0]).filter(key => key.includes("Target") && key.includes("DateTime"));
  }, [fullTableData]);

  const filteredData = useMemo(() => {
    if (!fullTableData.length) return [];

    return fullTableData.filter(row => {
      for (let i = 0; i < targetColumns.length; i++) {
        const col = targetColumns[i];
        const targetValue = [target1, target2][i];
        if (targetValue !== undefined) {
          const hasDatetime = !!row[col];
          if ((targetValue && !hasDatetime) || (!targetValue && hasDatetime)) return false;
        }
      }

      for (const key of Object.keys(filters)) {
        const filter = filters[key];
        if (!filter) continue;

        if (filter.type === "number") {
          if (filter.min !== undefined && row[key] < filter.min) return false;
          if (filter.max !== undefined && row[key] > filter.max) return false;
        }

        if (filter.type === "string") {
          if (!filter.value.includes(row[key])) return false;
        }

        if (filter.type === "boolean") {
          if (filter.value !== undefined && row[key] !== filter.value) return false;
        }
      }

      return true;
    });
  }, [fullTableData, target1, target2, filters, targetColumns]);

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans relative">
      <TopBar onLogout={onLogout}/>
      <div className="max-w-full p-5 flex flex-wrap gap-3 items-center z-10 relative">
        <label className="font-semibold">Algo:</label>
        <div className="w-64">
          <SearchableDropdown options={algos} value={selectedAlgo} onChange={setSelectedAlgo} placeholder="Select Algo..." />
        </div>
        <label className="font-semibold">Group:</label>
        <div className="w-64">
          <SearchableDropdown options={groups} value={selectedGroup} onChange={setSelectedGroup} placeholder="Select Group..." />
        </div>
        <label className="font-semibold">Interval:</label>
        <div className="w-64">
          <SearchableDropdown options={intervals} value={selectedInterval} onChange={setSelectedInterval} placeholder="Select Interval..." />
        </div>
      </div>

      <button
        onClick={() => setShowFilters(prev => !prev)}
        className="fixed top-28 right-11 z-30 p-3 bg-gray-800 rounded-full hover:bg-gray-700 shadow-lg transition-all duration-500 ease-in-out"
        title="Filters"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M6 8h12M10 12h4M14 16h-4" />
        </svg>
      </button>

      <div className={`fixed top-0 right-0 h-full w-80 bg-gray-900 shadow-2xl p-6 z-20 transition-transform duration-700 ease-[cubic-bezier(.68,-0.55,.265,1.55)] ${showFilters ? "translate-x-0" : "translate-x-full"}`}>
        <FilterSidebar
          filters={filters}
          setFilters={setFilters}
          onClearFilters={() => {
            setFilters({});
            setTarget1(undefined);
            setTarget2(undefined);
            setVisibleColumns([]);
          }}
          onTargetChange={handleTargetChange}
          target1={target1}
          target2={target2}
          fileType={fileType}
          setVisibleColumns={setVisibleColumns}
        />
      </div>

      <div className="p-5 overflow-x-auto">
        {currentFileName && (
          <div className="mb-3">
            <span className="text-yellow-400 font-semibold text-lg bg-gray-800/70 px-3 py-1 rounded-lg shadow-md">
              Viewing: {currentFileName} {loading && "(Loading...)"}
            </span>
          </div>
        )}
        {filteredData.length > 0 ? (
          <FileDataTable rows={filteredData} visibleColumns={visibleColumns} fileAssociationId={currentFileId!} fileType={fileType} />
        ) : (
          <p className="text-gray-400">{loading ? "Loading data..." : "No data available for this selection."}</p>
        )}
      </div>
    </div>
  );
};

export default UserScannerPage;

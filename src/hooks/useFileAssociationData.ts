import { useState, useEffect } from "react";
import { apiGet } from "../services/api";


interface FileAssociation {
  id: number;
  algo_name: string;
  group_name?: string;
  interval_name: string;
  file_name: string;
}

interface Algo {
  id: number;
  algo_name: string;
}

interface Group {
  id: number;
  group_name: string;
}

interface Interval {
  id: number;
  interval_name: string;
}

export const useFileAssociationData = () => {
  const [files, setFiles] = useState<any[]>([]);
  const [algos, setAlgos] = useState<string[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [intervals, setIntervals] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const loadData = async () => {
    try {
      setLoading(true);

      const filesData = await apiGet<FileAssociation[]>("/ttscanner/file-associations/");
      setFiles(filesData);

      const algoData = await apiGet<Algo[]>("/ttscanner/algos/");
      setAlgos(algoData.map(a => a.algo_name));

      const groupData = await apiGet<Group[]>("/ttscanner/groups/");
      setGroups(groupData.map(g => g.group_name));

      const intervalData = await apiGet<Interval[]>("/ttscanner/intervals/");
      setIntervals(intervalData.map(i => i.interval_name));

    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  };

  loadData();
}, []);

  return { files, setFiles, algos, groups, intervals, loading };
};

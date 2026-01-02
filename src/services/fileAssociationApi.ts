import axios from "axios";

const BASE_URL = `${import.meta.env.VITE_API_URL}/ttscanner`;

export const fetchAlgos = async () => {
  const res = await axios.get(`${BASE_URL}/algos/`);
  return res.data;
};

export const fetchGroups = async (algoId: number) => {
  const res = await axios.get(`${BASE_URL}/algos/${algoId}/groups/`);
  return res.data;
};

export const fetchIntervals = async (algoId: number, groupId: number | null) => {
  const res = await axios.get(`${BASE_URL}/algos/${algoId}/groups/${groupId ?? "none"}/intervals`);
  return res.data;
};

export const lookupFileAssociation = async (algoId: number, groupId: number | null, intervalId: number) => {
  const res = await axios.get(
    `${BASE_URL}/file-association/lookup/?algo=${algoId}&group=${groupId ?? ""}&interval=${intervalId}`
  );
  return res.data;
};


import axios from "axios"

const BASE_URL = import.meta.env.VITE_API_URL + "/ttscanner";

export const fetchUserSettings = async (userId: number) =>{
    const res = await axios.get(`${BASE_URL}/settings/${userId}/`);
    return res.data;
}

export const updateUserSettings = async (userId: number, settingsData: string) =>{
   const res = await axios.patch(`${BASE_URL}/settings/update/${userId}/`, settingsData);
    return res.data;
}

export const createUserSettings = async (userId: number) =>{
    const res = await axios.post(`${BASE_URL}/settings/create/${userId}/`);
    return res.data;
}
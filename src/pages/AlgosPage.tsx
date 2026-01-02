import React, { useState, useEffect } from 'react';
import { apiGet, apiPatch, apiPost, apiDelete } from '../services/api';
import { normalizeErrors } from '../utils/normalizeErrors';

interface Algo {
  id: number;
  algo_name: string;
}

const AlgosPage: React.FC = () => {
  const [algos, setAlgos] = useState<Algo[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentAlgo, setCurrentAlgo] = useState<Algo | null>(null);
  const [algoName, setAlgoName] = useState('');
  const [search, setSearch] = useState('');
  const [modalErrors, setModalErrors] = useState<Record<string, string[]> | null>(null);
  const [algoToDelete, setAlgoToDelete] = useState<Algo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlgos();
  }, []);

  const fetchAlgos = async () => {
    try {
      const data = await apiGet<Algo[]>('/ttscanner/algos/');
      setAlgos(data);
    } catch (error) {
      console.error('Error fetching algos:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (algo?: Algo) => {
    setCurrentAlgo(algo || null);
    setAlgoName(algo ? algo.algo_name : '');
    setModalOpen(true);
    setModalErrors(null);
  };

  const closeModal = () => {
    setModalOpen(false);
    setCurrentAlgo(null);
    setAlgoName('');
    setModalErrors(null);
  };

  const saveAlgo = async () => {
    try {
      setModalErrors(null);
      let updatedAlgo: any;
      if (currentAlgo) {
        updatedAlgo = await apiPatch(`/ttscanner/algos/update/${currentAlgo.id}/`, {
          algo_name: algoName,
        });
        setAlgos(prev =>
          prev.map(a => (a.id === currentAlgo.id ? { ...a, ...updatedAlgo } : a))
        );
      } else {
        updatedAlgo = await apiPost('/ttscanner/algos/create/', {
          algo_name: algoName,
        });
        setAlgos(prev => [...prev, updatedAlgo]);
      }
      closeModal();
    } catch (err) {
      setModalErrors(normalizeErrors(err));
      console.error('Error saving algo:', err);
    }
  };

  const filteredAlgos = algos.filter(a =>
    a.algo_name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Algos</h1>
      <button
        onClick={() => openModal()}
        className="px-4 py-2 bg-[#6b5bff] hover:bg-[#8b65ff] text-white rounded-lg transition-colors"
      >
        + Add Algo
      </button>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search Algos..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-[#111827] text-white px-2 py-1 rounded border border-white/20 w-full"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0B1220]">
        <table className="w-full">
          <thead>
            <tr className="bg-[#111827] border-b border-white/10">
              <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Algo Name</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredAlgos.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-gray-400">
                  No algos found
                </td>
              </tr>
            ) : (
              filteredAlgos.map(algo => (
                <tr key={algo.id} className="hover:bg-white/5">
                  <td className="px-6 py-4 text-sm text-white">{algo.id}</td>
                  <td className="px-6 py-4 text-sm text-white">{algo.algo_name}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => openModal(algo)}
                        className="w-7 h-7 rounded flex items-center justify-center bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
                      >
                        <span className="text-blue-400 text-sm">✏</span>
                      </button>
                      <button
                        onClick={() => setAlgoToDelete(algo)}
                        className="w-7 h-7 rounded flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 transition-colors"
                      >
                        <span className="text-red-400 text-sm">🗑</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-[#111827] p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4">
              {currentAlgo ? 'Edit Algo' : 'Add Algo'}
            </h2>
            {currentAlgo && <p className="mb-4 text-white">ID: {currentAlgo.id}</p>}
            <input
              type="text"
              value={algoName}
              onChange={e => setAlgoName(e.target.value)}
              placeholder="Enter Algo Name"
              className="bg-[#111827] text-white px-2 py-1 rounded border border-white/20 w-full mb-4"
            />
            {modalErrors && (
              <div className="p-4 bg-red-500/10 rounded-lg text-red-400 mb-4">
                {Object.entries(modalErrors).map(([key, vals]) => (
                  <div key={key}>{vals.join(', ')}</div>
                ))}
              </div>
            )}
            <div className="flex justify-end space-x-2">
              <button
                className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded"
                onClick={closeModal}
              >
                Cancel
              </button>
              <button
                className="bg-[#6b5bff] hover:bg-[#8b65ff] text-white px-4 py-2 rounded"
                onClick={() => saveAlgo()}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {algoToDelete && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-[#111827] p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4">Confirm Deletion</h2>
            <p className="mb-4 text-white">Are you sure you want to delete "{algoToDelete.algo_name}"?</p>
            <div className="flex justify-end space-x-2">
              <button
                className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded"
                onClick={() => setAlgoToDelete(null)}
              >
                Cancel
              </button>
              <button
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                onClick={async () => {
                  try {
                    await apiDelete(`/ttscanner/algos/delete/${algoToDelete.id}/`);
                    setAlgos(prev => prev.filter(a => a.id !== algoToDelete.id));
                  } catch (err) {
                    console.error("Delete failed:", err);
                  } finally {
                    setAlgoToDelete(null);
                  }
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlgosPage;
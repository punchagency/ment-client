import React, { useState, useEffect } from 'react';
import { apiGet, apiPatch, apiPost, apiDelete } from '../services/api';
import { normalizeErrors } from '../utils/normalizeErrors';

interface Interval {
  id: number;
  interval_name: string;
}

const IntervalsPage: React.FC = () => {
  const [intervals, setIntervals] = useState<Interval[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentInterval, setCurrentInterval] = useState<Interval | null>(null);
  const [intervalName, setIntervalName] = useState('');
  const [search, setSearch] = useState('');
  const [modalErrors, setModalErrors] = useState<Record<string, string[]> | null>(null);
  const [intervalToDelete, setIntervalToDelete] = useState<Interval | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIntervals();
  }, []);

  const fetchIntervals = async () => {
    try {
      const data = await apiGet<Interval[]>('/ttscanner/intervals/');
      setIntervals(data);
    } catch (error) {
      console.error('Error fetching intervals:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (interval?: Interval) => {
    setCurrentInterval(interval || null);
    setIntervalName(interval ? interval.interval_name : '');
    setModalOpen(true);
    setModalErrors(null);
  };

  const closeModal = () => {
    setModalOpen(false);
    setCurrentInterval(null);
    setIntervalName('');
    setModalErrors(null);
  };

  const saveInterval = async () => {
    try {
      setModalErrors(null);
      let updatedInterval: any;
      if (currentInterval) {
        updatedInterval = await apiPatch(`/ttscanner/intervals/update/${currentInterval.id}/`, {
          interval_name: intervalName,
        });
        setIntervals(prev =>
          prev.map(i => (i.id === currentInterval.id ? { ...i, ...updatedInterval } : i))
        );
      } else {
        updatedInterval = await apiPost('/ttscanner/intervals/create/', {
          interval_name: intervalName,
        });
        setIntervals(prev => [...prev, updatedInterval]);
      }
      closeModal();
    } catch (err) {
      setModalErrors(normalizeErrors(err));
      console.error('Error saving interval:', err);
    }
  };

  const filteredIntervals = intervals.filter(i =>
    i.interval_name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Intervals</h1>
      <button
        onClick={() => openModal()}
        className="px-4 py-2 bg-[#6b5bff] hover:bg-[#8b65ff] text-white rounded-lg transition-colors"
      >
        + Add Interval
      </button>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search Intervals..."
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
              <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Interval Name</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredIntervals.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-gray-400">
                  No intervals found
                </td>
              </tr>
            ) : (
              filteredIntervals.map(interval => (
                <tr key={interval.id} className="hover:bg-white/5">
                  <td className="px-6 py-4 text-sm text-white">{interval.id}</td>
                  <td className="px-6 py-4 text-sm text-white">{interval.interval_name}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => openModal(interval)}
                        className="w-7 h-7 rounded flex items-center justify-center bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
                      >
                        <span className="text-blue-400 text-sm">✏</span>
                      </button>
                      <button
                        onClick={() => setIntervalToDelete(interval)}
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
              {currentInterval ? 'Edit Interval' : 'Add Interval'}
            </h2>
            {currentInterval && <p className="mb-4 text-white">ID: {currentInterval.id}</p>}
            <p className="p-4 backdrop-blur-sm bg-green-500/15 border border-green-400/30 rounded-2xl shadow-md text-white font-medium text-sm mb-2">
              Use a positive number + unit (e.g., 5min, 1h) or 'daily'.
            </p>
            <input
              type="text"
              value={intervalName}
              onChange={e => setIntervalName(e.target.value)}
              placeholder="Enter Interval Name"
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
                onClick={() => saveInterval()}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {intervalToDelete && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-[#111827] p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4">Confirm Deletion</h2>
            <p className="mb-4 text-white">Are you sure you want to delete "{intervalToDelete.interval_name}"?</p>
            <div className="flex justify-end space-x-2">
              <button
                className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded"
                onClick={() => setIntervalToDelete(null)}
              >
                Cancel
              </button>
              <button
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                onClick={async () => {
                  try {
                    await apiDelete(`/ttscanner/intervals/delete/${intervalToDelete.id}/`);
                    setIntervals(prev => prev.filter(i => i.id !== intervalToDelete.id));
                  } catch (err) {
                    console.error("Delete failed:", err);
                  } finally {
                    setIntervalToDelete(null);
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

export default IntervalsPage;

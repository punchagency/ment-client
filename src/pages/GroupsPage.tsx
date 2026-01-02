import React, { useState, useEffect } from 'react';
import { apiGet, apiPatch, apiPost, apiDelete } from '../services/api';
import { normalizeErrors } from '../utils/normalizeErrors';

interface Group {
  id: number;
  group_name: string;
}

const GroupsPage: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
  const [groupName, setGroupName] = useState('');
  const [search, setSearch] = useState('');
  const [modalErrors, setModalErrors] = useState<Record<string, string[]> | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const data = await apiGet<Group[]>('/ttscanner/groups/');
      setGroups(data);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (group?: Group) => {
    setCurrentGroup(group || null);
    setGroupName(group ? group.group_name : '');
    setModalOpen(true);
    setModalErrors(null);
  };

  const closeModal = () => {
    setModalOpen(false);
    setCurrentGroup(null);
    setGroupName('');
    setModalErrors(null);
  };

  const saveGroup = async () => {
    try {
      setModalErrors(null);
      let updatedGroup: any;
      if (currentGroup) {
          updatedGroup = await apiPatch(`/ttscanner/groups/update/${currentGroup.id}/`, {
          group_name: groupName,
        });
        setGroups(prev =>
          prev.map(g => (g.id === currentGroup.id ? { ...g, ...updatedGroup } : g))
        );
      } else {
          updatedGroup = await apiPost('/ttscanner/groups/create/', {
          group_name: groupName,
        });
        setGroups(prev => [...prev, updatedGroup]);
      }
      closeModal();
    } catch (err) {
      setModalErrors(normalizeErrors(err));
      console.error('Error saving group:', err);
    }
  };

  const filteredGroups = groups.filter(g =>
    g.group_name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Groups</h1>
      <button
        onClick={() => openModal()}
        className="px-4 py-2 bg-[#6b5bff] hover:bg-[#8b65ff] text-white rounded-lg transition-colors"
      >
        + Add Group
      </button>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search Groups..."
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
              <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Group Name</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredGroups.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-gray-400">
                  No groups found
                </td>
              </tr>
            ) : (
              filteredGroups.map(group => (
                <tr key={group.id} className="hover:bg-white/5">
                  <td className="px-6 py-4 text-sm text-white">{group.id}</td>
                  <td className="px-6 py-4 text-sm text-white">{group.group_name}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => openModal(group)}
                        className="w-7 h-7 rounded flex items-center justify-center bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
                      >
                        <span className="text-blue-400 text-sm">✏</span>
                      </button>
                      <button
                        onClick={() => setGroupToDelete(group)}
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
              {currentGroup ? 'Edit Group' : 'Add Group'}
            </h2>
            {currentGroup && <p className="mb-4 text-white">ID: {currentGroup.id}</p>}
            <input
              type="text"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              placeholder="Enter Group Name"
              className="bg-[#111827] text-white px-2 py-1 rounded border border-white/20 w-full mb-4"
            />
            {modalErrors && (
              <div className="p-4 bg-red-500/10 rounded-lg text-red-400 mb-4">
                {Object.entries(modalErrors).map(([key, vals]) => (
                  <div key={key}>{key}: {vals.join(', ')}</div>
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
                onClick={() => saveGroup()}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {groupToDelete && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-[#111827] p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4">Confirm Deletion</h2>
            <p className="mb-4 text-white">Are you sure you want to delete "{groupToDelete.group_name}"?</p>
            <div className="flex justify-end space-x-2">
              <button
                className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded"
                onClick={() => setGroupToDelete(null)}
              >
                Cancel
              </button>
              <button
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                onClick={async () => {
                  try {
                    await apiDelete(`/ttscanner/groups/delete/${groupToDelete.id}/`);
                    setGroups(prev => prev.filter(g => g.id !== groupToDelete.id));
                  } catch (err) {
                    console.error("Delete failed:", err);
                  } finally {
                    setGroupToDelete(null);
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

export default GroupsPage;

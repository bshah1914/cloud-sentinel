import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserCog, Plus, Trash2, Shield, Eye, EyeOff } from 'lucide-react';
import { getUsers, createUser, deleteUser } from '../api';
import Card from '../components/Card';
import Loader from '../components/Loader';
import { useAuth } from '../auth';

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'viewer' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    getUsers().then((res) => setUsers(res.users || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreate = async () => {
    if (!newUser.username || !newUser.password) return;
    try {
      await createUser(newUser);
      setNewUser({ username: '', password: '', role: 'viewer' });
      setShowForm(false);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDelete = async (username) => {
    if (!confirm(`Delete user "${username}"?`)) return;
    try {
      await deleteUser(username);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  if (loading) return <Loader text="Loading users..." />;

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <UserCog className="w-6 h-6 text-primary" /> User Management
          </h1>
          <p className="text-text-muted text-sm mt-1">Manage users and roles (RBAC)</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark rounded-lg text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Add User
          </button>
        )}
      </motion.div>

      {error && (
        <div className="bg-red-500/15 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">{error}</div>
      )}

      {showForm && isAdmin && (
        <Card>
          <h3 className="text-sm font-semibold mb-4">Create New User</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text" placeholder="Username" value={newUser.username}
              onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
              className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary"
            />
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'} placeholder="Password" value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 pr-10 text-sm text-text focus:outline-none focus:border-primary"
              />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary cursor-pointer">
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
            <button onClick={handleCreate}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium transition-colors">
              Create
            </button>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {users.map((u, i) => (
          <motion.div key={u.username} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
            className="bg-surface-light border border-border rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary-light" />
              </div>
              <div>
                <p className="text-sm font-medium">{u.username}</p>
                <p className="text-xs text-text-muted capitalize">{u.role} {u.created ? `• Created ${new Date(u.created).toLocaleDateString()}` : ''}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                u.role === 'admin' ? 'bg-red-500/15 text-red-400' :
                u.role === 'editor' ? 'bg-amber-500/15 text-amber-400' :
                'bg-emerald-500/15 text-emerald-400'
              }`}>{u.role}</span>
              {isAdmin && u.username !== currentUser?.username && (
                <button onClick={() => handleDelete(u.username)}
                  className="p-2 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

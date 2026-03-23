import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserCog, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
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
    } catch (e) { setError(e.message); }
  };

  const handleDelete = async (username) => {
    if (!confirm(`Delete user "${username}"?`)) return;
    try { await deleteUser(username); load(); } catch (e) { setError(e.message); }
  };

  if (loading) return <Loader text="Loading users..." />;

  const isAdmin = currentUser?.role === 'admin';

  const roleColors = {
    admin: 'bg-red-500/10 text-red-400 border-red-500/15',
    editor: 'bg-amber-500/10 text-amber-400 border-amber-500/15',
    viewer: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15',
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/12 flex items-center justify-center">
              <UserCog className="w-4.5 h-4.5 text-primary-light" />
            </div>
            User Management
          </h1>
          <p className="text-text-muted text-sm mt-1.5">Manage users and roles (RBAC)</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary rounded-xl text-xs font-medium transition-all shadow-sm shadow-primary/15">
            <Plus className="w-3.5 h-3.5" /> Add User
          </button>
        )}
      </motion.div>

      {error && (
        <div className="bg-red-500/8 border border-red-500/15 rounded-xl p-3.5 text-sm text-red-400">{error}</div>
      )}

      {showForm && isAdmin && (
        <Card hover={false}>
          <h3 className="text-xs font-semibold mb-4 uppercase tracking-wider">Create New User</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input type="text" placeholder="Username" value={newUser.username}
              onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
              className="bg-surface/60 border border-border/50 rounded-xl px-3 py-2.5 text-sm text-text placeholder:text-text-muted/40 focus:outline-none focus:border-primary/40 transition-all" />
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} placeholder="Password" value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                className="w-full bg-surface/60 border border-border/50 rounded-xl px-3 py-2.5 pr-10 text-sm text-text placeholder:text-text-muted/40 focus:outline-none focus:border-primary/40 transition-all" />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text">
                {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              className="bg-surface/60 border border-border/50 rounded-xl px-3 py-2.5 text-sm text-text focus:outline-none focus:border-primary/40 cursor-pointer">
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
            <button onClick={handleCreate}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-xs font-medium transition-colors">
              Create
            </button>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {users.map((u, i) => (
          <motion.div key={u.username} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.025 }}
            className="bg-surface-light/80 border border-border/30 rounded-2xl p-4 flex items-center justify-between hover:border-border/50 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/15 to-accent/8 flex items-center justify-center border border-primary/10">
                <span className="text-sm font-bold text-primary-light uppercase">{u.username.charAt(0)}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-text">{u.username}</p>
                <p className="text-[10px] text-text-muted capitalize">{u.role} {u.created ? `\u2022 ${new Date(u.created).toLocaleDateString()}` : ''}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider border ${roleColors[u.role] || roleColors.viewer}`}>
                {u.role}
              </span>
              {isAdmin && u.username !== currentUser?.username && (
                <button onClick={() => handleDelete(u.username)}
                  className="p-2 rounded-xl text-text-muted hover:text-red-400 hover:bg-red-500/8 transition-all">
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

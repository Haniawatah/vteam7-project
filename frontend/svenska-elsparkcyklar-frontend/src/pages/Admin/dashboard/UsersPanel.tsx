import React, { useEffect, useMemo, useState } from 'react';
import { deleteUserAdmin, fetchUsersAdmin, updateUserRoleAdmin } from '../../../services/admin';

type AdminUserRow = {
  id: string;
  email: string;
  role: 'admin' | 'user';
  balance: number;
};

function coerceRole(v: any): 'admin' | 'user' {
  return v === 'admin' ? 'admin' : 'user';
}

function coerceNumber(v: any, fallback = 0): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeUser(raw: any): AdminUserRow {
  return {
    id: String(raw?.id ?? raw?._id ?? ''),
    email: String(raw?.email ?? ''),
    role: coerceRole(raw?.role ?? raw?.roll),
    balance: coerceNumber(raw?.balance ?? raw?.wallet ?? raw?.credits ?? 0, 0),
  };
}

const UsersPanel: React.FC = () => {
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<'admin' | 'user'>('user');
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchUsersAdmin();
      console.log(data, "daw")
      const list = Array.isArray(data) ? data : Array.isArray((data as any)?.data) ? (data as any).data : [];
      setRows(list.map(normalizeUser).filter((u) => u.id && u.email));
    } catch (e: any) {
      setError(e?.message ?? 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const editingUser = useMemo(() => rows.find((r) => r.id === editingId) ?? null, [rows, editingId]);

  const startEdit = (u: AdminUserRow) => {
    setEditingId(u.id);
    setEditingRole(u.role);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingRole('user');
  };

  const saveEdit = async () => {
    if (!editingUser) return;
    setBusy(true);
    setError(null);
    try {
      await updateUserRoleAdmin(editingUser.id, editingRole);
      await refresh();
      cancelEdit();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to update user');
    } finally {
      setBusy(false);
    }
  };

  const removeUser = async (u: AdminUserRow) => {
    const ok = window.confirm(`Delete user ${u.email}?`);
    if (!ok) return;

    setBusy(true);
    setError(null);
    try {
      await deleteUserAdmin(u.id);
      setRows((prev) => prev.filter((x) => x.id !== u.id));
    } catch (e: any) {
      setError(e?.message ?? 'Failed to delete user');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <h1 style={{ margin: 0 }}>Users</h1>
        <button onClick={() => void refresh()} disabled={loading || busy}>
          Refresh
        </button>
        {loading ? <span>Loading…</span> : null}
      </div>

      {error ? (
        <div className="error" style={{ marginBottom: 12 }}>
          {error}
        </div>
      ) : null}

      <table>
        <thead>
          <tr>
            <th>Email</th>
            <th>Role</th>
            <th style={{ textAlign: 'right' }}>Balance</th>
            <th style={{ width: 220 }}>Actions</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((u) => {
            const isEditing = u.id === editingId;
            return (
              <tr key={u.id}>
                <td>{u.email}</td>

                <td>
                  {isEditing ? (
                    <select value={editingRole} onChange={(e) => setEditingRole(e.target.value as any)} disabled={busy}>
                      <option value="user">customer</option>
                      <option value="admin">admin</option>
                    </select>
                  ) : (
                    <span>{u.role === 'admin' ? 'admin' : 'customer'}</span>
                  )}
                </td>

                <td style={{ textAlign: 'right' }}>{u.balance}</td>

                <td>
                  {isEditing ? (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button onClick={() => void saveEdit()} disabled={busy}>
                        Save
                      </button>
                      <button className="secondary" onClick={cancelEdit} disabled={busy}>
                        Cancel
                      </button>
                      <button className="danger" onClick={() => void removeUser(u)} disabled={busy}>
                        Delete
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => startEdit(u)} disabled={busy}>
                      Edit User
                    </button>
                  )}
                </td>
              </tr>
            );
          })}

          {!loading && rows.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ padding: 12 }}>
                No users found.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>

      <div style={{ marginTop: 12, color: 'var(--muted)', fontSize: 12 }}>
        Role update/delete needs matching backend routes.
      </div>
    </section>
  );
};

export default UsersPanel;
"use client";
import { useState, useEffect, useCallback } from "react";

const ADMIN_TOKEN = "ASHURABOSS";

interface User {
  userId: string;
  username: string;
  pin: string;
  banned: boolean;
  createdAt: string;
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [pass, setPass] = useState("");
  const [passError, setPassError] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ username: "", pin: "" });
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/users", { headers: { "x-admin-token": ADMIN_TOKEN } });
    const data = await res.json();
    setUsers(data.users ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem("ashura_admin");
    if (saved === "1") { setAuthed(true); fetchUsers(); }
  }, [fetchUsers]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pass === ADMIN_TOKEN) {
      sessionStorage.setItem("ashura_admin", "1");
      setAuthed(true);
      fetchUsers();
    } else {
      setPassError("Wrong password");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("ashura_admin");
    setAuthed(false);
  };

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 3000); };

  const banUser = async (userId: string, ban: boolean) => {
    await fetch("/api/admin/users", {
      method: "POST", headers: { "Content-Type": "application/json", "x-admin-token": ADMIN_TOKEN },
      body: JSON.stringify({ action: ban ? "ban" : "unban", userId }),
    });
    flash(ban ? "User banned" : "User unbanned");
    fetchUsers();
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("Delete this user permanently?")) return;
    await fetch("/api/admin/users", {
      method: "DELETE", headers: { "Content-Type": "application/json", "x-admin-token": ADMIN_TOKEN },
      body: JSON.stringify({ userId }),
    });
    flash("User deleted");
    fetchUsers();
  };

  const saveEdit = async () => {
    if (!editUser) return;
    await fetch("/api/admin/users", {
      method: "POST", headers: { "Content-Type": "application/json", "x-admin-token": ADMIN_TOKEN },
      body: JSON.stringify({ action: "edit", userId: editUser.userId, updates: { username: editForm.username, pin: editForm.pin } }),
    });
    setEditUser(null);
    flash("User updated");
    fetchUsers();
  };

  const filtered = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.userId.includes(search) ||
    u.pin.includes(search)
  );

  const bg = { background: "#050505" };
  const card = { background: "rgba(10,10,10,0.97)", border: "1px solid rgba(200,0,0,0.15)", borderRadius: "16px" };
  const redGlow = { color: "#cc3333", textShadow: "0 0 10px rgba(200,0,0,0.5)" };

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ ...bg, backgroundImage: "linear-gradient(rgba(200,0,0,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(200,0,0,0.04) 1px,transparent 1px)", backgroundSize: "40px 40px" }}>
        <div className="w-full max-w-xs">
          <div className="mb-8 text-center">
            <div className="mb-3 inline-flex size-14 items-center justify-center rounded-2xl" style={{ background: "linear-gradient(135deg,#8b0000,#cc0000)", boxShadow: "0 0 30px rgba(200,0,0,0.4)" }}>
              <span className="text-2xl">⚡</span>
            </div>
            <h1 className="text-xl font-black tracking-widest uppercase" style={redGlow}>ASHURA ADMIN</h1>
            <p className="text-xs text-zinc-600 mt-1">Restricted Access</p>
          </div>
          <form onSubmit={handleLogin} style={card} className="p-6 space-y-4">
            <input type="password" value={pass} onChange={(e) => setPass(e.target.value)}
              placeholder="Admin Password" autoFocus
              className="w-full rounded-xl border px-4 py-3 text-sm outline-none"
              style={{ background: "rgba(20,0,0,0.6)", borderColor: "rgba(200,0,0,0.2)", color: "#e8e8e8", caretColor: "#cc0000" }} />
            {passError && <p className="text-red-500 text-xs text-center">{passError}</p>}
            <button type="submit" className="w-full rounded-xl py-3 text-sm font-bold uppercase tracking-widest"
              style={{ background: "linear-gradient(135deg,#8b0000,#cc0000)", color: "#fff" }}>
              Enter
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ ...bg, backgroundImage: "linear-gradient(rgba(200,0,0,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(200,0,0,0.03) 1px,transparent 1px)", backgroundSize: "40px 40px" }}>
      {/* Header */}
      <div className="border-b px-6 py-4 flex items-center justify-between" style={{ borderColor: "rgba(200,0,0,0.12)", background: "rgba(8,8,8,0.98)" }}>
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg flex items-center justify-center text-sm" style={{ background: "linear-gradient(135deg,#8b0000,#cc0000)" }}>⚡</div>
          <div>
            <h1 className="text-sm font-black tracking-widest uppercase" style={redGlow}>ASHURA ADMIN</h1>
            <p className="text-xs text-zinc-600">{users.length} total users</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {msg && <span className="text-xs text-green-500 bg-green-950/30 px-3 py-1 rounded-lg">{msg}</span>}
          <button onClick={fetchUsers} className="text-xs text-zinc-500 hover:text-red-400 px-3 py-1.5 rounded-lg border transition-colors" style={{ borderColor: "rgba(200,0,0,0.15)" }}>Refresh</button>
          <button onClick={handleLogout} className="text-xs text-zinc-400 hover:text-red-400 px-3 py-1.5 rounded-lg border transition-colors" style={{ borderColor: "rgba(200,0,0,0.15)" }}>Logout</button>
        </div>
      </div>

      <div className="p-6 max-w-6xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Total Users", val: users.length, icon: "👥" },
            { label: "Active", val: users.filter((u) => !u.banned).length, icon: "✅" },
            { label: "Banned", val: users.filter((u) => u.banned).length, icon: "⛔" },
          ].map((s) => (
            <div key={s.label} style={card} className="p-4 flex items-center gap-3">
              <span className="text-2xl">{s.icon}</span>
              <div>
                <p className="text-2xl font-black" style={redGlow}>{s.val}</p>
                <p className="text-xs text-zinc-600 uppercase tracking-wider">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="mb-4">
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by username, user ID or PIN..."
            className="w-full rounded-xl border px-4 py-3 text-sm outline-none"
            style={{ background: "rgba(10,0,0,0.8)", borderColor: "rgba(200,0,0,0.15)", color: "#e8e8e8", caretColor: "#cc0000" }} />
        </div>

        {/* Table */}
        <div style={card} className="overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-zinc-600 text-sm">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-zinc-700 text-sm">No users found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(200,0,0,0.1)" }}>
                    {["User ID", "Username", "PIN", "Status", "Joined", "Actions"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-zinc-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr key={u.userId} style={{ borderBottom: "1px solid rgba(200,0,0,0.06)" }}
                      className="hover:bg-red-950/5 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-zinc-400">{u.userId}</td>
                      <td className="px-4 py-3 font-semibold text-zinc-200">{u.username}</td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-500">{u.pin}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${u.banned ? "bg-red-950/50 text-red-400" : "bg-green-950/50 text-green-400"}`}>
                          {u.banned ? "Banned" : "Active"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-600">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => { setEditUser(u); setEditForm({ username: u.username, pin: u.pin }); }}
                            className="px-2 py-1 rounded-lg text-xs font-medium border transition-colors hover:bg-blue-950/30 hover:text-blue-400 hover:border-blue-900"
                            style={{ borderColor: "rgba(200,0,0,0.15)", color: "#888" }}>Edit</button>
                          <button onClick={() => banUser(u.userId, !u.banned)}
                            className={`px-2 py-1 rounded-lg text-xs font-medium border transition-colors ${u.banned ? "hover:bg-green-950/30 hover:text-green-400 hover:border-green-900" : "hover:bg-red-950/30 hover:text-red-400 hover:border-red-900"}`}
                            style={{ borderColor: "rgba(200,0,0,0.15)", color: "#888" }}>
                            {u.banned ? "Unban" : "Ban"}
                          </button>
                          <button onClick={() => deleteUser(u.userId)}
                            className="px-2 py-1 rounded-lg text-xs font-medium border transition-colors hover:bg-red-950/40 hover:text-red-300"
                            style={{ borderColor: "rgba(200,0,0,0.15)", color: "#888" }}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div style={{ ...card, minWidth: "320px" }} className="p-6 space-y-4">
            <h2 className="font-bold text-sm uppercase tracking-widest" style={redGlow}>Edit User</h2>
            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1 block">Username</label>
              <input value={editForm.username} onChange={(e) => setEditForm((f) => ({ ...f, username: e.target.value }))}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                style={{ background: "rgba(20,0,0,0.6)", borderColor: "rgba(200,0,0,0.2)", color: "#e8e8e8" }} />
            </div>
            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1 block">New PIN (7 digits)</label>
              <input value={editForm.pin} onChange={(e) => { if (/^\d{0,7}$/.test(e.target.value)) setEditForm((f) => ({ ...f, pin: e.target.value })); }}
                className="w-full rounded-xl border px-3 py-2 text-sm font-mono tracking-widest text-center outline-none"
                style={{ background: "rgba(20,0,0,0.6)", borderColor: "rgba(200,0,0,0.2)", color: "#e8e8e8" }} />
            </div>
            <div className="flex gap-2">
              <button onClick={saveEdit} className="flex-1 rounded-xl py-2 text-sm font-bold"
                style={{ background: "linear-gradient(135deg,#8b0000,#cc0000)", color: "#fff" }}>Save</button>
              <button onClick={() => setEditUser(null)} className="flex-1 rounded-xl py-2 text-sm border text-zinc-400 hover:text-zinc-200"
                style={{ borderColor: "rgba(200,0,0,0.2)" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

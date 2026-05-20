"use client";
import { useState, useEffect, useCallback } from "react";

const ADMIN_TOKEN = "ASHURABOSS";

interface User {
  userId: string; username: string; pin: string; banned: boolean; createdAt: string;
}

type Tab = "users" | "maintenance";

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [pass, setPass] = useState("");
  const [passError, setPassError] = useState("");
  const [tab, setTab] = useState<Tab>("users");

  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ username: "", pin: "" });
  const [search, setSearch] = useState("");

  // Maintenance state
  const [maintEnabled, setMaintEnabled] = useState(false);
  const [maintMsg, setMaintMsg] = useState("");
  const [maintLoading, setMaintLoading] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const flash = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", { headers: { "x-admin-token": ADMIN_TOKEN } });
      const data = await res.json();
      setUsers(data.users ?? []);
    } catch { flash("Failed to fetch users", "error"); }
    setLoading(false);
  }, []);

  const fetchMaintenance = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/maintenance");
      const data = await res.json();
      setMaintEnabled(data.enabled ?? false);
      setMaintMsg(data.message ?? "");
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem("ashura_admin");
    if (saved === "1") { setAuthed(true); fetchUsers(); fetchMaintenance(); }
  }, [fetchUsers, fetchMaintenance]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pass === ADMIN_TOKEN) {
      sessionStorage.setItem("ashura_admin", "1");
      setAuthed(true);
      fetchUsers();
      fetchMaintenance();
    } else { setPassError("Invalid credentials"); }
  };

  const handleLogout = () => { sessionStorage.removeItem("ashura_admin"); setAuthed(false); };

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
    setEditUser(null); flash("User updated"); fetchUsers();
  };

  const saveMaintenance = async () => {
    setMaintLoading(true);
    try {
      const res = await fetch("/api/admin/maintenance", {
        method: "POST", headers: { "Content-Type": "application/json", "x-admin-token": ADMIN_TOKEN },
        body: JSON.stringify({ enabled: maintEnabled, message: maintMsg }),
      });
      if (res.ok) flash(maintEnabled ? "🔴 Maintenance mode ENABLED" : "🟢 Maintenance mode DISABLED");
      else flash("Failed to update", "error");
    } catch { flash("Network error", "error"); }
    setMaintLoading(false);
  };

  const filtered = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.userId.includes(search) || u.pin.includes(search)
  );

  // ── Login Screen ──────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div style={{ minHeight: "100vh", background: "#030303", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(200,0,0,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(200,0,0,0.04) 1px,transparent 1px)", backgroundSize: "48px 48px" }} />
        <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(180,0,0,0.1) 0%, transparent 70%)", borderRadius: "50%", filter: "blur(40px)" }} />
        <div style={{ position: "relative", width: "100%", maxWidth: "380px", padding: "0 16px" }}>
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <div style={{ display: "inline-flex", width: "64px", height: "64px", borderRadius: "20px", background: "linear-gradient(135deg,#8b0000,#cc0000)", alignItems: "center", justifyContent: "center", boxShadow: "0 0 40px rgba(200,0,0,0.5)", marginBottom: "20px", fontSize: "28px" }}>⚡</div>
            <h1 style={{ fontSize: "20px", fontWeight: 900, letterSpacing: "0.2em", textTransform: "uppercase", color: "#cc3333", textShadow: "0 0 20px rgba(200,0,0,0.5)", margin: 0 }}>ASHURA ADMIN</h1>
            <p style={{ fontSize: "12px", color: "#444", marginTop: "6px", letterSpacing: "0.1em" }}>RESTRICTED ACCESS</p>
          </div>
          <form onSubmit={handleLogin} style={{ background: "rgba(10,0,0,0.9)", border: "1px solid rgba(200,0,0,0.15)", borderRadius: "20px", padding: "32px", backdropFilter: "blur(20px)" }}>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "11px", color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "8px" }}>Admin Password</label>
              <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} autoFocus
                style={{ width: "100%", background: "rgba(20,0,0,0.8)", border: "1px solid rgba(200,0,0,0.2)", borderRadius: "12px", padding: "12px 16px", color: "#eee", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
                placeholder="Enter password…" />
            </div>
            {passError && <p style={{ color: "#ff4444", fontSize: "12px", marginBottom: "12px", textAlign: "center" }}>{passError}</p>}
            <button type="submit" style={{ width: "100%", background: "linear-gradient(135deg,#8b0000,#cc0000)", border: "none", borderRadius: "12px", padding: "13px", color: "#fff", fontSize: "13px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", boxShadow: "0 4px 24px rgba(180,0,0,0.3)" }}>
              Enter System
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────
  const s = {
    page: { minHeight: "100vh", background: "#030303", fontFamily: "'Inter', sans-serif", color: "#e0e0e0" } as React.CSSProperties,
    grid: { position: "absolute" as const, inset: 0, backgroundImage: "linear-gradient(rgba(200,0,0,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(200,0,0,0.025) 1px,transparent 1px)", backgroundSize: "48px 48px", pointerEvents: "none" as const },
    card: { background: "rgba(10,4,4,0.95)", border: "1px solid rgba(200,0,0,0.12)", borderRadius: "16px" } as React.CSSProperties,
    input: { background: "rgba(20,5,5,0.9)", border: "1px solid rgba(200,0,0,0.18)", borderRadius: "10px", padding: "11px 14px", color: "#eee", fontSize: "13px", outline: "none", width: "100%", boxSizing: "border-box" as const },
  };

  return (
    <div style={s.page}>
      <div style={s.grid} />

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: "20px", right: "20px", zIndex: 9999, background: toast.type === "success" ? "rgba(0,60,0,0.95)" : "rgba(80,0,0,0.95)", border: `1px solid ${toast.type === "success" ? "rgba(0,200,0,0.3)" : "rgba(255,80,80,0.3)"}`, borderRadius: "12px", padding: "12px 20px", fontSize: "13px", color: toast.type === "success" ? "#66ff88" : "#ff8888", boxShadow: "0 8px 32px rgba(0,0,0,0.5)", backdropFilter: "blur(12px)", animation: "fadeIn 0.2s ease" }}>
          {toast.text}
        </div>
      )}

      {/* Header */}
      <div style={{ position: "relative", borderBottom: "1px solid rgba(200,0,0,0.1)", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: "64px", background: "rgba(6,0,0,0.98)", backdropFilter: "blur(20px)", zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: "linear-gradient(135deg,#8b0000,#cc0000)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", boxShadow: "0 0 16px rgba(200,0,0,0.4)" }}>⚡</div>
          <div>
            <div style={{ fontSize: "13px", fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: "#cc3333" }}>ASHURA ADMIN</div>
            <div style={{ fontSize: "11px", color: "#444", marginTop: "1px" }}>{users.length} users registered</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button onClick={fetchUsers} style={{ background: "rgba(200,0,0,0.06)", border: "1px solid rgba(200,0,0,0.15)", borderRadius: "8px", padding: "7px 14px", color: "#888", fontSize: "12px", cursor: "pointer" }}>↻ Refresh</button>
          <button onClick={handleLogout} style={{ background: "rgba(200,0,0,0.08)", border: "1px solid rgba(200,0,0,0.2)", borderRadius: "8px", padding: "7px 14px", color: "#cc5555", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}>Logout</button>
        </div>
      </div>

      <div style={{ position: "relative", maxWidth: "1100px", margin: "0 auto", padding: "28px 24px" }}>

        {/* Stats Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "24px" }}>
          {[
            { icon: "👥", label: "Total Users", val: users.length, color: "#cc4444" },
            { icon: "🟢", label: "Active", val: users.filter(u => !u.banned).length, color: "#44cc66" },
            { icon: "⛔", label: "Banned", val: users.filter(u => u.banned).length, color: "#cc4444" },
            { icon: maintEnabled ? "🔴" : "🟢", label: "Maintenance", val: maintEnabled ? "ON" : "OFF", color: maintEnabled ? "#ff4444" : "#44cc66" },
          ].map((stat) => (
            <div key={stat.label} style={{ ...s.card, padding: "20px", display: "flex", alignItems: "center", gap: "14px" }}>
              <span style={{ fontSize: "26px" }}>{stat.icon}</span>
              <div>
                <div style={{ fontSize: "22px", fontWeight: 800, color: stat.color, lineHeight: 1 }}>{stat.val}</div>
                <div style={{ fontSize: "11px", color: "#555", marginTop: "4px", letterSpacing: "0.08em", textTransform: "uppercase" }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "4px", marginBottom: "20px", background: "rgba(10,0,0,0.6)", border: "1px solid rgba(200,0,0,0.1)", borderRadius: "12px", padding: "4px", width: "fit-content" }}>
          {(["users", "maintenance"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{ background: tab === t ? "linear-gradient(135deg,#8b0000,#cc0000)" : "transparent", border: "none", borderRadius: "9px", padding: "8px 22px", color: tab === t ? "#fff" : "#666", fontSize: "13px", fontWeight: 600, cursor: "pointer", letterSpacing: "0.05em", textTransform: "capitalize", transition: "all 0.2s" }}>
              {t === "users" ? "👥 Users" : "🔧 Maintenance"}
            </button>
          ))}
        </div>

        {/* ── USERS TAB ── */}
        {tab === "users" && (
          <>
            <div style={{ marginBottom: "14px" }}>
              <input value={search} onChange={(e) => setSearch(e.target.value)} style={s.input} placeholder="🔍  Search by username, user ID or PIN…" />
            </div>
            <div style={{ ...s.card, overflow: "hidden" }}>
              {loading ? (
                <div style={{ padding: "60px", textAlign: "center", color: "#444", fontSize: "14px" }}>Loading users…</div>
              ) : filtered.length === 0 ? (
                <div style={{ padding: "60px", textAlign: "center", color: "#444", fontSize: "14px" }}>No users found</div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(200,0,0,0.1)" }}>
                        {["User ID", "Username", "PIN", "Status", "Joined", "Actions"].map(h => (
                          <th key={h} style={{ padding: "14px 16px", textAlign: "left", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#555" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((u) => (
                        <tr key={u.userId} style={{ borderBottom: "1px solid rgba(200,0,0,0.06)" }}>
                          <td style={{ padding: "13px 16px", fontFamily: "monospace", fontSize: "12px", color: "#555" }}>{u.userId}</td>
                          <td style={{ padding: "13px 16px", fontWeight: 600, color: "#ddd" }}>{u.username}</td>
                          <td style={{ padding: "13px 16px", fontFamily: "monospace", fontSize: "12px", color: "#666" }}>{u.pin}</td>
                          <td style={{ padding: "13px 16px" }}>
                            <span style={{ padding: "3px 10px", borderRadius: "100px", fontSize: "11px", fontWeight: 700, background: u.banned ? "rgba(180,0,0,0.15)" : "rgba(0,160,60,0.12)", color: u.banned ? "#ff6666" : "#44cc77", border: `1px solid ${u.banned ? "rgba(180,0,0,0.25)" : "rgba(0,160,60,0.2)"}` }}>
                              {u.banned ? "Banned" : "Active"}
                            </span>
                          </td>
                          <td style={{ padding: "13px 16px", fontSize: "12px", color: "#555" }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                          <td style={{ padding: "13px 16px" }}>
                            <div style={{ display: "flex", gap: "6px" }}>
                              {[
                                { label: "Edit", color: "#4488ff", onClick: () => { setEditUser(u); setEditForm({ username: u.username, pin: u.pin }); } },
                                { label: u.banned ? "Unban" : "Ban", color: u.banned ? "#44cc66" : "#ff5555", onClick: () => banUser(u.userId, !u.banned) },
                                { label: "Delete", color: "#ff4444", onClick: () => deleteUser(u.userId) },
                              ].map((btn) => (
                                <button key={btn.label} onClick={btn.onClick} style={{ background: "transparent", border: `1px solid rgba(200,0,0,0.15)`, borderRadius: "7px", padding: "5px 10px", color: "#777", fontSize: "11px", cursor: "pointer", fontWeight: 600, transition: "all 0.15s" }}
                                  onMouseEnter={e => { (e.target as HTMLButtonElement).style.color = btn.color; (e.target as HTMLButtonElement).style.borderColor = btn.color; }}
                                  onMouseLeave={e => { (e.target as HTMLButtonElement).style.color = "#777"; (e.target as HTMLButtonElement).style.borderColor = "rgba(200,0,0,0.15)"; }}>
                                  {btn.label}
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── MAINTENANCE TAB ── */}
        {tab === "maintenance" && (
          <div style={{ maxWidth: "640px" }}>
            <div style={{ ...s.card, padding: "32px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "28px" }}>
                <div style={{ width: "44px", height: "44px", borderRadius: "14px", background: maintEnabled ? "linear-gradient(135deg,#8b0000,#cc0000)" : "rgba(200,0,0,0.08)", border: `1px solid ${maintEnabled ? "rgba(200,0,0,0.4)" : "rgba(200,0,0,0.15)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", transition: "all 0.3s", boxShadow: maintEnabled ? "0 0 24px rgba(200,0,0,0.4)" : "none" }}>🔧</div>
                <div>
                  <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 800, letterSpacing: "0.08em", color: "#ddd" }}>Maintenance Mode</h2>
                  <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#555" }}>Block all users with a custom message</p>
                </div>
              </div>

              {/* Toggle */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(200,0,0,0.04)", border: "1px solid rgba(200,0,0,0.1)", borderRadius: "12px", padding: "16px 20px", marginBottom: "20px" }}>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: maintEnabled ? "#ff5555" : "#888", transition: "color 0.3s" }}>{maintEnabled ? "🔴 Maintenance ACTIVE" : "🟢 Site is Live"}</div>
                  <div style={{ fontSize: "12px", color: "#444", marginTop: "3px" }}>Toggle to enable/disable maintenance mode</div>
                </div>
                <button onClick={() => setMaintEnabled(!maintEnabled)} style={{ position: "relative", width: "52px", height: "28px", borderRadius: "100px", background: maintEnabled ? "linear-gradient(135deg,#8b0000,#cc0000)" : "rgba(60,60,60,0.8)", border: "none", cursor: "pointer", transition: "background 0.3s", flexShrink: 0, boxShadow: maintEnabled ? "0 0 16px rgba(200,0,0,0.5)" : "none" }}>
                  <span style={{ position: "absolute", top: "3px", left: maintEnabled ? "26px" : "3px", width: "22px", height: "22px", borderRadius: "50%", background: "#fff", transition: "left 0.25s", boxShadow: "0 2px 6px rgba(0,0,0,0.5)" }} />
                </button>
              </div>

              {/* Message */}
              <div style={{ marginBottom: "24px" }}>
                <label style={{ fontSize: "11px", color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "10px" }}>Custom Message (shown to users)</label>
                <textarea value={maintMsg} onChange={(e) => setMaintMsg(e.target.value)} rows={4}
                  style={{ ...s.input, resize: "vertical", lineHeight: 1.6, fontFamily: "inherit" }}
                  placeholder="We are performing scheduled maintenance. We'll be back shortly…" />
                <p style={{ fontSize: "11px", color: "#444", marginTop: "6px" }}>Leave blank to show default message. Supports line breaks.</p>
              </div>

              {/* Preview box */}
              {(maintMsg || maintEnabled) && (
                <div style={{ background: "rgba(200,0,0,0.05)", border: "1px solid rgba(200,0,0,0.15)", borderRadius: "12px", padding: "16px 18px", marginBottom: "24px" }}>
                  <div style={{ fontSize: "11px", color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Preview Message</div>
                  <p style={{ margin: 0, fontSize: "13px", color: "#aaa", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{maintMsg || "We are performing scheduled maintenance.\nWe'll be back shortly."}</p>
                </div>
              )}

              <button onClick={saveMaintenance} disabled={maintLoading}
                style={{ width: "100%", background: maintEnabled ? "linear-gradient(135deg,#8b0000,#cc0000)" : "linear-gradient(135deg,#0a3d0a,#1a6b1a)", border: "none", borderRadius: "12px", padding: "14px", color: "#fff", fontSize: "13px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", cursor: maintLoading ? "not-allowed" : "pointer", opacity: maintLoading ? 0.6 : 1, boxShadow: maintEnabled ? "0 4px 24px rgba(180,0,0,0.35)" : "0 4px 24px rgba(0,100,0,0.25)", transition: "all 0.3s" }}>
                {maintLoading ? "Saving…" : maintEnabled ? "🔴 Apply — Enable Maintenance" : "🟢 Apply — Go Live"}
              </button>
            </div>

            {/* Warning card */}
            <div style={{ ...s.card, padding: "18px 22px", marginTop: "14px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
              <span style={{ fontSize: "18px", flexShrink: 0 }}>⚠️</span>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#cc8844", marginBottom: "4px" }}>Admin accounts are excluded</div>
                <div style={{ fontSize: "12px", color: "#555", lineHeight: 1.6 }}>When maintenance is active, admins logged into this panel can still access the site normally. Users will see the maintenance overlay and cannot interact with any part of the site.</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {editUser && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)" }}>
          <div style={{ ...s.card, width: "380px", padding: "32px", boxShadow: "0 24px 80px rgba(0,0,0,0.8)" }}>
            <h2 style={{ margin: "0 0 24px", fontSize: "15px", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#cc3333" }}>Edit User</h2>
            {[
              { label: "Username", key: "username", type: "text", placeholder: "Enter username" },
              { label: "New PIN (7 digits)", key: "pin", type: "text", placeholder: "0000000" },
            ].map((f) => (
              <div key={f.key} style={{ marginBottom: "16px" }}>
                <label style={{ fontSize: "11px", color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "7px" }}>{f.label}</label>
                <input type={f.type} value={editForm[f.key as keyof typeof editForm]}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (f.key === "pin" && !/^\d{0,7}$/.test(val)) return;
                    setEditForm(prev => ({ ...prev, [f.key]: val }));
                  }}
                  style={s.input} placeholder={f.placeholder} />
              </div>
            ))}
            <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
              <button onClick={saveEdit} style={{ flex: 1, background: "linear-gradient(135deg,#8b0000,#cc0000)", border: "none", borderRadius: "10px", padding: "12px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>Save</button>
              <button onClick={() => setEditUser(null)} style={{ flex: 1, background: "transparent", border: "1px solid rgba(200,0,0,0.2)", borderRadius: "10px", padding: "12px", color: "#888", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}

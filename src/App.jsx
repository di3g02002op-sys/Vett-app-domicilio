import { useState, useMemo, useEffect } from "react";

// ─── CONFIGURACIÓN GENERAL ──────────────────────────────────────────────────
const DOCTOR      = "Diego Villalobos Palacios";
const LOGO_URL    = "/logo.png"; // Archivo en carpeta /public
const SPECIES     = ["Perro", "Gato", "Ave", "Conejo", "Reptil", "Otro"];
const STATUSES    = ["Pendiente", "Confirmada", "Completada", "Cancelada"];
const SPECIES_ICO = { Perro: "🐕", Gato: "🐈", Ave: "🦜", Conejo: "🐇", Reptil: "🦎", Otro: "🐾" };
const DAYS_ES     = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const STATUS_CFG  = {
  Pendiente:  { bg: "#FFF3CD", text: "#856404", dot: "#FFC107" },
  Confirmada: { bg: "#D1E7DD", text: "#0A3622", dot: "#198754" },
  Completada: { bg: "#E2E3E5", text: "#41464B", dot: "#6C757D" },
  Cancelada:  { bg: "#F8D7DA", text: "#58151C", dot: "#DC3545" },
};

// ─── HELPERS (WhatsApp, PDF, Vacunas) ────────────────────────────────────────
function sendWhatsApp(appt, patient) {
  if (!patient?.ownerPhone) return alert("Falta el teléfono del tutor.");
  const phone = patient.ownerPhone.replace(/\D/g, "");
  const finalPhone = phone.length === 9 ? `56${phone}` : phone;
  const fechaStr = new Date(appt.date + "T12:00").toLocaleDateString("es-CL", { 
    weekday: 'long', day: 'numeric', month: 'long' 
  });
  const message = `Hola ${patient.ownerName}, le escribe el Dr. Diego Villalobos. Le recuerdo su cita para ${patient.name} este ${fechaStr} a las ${appt.time} hrs. ¡Nos vemos!`;
  window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`, "_blank");
}

function vaccStatus(nextDue) {
  if (!nextDue) return { label: "Sin fecha", color: "#6c757d", bg: "#e9ecef", dot: "#6c757d" };
  const d = Math.ceil((new Date(nextDue) - new Date()) / 864e5);
  if (d < 0) return { label: "Vencida", color: "#b91c1c", bg: "#fee2e2", dot: "#dc2626" };
  if (d <= 30) return { label: `En ${d}d`, color: "#92400e", bg: "#fef3c7", dot: "#d97706" };
  return { label: "Al día", color: "#065f46", bg: "#d1fae5", dot: "#059669" };
}

function exportPDF(patient, appts, doctor) {
  const vRows = (patient.vaccines || []).map(v =>
    `<tr><td>${v.name}</td><td>${v.lastDate || "—"}</td><td>${v.nextDue || "—"}</td></tr>`).join("");
  const hRows = (patient.history || []).map(h =>
    `<tr><td>${h.date}</td><td>${h.motivo}</td><td>${h.diagnostico || "—"}</td><td>${h.tratamiento || "—"}</td></tr>`).join("");

  const html = `<html><head><title>Ficha ${patient.name}</title><style>
    body{font-family:sans-serif; color:#1a2e1a; padding:30px;}
    h1{color:#3a7a3a; border-bottom:2px solid #3a7a3a;}
    table{width:100%; border-collapse:collapse; margin-top:15px;}
    th{background:#f2f7f0; text-align:left; padding:10px; border:1px solid #ddd;}
    td{padding:10px; border:1px solid #ddd;}
  </style></head><body>
    <h1>Ficha Médica: ${patient.name}</h1>
    <p><strong>Especie:</strong> ${patient.species} | <strong>Tutor:</strong> ${patient.ownerName}</p>
    <h2>Historial</h2><table><tr><th>Fecha</th><th>Motivo</th><th>Dx</th><th>Tto</th></tr>${hRows}</table>
    <h2>Vacunas</h2><table><tr><th>Vacuna</th><th>Aplicada</th><th>Próxima</th></tr>${vRows}</table>
  </body></html>`;
  const w = window.open("", "_blank");
  w.document.write(html); w.document.close(); setTimeout(() => w.print(), 500);
}

// ─── ESTILOS REUTILIZABLES ────────────────────────────────────────────────────
const inp = { width: "100%", padding: "10px", border: "1.5px solid #d8e8d0", borderRadius: 8, fontSize: 14, background: "#f9fdf7", boxSizing: "border-box" };
const btnG = { background: "#3a7a3a", color: "#fff", border: "none", borderRadius: 9, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" };
const btnW = { background: "#25D366", color: "#fff", border: "none", borderRadius: 9, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 };

// ─── COMPONENTES UI ──────────────────────────────────────────────────────────
function Badge({ status }) {
  const c = STATUS_CFG[status] || STATUS_CFG.Pendiente;
  return (
    <span style={{ background: c.bg, color: c.text, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 5 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot }} />{status}
    </span>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 15 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#fff", borderRadius: 18, width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "20px 25px", borderBottom: "1px solid #eee" }}>
          <h2 style={{ margin: 0, fontSize: 18, color: "#1a2e1a" }}>{title}</h2>
          <button onClick={onClose} style={{ border: "none", background: "none", fontSize: 24, cursor: "pointer", color: "#ccc" }}>×</button>
        </div>
        <div style={{ padding: 25 }}>{children}</div>
      </div>
    </div>
  );
}

// ─── APP PRINCIPAL ───────────────────────────────────────────────────────────
export default function VetApp() {
  const [tab, setTab] = useState("inicio");
  const [patients, setPatients] = useState([]);
  const [appts, setAppts] = useState([]);
  const [search, setSearch] = useState("");

  // Modales y Formularios
  const [apptModal, setApptModal] = useState(null);
  const [patModal, setPatModal] = useState(null);
  const [histPid, setHistPid] = useState(null);
  const [apptForm, setApptForm] = useState({ patientId: "", date: "", time: "", motivo: "", status: "Pendiente" });
  const [patForm, setPatForm] = useState({ name: "", species: "Perro", ownerName: "", ownerPhone: "", ownerAddress: "", notes: "" });
  const [vaccForm, setVaccForm] = useState({ name: "", lastDate: "", nextDue: "" });

  // Carga LocalStorage
  useEffect(() => {
    const p = localStorage.getItem("vet_pats_v2");
    const a = localStorage.getItem("vet_appts_v2");
    if (p) setPatients(JSON.parse(p));
    if (a) setAppts(JSON.parse(a));
  }, []);

  useEffect(() => {
    localStorage.setItem("vet_pats_v2", JSON.stringify(patients));
    localStorage.setItem("vet_appts_v2", JSON.stringify(appts));
  }, [patients, appts]);

  const today = new Date().toISOString().split("T")[0];
  const todayAppts = appts.filter(a => a.date === today && a.status !== "Cancelada");

  // Acciones
  const saveAppt = () => {
    if (!apptForm.date || !apptForm.patientId) return;
    if (apptModal === "new") setAppts([...appts, { ...apptForm, id: Date.now() }]);
    else setAppts(appts.map(a => a.id === apptModal.id ? { ...apptForm, id: a.id } : a));
    setApptModal(null);
  };

  const savePat = () => {
    if (!patForm.name || !patForm.ownerName) return;
    if (patModal === "new") setPatients([...patients, { ...patForm, id: Date.now(), history: [], vaccines: [] }]);
    else setPatients(patients.map(p => p.id === patModal.id ? { ...patForm, id: p.id } : p));
    setPatModal(null);
  };

  const addVaccine = (pid) => {
    if (!vaccForm.name) return;
    setPatients(patients.map(p => p.id === pid ? { ...p, vaccines: [...(p.vaccines || []), { ...vaccForm, id: Date.now() }] } : p));
    setVaccForm({ name: "", lastDate: "", nextDue: "" });
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", minHeight: "100vh", background: "#f0f5ef" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet" />

      {/* HEADER PERSONALIZADO CON LOGO */}
      <header style={{ background: "#1e3a1e", padding: "15px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", color: "#fff", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src={LOGO_URL} alt="Vet Logo" style={{ width: 45, height: 45, borderRadius: "50%", background: "#fff", padding: 2 }} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>VetDomicilio</div>
            <div style={{ fontSize: 10, color: "#7ec87e" }}>Méd. Vet. {DOCTOR}</div>
          </div>
        </div>
        <nav style={{ display: "flex", gap: 5 }}>
          {["inicio", "agenda", "pacientes"].map(n => (
            <button key={n} onClick={() => setTab(n)} style={{ background: tab === n ? "#3a7a3a" : "transparent", color: "#fff", border: "none", padding: "8px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", textTransform: "uppercase" }}>
              {n}
            </button>
          ))}
        </nav>
      </header>

      <main style={{ padding: 20, maxWidth: 800, margin: "0 auto" }}>
        
        {/* VISTA INICIO (RESUMEN) */}
        {tab === "inicio" && (
          <>
            <h2 style={{ color: "#1a2e1a", marginBottom: 20 }}>Visitas de Hoy 🩺</h2>
            {todayAppts.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, background: "#fff", borderRadius: 15 }}>
                <div style={{ fontSize: 40 }}>☕</div>
                <p style={{ color: "#8aaa8a" }}>No tienes citas para hoy. ¡Aprovecha de descansar!</p>
              </div>
            ) : (
              todayAppts.map(a => {
                const pt = patients.find(p => p.id === a.patientId);
                return (
                  <div key={a.id} style={{ background: "#fff", borderRadius: 15, padding: 15, marginBottom: 12, display: "flex", alignItems: "center", gap: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                    <div style={{ background: "#f2f7f0", padding: "10px", borderRadius: 10, textAlign: "center", minWidth: 50 }}>
                      <div style={{ fontWeight: 800, color: "#3a7a3a" }}>{a.time}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700 }}>{pt?.name} {SPECIES_ICO[pt?.species]}</div>
                      <div style={{ fontSize: 12, color: "#666" }}>{a.motivo}</div>
                    </div>
                    <button onClick={() => sendWhatsApp(a, pt)} style={btnW}>
                      <span>💬</span> WhatsApp
                    </button>
                  </div>
                );
              })
            )}
          </>
        )}

        {/* VISTA AGENDA */}
        {tab === "agenda" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0 }}>Calendario</h2>
              <button onClick={() => { setApptForm({ ...apptForm, date: today }); setApptModal("new"); }} style={btnG}>+ Nueva Cita</button>
            </div>
            {appts.sort((a,b) => a.date.localeCompare(b.date)).map(a => {
              const pt = patients.find(p => p.id === a.patientId);
              return (
                <div key={a.id} style={{ background: "#fff", borderRadius: 12, padding: 12, marginBottom: 8, display: "flex", alignItems: "center", gap: 10, borderLeft: `4px solid ${STATUS_CFG[a.status].dot}` }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#3a7a3a" }}>{a.date.split("-").reverse().slice(0,2).join("/")}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{pt?.name} — <span style={{ fontWeight: 400, color: "#666" }}>{a.time}</span></div>
                    <div style={{ fontSize: 12, color: "#888" }}>{a.motivo}</div>
                  </div>
                  <Badge status={a.status} />
                  <button onClick={() => setAppts(appts.filter(x => x.id !== a.id))} style={{ border: "none", background: "none", color: "#ff4d4d", cursor: "pointer" }}>🗑️</button>
                </div>
              );
            })}
          </>
        )}

        {/* VISTA PACIENTES */}
        {tab === "pacientes" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0 }}>Pacientes</h2>
              <button onClick={() => { setPatForm({ name: "", species: "Perro", ownerName: "", ownerPhone: "", ownerAddress: "", notes: "" }); setPatModal("new"); }} style={btnG}>+ Nuevo Paciente</button>
            </div>
            <input placeholder="🔍 Buscar mascota o tutor..." style={{ ...inp, marginBottom: 15 }} onChange={e => setSearch(e.target.value)} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {patients.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).map(p => (
                <div key={p.id} style={{ background: "#fff", borderRadius: 15, padding: 15, textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                  <div style={{ fontSize: 30 }}>{SPECIES_ICO[p.species]}</div>
                  <div style={{ fontWeight: 700, marginTop: 5 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: "#666", marginBottom: 10 }}>{p.ownerName}</div>
                  <div style={{ display: "flex", gap: 5 }}>
                    <button onClick={() => setHistPid(p.id)} style={{ ...btnG, flex: 1, padding: "6px", fontSize: 11 }}>Ficha</button>
                    <button onClick={() => exportPDF(p, appts, DOCTOR)} style={{ ...btnG, background: "#f0f5ef", color: "#3a7a3a", padding: "6px" }}>📄</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* MODALES */}
      {apptModal && (
        <Modal title="Agendar Cita" onClose={() => setApptModal(null)}>
          <label style={{ fontSize: 12, fontWeight: 700 }}>Mascota</label>
          <select style={{ ...inp, marginBottom: 10 }} value={apptForm.patientId} onChange={e => setApptForm({ ...apptForm, patientId: Number(e.target.value) })}>
            <option value="">Seleccionar...</option>
            {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <input type="date" style={inp} value={apptForm.date} onChange={e => setApptForm({ ...apptForm, date: e.target.value })} />
            <input type="time" style={inp} value={apptForm.time} onChange={e => setApptForm({ ...apptForm, time: e.target.value })} />
          </div>
          <input placeholder="Motivo (Vacuna, consulta...)" style={{ ...inp, marginBottom: 15 }} value={apptForm.motivo} onChange={e => setApptForm({ ...apptForm, motivo: e.target.value })} />
          <button onClick={saveAppt} style={{ ...btnG, width: "100%" }}>Guardar Cita</button>
        </Modal>
      )}

      {patModal && (
        <Modal title="Datos del Paciente" onClose={() => setPatModal(null)}>
          <input placeholder="Nombre Mascota" style={{ ...inp, marginBottom: 10 }} value={patForm.name} onChange={e => setPatForm({ ...patForm, name: e.target.value })} />
          <select style={{ ...inp, marginBottom: 10 }} value={patForm.species} onChange={e => setPatForm({ ...patForm, species: e.target.value })}>
            {SPECIES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input placeholder="Nombre del Dueño" style={{ ...inp, marginBottom: 10 }} value={patForm.ownerName} onChange={e => setPatForm({ ...patForm, ownerName: e.target.value })} />
          <input placeholder="WhatsApp (Ej: 912345678)" style={{ ...inp, marginBottom: 10 }} value={patForm.ownerPhone} onChange={e => setPatForm({ ...patForm, ownerPhone: e.target.value })} />
          <input placeholder="Dirección" style={{ ...inp, marginBottom: 10 }} value={patForm.ownerAddress} onChange={e => setPatForm({ ...patForm, ownerAddress: e.target.value })} />
          <button onClick={savePat} style={{ ...btnG, width: "100%" }}>Crear Ficha</button>
        </Modal>
      )}

      {/* MODAL HISTORIAL Y VACUNAS */}
      {histPid && (
        <Modal title={`Ficha: ${patients.find(p => p.id === histPid)?.name}`} onClose={() => setHistPid(null)}>
          <h3 style={{ fontSize: 14, color: "#3a7a3a" }}>💉 Registrar Vacuna</h3>
          <div style={{ background: "#f2f7f0", padding: 12, borderRadius: 10, marginBottom: 15 }}>
            <input placeholder="Nombre Vacuna" style={{ ...inp, marginBottom: 8 }} value={vaccForm.name} onChange={e => setVaccForm({ ...vaccForm, name: e.target.value })} />
            <div style={{ display: "flex", gap: 5 }}>
              <input type="date" style={inp} value={vaccForm.nextDue} onChange={e => setVaccForm({ ...vaccForm, nextDue: e.target.value })} />
              <button onClick={() => addVaccine(histPid)} style={btnG}>Añadir</button>
            </div>
          </div>
          <h3 style={{ fontSize: 14 }}>Historial de Vacunas</h3>
          {patients.find(p => p.id === histPid)?.vaccines?.map(v => (
            <div key={v.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "5px 0", borderBottom: "1px solid #eee" }}>
              <span>{v.name}</span>
              <span style={{ fontWeight: 700, color: "#3a7a3a" }}>Prox: {v.nextDue}</span>
            </div>
          ))}
        </Modal>
      )}
    </div>
  );
}

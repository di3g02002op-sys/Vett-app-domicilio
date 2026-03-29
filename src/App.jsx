import { useState, useMemo, useEffect } from "react";

// --- CONFIGURACIÓN Y DATOS INICIALES ---
const SPECIES_OPTIONS = ["Perro", "Gato", "Ave", "Conejo", "Reptil", "Otro"];
const STATUS_OPTIONS = ["Pendiente", "Confirmada", "Completada", "Cancelada"];
const STATUS_COLORS = {
  Pendiente: { bg: "#FFF3CD", text: "#856404", dot: "#FFC107" },
  Confirmada: { bg: "#D1E7DD", text: "#0A3622", dot: "#198754" },
  Completada: { bg: "#E2E3E5", text: "#41464B", dot: "#6C757D" },
  Cancelada: { bg: "#F8D7DA", text: "#58151C", dot: "#DC3545" },
};

const initialPatients = [
  { id: 1, name: "Tofu", species: "Gato", breed: "Siamés", age: "3", weight: "4.2", ownerName: "Valentina Rivas", ownerPhone: "9 8765 4321", ownerAddress: "Av. Providencia 456, Santiago", notes: "Alérgico a penicilina.", history: [] },
];

const initialAppointments = [
  { id: 1, patientId: 1, date: "2026-03-29", time: "10:00", motivo: "Control post-operatorio", status: "Confirmada", notes: "" },
];

// --- COMPONENTES DE UI ---
function Badge({ status }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.Pendiente;
  return (
    <span style={{ background: c.bg, color: c.text, borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5 }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: c.dot, display: "inline-block" }} />
      {status}
    </span>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(30,40,30,0.45)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 18, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "22px 28px 0" }}>
          <h2 style={{ margin: 0, fontSize: 20, color: "#1a2e1a", fontFamily: "'Lora', serif" }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#888", lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: "20px 28px 28px" }}>{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#4a6741", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</label>
      {children}
    </div>
  );
}

// --- ESTILOS REUTILIZABLES ---
const inputStyle = { width: "100%", padding: "9px 12px", border: "1.5px solid #d8e8d0", borderRadius: 8, fontSize: 14, color: "#1a2e1a", outline: "none", background: "#f9fdf7", boxSizing: "border-box" };
const btnPrimary = { background: "#3a7a3a", color: "#fff", border: "none", borderRadius: 9, padding: "10px 22px", fontSize: 14, fontWeight: 700, cursor: "pointer" };
const btnSecondary = { background: "transparent", color: "#3a7a3a", border: "1.5px solid #3a7a3a", borderRadius: 9, padding: "10px 22px", fontSize: 14, fontWeight: 700, cursor: "pointer" };

// --- COMPONENTE PRINCIPAL ---
export default function VetApp() {
  const [tab, setTab] = useState("agenda");
  const [search, setSearch] = useState("");

  // 1. ESTADOS CON PERSISTENCIA (LocalStorage)
  const [patients, setPatients] = useState(() => {
    const saved = localStorage.getItem("vet_patients");
    return saved ? JSON.parse(saved) : initialPatients;
  });

  const [appointments, setAppointments] = useState(() => {
    const saved = localStorage.getItem("vet_appointments");
    return saved ? JSON.parse(saved) : initialAppointments;
  });

  useEffect(() => {
    localStorage.setItem("vet_patients", JSON.stringify(patients));
  }, [patients]);

  useEffect(() => {
    localStorage.setItem("vet_appointments", JSON.stringify(appointments));
  }, [appointments]);

  // Modales y Formularios
  const [apptModal, setApptModal] = useState(null);
  const [patientModal, setPatientModal] = useState(null);
  const [historyModal, setHistoryModal] = useState(null);
  
  const emptyAppt = { patientId: "", date: "", time: "", motivo: "", status: "Pendiente", notes: "" };
  const emptyPatient = { name: "", species: "Perro", breed: "", age: "", weight: "", ownerName: "", ownerPhone: "", ownerAddress: "", notes: "" };
  const [apptForm, setApptForm] = useState(emptyAppt);
  const [patientForm, setPatientForm] = useState(emptyPatient);
  const [newHistEntry, setNewHistEntry] = useState({ date: new Date().toISOString().split("T")[0], motivo: "", diagnostico: "", tratamiento: "" });

  // Lógica de filtrado y búsqueda
  const sortedAppts = useMemo(() => 
    [...appointments].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)),
    [appointments]
  );

  const filteredPatients = useMemo(() =>
    patients.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) || 
      p.ownerName.toLowerCase().includes(search.toLowerCase())
    ), [patients, search]
  );

  const getPatient = (id) => patients.find(p => p.id === Number(id));

  // --- ACCIONES ---
  const saveAppt = () => {
    if (!apptForm.date || !apptForm.patientId || !apptForm.motivo) return alert("Completa los campos obligatorios");
    const data = { ...apptForm, patientId: Number(apptForm.patientId) };
    
    if (apptModal === "new") {
      setAppointments([...appointments, { ...data, id: Date.now() }]);
    } else {
      setAppointments(appointments.map(a => a.id === apptModal.id ? { ...data, id: a.id } : a));
    }
    setApptModal(null);
  };

  const savePatient = () => {
    if (!patientForm.name || !patientForm.ownerName) return alert("Nombre del paciente y dueño son obligatorios");
    
    if (patientModal === "new") {
      setPatients([...patients, { ...patientForm, id: Date.now(), history: [] }]);
    } else {
      setPatients(patients.map(p => p.id === patientModal.id ? { ...patientForm, id: p.id, history: p.history } : p));
    }
    setPatientModal(null);
  };

  const addHistory = () => {
    if (!newHistEntry.motivo) return;
    const updatedPatients = patients.map(p => 
      p.id === historyModal.id ? { ...p, history: [newHistEntry, ...p.history] } : p
    );
    setPatients(updatedPatients);
    setHistoryModal(updatedPatients.find(p => p.id === historyModal.id));
    setNewHistEntry({ date: new Date().toISOString().split("T")[0], motivo: "", diagnostico: "", tratamiento: "" });
  };

  const deleteAppt = (id) => { if(confirm("¿Eliminar cita?")) setAppointments(appointments.filter(a => a.id !== id)); };
  const deletePatient = (id) => { if(confirm("¿Eliminar ficha y citas?")) {
    setPatients(patients.filter(p => p.id !== id));
    setAppointments(appointments.filter(a => Number(a.patientId) !== id));
  }};

  const today = new Date().toISOString().split("T")[0];

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", minHeight: "100vh", background: "#f2f7f0", color: "#1a2e1a" }}>
      <link href="https://fonts.googleapis.com/css2?family=Lora:wght@600;700&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <header style={{ background: "#1e3a1e", padding: "0 28px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 62, boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 24 }}>🏥</span>
          <span style={{ color: "#fff", fontFamily: "'Lora', serif", fontSize: 18, fontWeight: 700 }}>VetDomicilio</span>
        </div>
        <nav style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setTab("agenda")} style={{ ...btnSecondary, color: "#fff", border: tab === "agenda" ? "1.5px solid #7ec87e" : "1.5px solid transparent" }}>Agenda</button>
          <button onClick={() => setTab("pacientes")} style={{ ...btnSecondary, color: "#fff", border: tab === "pacientes" ? "1.5px solid #7ec87e" : "1.5px solid transparent" }}>Pacientes</button>
        </nav>
      </header>

      <main style={{ padding: "30px 20px", maxWidth: 900, margin: "0 auto" }}>
        
        {/* --- VISTA AGENDA --- */}
        {tab === "agenda" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 25 }}>
              <h1 style={{ fontFamily: "'Lora', serif", margin: 0 }}>Próximas Visitas</h1>
              <button onClick={() => { setApptForm(emptyAppt); setApptModal("new"); }} style={btnPrimary}>+ Nueva Cita</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {sortedAppts.map(a => {
                const pt = getPatient(a.patientId);
                return (
                  <div key={a.id} style={{ background: "#fff", padding: 18, borderRadius: 15, display: "flex", alignItems: "center", gap: 20, boxShadow: "0 2px 5px rgba(0,0,0,0.04)", borderLeft: `5px solid ${STATUS_COLORS[a.status].dot}` }}>
                    <div style={{ textAlign: "center", minWidth: 60 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#3a7a3a" }}>{a.date.split("-").reverse().slice(0,2).join("/")}</div>
                      <div style={{ fontSize: 20, fontWeight: 800 }}>{a.time}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>{pt?.name || "Paciente no encontrado"} <span style={{ fontWeight: 400, fontSize: 13, color: "#666" }}>({pt?.species})</span></div>
                      <div style={{ fontSize: 13, color: "#555" }}>📍 {pt?.ownerAddress} | 📋 {a.motivo}</div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                      <Badge status={a.status} />
                      <div style={{ display: "flex", gap: 5 }}>
                        <button onClick={() => { setApptForm(a); setApptModal(a); }} style={{ ...btnSecondary, padding: "4px 10px", fontSize: 11 }}>Editar</button>
                        <button onClick={() => deleteAppt(a.id)} style={{ background: "#ffebeb", border: "none", color: "#c00", padding: "4px 8px", borderRadius: 5, cursor: "pointer" }}>✕</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* --- VISTA PACIENTES --- */}
        {tab === "pacientes" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h1 style={{ fontFamily: "'Lora', serif", margin: 0 }}>Fichas Clínicas</h1>
              <button onClick={() => { setPatientForm(emptyPatient); setPatientModal("new"); }} style={btnPrimary}>+ Nuevo Paciente</button>
            </div>
            <input 
              placeholder="Buscar por nombre o dueño..." 
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ ...inputStyle, marginBottom: 20 }}
            />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 15 }}>
              {filteredPatients.map(p => (
                <div key={p.id} style={{ background: "#fff", padding: 20, borderRadius: 16, border: "1px solid #e0eadd" }}>
                  <div style={{ fontSize: 24, marginBottom: 5 }}>{p.species === "Gato" ? "🐈" : "🐕"}</div>
                  <h3 style={{ margin: "0 0 5px 0", fontFamily: "'Lora', serif" }}>{p.name}</h3>
                  <p style={{ margin: 0, fontSize: 13, color: "#666" }}>{p.breed} • {p.age} años</p>
                  <div style={{ margin: "15px 0", padding: "10px 0", borderTop: "1px solid #eee" }}>
                    <div style={{ fontSize: 13 }}>👤 <strong>{p.ownerName}</strong></div>
                    <div style={{ fontSize: 12, color: "#555" }}>📞 {p.ownerPhone}</div>
                  </div>
                  <div style={{ display: "flex", gap: 5 }}>
                    <button onClick={() => setHistoryModal(p)} style={{ ...btnPrimary, flex: 1, fontSize: 12, padding: "8px" }}>Historial</button>
                    <button onClick={() => { setPatientForm(p); setPatientModal(p); }} style={{ ...btnSecondary, fontSize: 12, padding: "8px" }}>Editar</button>
                    <button onClick={() => deletePatient(p.id)} style={{ background: "#ffebeb", border: "none", padding: "0 10px", borderRadius: 8 }}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* --- MODALES --- */}
      {apptModal && (
        <Modal title={apptModal === "new" ? "Nueva Cita" : "Editar Cita"} onClose={() => setApptModal(null)}>
          <Field label="Paciente *">
            <select value={apptForm.patientId} onChange={e => setApptForm({...apptForm, patientId: e.target.value})} style={inputStyle}>
              <option value="">Seleccionar...</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.ownerName})</option>)}
            </select>
          </Field>
          <div style={{ display: "flex", gap: 10 }}>
            <Field label="Fecha"><input type="date" value={apptForm.date} onChange={e => setApptForm({...apptForm, date: e.target.value})} style={inputStyle}/></Field>
            <Field label="Hora"><input type="time" value={apptForm.time} onChange={e => setApptForm({...apptForm, time: e.target.value})} style={inputStyle}/></Field>
          </div>
          <Field label="Motivo"><input value={apptForm.motivo} onChange={e => setApptForm({...apptForm, motivo: e.target.value})} style={inputStyle}/></Field>
          <Field label="Estado">
            <select value={apptForm.status} onChange={e => setApptForm({...apptForm, status: e.target.value})} style={inputStyle}>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <button onClick={saveAppt} style={{ ...btnPrimary, width: "100%", marginTop: 10 }}>Guardar Cita</button>
        </Modal>
      )}

      {patientModal && (
        <Modal title={patientModal === "new" ? "Nueva Ficha" : "Editar Ficha"} onClose={() => setPatientModal(null)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Nombre Paciente *"><input value={patientForm.name} onChange={e => setPatientForm({...patientForm, name: e.target.value})} style={inputStyle}/></Field>
            <Field label="Especie">
              <select value={patientForm.species} onChange={e => setPatientForm({...patientForm, species: e.target.value})} style={inputStyle}>
                {SPECIES_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Nombre Dueño *"><input value={patientForm.ownerName} onChange={e => setPatientForm({...patientForm, ownerName: e.target.value})} style={inputStyle}/></Field>
          <Field label="Dirección"><input value={patientForm.ownerAddress} onChange={e => setPatientForm({...patientForm, ownerAddress: e.target.value})} style={inputStyle}/></Field>
          <Field label="Teléfono"><input value={patientForm.ownerPhone} onChange={e => setPatientForm({...patientForm, ownerPhone: e.target.value})} style={inputStyle}/></Field>
          <button onClick={savePatient} style={{ ...btnPrimary, width: "100%", marginTop: 10 }}>Guardar Ficha</button>
        </Modal>
      )}

      {historyModal && (
        <Modal title={`Historial: ${historyModal.name}`} onClose={() => setHistoryModal(null)}>
          <div style={{ marginBottom: 20, maxHeight: 300, overflowY: "auto" }}>
            {historyModal.history.map((h, i) => (
              <div key={i} style={{ padding: 12, background: "#f9fdf7", borderRadius: 10, marginBottom: 8, borderLeft: "3px solid #3a7a3a" }}>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{h.date} - {h.motivo}</div>
                <div style={{ fontSize: 13, marginTop: 4 }}><strong>Dx:</strong> {h.diagnostico}</div>
                <div style={{ fontSize: 13 }}><strong>Tx:</strong> {h.tratamiento}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: 15, background: "#f2f7f0", borderRadius: 12 }}>
            <h4 style={{ margin: "0 0 10px 0", fontSize: 14 }}>Nueva Entrada</h4>
            <Field label="Motivo"><input value={newHistEntry.motivo} onChange={e => setNewHistEntry({...newHistEntry, motivo: e.target.value})} style={inputStyle}/></Field>
            <Field label="Diagnóstico"><input value={newHistEntry.diagnostico} onChange={e => setNewHistEntry({...newHistEntry, diagnostico: e.target.value})} style={inputStyle}/></Field>
            <Field label="Tratamiento"><input value={newHistEntry.tratamiento} onChange={e => setNewHistEntry({...newHistEntry, tratamiento: e.target.value})} style={inputStyle}/></Field>
            <button onClick={addHistory} style={{ ...btnPrimary, width: "100%" }}>Agregar al Historial</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

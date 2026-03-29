import { useState, useEffect } from "react";

// ─── CONFIGURACIÓN ──────────────────────────────────────────────────
const DOCTOR = "Dr. Diego Villalobos Palacios";
const SPECIES_ICO = { Perro: "🐕", Gato: "🐈", Ave: "🦜", Conejo: "🐇", Reptil: "🦎", Otro: "🐾" };

// ─── HELPERS ────────────────────────────────────────────────────────
const exportPDF = (p) => {
  const historyHtml = (p.history || []).map(h => `
    <div style="border-bottom: 1px solid #ddd; padding: 10px 0;">
      <p><strong>Fecha:</strong> ${h.date} | <strong>Peso:</strong> ${h.weight}kg</p>
      <p><strong>Constantes:</strong> FC: ${h.fc} | FR: ${h.fr} | T°: ${h.temp}°C</p>
      <p><strong>Dx:</strong> ${h.diagnostico}</p>
      <p><strong>Tratamiento:</strong> ${h.tratamiento}</p>
    </div>
  `).join("");

  const vacunasHtml = (p.vacunas || []).map(v => `
    <li>${v.nombre} - Aplicada: ${v.fecha} (Refuerzo: ${v.refuerzo})</li>
  `).join("");

  const html = `<html><head><style>
    body{font-family: 'Helvetica', sans-serif; padding:40px; color:#222;}
    .header{border-bottom: 5px solid #2d5a2d; display:flex; justify-content:space-between;}
    .section{margin-top:20px; background:#f4f4f4; padding:15px; border-radius:10px;}
    h2{color:#2d5a2d; border-bottom:1px solid #2d5a2d;}
  </style></head><body>
    <div class="header"><h1>HISTORIA CLÍNICA</h1><p>${DOCTOR}</p></div>
    <div class="section">
      <strong>Paciente:</strong> ${p.name} | <strong>Raza:</strong> ${p.breed} | <strong>Edad:</strong> ${p.age} años<br>
      <strong>Tutor:</strong> ${p.ownerName} | <strong>Contacto:</strong> ${p.ownerPhone}
    </div>
    ${p.notes ? `<div style="color:red; font-weight:bold;">⚠️ ALERTAS: ${p.notes}</div>` : ""}
    <h2>CONTROL DE VACUNACIÓN</h2><ul>${vacunasHtml || "No registra"}</ul>
    <h2>EVOLUCIÓN CLÍNICA</h2>${historyHtml || "Sin consultas previas"}
  </body></html>`;
  
  const w = window.open("", "_blank");
  w.document.write(html); w.document.close(); setTimeout(() => w.print(), 500);
};

// ─── ESTILOS ────────────────────────────────────────────────────────
const inp = { width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: 8, marginBottom: 10 };
const btnP = { background: "#2d5a2d", color: "#fff", padding: "12px", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold" };

// ─── COMPONENTES ────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1000, display: "flex", justifyContent: "center", alignItems: "center", padding: 20 }}>
      <div style={{ background: "#fff", padding: 30, borderRadius: 20, width: "100%", maxWidth: 600, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ border: "none", background: "none", fontSize: 24, cursor: "pointer" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── APP ────────────────────────────────────────────────────────────
export default function VetApp() {
  const [tab, setTab] = useState("pacientes");
  const [patients, setPatients] = useState(() => JSON.parse(localStorage.getItem("vet_pro_data") || "[]"));
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null); // 'paciente', 'consulta', 'vacuna'
  const [activePat, setActivePat] = useState(null);

  useEffect(() => {
    localStorage.setItem("vet_pro_data", JSON.stringify(patients));
  }, [patients]);

  // Manejo de Pacientes
  const [pForm, setPForm] = useState({ name: "", species: "Perro", breed: "", age: "", ownerName: "", ownerPhone: "", ownerAddress: "", notes: "" });
  const savePatient = () => {
    if(!pForm.name) return;
    setPatients([...patients, { ...pForm, id: Date.now(), history: [], vacunas: [] }]);
    setModal(null);
  };

  // Manejo de Consultas (Historia Clínica)
  const [cForm, setCForm] = useState({ date: new Date().toISOString().split('T')[0], weight: "", fc: "", fr: "", temp: "", diagnostico: "", tratamiento: "" });
  const saveConsulta = () => {
    setPatients(patients.map(p => p.id === activePat.id ? { ...p, history: [cForm, ...p.history] } : p));
    setModal(null);
  };

  // Manejo de Vacunas
  const [vForm, setVForm] = useState({ nombre: "", fecha: "", refuerzo: "" });
  const saveVacuna = () => {
    setPatients(patients.map(p => p.id === activePat.id ? { ...p, vacunas: [vForm, ...p.vacunas] } : p));
    setModal(null);
  };

  return (
    <div style={{ fontFamily: "sans-serif", background: "#f0f2f0", minHeight: "100vh" }}>
      <header style={{ background: "#1a331a", color: "white", padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0, fontSize: 20 }}>🐾 VetManager Pro</h1>
        <button style={{ ...btnP, background: "#fff", color: "#1a331a" }} onClick={() => { setPForm({ name: "", species: "Perro", breed: "", age: "", ownerName: "", ownerPhone: "", ownerAddress: "", notes: "" }); setModal("paciente"); }}>+ Nuevo Paciente</button>
      </header>

      <main style={{ padding: 20, maxWidth: 1000, margin: "0 auto" }}>
        <input placeholder="🔍 Buscar paciente por nombre o tutor..." style={{ ...inp, padding: 15, fontSize: 16 }} onChange={e => setSearch(e.target.value)} />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
          {patients.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.ownerName.toLowerCase().includes(search.toLowerCase())).map(p => (
            <div key={p.id} style={{ background: "white", borderRadius: 15, padding: 20, boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 40 }}>{SPECIES_ICO[p.species]}</span>
                <button onClick={() => exportPDF(p)} style={{ ...btnP, padding: "5px 10px" }}>PDF</button>
              </div>
              <h2 style={{ margin: "10px 0" }}>{p.name}</h2>
              <p style={{ color: "#666" }}>{p.breed} • {p.age} años</p>
              
              <div style={{ display: "flex", gap: 5, marginTop: 15 }}>
                <button style={{ ...btnP, flex: 1, fontSize: 12 }} onClick={() => { setActivePat(p); setModal("consulta"); }}>🩺 Consulta</button>
                <button style={{ ...btnP, flex: 1, fontSize: 12, background: "#4a90e2" }} onClick={() => { setActivePat(p); setModal("vacuna"); }}>💉 Vacuna</button>
                <button style={{ ...btnP, background: "#fee2e2", color: "#b91c1c" }} onClick={() => setPatients(patients.filter(x => x.id !== p.id))}>🗑️</button>
              </div>

              {p.history.length > 0 && (
                <div style={{ marginTop: 15, padding: 10, background: "#f9f9f9", borderRadius: 8, fontSize: 12 }}>
                  <strong>Último Dx:</strong> {p.history[0].diagnostico}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      {/* MODAL NUEVO PACIENTE */}
      {modal === "paciente" && (
        <Modal title="Alta de Paciente" onClose={() => setModal(null)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <input placeholder="Nombre Mascota" style={inp} onChange={e => setPForm({...pForm, name: e.target.value})} />
            <select style={inp} onChange={e => setPForm({...pForm, species: e.target.value})}>
              {Object.keys(SPECIES_ICO).map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <input placeholder="Raza" style={inp} onChange={e => setPForm({...pForm, breed: e.target.value})} />
          <input placeholder="Nombre Tutor" style={inp} onChange={e => setPForm({...pForm, ownerName: e.target.value})} />
          <input placeholder="Teléfono" style={inp} onChange={e => setPForm({...pForm, ownerPhone: e.target.value})} />
          <textarea placeholder="Alertas Médicas (Alergias, conducta)" style={{...inp, height: 80}} onChange={e => setPForm({...pForm, notes: e.target.value})} />
          <button style={{...btnP, width: "100%"}} onClick={savePatient}>Registrar Paciente</button>
        </Modal>
      )}

      {/* MODAL NUEVA CONSULTA */}
      {modal === "consulta" && (
        <Modal title={`Consulta: ${activePat.name}`} onClose={() => setModal(null)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <input type="date" style={inp} value={cForm.date} onChange={e => setCForm({...cForm, date: e.target.value})} />
            <input placeholder="Peso (kg)" type="number" style={inp} onChange={e => setCForm({...cForm, weight: e.target.value})} />
            <input placeholder="T° (°C)" type="number" style={inp} onChange={e => setCForm({...cForm, temp: e.target.value})} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <input placeholder="FC (lat/min)" style={inp} onChange={e => setCForm({...cForm, fc: e.target.value})} />
            <input placeholder="FR (resp/min)" style={inp} onChange={e => setCForm({...cForm, fr: e.target.value})} />
          </div>
          <textarea placeholder="Diagnóstico" style={{...inp, height: 60}} onChange={e => setCForm({...cForm, diagnostico: e.target.value})} />
          <textarea placeholder="Tratamiento y Receta" style={{...inp, height: 80}} onChange={e => setCForm({...cForm, tratamiento: e.target.value})} />
          <button style={{...btnP, width: "100%"}} onClick={saveConsulta}>Finalizar y Guardar Historia</button>
        </Modal>
      )}

      {/* MODAL VACUNAS */}
      {modal === "vacuna" && (
        <Modal title={`Inmunización: ${activePat.name}`} onClose={() => setModal(null)}>
          <input placeholder="Nombre de Vacuna (Ej: Octuple, Triple Felina)" style={inp} onChange={e => setVForm({...vForm, nombre: e.target.value})} />
          <label>Fecha de Aplicación</label>
          <input type="date" style={inp} onChange={e => setVForm({...vForm, fecha: e.target.value})} />
          <label>Fecha de Próximo Refuerzo</label>
          <input type="date" style={inp} onChange={e => setVForm({...vForm, refuerzo: e.target.value})} />
          <button style={{...btnP, width: "100%"}} onClick={saveVacuna}>Registrar Vacuna</button>
        </Modal>
      )}
    </div>
  );
}

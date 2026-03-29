import { useState, useEffect } from "react";

// ─── CONFIGURACIÓN DE MARCA (DIAGO VILLALOBOS) ──────────────────────
const DOCTOR      = "Dr. Diego Villalobos Palacios";
const LOGO_URL    = "/logo.png"; // Asegúrate de tener tu logo con este nombre
const SPECIES_ICO = { Perro: "🐕", Gato: "🐈", Ave: "🦜", Conejo: "🐇", Reptil: "🦎", Otro: "🐾" };

// ─── HELPERS PROFESIONALES ──────────────────────────────────────────
const sendWhatsApp = (p, msg) => {
  if (!p?.ownerPhone) return alert("Falta el teléfono del tutor.");
  const phone = p.ownerPhone.replace(/\D/g, "");
  const finalPhone = phone.length === 9 ? `56${phone}` : phone;
  window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(msg)}`, "_blank");
};

const exportPDF = (p) => {
  const historyHtml = (p.history || []).map(h => `
    <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
      <p style="margin:0"><strong>Fecha:</strong> ${h.date} | <strong>Peso:</strong> ${h.weight}kg</p>
      <p style="margin:5px 0; font-size:0.9em; color:#555;">Constantes: FC: ${h.fc || '-'} | FR: ${h.fr || '-'} | T°: ${h.temp || '-'}°C</p>
      <p style="margin:2px 0;"><strong>Diagnóstico:</strong> ${h.diagnostico}</p>
      <p style="margin:2px 0;"><strong>Tratamiento:</strong> ${h.tratamiento}</p>
    </div>
  `).join("");

  const vacunasHtml = (p.vacunas || []).map(v => `
    <li>${v.nombre} (${v.fecha}) - Refuerzo: <strong>${v.refuerzo}</strong></li>
  `).join("");

  const html = `<html><head><title>Ficha - ${p.name}</title><style>
    body{font-family:Arial, sans-serif; padding:30px; color:#333; line-height:1.4;}
    .header{display:flex; justify-content:space-between; border-bottom:4px solid #3a7a3a; padding-bottom:10px;}
    .box{background:#f4f7f4; padding:15px; border-radius:10px; margin:20px 0;}
    .alert{background:#fff0f0; border:2px solid #ff4d4d; padding:10px; color:#d32f2f; font-weight:bold; border-radius:8px;}
    h2{color:#3a7a3a; border-bottom:1px solid #3a7a3a; margin-top:30px;}
  </style></head><body>
    <div class="header">
      <div><h1>FICHA CLÍNICA VETERINARIA</h1><p>Paciente: <strong>${p.name}</strong></p></div>
      <div style="text-align:right"><h3>${DOCTOR}</h3><p>Médico Veterinario</p></div>
    </div>
    ${p.notes ? `<div class="alert">⚠️ ALERGIAS/ADVERTENCIAS: ${p.notes}</div>` : ""}
    <div class="box">
      <strong>Especie/Raza:</strong> ${p.species} ${p.breed} | <strong>Edad:</strong> ${p.age} años<br>
      <strong>Tutor:</strong> ${p.ownerName} | <strong>Teléfono:</strong> ${p.ownerPhone}<br>
      <strong>Dirección:</strong> ${p.ownerAddress}
    </div>
    <h2>HISTORIAL DE CONSULTAS</h2>${historyHtml || "<p>Sin registros.</p>"}
    <h2>CALENDARIO DE VACUNAS</h2><ul>${vacunasHtml || "<li>No registra vacunas</li>"}</ul>
  </body></html>`;
  const w = window.open("", "_blank");
  w.document.write(html); w.document.close(); setTimeout(() => w.print(), 500);
};

// ─── COMPONENTES UI ─────────────────────────────────────────────────
const inp = { width: "100%", padding: "12px", border: "1.5px solid #d8e8d0", borderRadius: 10, marginBottom: 12, boxSizing: "border-box" };
const btnG = { background: "#3a7a3a", color: "#fff", border: "none", borderRadius: 10, padding: "12px 20px", fontWeight: 700, cursor: "pointer" };

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 10 }}>
      <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 550, maxHeight: "90vh", overflowY: "auto", padding: 25 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ border: "none", background: "none", fontSize: 28, cursor: "pointer" }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── APP PRINCIPAL ──────────────────────────────────────────────────
export default function VetApp() {
  const [tab, setTab] = useState("inicio");
  const [patients, setPatients] = useState(() => JSON.parse(localStorage.getItem("vet_data_final") || "[]"));
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null); // 'paciente', 'consulta', 'vacuna'
  const [activePat, setActivePat] = useState(null);

  useEffect(() => {
    localStorage.setItem("vet_data_final", JSON.stringify(patients));
  }, [patients]);

  // Formularios
  const [pForm, setPForm] = useState({ name: "", species: "Perro", breed: "", age: "", weight: "", ownerName: "", ownerPhone: "", ownerAddress: "", notes: "" });
  const [cForm, setCForm] = useState({ date: new Date().toISOString().split('T')[0], weight: "", fc: "", fr: "", temp: "", diagnostico: "", tratamiento: "" });
  const [vForm, setVForm] = useState({ nombre: "", fecha: "", refuerzo: "" });

  const savePatient = () => {
    if (!pForm.name || !pForm.ownerName) return alert("Nombre y Tutor son obligatorios");
    setPatients([...patients, { ...pForm, id: Date.now(), history: [], vacunas: [] }]);
    setModal(null);
  };

  const saveConsulta = () => {
    setPatients(patients.map(p => p.id === activePat.id ? { 
      ...p, 
      weight: cForm.weight || p.weight,
      history: [cForm, ...p.history] 
    } : p));
    setModal(null);
  };

  const saveVacuna = () => {
    setPatients(patients.map(p => p.id === activePat.id ? { ...p, vacunas: [vForm, ...p.vacunas] } : p));
    setModal(null);
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", minHeight: "100vh", background: "#f4f7f4" }}>
      {/* HEADER PERSONALIZADO */}
      <header style={{ background: "#1e3a1e", padding: "15px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", color: "#fff", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src={LOGO_URL} alt="Logo" style={{ width: 45, height: 45, borderRadius: "50%", background: "#fff" }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 14 }}>{DOCTOR.toUpperCase()}</div>
            <div style={{ fontSize: 10, opacity: 0.8 }}>Gestión Veterinaria Domiciliaria</div>
          </div>
        </div>
        <nav style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setTab("inicio")} style={{ background: tab === "inicio" ? "#3a7a3a" : "transparent", border: "none", color: "#fff", padding: "8px 12px", borderRadius: 8, cursor: "pointer" }}>Inicio</button>
          <button onClick={() => setTab("pacientes")} style={{ background: tab === "pacientes" ? "#3a7a3a" : "transparent", border: "none", color: "#fff", padding: "8px 12px", borderRadius: 8, cursor: "pointer" }}>Pacientes</button>
        </nav>
      </header>

      <main style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
        {tab === "inicio" && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <h2 style={{ color: "#1e3a1e" }}>Bienvenido, Diego</h2>
            <p>Tienes {patients.length} pacientes registrados.</p>
            <button onClick={() => setModal("paciente")} style={btnG}>+ Registrar Nuevo Paciente</button>
          </div>
        )}

        {tab === "pacientes" && (
          <>
            <input placeholder="🔍 Buscar por mascota, tutor o raza..." style={{ ...inp, padding: 15 }} onChange={e => setSearch(e.target.value)} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 15 }}>
              {patients.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.ownerName.toLowerCase().includes(search.toLowerCase()) || p.breed.toLowerCase().includes(search.toLowerCase())).map(p => (
                <div key={p.id} style={{ background: "#fff", padding: 20, borderRadius: 20, boxShadow: "0 4px 15px rgba(0,0,0,0.05)", border: p.notes ? "2px solid #ff4d4d" : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 35 }}>{SPECIES_ICO[p.species] || "🐾"}</span>
                    <button onClick={() => exportPDF(p)} style={{ ...btnG, padding: "8px 12px" }}>📄 PDF</button>
                  </div>
                  <h3 style={{ margin: "10px 0 5px" }}>{p.name}</h3>
                  <p style={{ fontSize: 13, color: "#666", margin: "0 0 10px" }}>{p.breed} | {p.weight}kg | {p.age} años</p>
                  
                  <div style={{ background: "#f9f9f9", padding: "10px", borderRadius: 10, fontSize: 12, marginBottom: 10 }}>
                    <strong>Tutor:</strong> {p.ownerName}<br/>
                    <strong>Dir:</strong> {p.ownerAddress}
                  </div>

                  {p.notes && <div style={{ color: "#d32f2f", fontSize: 11, fontWeight: 700, marginBottom: 10 }}>⚠️ {p.notes}</div>}

                  <div style={{ display: "flex", gap: 5 }}>
                    <button onClick={() => { setActivePat(p); setModal("consulta"); }} style={{ ...btnG, flex: 1, fontSize: 11 }}>🩺 Consulta</button>
                    <button onClick={() => { setActivePat(p); setModal("vacuna"); }} style={{ ...btnG, flex: 1, fontSize: 11, background: "#4a90e2" }}>💉 Vacuna</button>
                    <button onClick={() => sendWhatsApp(p, `Hola ${p.ownerName}, le escribe el Dr. Diego Villalobos...`)} style={{ ...btnG, background: "#25D366" }}>💬</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* MODALES */}
      {modal === "paciente" && (
        <Modal title="Nueva Ficha Médica" onClose={() => setModal(null)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <input placeholder="Nombre Mascota" style={inp} onChange={e => setPForm({...pForm, name: e.target.value})} />
            <select style={inp} onChange={e => setPForm({...pForm, species: e.target.value})}>
              {Object.keys(SPECIES_ICO).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <input placeholder="Raza" style={inp} onChange={e => setPForm({...pForm, breed: e.target.value})} />
            <input placeholder="Edad" type="number" style={inp} onChange={e => setPForm({...pForm, age: e.target.value})} />
            <input placeholder="Peso Inicial" type="number" style={inp} onChange={e => setPForm({...pForm, weight: e.target.value})} />
          </div>
          <textarea placeholder="⚠️ Alergias o condiciones especiales" style={{ ...inp, height: 70, borderColor: "#ff4d4d" }} onChange={e => setPForm({...pForm, notes: e.target.value})} />
          <hr />
          <input placeholder="Nombre del Tutor" style={inp} onChange={e => setPForm({...pForm, ownerName: e.target.value})} />
          <input placeholder="Teléfono WhatsApp" style={inp} onChange={e => setPForm({...pForm, ownerPhone: e.target.value})} />
          <input placeholder="Dirección Domicilio" style={inp} onChange={e => setPForm({...pForm, ownerAddress: e.target.value})} />
          <button onClick={savePatient} style={{ ...btnG, width: "100%" }}>Guardar Paciente</button>
        </Modal>
      )}

      {modal === "consulta" && (
        <Modal title={`Consulta: ${activePat.name}`} onClose={() => setModal(null)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            <input type="date" style={inp} value={cForm.date} onChange={e => setCForm({...cForm, date: e.target.value})} />
            <input placeholder="Peso kg" type="number" style={inp} onChange={e => setCForm({...cForm, weight: e.target.value})} />
            <input placeholder="T° °C" type="number" style={inp} onChange={e => setCForm({...cForm, temp: e.target.value})} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <input placeholder="F. Cardíaca" style={inp} onChange={e => setCForm({...cForm, fc: e.target.value})} />
            <input placeholder="F. Resp." style={inp} onChange={e => setCForm({...cForm, fr: e.target.value})} />
          </div>
          <textarea placeholder="Diagnóstico Clínico" style={{ ...inp, height: 60 }} onChange={e => setCForm({...cForm, diagnostico: e.target.value})} />
          <textarea placeholder="Tratamiento / Receta" style={{ ...inp, height: 80, background: "#f0f5ef" }} onChange={e => setCForm({...cForm, tratamiento: e.target.value})} />
          <button onClick={saveConsulta} style={{ ...btnG, width: "100%" }}>Finalizar Consulta</button>
        </Modal>
      )}

      {modal === "vacuna" && (
        <Modal title={`Vacunación: ${activePat.name}`} onClose={() => setModal(null)}>
          <input placeholder="Nombre Vacuna (Sextuple, KC, etc.)" style={inp} onChange={e => setVForm({...vForm, nombre: e.target.value})} />
          <label style={{ fontSize: 12 }}>Fecha Aplicación</label>
          <input type="date" style={inp} onChange={e => setVForm({...vForm, fecha: e.target.value})} />
          <label style={{ fontSize: 12 }}>Próximo Refuerzo</label>
          <input type="date" style={inp} onChange={e => setVForm({...vForm, refuerzo: e.target.value})} />
          <button onClick={saveVacuna} style={{ ...btnG, width: "100%", background: "#4a90e2" }}>Registrar Vacuna</button>
        </Modal>
      )}
    </div>
  );
}

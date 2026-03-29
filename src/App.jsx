import { useState, useEffect, useMemo } from "react";

// ─── CONFIGURACIÓN DE IDENTIDAD Y MARCA ─────────────────────────────
const DOCTOR      = "Dr. Diego Villalobos Palacios";
const CLINICA     = "Veterinario a Domicilio"; 
const LOGO_URL    = "/logo.png"; 
const SPECIES_ICO = { Perro: "🐕", Gato: "🐈", Ave: "🦜", Conejo: "🐇", Reptil: "🦎", Otro: "🐾" };

// ─── GENERADOR DE DOCUMENTOS PDF ────────────────────────────────────
const exportPDF = (p, type = "historia", consulta = null) => {
  const isReceta = type === "receta";
  const html = `<html><head><style>
    body{font-family: 'Segoe UI', sans-serif; padding:40px; color:#333; line-height:1.6;}
    .header{display:flex; justify-content:space-between; align-items:center; border-bottom:4px solid #1a331a; padding-bottom:15px; margin-bottom:25px;}
    .info-grid{background:#f9f9f9; padding:20px; border-radius:12px; margin-bottom:25px; display:grid; grid-template-columns: 1fr 1fr; gap:15px; border:1px solid #eee;}
    .alerta{color: #d32f2f; font-weight: bold; border: 2px solid #d32f2f; padding: 8px; margin-top: 10px; border-radius: 8px; text-align:center;}
    .med-box{font-size:17px; white-space: pre-wrap; padding:25px; border:2px dashed #3a7a3a; border-radius:15px; background:#fff;}
    .footer{margin-top:60px; text-align:center; font-size:11px; border-top:1px solid #ddd; padding-top:15px; color:#777;}
  </style></head><body>
    <div class="header"><div><h1 style="margin:0;">${isReceta ? 'RECETA' : 'FICHA'}</h1><p>${CLINICA}</p></div><div style="text-align:right"><strong>${DOCTOR}</strong></div></div>
    <div class="info-grid">
      <div><strong>Tutor:</strong> ${p.ownerName}<br><strong>WhatsApp:</strong> ${p.ownerPhone}</div>
      <div><strong>Paciente:</strong> ${p.name}<br><strong>Peso:</strong> ${p.weight}kg ${p.alergias ? `<div class="alerta">ALÉRGICO A: ${p.alergias}</div>` : ''}</div>
    </div>
    ${isReceta ? `<h3>TRATAMIENTO:</h3><div class="med-box">${consulta.tratamiento}</div>` : `<h3>HISTORIAL</h3>${p.history.map(h => `<p><strong>${h.date}:</strong> ${h.diagnostico}</p>`).join("")}`}
    <div class="footer">Emitido en Concepción, Chile</div>
  </body></html>`;
  const w = window.open("", "_blank"); w.document.write(html); w.document.close(); setTimeout(() => w.print(), 500);
};

export default function VetApp() {
  const [tab, setTab] = useState("inicio");
  const [patients, setPatients] = useState(() => JSON.parse(localStorage.getItem("vet_v21") || "[]"));
  const [finances, setFinances] = useState(() => JSON.parse(localStorage.getItem("fin_v21") || "[]"));
  const [modal, setModal] = useState(null);
  const [activePat, setActivePat] = useState(null);
  const [activeHist, setActiveHist] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    localStorage.setItem("vet_v21", JSON.stringify(patients));
    localStorage.setItem("fin_v21", JSON.stringify(finances));
  }, [patients, finances]);

  // Alertas combinadas (Vacunas y Desparasitaciones)
  const alertas = useMemo(() => {
    const hoy = new Date();
    const limite = new Date(); limite.setDate(hoy.getDate() + 30);
    return patients.flatMap(p => {
      const items = [...(p.vacunas || []), ...(p.parasitos || [])];
      return items.filter(v => { const d = new Date(v.refuerzo); return d >= hoy && d <= limite; })
                  .map(v => ({ ...v, pName: p.name, phone: p.ownerPhone, tutor: p.ownerName }));
    });
  }, [patients]);

  const stats = useMemo(() => {
    const ing = finances.filter(f => f.tipo === "ingreso").reduce((a, b) => a + Number(b.monto), 0);
    const gas = finances.filter(f => f.tipo === "gasto").reduce((a, b) => a + Number(b.monto), 0);
    return { neto: ing - gas };
  }, [finances]);

  // Formularios
  const [pForm, setPForm] = useState({ name: "", species: "Perro", breed: "", age: "", weight: "", alergias: "", ownerName: "", ownerPhone: "", ownerAddress: "" });
  const [cForm, setCForm] = useState({ id: null, date: new Date().toISOString().split('T')[0], weight: "", temp: "", fc: "", fr: "", diagnostico: "", tratamiento: "", consentimiento: false });
  const [vForm, setVForm] = useState({ nombre: "", refuerzo: "", tipo: "vacuna" });
  const [calc, setCalc] = useState({ p: "", d: "", c: "", r: 0 });

  const labelS = { fontSize: "11px", fontWeight: "bold", color: "#3a7a3a", marginBottom: "3px", display: "block" };
  const inp = { width: "100%", padding: "12px", border: "1.5px solid #d8e8d0", borderRadius: 12, marginBottom: 12, boxSizing: "border-box" };
  const btnG = { background: "#3a7a3a", color: "#fff", border: "none", borderRadius: 12, padding: "14px", fontWeight: 700, cursor: "pointer" };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#f4f7f4", minHeight: "100vh" }}>
      <header style={{ background: "#1a331a", color: "#fff", padding: "15px 25px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>{CLINICA}</div>
        </div>
        <nav style={{ display: "flex", gap: 20 }}>
          {["inicio", "pacientes", "finanzas"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", opacity: tab === t ? 1 : 0.6 }}>{t.toUpperCase()}</button>
          ))}
        </nav>
      </header>

      <main style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
        {tab === "inicio" && (
          <div style={{ background: "#fff", padding: 25, borderRadius: 25 }}>
            <h3>📅 Recordatorios (30 días)</h3>
            {alertas.length === 0 ? <p>Todo al día.</p> : alertas.map((a, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f0f0f0" }}>
                <div><strong>{a.pName}</strong> - {a.nombre}<br/><small>Refuerzo: {a.refuerzo}</small></div>
                <button onClick={() => window.open(`https://wa.me/56${a.phone}?text=Hola ${a.tutor}, ${a.pName} tiene refuerzo de ${a.nombre} el ${a.refuerzo}.`)} style={{ ...btnG, background: "#25D366", padding: "8px 15px", fontSize: 11 }}>WhatsApp</button>
              </div>
            ))}
          </div>
        )}

        {tab === "pacientes" && (
          <>
            <div style={{ display: "flex", gap: 12, marginBottom: 25 }}>
              <input placeholder="🔍 Buscar..." style={{ ...inp, flex: 1, marginBottom: 0 }} onChange={e => setSearch(e.target.value)} />
              <button onClick={() => { setPForm({ name: "", species: "Perro", breed: "", age: "", weight: "", alergias: "", ownerName: "", ownerPhone: "", ownerAddress: "" }); setModal("paciente"); }} style={btnG}>+ Nueva Ficha</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
              {patients.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).map(p => (
                <div key={p.id} style={{ background: "#fff", padding: 25, borderRadius: 25, border: p.alergias ? "2px solid #ff4d4d" : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 35 }}>{SPECIES_ICO[p.species] || "🐾"}</span>
                    <button onClick={() => { setActivePat(p); setPForm(p); setModal("paciente"); }} style={{ background: "none", border: "none", color: "#3a7a3a", cursor: "pointer", fontWeight: "bold" }}>✏️ Editar</button>
                  </div>
                  <h3>{p.name}</h3>
                  <p style={{ fontSize: 13, color: "#666" }}>{p.ownerName} | {p.weight} kg</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
                    <button onClick={() => { setActivePat(p); setCForm({ id: Date.now(), date: new Date().toISOString().split('T')[0], weight: p.weight, temp: "", fc: "", fr: "", diagnostico: "", tratamiento: "", consentimiento: false }); setModal("consulta"); }} style={btnG}>🩺 Consulta</button>
                    <button onClick={() => { setActivePat(p); setModal("vacuna"); }} style={{ ...btnG, background: "#4a90e2" }}>💉 Vacuna/Parásito</button>
                    <button onClick={() => { setActivePat(p); setModal("historial"); }} style={{ ...btnG, gridColumn: "span 2", background: "#f0f5ef", color: "#3a7a3a" }}>📜 Historial</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* MODAL: ALTA O EDICIÓN DE PACIENTE */}
      {modal === "paciente" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", padding: 30, borderRadius: 30, width: "90%", maxWidth: 500 }}>
            <h3>{activePat ? "Editar Paciente" : "Nueva Ficha"}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <input placeholder="Nombre" value={pForm.name} style={inp} onChange={e => setPForm({...pForm, name: e.target.value})} />
              <select value={pForm.species} style={inp} onChange={e => setPForm({...pForm, species: e.target.value})}><option>Perro</option><option>Gato</option><option>Otro</option></select>
            </div>
            <input placeholder="Alergias" value={pForm.alergias} style={{ ...inp, border: "1.5px solid #ff4d4d" }} onChange={e => setPForm({...pForm, alergias: e.target.value})} />
            <input placeholder="WhatsApp" value={pForm.ownerPhone} style={inp} onChange={e => setPForm({...pForm, ownerPhone: e.target.value})} />
            <button style={{ ...btnG, width: "100%" }} onClick={() => {
              if (activePat) { setPatients(patients.map(p => p.id === activePat.id ? { ...p, ...pForm } : p)); }
              else { setPatients([{ ...pForm, id: Date.now(), history: [], vacunas: [], parasitos: [] }, ...patients]); }
              setModal(null); setActivePat(null);
            }}>Guardar Ficha</button>
            <button onClick={() => { setModal(null); setActivePat(null); }} style={{ background: "none", border: "none", width: "100%", marginTop: 10 }}>Cancelar</button>
          </div>
        </div>
      )}

      {/* MODAL: CONSULTA (CON SOPORTE PARA EDICIÓN) */}
      {modal === "consulta" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 30, width: "100%", maxWidth: 600, padding: 30, maxHeight: "90vh", overflowY: "auto" }}>
            <h3>{activeHist ? "Editar Consulta" : "Atención"}: {activePat.name}</h3>
            <textarea placeholder="Diagnóstico" value={cForm.diagnostico} style={inp} onChange={e => setCForm({...cForm, diagnostico: e.target.value})} />
            <textarea placeholder="Tratamiento" value={cForm.tratamiento} style={{ ...inp, height: 100, border: "2px solid #3a7a3a" }} onChange={e => setCForm({...cForm, tratamiento: e.target.value})} />
            <button style={{ ...btnG, width: "100%" }} onClick={() => {
              const newHist = activeHist 
                ? activePat.history.map(h => h.id === cForm.id ? cForm : h)
                : [cForm, ...activePat.history];
              setPatients(patients.map(p => p.id === activePat.id ? { ...p, history: newHist } : p));
              setModal(null); setActiveHist(null);
            }}>Guardar Cambios</button>
          </div>
        </div>
      )}

      {/* MODAL: VACUNA / DESPARASITACIÓN */}
      {modal === "vacuna" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", padding: 30, borderRadius: 25, width: "90%", maxWidth: 400 }}>
            <h3>Vacuna o Antiparasitario</h3>
            <select style={inp} onChange={e => setVForm({...vForm, tipo: e.target.value})}>
              <option value="vacuna">💉 Vacuna</option>
              <option value="parasito">💊 Antiparasitario</option>
            </select>
            <input placeholder="Nombre (Ej: Octuple, Bravecto)" style={inp} onChange={e => setVForm({...vForm, nombre: e.target.value})} />
            <span style={labelS}>Fecha de Refuerzo</span>
            <input type="date" style={inp} onChange={e => setVForm({...vForm, refuerzo: e.target.value})} />
            <button style={{ ...btnG, width: "100%" }} onClick={() => {
              const key = vForm.tipo === "vacuna" ? "vacunas" : "parasitos";
              setPatients(patients.map(p => p.id === activePat.id ? { ...p, [key]: [vForm, ...(p[key] || [])] } : p));
              setModal(null);
            }}>Guardar Registro</button>
          </div>
        </div>
      )}

      {/* MODAL: HISTORIAL CON OPCIÓN DE EDICIÓN */}
      {modal === "historial" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", padding: 35, borderRadius: 30, width: "90%", maxWidth: 650, maxHeight: "80vh", overflowY: "auto" }}>
            <h3>Historial de {activePat.name}</h3>
            {activePat.history.map((h, i) => (
              <div key={i} style={{ borderBottom: "1px solid #eee", padding: "15px 0" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <strong>{h.date} - {h.diagnostico}</strong>
                  <div style={{ display: "flex", gap: 5 }}>
                    <button onClick={() => { setCForm(h); setActiveHist(true); setModal("consulta"); }} style={{ ...btnG, background: "#f39c12", fontSize: 10, padding: "5px" }}>✏️</button>
                    <button onClick={() => exportPDF(activePat, "receta", h)} style={{ ...btnG, fontSize: 10, padding: "5px" }}>📄 PDF</button>
                  </div>
                </div>
              </div>
            ))}
            <button onClick={() => setModal(null)} style={{ ...btnG, width: "100%", marginTop: 20, background: "#666" }}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}

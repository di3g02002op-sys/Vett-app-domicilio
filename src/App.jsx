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
    .logo-img{height: 70px; width: auto;}
    .info-grid{background:#f9f9f9; padding:20px; border-radius:12px; margin-bottom:25px; display:grid; grid-template-columns: 1fr 1fr; gap:15px; border:1px solid #eee;}
    .footer{margin-top:60px; text-align:center; font-size:11px; border-top:1px solid #ddd; padding-top:15px; color:#777;}
    h3{color:#1a331a; border-bottom:2px solid #3a7a3a; padding-bottom:5px; margin-top:30px;}
    .med-box{font-size:17px; white-space: pre-wrap; padding:25px; border:2px dashed #3a7a3a; border-radius:15px; background:#fff;}
  </style></head><body>
    <div class="header">
      <img src="${LOGO_URL}" class="logo-img" onerror="this.style.display='none'">
      <div style="text-align:right">
        <h1 style="margin:0; color:#1a331a;">${isReceta ? 'RECETA MÉDICA' : 'FICHA CLÍNICA'}</h1>
        <h2 style="margin:0; color:#3a7a3a;">${CLINICA}</h2>
        <p style="margin:5px 0;">${DOCTOR}</p>
      </div>
    </div>
    <div class="info-grid">
      <div><strong>Tutor:</strong> ${p.ownerName}<br><strong>WhatsApp:</strong> ${p.ownerPhone}<br><strong>Dirección:</strong> ${p.ownerAddress}</div>
      <div><strong>Paciente:</strong> ${p.name}<br><strong>Especie/Raza:</strong> ${p.species} / ${p.breed}<br><strong>Peso:</strong> ${p.weight || '--'} kg</div>
    </div>
    ${isReceta ? `
      <h3>INDICACIONES Y TRATAMIENTO:</h3>
      <div class="med-box">${consulta.tratamiento}</div>
    ` : `
      <h3>HISTORIAL CLÍNICO</h3>
      ${p.history.map(h => `
        <div style="margin-bottom:25px; padding-bottom:15px; border-bottom:1px solid #eee;">
          <p><strong>Fecha:</strong> ${h.date} | <strong>Peso:</strong> ${h.weight}kg | <strong>T°:</strong> ${h.temp}°C</p>
          <p><strong>Diagnóstico:</strong> ${h.diagnostico}</p>
          <p><strong>Tratamiento:</strong> ${h.tratamiento}</p>
        </div>
      `).join("")}
    `}
    <div class="footer"><p>Documento emitido por ${DOCTOR} - Concepción, Chile</p></div>
  </body></html>`;
  const w = window.open("", "_blank"); w.document.write(html); w.document.close(); setTimeout(() => w.print(), 500);
};

export default function VetApp() {
  const [tab, setTab] = useState("inicio");
  const [patients, setPatients] = useState(() => JSON.parse(localStorage.getItem("vet_dom_v17") || "[]"));
  const [finances, setFinances] = useState(() => JSON.parse(localStorage.getItem("fin_dom_v17") || "[]"));
  const [modal, setModal] = useState(null);
  const [activePat, setActivePat] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    localStorage.setItem("vet_dom_v17", JSON.stringify(patients));
    localStorage.setItem("fin_dom_v17", JSON.stringify(finances));
  }, [patients, finances]);

  // Alertas Vacunas
  const alertas = useMemo(() => {
    const hoy = new Date();
    const limite = new Date(); limite.setDate(hoy.getDate() + 30);
    return patients.flatMap(p => (p.vacunas || []).filter(v => {
      const d = new Date(v.refuerzo); return d >= hoy && d <= limite;
    }).map(v => ({ ...v, pName: p.name, phone: p.ownerPhone, tutor: p.ownerName })));
  }, [patients]);

  const stats = useMemo(() => {
    const ing = finances.filter(f => f.tipo === "ingreso").reduce((a, b) => a + Number(b.monto), 0);
    const gas = finances.filter(f => f.tipo === "gasto").reduce((a, b) => a + Number(b.monto), 0);
    return { neto: ing - gas };
  }, [finances]);

  // States para Formularios
  const [pForm, setPForm] = useState({ name: "", species: "Perro", breed: "", age: "", weight: "", ownerName: "", ownerPhone: "", ownerAddress: "", notes: "" });
  const [cForm, setCForm] = useState({ date: new Date().toISOString().split('T')[0], weight: "", temp: "", fc: "", fr: "", tllc: "", examenFisico: "", diagnostico: "", tratamiento: "" });
  const [vForm, setVForm] = useState({ nombre: "", fecha: "", refuerzo: "" });
  const [calc, setCalc] = useState({ p: "", d: "", c: "", r: 0 });

  const labelS = { fontSize: "11px", fontWeight: "bold", color: "#3a7a3a", marginBottom: "3px", display: "block" };
  const inp = { width: "100%", padding: "12px", border: "1.5px solid #d8e8d0", borderRadius: 12, marginBottom: 12, boxSizing: "border-box" };
  const btnG = { background: "#3a7a3a", color: "#fff", border: "none", borderRadius: 12, padding: "14px", fontWeight: 700, cursor: "pointer" };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#f4f7f4", minHeight: "100vh" }}>
      <header style={{ background: "#1a331a", color: "#fff", padding: "15px 25px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
          <img src={LOGO_URL} style={{ height: 45, width: "auto", background: "#fff", borderRadius: 8, padding: 3 }} alt="Logo" onerror="this.style.display='none'" />
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>{CLINICA}</div>
            <div style={{ fontSize: 10, opacity: 0.8 }}>{DOCTOR}</div>
          </div>
        </div>
        <nav style={{ display: "flex", gap: 20 }}>
          {["inicio", "pacientes", "finanzas"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", opacity: tab === t ? 1 : 0.6 }}>{t.toUpperCase()}</button>
          ))}
        </nav>
      </header>

      <main style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
        
        {tab === "inicio" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15, marginBottom: 25 }}>
            <div style={{ background: "#fff", padding: 25, borderRadius: 25 }}>
              <small>Caja Neta</small><br/><strong>${stats.neto.toLocaleString()}</strong>
            </div>
            <div style={{ background: "#fff", padding: 25, borderRadius: 25 }}>
              <small>Vacunas x Vencer</small><br/><strong>{alertas.length}</strong>
            </div>
          </div>
        )}

        {tab === "pacientes" && (
          <>
            <div style={{ display: "flex", gap: 12, marginBottom: 25 }}>
              <input placeholder="🔍 Buscar mascota..." style={{ ...inp, flex: 1, marginBottom: 0 }} onChange={e => setSearch(e.target.value)} />
              <button onClick={() => setModal("paciente")} style={btnG}>+ Nueva Ficha</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
              {patients.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).map(p => (
                <div key={p.id} style={{ background: "#fff", padding: 25, borderRadius: 25 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 35 }}>{SPECIES_ICO[p.species] || "🐾"}</span><button onClick={() => exportPDF(p)} style={{ ...btnG, fontSize: 10, padding: "5px 10px" }}>PDF</button></div>
                  <h3 style={{ margin: "10px 0 0" }}>{p.name}</h3>
                  <p style={{ fontSize: 13, color: "#666", marginBottom: 15 }}>{p.breed} | {p.weight || '--'} kg</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <button onClick={() => { setActivePat(p); setModal("consulta"); }} style={btnG}>🩺 Consulta</button>
                    <button onClick={() => { setActivePat(p); setModal("vacuna"); }} style={{ ...btnG, background: "#4a90e2" }}>💉 Vacuna</button>
                    <button onClick={() => { setActivePat(p); setModal("historial"); }} style={{ ...btnG, gridColumn: "span 2", background: "#f0f5ef", color: "#3a7a3a" }}>📜 Historial</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* --- PESTAÑA FINANZAS --- */}
        {tab === "finanzas" && (
          <div style={{ background: "#fff", padding: 30, borderRadius: 25 }}>
            <h3>💰 Contabilidad</h3>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10, marginBottom: 15 }}>
              <input placeholder="Glosa..." style={inp} id="fDesc" />
              <input placeholder="Monto" type="number" style={inp} id="fMonto" />
              <select style={inp} id="fTipo"><option value="ingreso">Ingreso</option><option value="gasto">Gasto</option></select>
            </div>
            <button style={{ ...btnG, width: "100%" }} onClick={() => {
              const d = document.getElementById("fDesc").value; const m = document.getElementById("fMonto").value; const t = document.getElementById("fTipo").value;
              if(d && m) { setFinances([{ desc: d, monto: m, tipo: t, fecha: new Date().toLocaleDateString() }, ...finances]); document.getElementById("fDesc").value = ""; document.getElementById("fMonto").value = ""; }
            }}>Registrar</button>
          </div>
        )}
      </main>

      {/* MODAL: ALTA PACIENTE (ACTUALIZADO CON PESO) */}
      {modal === "paciente" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", padding: 30, borderRadius: 30, width: "90%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto" }}>
            <h3>Nueva Ficha Clínica</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div><span style={labelS}>Nombre</span><input style={inp} onChange={e => setPForm({...pForm, name: e.target.value})} /></div>
              <div><span style={labelS}>Especie</span><select style={inp} onChange={e => setPForm({...pForm, species: e.target.value})}><option>Perro</option><option>Gato</option><option>Otro</option></select></div>
              <div><span style={labelS}>Raza</span><input style={inp} onChange={e => setPForm({...pForm, breed: e.target.value})} /></div>
              <div><span style={labelS}>Peso Inicial (Kg)</span><input type="number" step="0.1" style={inp} onChange={e => setPForm({...pForm, weight: e.target.value})} /></div>
            </div>
            <span style={labelS}>Tutor</span><input style={inp} onChange={e => setPForm({...pForm, ownerName: e.target.value})} />
            <span style={labelS}>WhatsApp</span><input style={inp} onChange={e => setPForm({...pForm, ownerPhone: e.target.value})} />
            <span style={labelS}>Dirección</span><input style={inp} onChange={e => setPForm({...pForm, ownerAddress: e.target.value})} />
            <button style={{ ...btnG, width: "100%" }} onClick={() => { setPatients([{ ...pForm, id: Date.now(), history: [], vacunas: [] }, ...patients]); setModal(null); }}>Crear Ficha</button>
            <button onClick={() => setModal(null)} style={{ background: "none", border: "none", width: "100%", marginTop: 10, color: "#666" }}>Cerrar</button>
          </div>
        </div>
      )}

      {/* MODAL: CONSULTA + CALCULADORA */}
      {modal === "consulta" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 10 }}>
          <div style={{ background: "#fff", borderRadius: 30, width: "100%", maxWidth: 700, maxHeight: "95vh", overflowY: "auto", padding: 30 }}>
            <h3>Atención: {activePat.name}</h3>
            <div style={{ background: "#f0f7f0", padding: 15, borderRadius: 15, marginBottom: 15 }}>
              <span style={labelS}>🧮 CALCULADORA RÁPIDA (ml)</span>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 0.5fr", gap: 8 }}>
                <input placeholder="Peso kg" style={inp} onChange={e => setCalc({...calc, p: e.target.value})} />
                <input placeholder="mg/kg" style={inp} onChange={e => setCalc({...calc, d: e.target.value})} />
                <input placeholder="mg/ml" style={inp} onChange={e => setCalc({...calc, c: e.target.value})} />
                <button style={btnG} onClick={() => setCalc({...calc, r: (calc.p * calc.d / calc.c).toFixed(2)})}>ok</button>
              </div>
              {calc.r > 0 && <p style={{ textAlign: "center", fontWeight: "bold" }}>Dosis: {calc.r} ml</p>}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
              <input placeholder="Kg" style={inp} onChange={e => setCForm({...cForm, weight: e.target.value})} />
              <input placeholder="T°" style={inp} onChange={e => setCForm({...cForm, temp: e.target.value})} />
              <input placeholder="FC" style={inp} onChange={e => setCForm({...cForm, fc: e.target.value})} />
              <input placeholder="FR" style={inp} onChange={e => setCForm({...cForm, fr: e.target.value})} />
            </div>
            <textarea style={{ ...inp, height: 80 }} placeholder="Examen físico..." onChange={e => setCForm({...cForm, examenFisico: e.target.value})} />
            <input placeholder="Diagnóstico" style={inp} onChange={e => setCForm({...cForm, diagnostico: e.target.value})} />
            <textarea style={{ ...inp, height: 100, border: "2px solid #3a7a3a" }} placeholder="Tratamiento..." onChange={e => setCForm({...cForm, tratamiento: e.target.value})} />
            <button style={{ ...btnG, width: "100%" }} onClick={() => {
              setPatients(patients.map(p => p.id === activePat.id ? { ...p, weight: cForm.weight || p.weight, history: [cForm, ...p.history] } : p));
              setModal(null);
            }}>Finalizar</button>
          </div>
        </div>
      )}

      {/* --- MODALES RESTANTES (VACUNA E HISTORIAL) --- */}
      {modal === "vacuna" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", padding: 30, borderRadius: 25, width: "90%", maxWidth: 400 }}>
            <h3>Vacuna: {activePat.name}</h3>
            <input placeholder="Nombre Vacuna" style={inp} onChange={e => setVForm({...vForm, nombre: e.target.value})} />
            <input type="date" style={inp} onChange={e => setVForm({...vForm, refuerzo: e.target.value})} />
            <button style={{ ...btnG, width: "100%" }} onClick={() => {
              setPatients(patients.map(p => p.id === activePat.id ? { ...p, vacunas: [vForm, ...(p.vacunas || [])] } : p));
              setModal(null);
            }}>Guardar</button>
          </div>
        </div>
      )}

      {modal === "historial" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", padding: 35, borderRadius: 30, width: "90%", maxWidth: 650, maxHeight: "85vh", overflowY: "auto" }}>
            <h3>Historial: {activePat.name}</h3>
            {activePat.history.length === 0 ? <p>Sin registros.</p> : activePat.history.map((h, i) => (
              <div key={i} style={{ borderBottom: "1px solid #eee", padding: "15px 0" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <strong>{h.date} — Dx: {h.diagnostico}</strong>
                  <button onClick={() => exportPDF(activePat, "receta", h)} style={{ ...btnG, fontSize: 10, padding: "5px 12px" }}>Receta PDF</button>
                </div>
              </div>
            ))}
            <button onClick={() => setModal(null)} style={{ ...btnG, width: "100%", marginTop: 20, background: "#eee", color: "#333" }}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

// ─── CONFIGURACIÓN DE MARCA ────────────────────────────────────────
const DOCTOR = "Dr. Diego Villalobos Palacios";
const CLINICA = "Veterinario a Domicilio";
const LOGO_URL = "/logo.png"; 
const SPECIES_ICO = { Perro: "🐕", Gato: "🐈", Ave: "🦜", Conejo: "🐇", Reptil: "🦎", Otro: "🐾" };

// ─── VADEMÉCUM TÉCNICO COMPLETO ────────────────────────────────────
const DOSIS_REF = [
  { n: "Meloxicam (0.2mg/kg)", d: 0.2, c: 5 },
  { n: "Tramadol (2mg/kg)", d: 2, c: 50 },
  { n: "Enrofloxacino (5mg/kg)", d: 5, c: 100 },
  { n: "Cefalexina (20mg/kg)", d: 20, c: 250 },
  { n: "Propofol (4mg/kg)", d: 4, c: 10 },
  { n: "Xilacina (1mg/kg)", d: 1, c: 20 },
  { n: "Amoxicilina (20mg/kg)", d: 20, c: 250 }
];

const PLANTILLAS = [
  { label: "Gastro", texto: "1. Ayuno hídrico 2h.\n2. Dieta blanda (pollo+arroz) 3-5 días.\n3. Metronidazol 15mg/kg c/12h.\n4. Probiótico c/24h.\nControl en 5 días." },
  { label: "Otitis", texto: "1. Limpieza canal auditivo.\n2. Otomax 5 gotas c/12h (10 días).\n3. Collar isabelino.\nControl en 10 días." },
  { label: "Derma", texto: "1. Apoquel 0.5mg/kg c/24h.\n2. Shampoo hipoalergénico 2v/semana.\n3. Evitar pasto mojado.\nControl en 14 días." },
  { label: "Urgencia", texto: "Estabilización inicial realizada. Se sugiere hospitalización para monitoreo 24h y fluidoterapia endovenosa." },
];

// ─── MOTOR DE DOCUMENTOS (PDF) ──────────────────────────────────────
const exportPDF = (p, type, consulta) => {
  const isReceta = type === "receta";
  const html = `<html><head><style>
    body{font-family:Helvetica,sans-serif;padding:40px;color:#222;line-height:1.6}
    .header{display:flex;justify-content:space-between;border-bottom:5px solid #1a331a;padding-bottom:15px;margin-bottom:30px}
    .info-grid{background:#f4f7f4;padding:20px;border-radius:15px;display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:30px;border:1px solid #d8e8d0}
    .alerta{color:white;background:#d32f2f;font-weight:bold;padding:10px;text-align:center;border-radius:8px;margin-bottom:15px}
    .exam-grid{display:grid;grid-template-columns:repeat(3, 1fr);gap:12px;font-size:12px;background:#fff;padding:15px;border-radius:10px;border:1px solid #eee}
    .med-box{font-size:18px;white-space:pre-wrap;padding:30px;border:3px dashed #3a7a3a;border-radius:20px;background:#fff}
    h3{color:#1a331a;border-bottom:2px solid #3a7a3a;padding-bottom:5px;margin-top:25px}
  </style></head><body>
    <div class="header">
      <img src="${LOGO_URL}" style="height:80px" onerror="this.style.display='none'">
      <div style="text-align:right">
        <h1 style="margin:0">${isReceta ? 'RECETA MÉDICA' : 'FICHA CLÍNICA'}</h1>
        <h2 style="margin:0;color:#3a7a3a">${CLINICA}</h2>
        <p style="margin:0">${DOCTOR}</p>
      </div>
    </div>
    ${p.alergias ? `<div class="alerta">⚠️ ATENCIÓN: ALÉRGICO A ${p.alergias.toUpperCase()}</div>` : ''}
    <div class="info-grid">
      <div><strong>TUTOR:</strong> ${p.ownerName}<br><strong>FONO:</strong> ${p.ownerPhone}<br><strong>DIRECCIÓN:</strong> ${p.ownerAddress || 'No registrada'}</div>
      <div><strong>PACIENTE:</strong> ${p.name} (${p.species})<br><strong>RAZA:</strong> ${p.breed || 'Mestizo'}<br><strong>PESO:</strong> ${consulta?.weight || '--'} kg</div>
    </div>
    ${isReceta ? `<h3>INDICACIONES Y TRATAMIENTO:</h3><div class="med-box">${consulta.tratamiento}</div>` : `
      <h3>EXAMEN FÍSICO Y CONSTANTES</h3>
      <div class="exam-grid">
        <div><strong>T°:</strong> ${consulta.temp}°C</div><div><strong>FC:</strong> ${consulta.fc} lpm</div><div><strong>FR:</strong> ${consulta.fr} rpm</div>
        <div><strong>TLLC:</strong> ${consulta.tllc}s</div><div><strong>CC:</strong> ${consulta.cc}/5</div><div><strong>Mucosas:</strong> ${consulta.mucosas}</div>
        <div><strong>Linfonodos:</strong> ${consulta.linfonodos}</div><div><strong>Hidratación:</strong> ${consulta.hidratacion}%</div><div><strong>Oral:</strong> ${consulta.oral}</div>
      </div>
      <h3>ANAMNESIS:</h3><p>${consulta.anamnesis || 'Sin registros previos.'}</p>
      <h3>DIAGNÓSTICO:</h3><p><strong>${consulta.diagnostico}</strong></p>
      <h3>PLAN TERAPÉUTICO:</h3><p style="white-space:pre-wrap">${consulta.tratamiento}</p>
    `}
    <div style="margin-top:60px;display:flex;justify-content:space-between;font-size:12px">
      <div>Fecha: ${consulta.date}</div>
      <div style="text-align:center;border-top:1px solid #333;width:200px"><br>Firma ${DOCTOR}</div>
    </div>
  </body></html>`;
  const w = window.open("", "_blank"); w.document.write(html); w.document.close(); setTimeout(() => w.print(), 500);
};

// ─── ESTILOS UI ────────────────────────────────────────────────────
const inp = { width: "100%", padding: "12px", border: "1.5px solid #d8e8d0", borderRadius: 12, marginBottom: 12, fontSize: "16px", outline: "none" };
const btnStyle = { background: "#3a7a3a", color: "#fff", border: "none", borderRadius: 12, padding: "15px", fontWeight: "bold", cursor: "pointer", transition: "0.3s" };

export default function VetApp() {
  const [tab, setTab] = useState("inicio");
  const [patients, setPatients] = useState([]);
  const [finances, setFinances] = useState([]);
  const [isClient, setIsClient] = useState(false);
  const [modal, setModal] = useState(null);
  const [activePatId, setActivePatId] = useState(null);
  const [search, setSearch] = useState("");
  const [calc, setCalc] = useState({ p: "", d: "", c: "", r: 0 });
  
  const [pForm, setPForm] = useState({ name: "", species: "Perro", breed: "", weight: "", reproductivo: "Entero/a", alergias: "", ownerName: "", ownerPhone: "", ownerAddress: "" });
  
  const [cForm, setCForm] = useState({ id: null, date: new Date().toISOString().split("T")[0], weight: "", temp: "", fc: "", fr: "", tllc: "", mucosas: "", cc: "3", linfonodos: "Normal", hidratacion: "0", oral: "Normal", anamnesis: "", diagnostico: "", tratamiento: "", proximoControl: "", consentimiento: false });

  useEffect(() => {
    setIsClient(true);
    const p = localStorage.getItem("vet_final_v1");
    const f = localStorage.getItem("fin_final_v1");
    if (p) setPatients(JSON.parse(p));
    if (f) setFinances(JSON.parse(f));
  }, []);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem("vet_final_v1", JSON.stringify(patients));
      localStorage.setItem("fin_final_v1", JSON.stringify(finances));
    }
  }, [patients, finances, isClient]);

  const stats = useMemo(() => {
    const ing = finances.filter(f => f.tipo === "ingreso").reduce((a, b) => a + Number(b.monto), 0);
    const gas = finances.filter(f => f.tipo === "gasto").reduce((a, b) => a + Number(b.monto), 0);
    const dataMes = {};
    patients.flatMap(p => p.history || []).forEach(h => {
      const m = h.date.slice(5, 7); dataMes[m] = (dataMes[m] || 0) + 1;
    });
    return { neto: ing - gas, ing, gas, graph: Object.entries(dataMes).map(([m, v]) => ({ mes: m, consultas: v })) };
  }, [finances, patients]);

  if (!isClient) return null;
  const activePat = patients.find(p => p.id === activePatId);

  return (
    <div style={{ fontFamily: "Segoe UI, sans-serif", background: "#f0f4f0", minHeight: "100vh" }}>
      {/* NAVEGACIÓN PRINCIPAL */}
      <header style={{ background: "#1a331a", color: "white", padding: "15px 20px", position: "sticky", top: 0, zIndex: 100, display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 2px 10px rgba(0,0,0,0.2)" }}>
        <div><strong style={{fontSize: "1.2rem"}}>{CLINICA}</strong><br/><small>{DOCTOR}</small></div>
        <div style={{ display: "flex", gap: "10px" }}>
          {["inicio", "pacientes", "finanzas"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ background: tab === t ? "#3a7a3a" : "none", border: "none", color: "white", padding: "8px 12px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>{t.toUpperCase()}</button>
          ))}
        </div>
      </header>

      <main style={{ padding: "20px", maxWidth: "900px", margin: "0 auto" }}>
        {tab === "inicio" && (
          <div style={{ display: "grid", gap: "20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                <div style={{ background: "white", padding: "25px", borderRadius: "25px", textAlign: "center", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
                  <small style={{color: "#666"}}>Balance Neto</small>
                  <h2 style={{ margin: 0, color: "#27ae60", fontSize: "2rem" }}>${stats.neto.toLocaleString()}</h2>
                </div>
                <div style={{ background: "white", padding: "25px", borderRadius: "25px", textAlign: "center", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
                  <small style={{color: "#666"}}>Consultas Totales</small>
                  <h2 style={{ margin: 0, color: "#3a7a3a", fontSize: "2rem" }}>{patients.reduce((acc, p) => acc + (p.history?.length || 0), 0)}</h2>
                </div>
            </div>
            <div style={{ background: "white", padding: "20px", borderRadius: "25px", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
              <h3 style={{marginTop: 0}}>Rendimiento de Consultas</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={stats.graph}><CartesianGrid stroke="#f0f0f0"/><XAxis dataKey="mes"/><YAxis/><Tooltip/><Line type="monotone" dataKey="consultas" stroke="#3a7a3a" strokeWidth={4}/></LineChart>
              </ResponsiveContainer>
            </div>
            <button onClick={() => {
              const data = JSON.stringify({ patients, finances });
              const blob = new Blob([data], {type: "application/json"});
              const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `VET_BACKUP_${new Date().toISOString().split('T')[0]}.json`; a.click();
            }} style={{ ...btnStyle, background: "#1a331a" }}>Guardar Respaldo Completo (JSON)</button>
          </div>
        )}

        {tab === "pacientes" && (
          <div>
            <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
              <input placeholder="Buscar por mascota o tutor..." style={{ ...inp, marginBottom: 0, flex: 1 }} onChange={e => setSearch(e.target.value.toLowerCase())} />
              <button style={{...btnStyle, padding: "0 25px"}} onClick={() => { setPForm({ name: "", species: "Perro", breed: "", weight: "", reproductivo: "Entero/a", alergias: "", ownerName: "", ownerPhone: "", ownerAddress: "" }); setActivePatId(null); setModal("paciente"); }}>+ Nueva Ficha</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
              {patients.filter(p => p.name.toLowerCase().includes(search) || p.ownerName.toLowerCase().includes(search)).map(p => (
                <div key={p.id} style={{ background: "white", padding: "20px", borderRadius: "25px", boxShadow: "0 5px 15px rgba(0,0,0,0.05)", borderTop: p.alergias ? "10px solid #e74c3c" : "10px solid #3a7a3a" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: "1.4rem" }}>{SPECIES_ICO[p.species]} {p.name}</h3>
                        <p style={{ margin: "5px 0", color: "#666", fontSize: "14px" }}><b>Tutor:</b> {p.ownerName}<br/><b>Fono:</b> {p.ownerPhone}</p>
                    </div>
                    <button onClick={() => { setPForm(p); setActivePatId(p.id); setModal("paciente"); }} style={{ background: "#f0f4f0", border: "none", borderRadius: "50%", width: "40px", height: "40px", cursor: "pointer" }}>✏️</button>
                  </div>
                  {p.alergias && <div style={{ color: "#e74c3c", fontWeight: "bold", fontSize: "12px", marginTop: "5px" }}>⚠️ ALERGIA: {p.alergias}</div>}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "15px" }}>
                    <button style={btnStyle} onClick={() => { setActivePatId(p.id); setCForm({ ...cForm, id: Date.now(), weight: p.weight }); setModal("consulta"); }}>Nueva Consulta</button>
                    <button style={{ ...btnStyle, background: "#f0f5ef", color: "#3a7a3a" }} onClick={() => { setActivePatId(p.id); setModal("historial"); }}>Historial ({p.history?.length || 0})</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "finanzas" && (
          <div style={{ background: "white", padding: "30px", borderRadius: "30px", boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
            <h3>💰 Contabilidad</h3>
            <div style={{ display: "grid", gap: "10px", marginBottom: "20px" }}>
                <input id="fD" placeholder="Descripción del servicio/gasto" style={inp} />
                <input id="fM" placeholder="Monto $" type="number" style={inp} />
                <div style={{ display: "flex", gap: "10px" }}>
                    <button style={{ ...btnStyle, flex: 1 }} onClick={() => {
                        const d = document.getElementById("fD").value; const m = document.getElementById("fM").value;
                        if(d && m) { setFinances([{ desc: d, monto: m, tipo: "ingreso", fecha: new Date().toLocaleDateString() }, ...finances]); document.getElementById("fD").value = ""; document.getElementById("fM").value = ""; }
                    }}>+ Registrar Ingreso</button>
                    <button style={{ ...btnStyle, flex: 1, background: "#e74c3c" }} onClick={() => {
                        const d = document.getElementById("fD").value; const m = document.getElementById("fM").value;
                        if(d && m) { setFinances([{ desc: d, monto: m, tipo: "gasto", fecha: new Date().toLocaleDateString() }, ...finances]); document.getElementById("fD").value = ""; document.getElementById("fM").value = ""; }
                    }}>- Registrar Gasto</button>
                </div>
            </div>
            <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                {finances.map((f, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "12px", borderBottom: "1px solid #eee", background: i % 2 === 0 ? "#fafafa" : "#fff" }}>
                        <div><strong>{f.desc}</strong><br/><small style={{color: "#999"}}>{f.fecha}</small></div>
                        <strong style={{ color: f.tipo === "ingreso" ? "#27ae60" : "#e74c3c" }}>{f.tipo === "ingreso" ? "+" : "-"}${Number(f.monto).toLocaleString()}</strong>
                    </div>
                ))}
            </div>
          </div>
        )}
      </main>

      {/* MODAL: CONSULTA MÉDICA COMPLETA */}
      {modal === "consulta" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "15px" }}>
          <div style={{ background: "white", borderRadius: "30px", width: "100%", maxWidth: "800px", maxHeight: "95vh", overflowY: "auto", padding: "30px" }}>
            <h2 style={{ marginTop: 0, color: "#1a331a" }}>Atención Clínica: {activePat?.name}</h2>
            
            {/* CALCULADORA DE FÁRMACOS */}
            <div style={{ background: "#f0f7f0", padding: "20px", borderRadius: "20px", marginBottom: "20px", border: "1px solid #d8e8d0" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 0.5fr", gap: "10px" }}>
                <div><small>Peso (kg)</small><input style={{...inp, marginBottom: 0}} value={calc.p} onChange={e => setCalc({...calc, p: e.target.value})} /></div>
                <div><small>Dosis (mg/kg)</small><input style={{...inp, marginBottom: 0}} value={calc.d} onChange={e => setCalc({...calc, d: e.target.value})} /></div>
                <div><small>Conc (mg/ml)</small><input style={{...inp, marginBottom: 0}} value={calc.c} onChange={e => setCalc({...calc, c: e.target.value})} /></div>
                <button style={{ ...btnStyle, marginTop: "18px" }} onClick={() => setCalc({...calc, r: (calc.p * calc.d / calc.c).toFixed(2)})}>OK</button>
              </div>
              <div style={{ display: "flex", gap: "8px", overflowX: "auto", marginTop: "15px", paddingBottom: "5px" }}>
                {DOSIS_REF.map((dr, i) => <button key={i} onClick={() => setCalc({...calc, d: dr.d, c: dr.c})} style={{ fontSize: "11px", whiteSpace: "nowrap", padding: "6px 10px", borderRadius: "8px", border: "1px solid #3a7a3a", background: "#fff", cursor: "pointer" }}>{dr.n}</button>)}
              </div>
              {calc.r > 0 && <div style={{ textAlign: "center", marginTop: "15px", fontSize: "1.2rem", color: "#1a331a" }}><b>Resultado: {calc.r} ml</b></div>}
            </div>

            {/* CONSTANTES FISIOLÓGICAS */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "20px" }}>
              <div><small>Peso (kg)</small><input style={inp} value={cForm.weight} onChange={e => setCForm({...cForm, weight: e.target.value})} /></div>
              <div><small>T° (°C)</small><input style={inp} value={cForm.temp} onChange={e => setCForm({...cForm, temp: e.target.value})} /></div>
              <div><small>FC (lpm)</small><input style={inp} value={cForm.fc} onChange={e => setCForm({...cForm, fc: e.target.value})} /></div>
              <div><small>FR (rpm)</small><input style={inp} value={cForm.fr} onChange={e => setCForm({...cForm, fr: e.target.value})} /></div>
              <div><small>TLLC (seg)</small><input style={inp} value={cForm.tllc} onChange={e => setCForm({...cForm, tllc: e.target.value})} /></div>
              <div><small>CC (1-5)</small><input style={inp} value={cForm.cc} onChange={e => setCForm({...cForm, cc: e.target.value})} /></div>
              <div><small>Mucosas</small><input style={inp} value={cForm.mucosas} onChange={e => setCForm({...cForm, mucosas: e.target.value})} /></div>
              <div><small>Linfonodos</small><input style={inp} value={cForm.linfonodos} onChange={e => setCForm({...cForm, linfonodos: e.target.value})} /></div>
              <div><small>Hidratación %</small><input style={inp} value={cForm.hidratacion} onChange={e => setCForm({...cForm, hidratacion: e.target.value})} /></div>
            </div>
            <input placeholder="Cavidad Oral / Otros hallazgos" style={inp} value={cForm.oral} onChange={e => setCForm({...cForm, oral: e.target.value})} />

            <textarea placeholder="Anamnesis detallada..." style={{ ...inp, height: "80px" }} value={cForm.anamnesis} onChange={e => setCForm({...cForm, anamnesis: e.target.value})} />
            
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "15px" }}>
              {PLANTILLAS.map((pl, i) => <button key={i} onClick={() => setCForm({...cForm, tratamiento: pl.texto, diagnostico: pl.label})} style={{ fontSize: "12px", padding: "8px 12px", borderRadius: "10px", border: "1px solid #ccc", background: "#f9f9f9", cursor: "pointer" }}>{pl.label}</button>)}
            </div>

            <input placeholder="DIAGNÓSTICO PRESUNTIVO/DEFINITIVO" style={{...inp, fontWeight: "bold", borderColor: "#3a7a3a"}} value={cForm.diagnostico} onChange={e => setCForm({...cForm, diagnostico: e.target.value})} />
            <textarea placeholder="TRATAMIENTO E INDICACIONES (Esto aparecerá en la receta)" style={{ ...inp, height: "150px", border: "2px solid #3a7a3a" }} value={cForm.tratamiento} onChange={e => setCForm({...cForm, tratamiento: e.target.value})} />
            
            <button style={{ ...btnStyle, width: "100%", fontSize: "1.1rem" }} onClick={() => {
              setPatients(patients.map(p => p.id === activePatId ? {...p, weight: cForm.weight || p.weight, history: [cForm, ...(p.history || [])]} : p));
              setModal(null);
              setCForm({ ...cForm, id: null });
            }}>Guardar Ficha Clínica</button>
            <button onClick={() => setModal(null)} style={{ width: "100%", background: "none", border: "none", marginTop: "15px", color: "#666", cursor: "pointer" }}>Descartar cambios</button>
          </div>
        </div>
      )}

      {/* MODAL: HISTORIAL Y EXPORTACIÓN */}
      {modal === "historial" && activePat && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "white", padding: "30px", borderRadius: "30px", width: "95%", maxWidth: "700px", maxHeight: "85vh", overflowY: "auto" }}>
            <h3 style={{marginTop: 0}}>Historial Clínico: {activePat.name}</h3>
            {activePat.history?.length === 0 ? <p>No hay atenciones registradas.</p> : activePat.history.map((h, i) => (
              <div key={i} style={{ borderBottom: "1px solid #eee", padding: "20px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{flex: 1}}>
                  <strong style={{fontSize: "1.1rem"}}>{h.date} — {h.diagnostico}</strong>
                  <p style={{ margin: "5px 0", color: "#666", fontSize: "14px" }}>{h.tratamiento.substring(0, 100)}...</p>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => window.open(`https://wa.me/56${activePat.ownerPhone.replace(/\D/g,"")}?text=*INFORME VETERINARIO: ${activePat.name}*%0A%0A*Diagnóstico:* ${h.diagnostico}%0A*Tratamiento:* ${h.tratamiento}%0A%0A_Dr. Diego Villalobos P._`)} style={{ background: "#25D366", color: "white", border: "none", padding: "10px", borderRadius: "10px", cursor: "pointer" }}>WA</button>
                  <button onClick={() => exportPDF(activePat, "historia", h)} style={{ ...btnStyle, padding: "10px" }}>FICHA</button>
                  <button onClick={() => exportPDF(activePat, "receta", h)} style={{ ...btnStyle, background: "#4a90e2", padding: "10px" }}>RECETA</button>
                </div>
              </div>
            ))}
            <button onClick={() => setModal(null)} style={{ ...btnStyle, width: "100%", marginTop: "20px", background: "#eee", color: "#333" }}>Cerrar Historial</button>
          </div>
        </div>
      )}

      {/* MODAL: FICHA DE PACIENTE (NUEVO/EDITAR) */}
      {modal === "paciente" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "white", padding: "35px", borderRadius: "35px", width: "90%", maxWidth: "500px" }}>
            <h3 style={{marginTop: 0}}>{activePatId ? "Actualizar Datos" : "Nueva Ficha de Paciente"}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <input placeholder="Nombre Mascota" style={inp} value={pForm.name} onChange={e => setPForm({...pForm, name: e.target.value})} />
                <select style={inp} value={pForm.species} onChange={e => setPForm({...pForm, species: e.target.value})}>
                    {Object.keys(SPECIES_ICO).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
            <input placeholder="Raza" style={inp} value={pForm.breed} onChange={e => setPForm({...pForm, breed: e.target.value})} />
            <input placeholder="ALERGIAS (Crucial)" style={{ ...inp, border: "2px solid #e74c3c", color: "#e74c3c", fontWeight: "bold" }} value={pForm.alergias} onChange={e => setPForm({...pForm, alergias: e.target.value})} />
            <hr style={{margin: "15px 0", border: "0.5px solid #eee"}}/>
            <input placeholder="Nombre del Tutor" style={inp} value={pForm.ownerName} onChange={e => setPForm({...pForm, ownerName: e.target.value})} />
            <input placeholder="WhatsApp (Ej: 987654321)" style={inp} value={pForm.ownerPhone} onChange={e => setPForm({...pForm, ownerPhone: e.target.value})} />
            <input placeholder="Dirección / Sector" style={inp} value={pForm.ownerAddress} onChange={e => setPForm({...pForm, ownerAddress: e.target.value})} />
            
            <button style={{ ...btnStyle, width: "100%", marginTop: "10px" }} onClick={() => {
              if(activePatId) setPatients(patients.map(p => p.id === activePatId ? {...p, ...pForm} : p));
              else setPatients([{ ...pForm, id: Date.now(), history: [] }, ...patients]);
              setModal(null);
            }}>Guardar Cambios</button>
            <button onClick={() => setModal(null)} style={{ width: "100%", background: "none", border: "none", marginTop: "15px", color: "#999", cursor: "pointer" }}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}

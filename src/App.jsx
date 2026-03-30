import { useState, useEffect, useMemo, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

// ─── CONFIGURACIÓN DE IDENTIDAD ─────────────────────────────────────
const DOCTOR      = "Dr. Diego Villalobos Palacios";
const CLINICA     = "Veterinario a Domicilio"; 
const LOGO_URL    = "/logo.png"; 
const SPECIES_ICO = { Perro: "🐕", Gato: "🐈", Ave: "🦜", Conejo: "🐇", Reptil: "🦎", Otro: "🐾" };

// ─── VADEMÉCUM Y PROTOCOLOS ─────────────────────────────────────────
const DOSIS_REF = [
  { n: "Meloxicam (0.2mg/kg)", d: 0.2, c: 5 },
  { n: "Tramadol (2mg/kg)", d: 2, c: 50 },
  { n: "Enrofloxacino (5mg/kg)", d: 5, c: 50 },
  { n: "Cefalexina (20mg/kg)", d: 20, c: 250 }
];

const PLANTILLAS = [
  { label: "Gastro", texto: "1. Ayuno hídrico 2h.\n2. Dieta blanda 3-5 días.\n3. Metronidazol 15mg/kg c/12h.\n4. Probiótico c/24h." },
  { label: "Otitis", texto: "1. Limpieza canal auditivo.\n2. Otomax 5 gotas c/12h (7 días).\n3. Collar isabelino." },
  { label: "Derma", texto: "1. Apoquel 0.5mg/kg c/24h.\n2. Shampoo hipoalergénico 2v/sem.\n3. Evitar humedad." },
  { label: "Herida", texto: "1. Clorhexidina 0.05%.\n2. Amoxicilina/Clav 20mg/kg c/12h.\n3. Meloxicam 0.2mg/kg c/24h." }
];

// ─── GENERADOR DE DOCUMENTOS ────────────────────────────────────────
const exportPDF = (p, type = "historia", consulta = null) => {
  const isReceta = type === "receta";
  const html = `<html><head><style>
    body{font-family:sans-serif;padding:40px;color:#333;line-height:1.6}
    .header{display:flex;justify-content:space-between;align-items:center;border-bottom:4px solid #1a331a;padding-bottom:15px;margin-bottom:25px}
    .info-grid{background:#f9f9f9;padding:20px;border-radius:12px;margin-bottom:25px;display:grid;grid-template-columns:1fr 1fr;gap:15px;border:1px solid #eee}
    .alerta{color:#d32f2f;font-weight:bold;border:2px solid #d32f2f;padding:8px;border-radius:8px;text-align:center;background:#fff1f1}
    h3{color:#1a331a;border-bottom:2px solid #3a7a3a;padding-bottom:5px;margin-top:20px}
    .med-box{font-size:17px;white-space:pre-wrap;padding:25px;border:2px dashed #3a7a3a;border-radius:15px;background:#fff}
    .exam-grid{display:grid;grid-template-columns:repeat(3, 1fr);gap:10px;font-size:12px}
  </style></head><body>
    <div class="header">
      <img src="${LOGO_URL}" style="height:70px" onerror="this.style.display='none'">
      <div style="text-align:right">
        <h1 style="margin:0">${isReceta ? 'RECETA MÉDICA' : 'FICHA CLÍNICA'}</h1>
        <h2 style="margin:0;color:#3a7a3a">${CLINICA}</h2>
        <p>${DOCTOR}</p>
      </div>
    </div>
    <div class="info-grid">
      <div><strong>Tutor:</strong> ${p.ownerName}<br><strong>WhatsApp:</strong> ${p.ownerPhone}<br><strong>Dirección:</strong> ${p.ownerAddress}</div>
      <div><strong>Paciente:</strong> ${p.name} (${p.species})<br><strong>Peso:</strong> ${consulta?.weight || '--'} kg
      ${p.alergias ? `<div class="alerta">⚠️ ALÉRGICO A: ${p.alergias.toUpperCase()}</div>` : ''}</div>
    </div>
    ${isReceta ? `<h3>INDICACIONES:</h3><div class="med-box">${consulta.tratamiento}</div>` : 
    `<h3>EXAMEN FÍSICO (${consulta.date})</h3>
     <div class="exam-grid">
       <div><strong>T°:</strong> ${consulta.temp || '--'} °C</div>
       <div><strong>FC:</strong> ${consulta.fc || '--'} lpm</div>
       <div><strong>FR:</strong> ${consulta.fr || '--'} rpm</div>
       <div><strong>TLLC:</strong> ${consulta.tllc || '--'} seg</div>
       <div><strong>Mucosas:</strong> ${consulta.mucosas || '--'}</div>
       <div><strong>CC:</strong> ${consulta.cc || '--'}/5</div>
       <div><strong>Linfonodos:</strong> ${consulta.linfonodos || '--'}</div>
       <div><strong>Hidratación:</strong> ${consulta.hidratacion || '--'} %</div>
     </div>
     <h3>ANAMNESIS:</h3><p>${consulta.anamnesis || 'Sin registros.'}</p>
     <h3>DIAGNÓSTICO:</h3><p>${consulta.diagnostico}</p>
     <h3>PLAN TERAPÉUTICO:</h3><p style="white-space:pre-wrap">${consulta.tratamiento}</p>`}
    ${!isReceta && consulta?.consentimiento ? `<div style="margin-top:50px;font-size:10px;border:1px solid #ddd;padding:10px"><strong>CONSENTIMIENTO INFORMADO:</strong> El tutor autoriza al médico veterinario a realizar los procedimientos descritos.<br><br><br>__________________________<br>Firma del Tutor</div>` : ''}
  </body></html>`;
  const w = window.open("", "_blank"); w.document.write(html); w.document.close(); setTimeout(() => w.print(), 500);
};

// ─── ESTILOS REUTILIZABLES ──────────────────────────────────────────
const inp = { width: "100%", padding: "10px", border: "1.5px solid #d8e8d0", borderRadius: 10, marginBottom: 8, boxSizing: "border-box" };
const btnG = { background: "#3a7a3a", color: "#fff", border: "none", borderRadius: 12, padding: "12px", fontWeight: 700, cursor: "pointer" };

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
  const [cForm, setCForm] = useState({ id: null, date: new Date().toISOString().split('T')[0], weight: "", temp: "", fc: "", fr: "", tllc: "", mucosas: "", cc: "3", linfonodos: "", hidratacion: "", oral: "", anamnesis: "", diagnostico: "", tratamiento: "", proximoControl: "", consentimiento: false });

  const activePat = useMemo(() => patients.find(p => p.id === activePatId), [patients, activePatId]);

  useEffect(() => {
    setIsClient(true);
    const p = localStorage.getItem("vet_v25");
    const f = localStorage.getItem("fin_v25");
    if (p) setPatients(JSON.parse(p));
    if (f) setFinances(JSON.parse(f));
  }, []);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem("vet_v25", JSON.stringify(patients));
      localStorage.setItem("fin_v25", JSON.stringify(finances));
    }
  }, [patients, finances, isClient]);

  const stats = useMemo(() => {
    const ing = finances.filter(f => f.tipo === "ingreso").reduce((a, b) => a + Number(b.monto), 0);
    const gas = finances.filter(f => f.tipo === "gasto").reduce((a, b) => a + Number(b.monto), 0);
    const dataMes = {};
    patients.flatMap(p => p.history || []).forEach(h => {
        const m = h.date.slice(5, 7) + "/" + h.date.slice(2, 4);
        dataMes[m] = (dataMes[m] || 0) + 1;
    });
    return { ing, gas, neto: ing - gas, graph: Object.entries(dataMes).map(([m, v]) => ({ mes: m, consultas: v })) };
  }, [finances, patients]);

  if (!isClient) return null;

  return (
    <div style={{ fontFamily: "sans-serif", background: "#f4f7f4", minHeight: "100vh" }}>
      <header style={{ background: "#1a331a", color: "#fff", padding: "15px 25px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src={LOGO_URL} style={{ height: 40, background: "#fff", borderRadius: 5 }} alt="" onerror="this.style.display='none'"/>
          <div><div style={{ fontWeight: 800 }}>{CLINICA}</div><div style={{ fontSize: 10 }}>{DOCTOR}</div></div>
        </div>
        <nav style={{ display: "flex", gap: 15 }}>
          {["inicio", "pacientes", "stats", "finanzas"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ background: tab === t ? "#3a7a3a" : "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 12 }}>{t.toUpperCase()}</button>
          ))}
        </nav>
      </header>

      <main style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
        {tab === "inicio" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15 }}>
            <div style={{ background: "#fff", padding: 25, borderRadius: 25 }}>
              <small>Balance Neto</small><br/><strong style={{ fontSize: 24, color: "#27ae60" }}>${stats.neto.toLocaleString()}</strong>
            </div>
            <div style={{ background: "#fff", padding: 25, borderRadius: 25 }}>
              <small>Total Pacientes</small><br/><strong style={{ fontSize: 24 }}>{patients.length}</strong>
            </div>
            <div style={{ background: "#fff", padding: 20, borderRadius: 25, gridColumn: "span 2" }}>
                <button onClick={() => {
                    const blob = new Blob([JSON.stringify({patients, finances})], {type: "application/json"});
                    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download="vet_backup.json"; a.click();
                }} style={{ ...btnG, width: "100%" }}>Descargar Respaldo Total (JSON)</button>
            </div>
          </div>
        )}

        {tab === "pacientes" && (
          <>
            <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
              <input placeholder="Buscar mascota o tutor..." style={{ ...inp, flex: 1, marginBottom: 0 }} onChange={e => setSearch(e.target.value.toLowerCase())} />
              <button onClick={() => { setPForm({ name: "", species: "Perro", breed: "", weight: "", reproductivo: "Entero/a", alergias: "", ownerName: "", ownerPhone: "", ownerAddress: "" }); setActivePatId(null); setModal("paciente"); }} style={btnG}>+ Nueva Ficha</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 15 }}>
              {patients.filter(p => p.name.toLowerCase().includes(search) || p.ownerName.toLowerCase().includes(search)).map(p => (
                <div key={p.id} style={{ background: "#fff", padding: 20, borderRadius: 20, border: p.alergias ? "2px solid #ff4d4d" : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 30 }}>{SPECIES_ICO[p.species] || "🐾"}</span>
                    <button onClick={() => { setPForm(p); setActivePatId(p.id); setModal("paciente"); }} style={{ background: "none", border: "none", color: "#3a7a3a", cursor: "pointer" }}>✏️ Editar</button>
                  </div>
                  <h3 style={{ margin: "5px 0" }}>{p.name}</h3>
                  <p style={{ fontSize: 12, color: "#666" }}>{p.ownerName} | {p.ownerPhone}</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5, marginTop: 10 }}>
                    <button onClick={() => { setActivePatId(p.id); setCForm({ ...cForm, id: Date.now(), weight: p.weight }); setModal("consulta"); }} style={btnG}>🩺 Consulta</button>
                    <button onClick={() => { setActivePatId(p.id); setModal("historial"); }} style={{ ...btnG, background: "#f0f5ef", color: "#3a7a3a" }}>📜 Historial</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === "stats" && (
          <div style={{ background: "#fff", padding: 25, borderRadius: 25 }}>
            <h3>Rendimiento Mensual</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={stats.graph}>
                <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="mes" /><YAxis /><Tooltip />
                <Line type="monotone" dataKey="consultas" stroke="#3a7a3a" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === "finanzas" && (
          <div style={{ background: "#fff", padding: 25, borderRadius: 25 }}>
            <h3>💰 Registro de Caja</h3>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10 }}>
              <input id="fD" placeholder="Descripción" style={inp} />
              <input id="fM" placeholder="Monto" type="number" style={inp} />
              <button style={btnG} onClick={() => {
                const d = document.getElementById("fD").value; const m = document.getElementById("fM").value;
                if(d && m) setFinances([{ desc: d, monto: m, tipo: "ingreso", fecha: new Date().toLocaleDateString() }, ...finances]);
              }}>Registrar</button>
            </div>
            <div style={{ marginTop: 20, maxHeight: 300, overflowY: "auto" }}>
                {finances.map((f, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #eee" }}>
                        <span>{f.desc} <small>({f.fecha})</small></span>
                        <strong>${Number(f.monto).toLocaleString()}</strong>
                    </div>
                ))}
            </div>
          </div>
        )}
      </main>

      {/* MODAL: CONSULTA COMPLETA */}
      {modal === "consulta" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 10 }}>
          <div style={{ background: "#fff", borderRadius: 30, width: "100%", maxWidth: 750, maxHeight: "95vh", overflowY: "auto", padding: 25 }}>
            <h3>Consulta: {activePat?.name}</h3>
            
            <div style={{ background: "#f0f7f0", padding: 15, borderRadius: 20, marginBottom: 15 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 0.5fr", gap: 8 }}>
                <input placeholder="kg" style={inp} value={calc.p} onChange={e => setCalc({...calc, p: e.target.value})} />
                <input placeholder="mg/kg" style={inp} value={calc.d} onChange={e => setCalc({...calc, d: e.target.value})} />
                <input placeholder="mg/ml" style={inp} value={calc.c} onChange={e => setCalc({...calc, c: e.target.value})} />
                <button style={{...btnG, padding: "10px"}} onClick={() => setCalc({...calc, r: (calc.p * calc.d / calc.c).toFixed(2)})}>OK</button>
              </div>
              <div style={{ display: "flex", gap: 5, overflowX: "auto", marginTop: 10 }}>
                {DOSIS_REF.map((dr, i) => <button key={i} onClick={() => setCalc({...calc, d: dr.d, c: dr.c})} style={{ fontSize: 10, whiteSpace: "nowrap" }}>{dr.n}</button>)}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              <div><small>Peso</small><input style={inp} value={cForm.weight} onChange={e => setCForm({...cForm, weight: e.target.value})} /></div>
              <div><small>T°</small><input style={inp} value={cForm.temp} onChange={e => setCForm({...cForm, temp: e.target.value})} /></div>
              <div><small>FC</small><input style={inp} value={cForm.fc} onChange={e => setCForm({...cForm, fc: e.target.value})} /></div>
              <div><small>FR</small><input style={inp} value={cForm.fr} onChange={e => setCForm({...cForm, fr: e.target.value})} /></div>
            </div>

            <textarea placeholder="Anamnesis" style={{ ...inp, height: 50 }} value={cForm.anamnesis} onChange={e => setCForm({...cForm, anamnesis: e.target.value})} />
            
            <div style={{ display: "flex", gap: 5, margin: "10px 0" }}>
              {PLANTILLAS.map((pl, i) => <button key={i} onClick={() => setCForm({...cForm, tratamiento: pl.texto, diagnostico: pl.label})} style={{ fontSize: 10 }}>{pl.label}</button>)}
            </div>

            <input placeholder="Diagnóstico" style={inp} value={cForm.diagnostico} onChange={e => setCForm({...cForm, diagnostico: e.target.value})} />
            <textarea placeholder="Tratamiento e Indicaciones" style={{ ...inp, height: 100, border: "2px solid #3a7a3a" }} value={cForm.tratamiento} onChange={e => setCForm({...cForm, tratamiento: e.target.value})} />
            
            <label style={{ fontSize: 12 }}><input type="checkbox" checked={cForm.consentimiento} onChange={e => setCForm({...cForm, consentimiento: e.target.checked})} /> Incluir consentimiento en PDF</label>

            <button style={{ ...btnG, width: "100%", marginTop: 15 }} onClick={() => {
              setPatients(patients.map(p => p.id === activePatId ? { ...p, weight: cForm.weight || p.weight, history: [cForm, ...(p.history || [])] } : p));
              setModal(null);
            }}>Guardar Atención</button>
            <button onClick={() => setModal(null)} style={{ width: "100%", background: "none", border: "none", marginTop: 10, cursor: "pointer" }}>Cancelar</button>
          </div>
        </div>
      )}

      {/* MODAL: HISTORIAL */}
      {modal === "historial" && activePat && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", padding: 30, borderRadius: 30, width: "90%", maxWidth: 650, maxHeight: "80vh", overflowY: "auto" }}>
            <h3>Historial de {activePat.name}</h3>
            {activePat.history?.length === 0 ? <p>Sin registros aún.</p> : activePat.history.map((h, i) => (
              <div key={i} style={{ borderBottom: "1px solid #eee", padding: "15px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div><strong>{h.date}</strong><br/>{h.diagnostico}</div>
                <div style={{ display: "flex", gap: 5 }}>
                  <button onClick={() => window.open(`https://wa.me/56${activePat.ownerPhone.replace(/\D/g,"")}?text=Informe: ${h.diagnostico}. Tratamiento: ${h.tratamiento}`)} style={{ background: "#25D366", color: "#fff", border: "none", borderRadius: 8, padding: "8px" }}>WA</button>
                  <button onClick={() => exportPDF(activePat, "historia", h)} style={{ ...btnG, padding: "8px" }}>Ficha</button>
                  <button onClick={() => exportPDF(activePat, "receta", h)} style={{ ...btnG, background: "#4a90e2", padding: "8px" }}>Receta</button>
                </div>
              </div>
            ))}
            <button onClick={() => setModal(null)} style={{ ...btnG, width: "100%", marginTop: 20, background: "#eee", color: "#333" }}>Cerrar</button>
          </div>
        </div>
      )}

      {/* MODAL: PACIENTE (NUEVO O EDITAR) */}
      {modal === "paciente" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", padding: 30, borderRadius: 30, width: "90%", maxWidth: 500 }}>
            <h3>{activePatId ? "Editar Ficha" : "Nueva Ficha"}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <input placeholder="Nombre Mascota" style={inp} value={pForm.name} onChange={e => setPForm({...pForm, name: e.target.value})} />
                <select style={inp} value={pForm.species} onChange={e => setPForm({...pForm, species: e.target.value})}>
                    {Object.keys(SPECIES_ICO).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
            <input placeholder="Raza" style={inp} value={pForm.breed} onChange={e => setPForm({...pForm, breed: e.target.value})} />
            <input placeholder="Alergias (dejar vacío si no tiene)" style={{ ...inp, color: "red" }} value={pForm.alergias} onChange={e => setPForm({...pForm, alergias: e.target.value})} />
            <input placeholder="Nombre Tutor" style={inp} value={pForm.ownerName} onChange={e => setPForm({...pForm, ownerName: e.target.value})} />
            <input placeholder="WhatsApp (Ej: 912345678)" style={inp} value={pForm.ownerPhone} onChange={e => setPForm({...pForm, ownerPhone: e.target.value})} />
            <input placeholder="Dirección" style={inp} value={pForm.ownerAddress} onChange={e => setPForm({...pForm, ownerAddress: e.target.value})} />
            
            <button style={{ ...btnG, width: "100%", marginTop: 10 }} onClick={() => {
                if(activePatId) setPatients(patients.map(p => p.id === activePatId ? {...p, ...pForm} : p));
                else setPatients([{ ...pForm, id: Date.now(), history: [] }, ...patients]);
                setModal(null);
            }}>Guardar Ficha</button>
            <button onClick={() => setModal(null)} style={{ width: "100%", background: "none", border: "none", marginTop: 10 }}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}

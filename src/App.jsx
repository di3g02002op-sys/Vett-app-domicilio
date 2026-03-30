import { useState, useEffect, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

// ─── CONFIGURACIÓN E IDENTIDAD ─────────────────────────────────────
const DOCTOR = "Dr. Diego Villalobos Palacios";
const CLINICA = "Veterinario a Domicilio";
const LOGO_URL = "/logo.png"; 
const SPECIES_ICO = { Perro: "🐕", Gato: "🐈", Ave: "🦜", Conejo: "🐇", Reptil: "🦎", Otro: "🐾" };

// ─── VADEMÉCUM Y PROTOCOLOS AMPLIADOS ──────────────────────────────
const DOSIS_REF = [
  { n: "Meloxicam (0.2mg/kg)", d: 0.2, c: 5 },
  { n: "Tramadol (2mg/kg)", d: 2, c: 50 },
  { n: "Enrofloxacino (5mg/kg)", d: 5, c: 100 },
  { n: "Cefalexina (20mg/kg)", d: 20, c: 250 },
  { n: "Propofol (4mg/kg)", d: 4, c: 10 },
  { n: "Xilacina (1mg/kg)", d: 1, c: 20 }
];

const PLANTILLAS = [
  { label: "Gastro", texto: "1. Ayuno hídrico 2h.\n2. Dieta blanda (pollo+arroz) 3-5 días.\n3. Metronidazol 15mg/kg c/12h.\n4. Probiótico c/24h.\nControl en 5 días." },
  { label: "Otitis", texto: "1. Limpieza canal auditivo.\n2. Otomax 5 gotas c/12h (10 días).\n3. Collar isabelino permanente.\nControl en 10 días." },
  { label: "Derma", texto: "1. Apoquel 0.5mg/kg c/24h.\n2. Shampoo hipoalergénico 2v/semana.\n3. Evitar contacto con pasto mojado.\nControl en 14 días." },
  { label: "Herida", texto: "1. Limpieza Clorhexidina 0.05%.\n2. Amoxicilina-Clav 20mg/kg c/12h.\n3. Meloxicam 0.2mg/kg c/24h (con comida).\nCuración cada 48h." },
];

// ─── LÓGICA DE EXPORTACIÓN (PDF Y WHATSAPP) ────────────────────────
const exportPDF = (p, type, consulta) => {
  const isReceta = type === "receta";
  const html = `<html><head><style>
    body{font-family:sans-serif;padding:30px;color:#333;line-height:1.5}
    .header{display:flex;justify-content:space-between;border-bottom:4px solid #1a331a;padding-bottom:10px;margin-bottom:20px}
    .info-grid{background:#f4f4f4;padding:15px;border-radius:10px;display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px}
    .alerta{color:red;font-weight:bold;border:2px solid red;padding:5px;text-align:center;border-radius:5px}
    .exam-grid{display:grid;grid-template-columns:repeat(3, 1fr);gap:8px;font-size:11px}
    .med-box{font-size:16px;white-space:pre-wrap;padding:20px;border:2px dashed #3a7a3a;border-radius:10px;background:#fff}
    h3{color:#1a331a;border-bottom:1px solid #3a7a3a}
  </style></head><body>
    <div class="header">
      <img src="${LOGO_URL}" style="height:60px" onerror="this.style.display='none'">
      <div style="text-align:right"><h1>${isReceta ? 'RECETA' : 'FICHA'}</h1><h2>${CLINICA}</h2><p>${DOCTOR}</p></div>
    </div>
    <div class="info-grid">
      <div><strong>Tutor:</strong> ${p.ownerName}<br><strong>Fono:</strong> ${p.ownerPhone}</div>
      <div><strong>Paciente:</strong> ${p.name}<br><strong>Peso:</strong> ${consulta?.weight || '--'} kg
      ${p.alergias ? `<div class="alerta">ALÉRGICO A: ${p.alergias}</div>` : ''}</div>
    </div>
    ${isReceta ? `<h3>INDICACIONES:</h3><div class="med-box">${consulta.tratamiento}</div>` : `
      <h3>EXAMEN FÍSICO</h3>
      <div class="exam-grid">
        <div>T°: ${consulta.temp}°C</div><div>FC: ${consulta.fc}</div><div>FR: ${consulta.fr}</div>
        <div>TLLC: ${consulta.tllc}s</div><div>CC: ${consulta.cc}/5</div><div>Mucosas: ${consulta.mucosas}</div>
        <div>Linfonodos: ${consulta.linfonodos}</div><div>Hidratación: ${consulta.hidratacion}%</div><div>Oral: ${consulta.oral}</div>
      </div>
      <h3>ANAMNESIS</h3><p>${consulta.anamnesis}</p>
      <h3>DIAGNÓSTICO</h3><p>${consulta.diagnostico}</p>
      <h3>TRATAMIENTO</h3><p style="white-space:pre-wrap">${consulta.tratamiento}</p>
    `}
    <p style="font-size:10px;margin-top:40px">Concepción, Chile - ${new Date().toLocaleDateString()}</p>
  </body></html>`;
  const w = window.open("", "_blank"); w.document.write(html); w.document.close(); setTimeout(() => w.print(), 500);
};

// ─── COMPONENTE APP ────────────────────────────────────────────────
const EMPTY_C = { id: null, date: new Date().toISOString().split("T")[0], weight: "", temp: "", fc: "", fr: "", tllc: "", mucosas: "", cc: "3", linfonodos: "Normal", hidratacion: "0", oral: "Normal", anamnesis: "", diagnostico: "", tratamiento: "", proximoControl: "", consentimiento: false };

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
  const [cForm, setCForm] = useState(EMPTY_C);

  useEffect(() => {
    setIsClient(true);
    const p = localStorage.getItem("vet_v26_pro");
    const f = localStorage.getItem("fin_v26_pro");
    if (p) setPatients(JSON.parse(p));
    if (f) setFinances(JSON.parse(f));
  }, []);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem("vet_v26_pro", JSON.stringify(patients));
      localStorage.setItem("fin_v26_pro", JSON.stringify(finances));
    }
  }, [patients, finances, isClient]);

  const stats = useMemo(() => {
    const ing = finances.filter(f => f.tipo === "ingreso").reduce((a, b) => a + Number(b.monto), 0);
    const gas = finances.filter(f => f.tipo === "gasto").reduce((a, b) => a + Number(b.monto), 0);
    const history = patients.flatMap(p => p.history || []);
    const dataGraph = history.reduce((acc, h) => {
      const mes = h.date.slice(5, 7); acc[mes] = (acc[mes] || 0) + 1; return acc;
    }, {});
    return { neto: ing - gas, graph: Object.entries(dataGraph).map(([m, v]) => ({ mes: m, consultas: v })) };
  }, [finances, patients]);

  if (!isClient) return null;

  const activePat = patients.find(p => p.id === activePatId);
  const inp = { width: "100%", padding: "12px", border: "1.5px solid #d8e8d0", borderRadius: 12, marginBottom: 10, fontSize: "16px" };
  const btnStyle = { background: "#3a7a3a", color: "#fff", border: "none", borderRadius: 12, padding: "15px", fontWeight: "bold", cursor: "pointer" };

  return (
    <div style={{ fontFamily: "sans-serif", background: "#f0f2f0", minHeight: "100vh", color: "#1a331a" }}>
      {/* HEADER */}
      <header style={{ background: "#1a331a", color: "white", padding: "15px", position: "sticky", top: 0, zIndex: 100, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div><strong>{CLINICA}</strong><br/><small>{DOCTOR}</small></div>
        <nav style={{ display: "flex", gap: "8px" }}>
          {["inicio", "pacientes", "finanzas"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ background: tab === t ? "#3a7a3a" : "none", border: "none", color: "white", padding: "8px", borderRadius: "8px" }}>{t.toUpperCase()}</button>
          ))}
        </nav>
      </header>

      <main style={{ padding: "15px", maxWidth: "800px", margin: "0 auto" }}>
        {tab === "inicio" && (
          <div style={{ display: "grid", gap: "15px" }}>
            <div style={{ background: "white", padding: "20px", borderRadius: "20px", textAlign: "center" }}>
              <small>Balance Neto</small>
              <h2 style={{ margin: 0, color: "#27ae60" }}>${stats.neto.toLocaleString()}</h2>
            </div>
            <div style={{ background: "white", padding: "20px", borderRadius: "20px" }}>
              <h3>Consultas Mensuales</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={stats.graph}><CartesianGrid stroke="#eee"/><XAxis dataKey="mes"/><YAxis/><Tooltip/><Line type="monotone" dataKey="consultas" stroke="#3a7a3a" strokeWidth={3}/></LineChart>
              </ResponsiveContainer>
            </div>
            <button onClick={() => {
              const data = JSON.stringify({ patients, finances });
              const blob = new Blob([data], {type: "application/json"});
              const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "vet_backup_2026.json"; a.click();
            }} style={{ ...btnStyle, background: "#4a90e2" }}>Generar Respaldo Total</button>
          </div>
        )}

        {tab === "pacientes" && (
          <div>
            <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
              <input placeholder="Buscar mascota..." style={{ ...inp, marginBottom: 0 }} onChange={e => setSearch(e.target.value.toLowerCase())} />
              <button style={btnStyle} onClick={() => { setPForm({ name: "", species: "Perro", breed: "", weight: "", reproductivo: "Entero/a", alergias: "", ownerName: "", ownerPhone: "", ownerAddress: "" }); setActivePatId(null); setModal("paciente"); }}>+</button>
            </div>
            <div style={{ display: "grid", gap: "12px" }}>
              {patients.filter(p => p.name.toLowerCase().includes(search)).map(p => (
                <div key={p.id} style={{ background: "white", padding: "15px", borderRadius: "18px", borderLeft: p.alergias ? "8px solid #e74c3c" : "8px solid #3a7a3a" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <h3 style={{ margin: 0 }}>{SPECIES_ICO[p.species]} {p.name}</h3>
                    <button onClick={() => { setPForm(p); setActivePatId(p.id); setModal("paciente"); }} style={{ background: "none", border: "none", fontSize: "18px" }}>✏️</button>
                  </div>
                  <p style={{ margin: "5px 0", fontSize: "14px", color: "#666" }}>{p.ownerName} • {p.ownerPhone}</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "10px" }}>
                    <button style={btnStyle} onClick={() => { setActivePatId(p.id); setCForm({ ...EMPTY_C, id: Date.now(), weight: p.weight }); setModal("consulta"); }}>Nueva Consulta</button>
                    <button style={{ ...btnStyle, background: "#f0f5ef", color: "#3a7a3a" }} onClick={() => { setActivePatId(p.id); setModal("historial"); }}>Historial ({p.history?.length || 0})</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "finanzas" && (
          <div style={{ background: "white", padding: "20px", borderRadius: "20px" }}>
            <h3>Registro de Caja</h3>
            <input id="fD" placeholder="Descripción" style={inp} />
            <input id="fM" placeholder="Monto" type="number" style={inp} />
            <div style={{ display: "flex", gap: "10px" }}>
              <button style={{ ...btnStyle, flex: 1 }} onClick={() => {
                const d = document.getElementById("fD").value; const m = document.getElementById("fM").value;
                if(d && m) { setFinances([{ desc: d, monto: m, tipo: "ingreso", fecha: new Date().toLocaleDateString() }, ...finances]); document.getElementById("fD").value = ""; document.getElementById("fM").value = ""; }
              }}>+ Ingreso</button>
              <button style={{ ...btnStyle, flex: 1, background: "#e74c3c" }} onClick={() => {
                const d = document.getElementById("fD").value; const m = document.getElementById("fM").value;
                if(d && m) { setFinances([{ desc: d, monto: m, tipo: "gasto", fecha: new Date().toLocaleDateString() }, ...finances]); document.getElementById("fD").value = ""; document.getElementById("fM").value = ""; }
              }}>- Gasto</button>
            </div>
            <div style={{ marginTop: "20px" }}>
              {finances.map((f, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #eee" }}>
                  <span>{f.desc}</span><strong style={{ color: f.tipo === "ingreso" ? "green" : "red" }}>${Number(f.monto).toLocaleString()}</strong>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* MODAL CONSULTA (FULL) */}
      {modal === "consulta" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "10px" }}>
          <div style={{ background: "white", borderRadius: "25px", width: "100%", maxWidth: "700px", maxHeight: "95vh", overflowY: "auto", padding: "20px" }}>
            <h3 style={{ marginTop: 0 }}>Consulta: {activePat?.name}</h3>
            
            {/* CALCULADORA REINTEGRADA */}
            <div style={{ background: "#f0f7f0", padding: "12px", borderRadius: "15px", marginBottom: "15px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 0.5fr", gap: "5px" }}>
                <input placeholder="kg" style={{ ...inp, marginBottom: 0 }} value={calc.p} onChange={e => setCalc({...calc, p: e.target.value})} />
                <input placeholder="mg/kg" style={{ ...inp, marginBottom: 0 }} value={calc.d} onChange={e => setCalc({...calc, d: e.target.value})} />
                <input placeholder="mg/ml" style={{ ...inp, marginBottom: 0 }} value={calc.c} onChange={e => setCalc({...calc, c: e.target.value})} />
                <button style={{ ...btnStyle, padding: "5px" }} onClick={() => setCalc({...calc, r: (calc.p * calc.d / calc.c).toFixed(2)})}>OK</button>
              </div>
              <div style={{ display: "flex", gap: "5px", overflowX: "auto", marginTop: "10px", paddingBottom: "5px" }}>
                {DOSIS_REF.map((dr, i) => <button key={i} onClick={() => setCalc({...calc, d: dr.d, c: dr.c})} style={{ fontSize: "11px", whiteSpace: "nowrap", borderRadius: "5px", border: "1px solid #3a7a3a" }}>{dr.n}</button>)}
              </div>
              {calc.r > 0 && <div style={{ textAlign: "center", marginTop: "10px", fontWeight: "bold", color: "#3a7a3a" }}>Dosis: {calc.r} ml</div>}
            </div>

            {/* EXAMEN FÍSICO COMPLETO */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
              <input placeholder="Peso (kg)" style={inp} value={cForm.weight} onChange={e => setCForm({...cForm, weight: e.target.value})} />
              <input placeholder="T° (°C)" style={inp} value={cForm.temp} onChange={e => setCForm({...cForm, temp: e.target.value})} />
              <input placeholder="FC" style={inp} value={cForm.fc} onChange={e => setCForm({...cForm, fc: e.target.value})} />
              <input placeholder="FR" style={inp} value={cForm.fr} onChange={e => setCForm({...cForm, fr: e.target.value})} />
              <input placeholder="TLLC" style={inp} value={cForm.tllc} onChange={e => setCForm({...cForm, tllc: e.target.value})} />
              <input placeholder="CC (1-5)" style={inp} value={cForm.cc} onChange={e => setCForm({...cForm, cc: e.target.value})} />
              <input placeholder="Mucosas" style={inp} value={cForm.mucosas} onChange={e => setCForm({...cForm, mucosas: e.target.value})} />
              <input placeholder="Linfonodos" style={inp} value={cForm.linfonodos} onChange={e => setCForm({...cForm, linfonodos: e.target.value})} />
              <input placeholder="Hidratación %" style={inp} value={cForm.hidratacion} onChange={e => setCForm({...cForm, hidratacion: e.target.value})} />
            </div>
            <input placeholder="Cavidad Oral" style={inp} value={cForm.oral} onChange={e => setCForm({...cForm, oral: e.target.value})} />

            <textarea placeholder="Anamnesis" style={{ ...inp, height: "60px" }} value={cForm.anamnesis} onChange={e => setCForm({...cForm, anamnesis: e.target.value})} />
            
            <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginBottom: "10px" }}>
              {PLANTILLAS.map((pl, i) => <button key={i} onClick={() => setCForm({...cForm, tratamiento: pl.texto, diagnostico: pl.label})} style={{ fontSize: "12px", padding: "5px", borderRadius: "5px" }}>{pl.label}</button>)}
            </div>

            <input placeholder="Diagnóstico" style={inp} value={cForm.diagnostico} onChange={e => setCForm({...cForm, diagnostico: e.target.value})} />
            <textarea placeholder="Tratamiento e Indicaciones" style={{ ...inp, height: "120px", border: "2px solid #3a7a3a" }} value={cForm.tratamiento} onChange={e => setCForm({...cForm, tratamiento: e.target.value})} />
            
            <button style={{ ...btnStyle, width: "100%" }} onClick={() => {
              setPatients(patients.map(p => p.id === activePatId ? {...p, weight: cForm.weight || p.weight, history: [cForm, ...(p.history || [])]} : p));
              setModal(null);
            }}>Guardar Atención</button>
            <button onClick={() => setModal(null)} style={{ width: "100%", background: "none", border: "none", marginTop: "10px", color: "#666" }}>Cerrar</button>
          </div>
        </div>
      )}

      {/* MODAL HISTORIAL */}
      {modal === "historial" && activePat && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "white", padding: "20px", borderRadius: "25px", width: "95%", maxWidth: "600px", maxHeight: "85vh", overflowY: "auto" }}>
            <h3>Historial: {activePat.name}</h3>
            {activePat.history?.map((h, i) => (
              <div key={i} style={{ borderBottom: "1px solid #eee", padding: "15px 0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                  <strong>{h.date} - {h.diagnostico}</strong>
                  <div style={{ display: "flex", gap: "5px" }}>
                    <button onClick={() => window.open(`https://wa.me/56${activePat.ownerPhone.replace(/\D/g,"")}?text=Ficha ${activePat.name}: ${h.diagnostico}. Tratamiento: ${h.tratamiento}`)} style={{ background: "#25D366", color: "white", border: "none", padding: "5px 10px", borderRadius: "8px" }}>WA</button>
                    <button onClick={() => exportPDF(activePat, "historia", h)} style={{ ...btnStyle, padding: "5px 10px" }}>Ficha</button>
                    <button onClick={() => exportPDF(activePat, "receta", h)} style={{ ...btnStyle, background: "#4a90e2", padding: "5px 10px" }}>Receta</button>
                  </div>
                </div>
                <small style={{ color: "#666" }}>{h.tratamiento.substring(0, 60)}...</small>
              </div>
            ))}
            <button onClick={() => setModal(null)} style={{ ...btnStyle, width: "100%", marginTop: "15px", background: "#eee", color: "#333" }}>Cerrar</button>
          </div>
        </div>
      )}

      {/* MODAL PACIENTE (EDITAR/CREAR) */}
      {modal === "paciente" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "white", padding: "25px", borderRadius: "25px", width: "90%", maxWidth: "450px" }}>
            <h3>{activePatId ? "Editar Ficha" : "Nueva Ficha"}</h3>
            <input placeholder="Nombre Mascota" style={inp} value={pForm.name} onChange={e => setPForm({...pForm, name: e.target.value})} />
            <select style={inp} value={pForm.species} onChange={e => setPForm({...pForm, species: e.target.value})}>
              {Object.keys(SPECIES_ICO).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input placeholder="Nombre Tutor" style={inp} value={pForm.ownerName} onChange={e => setPForm({...pForm, ownerName: e.target.value})} />
            <input placeholder="WhatsApp (Ej: 987654321)" style={inp} value={pForm.ownerPhone} onChange={e => setPForm({...pForm, ownerPhone: e.target.value})} />
            <input placeholder="Alergias / Notas críticas" style={{ ...inp, border: "1.5px solid #e74c3c" }} value={pForm.alergias} onChange={e => setPForm({...pForm, alergias: e.target.value})} />
            <button style={{ ...btnStyle, width: "100%" }} onClick={() => {
              if(activePatId) setPatients(patients.map(p => p.id === activePatId ? {...p, ...pForm} : p));
              else setPatients([{ ...pForm, id: Date.now(), history: [] }, ...patients]);
              setModal(null);
            }}>Guardar Ficha</button>
            <button onClick={() => setModal(null)} style={{ width: "100%", background: "none", border: "none", marginTop: "10px" }}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}

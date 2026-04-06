import { useState, useEffect, useMemo, useRef } from “react”;
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from “recharts”;

// ─── CONFIGURACIÓN DE IDENTIDAD Y MARCA ─────────────────────────────
const DOCTOR      = “Dr. Diego Villalobos Palacios”;
const CLINICA     = “Veterinario a Domicilio”;
const LOGO_URL    = “/logo.png”;
const SPECIES_ICO = { Perro: “🐕”, Gato: “🐈”, Ave: “🦜”, Conejo: “🐇”, Reptil: “🦎”, Otro: “🐾” };

// ─── REFERENCIA RÁPIDA DE DOSIS (Vademécum Mini) ─────────────────────
const DOSIS_REF = [
{ n: “Meloxicam (0.2mg/kg)”, d: 0.2, c: 5 },
{ n: “Tramadol (2mg/kg)”, d: 2, c: 50 },
{ n: “Enrofloxacino (5mg/kg)”, d: 5, c: 50 },
{ n: “Cefalexina (20mg/kg)”, d: 20, c: 250 }
];

// ─── GENERADOR DE DOCUMENTOS PDF ───────────
const exportPDF = (p, type = “historia”, consulta = null) => {
const isReceta = type === “receta”;
const html = `<html><head><style> body{font-family: 'Segoe UI', sans-serif; padding:40px; color:#333; line-height:1.6;} .header{display:flex; justify-content:space-between; align-items:center; border-bottom:4px solid #1a331a; padding-bottom:15px; margin-bottom:25px;} .logo-img{height: 70px; width: auto;} .info-grid{background:#f9f9f9; padding:20px; border-radius:12px; margin-bottom:25px; display:grid; grid-template-columns: 1fr 1fr; gap:15px; border:1px solid #eee;} .alerta-alergia{color: #d32f2f; font-weight: bold; border: 2px solid #d32f2f; padding: 8px; margin-top: 10px; border-radius: 8px; text-align:center; background:#fff1f1;} .footer{margin-top:60px; text-align:center; font-size:11px; border-top:1px solid #ddd; padding-top:15px; color:#777;} h3{color:#1a331a; border-bottom:2px solid #3a7a3a; padding-bottom:5px; margin-top:30px;} .med-box{font-size:17px; white-space: pre-wrap; padding:25px; border:2px dashed #3a7a3a; border-radius:15px; background:#fff;} .legal{font-size:10px; color:#666; margin-top:30px; border:1px solid #eee; padding:10px;} .exam-grid{display:grid; grid-template-columns: 1fr 1fr 1fr; gap:10px; font-size:12px;} </style></head><body> <div class="header"> <img src="${LOGO_URL}" class="logo-img" onerror="this.style.display='none'"> <div style="text-align:right"> <h1 style="margin:0; color:#1a331a;">${isReceta ? 'RECETA MÉDICA' : 'FICHA CLÍNICA'}</h1> <h2 style="margin:0; color:#3a7a3a;">${CLINICA}</h2> <p style="margin:5px 0;">${DOCTOR}</p> </div> </div> <div class="info-grid"> <div><strong>Tutor:</strong> ${p.ownerName}<br><strong>WhatsApp:</strong> ${p.ownerPhone}<br><strong>Dirección:</strong> ${p.ownerAddress}</div> <div> <strong>Paciente:</strong> ${p.name}<br><strong>Especie/Raza:</strong> ${p.species} / ${p.breed}<br> <strong>Peso:</strong> ${consulta?.weight || p.weight || '--'} kg | <strong>Estado:</strong> ${p.reproductivo || 'Entero/a'} ${p.alergias ? `<div class="alerta-alergia">⚠️ ALÉRGICO A: ${p.alergias.toUpperCase()}</div>`: ''} </div> </div> ${isReceta ?`<h3>INDICACIONES:</h3><div class="med-box">${consulta.tratamiento}</div>`: `<h3>ANAMNESIS:</h3><p>${consulta.anamnesis || ‘Sin registros.’}</p>
<h3>EXAMEN FÍSICO Y CONSTANTES (${consulta.date})</h3>
<div class="exam-grid">
<div><strong>T°:</strong> ${consulta.temp || ‘–’} °C</div>
<div><strong>FC:</strong> ${consulta.fc || ‘–’} lpm</div>
<div><strong>FR:</strong> ${consulta.fr || ‘–’} rpm</div>
<div><strong>TLLC:</strong> ${consulta.tllc || ‘–’} seg</div>
<div><strong>Mucosas:</strong> ${consulta.mucosas || ‘–’}</div>
<div><strong>CC:</strong> ${consulta.cc || ‘–’}/5</div>
<div><strong>Linfonodos:</strong> ${consulta.linfonodos || ‘–’}</div>
<div><strong>Hidratación:</strong> ${consulta.hidratacion || ‘–’} %</div>
<div><strong>Cav. Oral:</strong> ${consulta.oral || ‘–’}</div>
</div>
<h3>DIAGNÓSTICO</h3><p>${consulta.diagnostico}</p>
<h3>PLAN TERAPÉUTICO</h3><p>${consulta.tratamiento}</p>`}

```
${!isReceta && consulta?.consentimiento ? `
  <div class="legal">
    <strong>CONSENTIMIENTO INFORMADO:</strong> El tutor declara haber sido informado de los riesgos y autoriza al ${DOCTOR} a proceder.
    <br><br><br>__________________________<br>Firma del Tutor
  </div>
` : ''}
<div class="footer"><p>Documento emitido en Concepción, Chile. ${consulta?.proximoControl ? `| Próximo Control: ${consulta.proximoControl}` : ''}</p></div>
```

  </body></html>`;
  const w = window.open("", "_blank"); w.document.write(html); w.document.close(); setTimeout(() => w.print(), 500);
};

export default function VetApp() {
const [tab, setTab] = useState(“inicio”);
const [patients, setPatients] = useState(() => (typeof window !== ‘undefined’ ? JSON.parse(localStorage.getItem(“vet_v25”) || “[]”) : []));
const [finances, setFinances] = useState(() => (typeof window !== ‘undefined’ ? JSON.parse(localStorage.getItem(“fin_v25”) || “[]”) : []));
const [modal, setModal] = useState(null);
const [activePat, setActivePat] = useState(null);
const [activeHistId, setActiveHistId] = useState(null);
const [search, setSearch] = useState(””);

// ESTADOS PARA FORMULARIOS
const [pForm, setPForm] = useState({ name: “”, species: “Perro”, breed: “”, weight: “”, reproductivo: “Entero/a”, alergias: “”, ownerName: “”, ownerPhone: “”, ownerAddress: “” });
const [cForm, setCForm] = useState({ id: null, date: new Date().toISOString().split(‘T’)[0], weight: “”, temp: “”, fc: “”, fr: “”, tllc: “”, mucosas: “”, cc: “3”, linfonodos: “”, hidratacion: “”, oral: “”, anamnesis: “”, diagnostico: “”, tratamiento: “”, proximoControl: “”, consentimiento: false });
const [vForm, setVForm] = useState({ nombre: “”, fecha: new Date().toISOString().split(‘T’)[0], refuerzo: “”, tipo: “vacuna” });
const [calc, setCalc] = useState({ p: “”, d: “”, c: “”, r: 0 });

useEffect(() => {
localStorage.setItem(“vet_v25”, JSON.stringify(patients));
localStorage.setItem(“fin_v25”, JSON.stringify(finances));
}, [patients, finances]);

// ─── LÓGICA DE ALERTAS Y RECORDATORIOS ─────────────────────────────
const alertas = useMemo(() => {
const hoy = new Date();
const limite = new Date(); limite.setDate(hoy.getDate() + 30);
return patients.flatMap(p => {
const recordatorios = […(p.vacunas || []), …(p.parasitos || [])];
// También incluimos los próximos controles clínicos de las consultas
if(p.history && p.history[0]?.proximoControl) {
recordatorios.push({ nombre: “Control Clínico”, refuerzo: p.history[0].proximoControl });
}
return recordatorios.filter(v => {
if(!v.refuerzo) return false;
const d = new Date(v.refuerzo);
return d >= hoy && d <= limite;
}).map(v => ({ …v, pName: p.name, phone: p.ownerPhone, tutor: p.ownerName }));
});
}, [patients]);

const stats = useMemo(() => {
const ing = finances.filter(f => f.tipo === “ingreso”).reduce((a, b) => a + Number(b.monto), 0);
const gas = finances.filter(f => f.tipo === “gasto”).reduce((a, b) => a + Number(b.monto), 0);
return { neto: ing - gas };
}, [finances]);

const exportFinanzasExcel = () => {
const csv = “Fecha,Descripcion,Monto,Tipo\n” + finances.map(f => `${f.fecha},${f.desc},${f.monto},${f.tipo}`).join(”\n”);
const blob = new Blob([csv], { type: ‘text/csv’ });
const url = window.URL.createObjectURL(blob);
const a = document.createElement(‘a’); a.setAttribute(‘href’, url); a.setAttribute(‘download’, ‘finanzas_vet.csv’); a.click();
};

const labelS = { fontSize: “11px”, fontWeight: “bold”, color: “#3a7a3a”, marginBottom: “3px”, display: “block” };
const inp = { width: “100%”, padding: “10px”, border: “1.5px solid #d8e8d0”, borderRadius: 10, marginBottom: 8, boxSizing: “border-box”, fontSize: “14px” };
const btnG = { background: “#3a7a3a”, color: “#fff”, border: “none”, borderRadius: 12, padding: “14px”, fontWeight: 700, cursor: “pointer” };

const filteredPatients = useMemo(() => {
const s = search.toLowerCase();
return patients.filter(p => p.name.toLowerCase().includes(s) || p.ownerName.toLowerCase().includes(s));
}, [patients, search]);

return (
<div style={{ fontFamily: “‘DM Sans’, sans-serif”, background: “#f4f7f4”, minHeight: “100vh” }}>
<header style={{ background: “#1a331a”, color: “#fff”, padding: “15px 25px”, display: “flex”, justifyContent: “space-between”, alignItems: “center”, position: “sticky”, top: 0, zIndex: 100 }}>
<div style={{ display: “flex”, alignItems: “center”, gap: 15 }}>
<img src={LOGO_URL} style={{ height: 45, width: “auto”, background: “#fff”, borderRadius: 8, padding: 3 }} alt=“Vet” />
<div><div style={{ fontWeight: 800, fontSize: 18 }}>{CLINICA}</div><div style={{ fontSize: 10, opacity: 0.8 }}>{DOCTOR}</div></div>
</div>
<nav style={{ display: “flex”, gap: 20 }}>
{[“inicio”, “pacientes”, “finanzas”].map(t => (
<button key={t} onClick={() => setTab(t)} style={{ background: “none”, border: “none”, color: “#fff”, cursor: “pointer”, opacity: tab === t ? 1 : 0.6 }}>{t.toUpperCase()}</button>
))}
</nav>
</header>

```
  <main style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
    {tab === "inicio" && (
      <>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15, marginBottom: 25 }}>
          <div style={{ background: "#fff", padding: 25, borderRadius: 25 }}>
            <small>Caja Neta</small><br/><strong style={{ fontSize: 26, color: "#27ae60" }}>${stats.neto.toLocaleString()}</strong>
          </div>
          <div style={{ background: "#fff", padding: 25, borderRadius: 25 }}>
            <small>Alertas Próximas</small><br/><strong style={{ fontSize: 26, color: "#e67e22" }}>{alertas.length}</strong>
          </div>
        </div>
        <div style={{ background: "#fff", padding: 25, borderRadius: 25 }}>
          <h3>📢 Recordatorios y Seguimientos (30 días)</h3>
          {alertas.length === 0 ? <p>No hay pendientes.</p> : alertas.map((a, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f0f0f0" }}>
              <div><strong>{a.pName}</strong> - {a.nombre}<br/><small>Refuerzo el: {a.refuerzo}</small></div>
              <button onClick={() => window.open(`https://wa.me/56${a.phone.replace(/\D/g,"")}?text=Hola ${a.tutor}, le recuerdo que ${a.pName} tiene programado su ${a.nombre} para el día ${a.refuerzo}. Saludos!`)} style={{ ...btnG, background: "#25D366", padding: "8px 15px", fontSize: 11 }}>WhatsApp</button>
            </div>
          ))}
        </div>
      </>
    )}

    {tab === "pacientes" && (
      <>
        <div style={{ display: "flex", gap: 12, marginBottom: 25 }}>
          <input placeholder="🔍 Buscar por mascota o tutor..." style={{ ...inp, flex: 1, marginBottom: 0 }} value={search} onChange={e => setSearch(e.target.value)} />
          <button onClick={() => { setPForm({ name: "", species: "Perro", breed: "", weight: "", reproductivo: "Entero/a", alergias: "", ownerName: "", ownerPhone: "", ownerAddress: "" }); setActivePat(null); setModal("paciente"); }} style={btnG}>+ Nueva Ficha</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
          {filteredPatients.map(p => (
            <div key={p.id} style={{ background: "#fff", padding: 25, borderRadius: 25, border: p.alergias ? "2px solid #ff4d4d" : "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 35 }}>{SPECIES_ICO[p.species] || "🐾"}</span>
                <button onClick={() => { setActivePat(p); setPForm(p); setModal("paciente"); }} style={{ background: "none", border: "none", color: "#3a7a3a", fontWeight: "bold", cursor: "pointer" }}>✏️ Editar</button>
              </div>
              <h3 style={{ margin: "5px 0" }}>{p.name}</h3>
              <p style={{ fontSize: 13, color: "#666" }}>Tutor: {p.ownerName} | {p.weight} kg</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
                <button onClick={() => { setActivePat(p); setActiveHistId(null); setCForm({ id: Date.now(), date: new Date().toISOString().split('T')[0], weight: p.weight, temp: "", fc: "", fr: "", tllc: "", mucosas: "", cc: "3", linfonodos: "", hidratacion: "", oral: "", anamnesis: "", diagnostico: "", tratamiento: "", proximoControl: "", consentimiento: false }); setModal("consulta"); }} style={btnG}>🩺 Consulta</button>
                <button onClick={() => { setActivePat(p); setVForm({ nombre: "", fecha: new Date().toISOString().split('T')[0], refuerzo: "", tipo: "vacuna" }); setModal("vacuna"); }} style={{ ...btnG, background: "#4a90e2" }}>💉 Vac/Parás</button>
                <button onClick={() => { setActivePat(p); setModal("historial"); }} style={{ ...btnG, gridColumn: "span 2", background: "#f0f5ef", color: "#3a7a3a" }}>📜 Historial</button>
              </div>
            </div>
          ))}
        </div>
      </>
    )}

    {tab === "finanzas" && (
      <div style={{ background: "#fff", padding: 30, borderRadius: 25 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3>💰 Contabilidad</h3>
            <button onClick={exportFinanzasExcel} style={{ background: "#1D6F42", color: "#fff", border: "none", padding: "8px 15px", borderRadius: 10, cursor: "pointer", fontSize: 12 }}>📥 Descargar Excel (.csv)</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10, marginTop: 15, marginBottom: 15 }}>
          <input placeholder="Descripción" style={inp} id="fDesc" />
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

  {/* MODAL: CONSULTA */}
  {modal === "consulta" && (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 10 }}>
      <div style={{ background: "#fff", borderRadius: 30, width: "100%", maxWidth: 750, maxHeight: "95vh", overflowY: "auto", padding: 25 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
            <h3>{activeHistId ? "Editar Atención" : "Atención"}: {activePat.name}</h3>
            <input type="date" value={cForm.date} style={{ ...inp, width: "auto" }} onChange={e => setCForm({...cForm, date: e.target.value})} />
        </div>
        
        <div style={{ background: "#f0f7f0", padding: 15, borderRadius: 15, marginBottom: 15 }}>
          <span style={labelS}>🧮 CALCULADORA Y DOSIS COMUNES</span>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 0.5fr", gap: 8 }}>
            <input placeholder="kg" style={inp} value={calc.p} onChange={e => setCalc({...calc, p: e.target.value})} />
            <input placeholder="mg/kg" style={inp} value={calc.d} onChange={e => setCalc({...calc, d: e.target.value})} />
            <input placeholder="mg/ml" style={inp} value={calc.c} onChange={e => setCalc({...calc, c: e.target.value})} />
            <button style={{...btnG, padding: "10px"}} onClick={() => setCalc({...calc, r: (calc.p * calc.d / calc.c).toFixed(2)})}>ok</button>
          </div>
          <div style={{ display: "flex", gap: 5, overflowX: "auto", marginTop: 10, paddingBottom: 5 }}>
            {DOSIS_REF.map((dr, i) => (
                <button key={i} onClick={() => setCalc({...calc, d: dr.d, c: dr.c})} style={{ background: "#fff", border: "1px solid #3a7a3a", borderRadius: 8, padding: "4px 8px", fontSize: 10, whiteSpace: "nowrap", cursor: "pointer" }}>{dr.n}</button>
            ))}
          </div>
          {calc.r > 0 && <p style={{ textAlign: "center", fontWeight: "bold", margin: "10px 0 0", color: "#1a331a" }}>Dosis: {calc.r} ml</p>}
        </div>

        <span style={labelS}>ANAMNESIS</span>
        <textarea style={{ ...inp, height: 40 }} value={cForm.anamnesis} onChange={e => setCForm({...cForm, anamnesis: e.target.value})} />

        <div style={{ border: "1px solid #d8e8d0", borderRadius: 15, padding: 15, marginBottom: 15 }}>
          <span style={labelS}>🩺 EXAMEN FÍSICO</span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            <div><small style={{fontSize: "9px"}}>Peso</small><input value={cForm.weight} style={inp} onChange={e => setCForm({...cForm, weight: e.target.value})} /></div>
            <div><small style={{fontSize: "9px"}}>T°</small><input value={cForm.temp} style={inp} onChange={e => setCForm({...cForm, temp: e.target.value})} /></div>
            <div><small style={{fontSize: "9px"}}>FC</small><input value={cForm.fc} style={inp} onChange={e => setCForm({...cForm, fc: e.target.value})} /></div>
            <div><small style={{fontSize: "9px"}}>FR</small><input value={cForm.fr} style={inp} onChange={e => setCForm({...cForm, fr: e.target.value})} /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 5 }}>
            <input placeholder="Mucosas" value={cForm.mucosas} style={inp} onChange={e => setCForm({...cForm, mucosas: e.target.value})} />
            <input placeholder="TLLC" value={cForm.tllc} style={inp} onChange={e => setCForm({...cForm, tllc: e.target.value})} />
            <select style={inp} value={cForm.cc} onChange={e => setCForm({...cForm, cc: e.target.value})}><option value="1">CC 1/5</option><option value="2">CC 2/5</option><option value="3">CC 3/5</option><option value="4">CC 4/5</option><option value="5">CC 5/5</option></select>
          </div>
          <input placeholder="Cavidad Oral / Otros" style={inp} value={cForm.oral} onChange={e => setCForm({...cForm, oral: e.target.value})} />
        </div>
        
        <input placeholder="Diagnóstico..." style={inp} value={cForm.diagnostico} onChange={e => setCForm({...cForm, diagnostico: e.target.value})} />
        <textarea style={{ ...inp, height: 70, border: "2px solid #3a7a3a" }} placeholder="Tratamiento..." value={cForm.tratamiento} onChange={e => setCForm({...cForm, tratamiento: e.target.value})} />
        
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 15 }}>
            <span style={labelS}>PRÓXIMO CONTROL:</span>
            <input type="date" style={{ ...inp, marginBottom: 0, flex: 1 }} value={cForm.proximoControl} onChange={e => setCForm({...cForm, proximoControl: e.target.value})} />
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 15 }}>
            <input type="checkbox" checked={cForm.consentimiento} onChange={e => setCForm({...cForm, consentimiento: e.target.checked})} />
            <span style={{ fontSize: 11 }}>Consentimiento Informado</span>
        </div>

        <button style={{ ...btnG, width: "100%" }} onClick={() => {
          if (activeHistId) {
              const newHist = activePat.history.map(h => h.id === activeHistId ? cForm : h);
              setPatients(patients.map(p => p.id === activePat.id ? {...p, history: newHist} : p));
          } else {
              setPatients(patients.map(p => p.id === activePat.id ? { ...p, weight: cForm.weight || p.weight, history: [cForm, ...(p.history || [])] } : p));
          }
          setModal(null);
        }}>Guardar Atención</button>
        <button onClick={() => setModal(null)} style={{ background: "none", border: "none", width: "100%", marginTop: 10, color: "#666" }}>Cancelar</button>
      </div>
    </div>
  )}

  {/* MODAL: PACIENTE */}
  {modal === "paciente" && (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", padding: 30, borderRadius: 30, width: "90%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto" }}>
        <h3 style={{ margin: 0 }}>{activePat ? "Editar Ficha" : "Nueva Ficha"}</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 15 }}>
          <input placeholder="Nombre Mascota" value={pForm.name} style={inp} onChange={e => setPForm({...pForm, name: e.target.value})} />
          <select value={pForm.species} style={inp} onChange={e => setPForm({...pForm, species: e.target.value})}><option>Perro</option><option>Gato</option><option>Ave</option><option>Otro</option></select>
          <input placeholder="Peso (Kg)" value={pForm.weight} type="number" style={inp} onChange={e => setPForm({...pForm, weight: e.target.value})} />
          <select value={pForm.reproductivo} style={inp} onChange={e => setPForm({...pForm, reproductivo: e.target.value})}><option>Entero/a</option><option>Castrado/a</option></select>
        </div>
        <input placeholder="Raza" value={pForm.breed} style={inp} onChange={e => setPForm({...pForm, breed: e.target.value})} />
        <input placeholder="Alergias" style={{ ...inp, border: "1.5px solid #ff4d4d" }} value={pForm.alergias} onChange={e => setPForm({...pForm, alergias: e.target.value})} />
        <input placeholder="Nombre Tutor" value={pForm.ownerName} style={inp} onChange={e => setPForm({...pForm, ownerName: e.target.value})} />
        <input placeholder="WhatsApp Tutor" value={pForm.ownerPhone} style={inp} onChange={e => setPForm({...pForm, ownerPhone: e.target.value})} />
        <input placeholder="Dirección" value={pForm.ownerAddress} style={inp} onChange={e => setPForm({...pForm, ownerAddress: e.target.value})} />
        <button style={{ ...btnG, width: "100%" }} onClick={() => { 
            if(activePat) setPatients(patients.map(p => p.id === activePat.id ? {...p, ...pForm} : p));
            else setPatients([{ ...pForm, id: Date.now(), history: [], vacunas: [], parasitos: [] }, ...patients]);
            setModal(null); 
        }}>Guardar Ficha</button>
        <button onClick={() => setModal(null)} style={{ background: "none", border: "none", width: "100%", marginTop: 10, cursor: "pointer", color: "#666" }}>Cerrar</button>
      </div>
    </div>
  )}

  {/* MODAL: VACUNA / PARÁSITOS (CON REFUERZO) */}
  {modal === "vacuna" && (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", padding: 30, borderRadius: 25, width: "90%", maxWidth: 400 }}>
        <h3>Vacuna / Desparasitación</h3>
        <span style={labelS}>TIPO DE PROCEDIMIENTO</span>
        <select style={inp} value={vForm.tipo} onChange={e => setVForm({...vForm, tipo: e.target.value})}>
            <option value="vacuna">💉 Vacuna</option>
            <option value="parasito">💊 Antiparasitario</option>
        </select>
        <span style={labelS}>NOMBRE PRODUCTO</span>
        <input placeholder="Ej: Óctuple, Bravecto, Milbemax" value={vForm.nombre} style={inp} onChange={e => setVForm({...vForm, nombre: e.target.value})} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
                <span style={labelS}>APLICADO HOY</span>
                <input type="date" value={vForm.fecha} style={inp} onChange={e => setVForm({...vForm, fecha: e.target.value})} />
            </div>
            <div>
                <span style={labelS}>PRÓX. REFUERZO</span>
                <input type="date" value={vForm.refuerzo} style={inp} onChange={e => setVForm({...vForm, refuerzo: e.target.value})} />
            </div>
        </div>
        <button style={{ ...btnG, width: "100%", marginTop: 10 }} onClick={() => {
          if(!vForm.nombre || !vForm.refuerzo) return alert("Ingresa nombre y fecha de refuerzo");
          const listKey = vForm.tipo === "vacuna" ? "vacunas" : "parasitos";
          setPatients(patients.map(p => p.id === activePat.id ? { ...p, [listKey]: [{...vForm, id: Date.now()}, ...(p[listKey] || [])] } : p));
          setModal(null);
        }}>Guardar Registro</button>
        <button onClick={() => setModal(null)} style={{ background: "none", border: "none", width: "100%", marginTop: 10, color: "#666" }}>Cancelar</button>
      </div>
    </div>
  )}

  {/* MODAL: HISTORIAL CLÍNICO */}
  {modal === "historial" && (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", padding: 35, borderRadius: 30, width: "90%", maxWidth: 650, maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3 style={{ margin: 0 }}>Historial: {activePat.name}</h3>
            <span style={{ fontSize: 12, background: "#f0f5ef", padding: "5px 10px", borderRadius: 10 }}>{activePat.history.length} atenciones</span>
        </div>

        {/* SECCIÓN PREVENTIVA RÁPIDA */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15, marginBottom: 20, background: "#f9f9f9", padding: 15, borderRadius: 15 }}>
            <div>
                <span style={labelS}>ÚLTIMAS VACUNAS</span>
                {activePat.vacunas?.length > 0 ? activePat.vacunas.slice(0,2).map((v,i) => <div key={i} style={{fontSize: 11}}>• {v.nombre} ({v.fecha})</div>) : <div style={{fontSize: 10}}>Sin registros</div>}
            </div>
            <div>
                <span style={labelS}>ÚLTIMOS PARÁSITOS</span>
                {activePat.parasitos?.length > 0 ? activePat.parasitos.slice(0,2).map((v,i) => <div key={i} style={{fontSize: 11}}>• {v.nombre} ({v.fecha})</div>) : <div style={{fontSize: 10}}>Sin registros</div>}
            </div>
        </div>

        {activePat.history.length === 0 ? <p>Sin registros clínicos.</p> : activePat.history.map((h, i) => (
          <div key={i} style={{ borderBottom: "1px solid #eee", padding: "15px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><strong>{h.date} — Dx: {h.diagnostico}</strong></div>
              <div style={{ display: "flex", gap: 5 }}>
                <button onClick={() => { setCForm(h); setActiveHistId(h.id); setModal("consulta"); }} style={{ ...btnG, padding: "5px 10px", background: "#f39c12", fontSize: 11 }}>✏️</button>
                <button onClick={() => exportPDF(activePat, "historia", h)} style={{ ...btnG, fontSize: 10, padding: "5px 10px" }}>Ficha</button>
                <button onClick={() => exportPDF(activePat, "receta", h)} style={{ ...btnG, fontSize: 10, padding: "5px 10px", background: "#4a90e2" }}>Receta</button>
              </div>
            </div>
          </div>
        ))}
        <button onClick={() => setModal(null)} style={{ ...btnG, width: "100%", marginTop: 20, background: "#eee", color: "#333" }}>Cerrar</button>
      </div>
    </div>
  )}
</div>
```

);
}

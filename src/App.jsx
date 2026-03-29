import { useState, useEffect, useMemo, useRef } from "react";

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
    h3{color:#1a331a; border-bottom:2px solid #3a7a3a; padding-bottom:5px; margin-top:20px;}
    .med-box{font-size:17px; white-space: pre-wrap; padding:25px; border:2px dashed #3a7a3a; border-radius:15px; background:#fff;}
    .exam-grid{display:grid; grid-template-columns: 1fr 1fr 1fr; gap:10px; font-size:12px; background:#fff; padding:10px; border-radius:8px;}
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
      <div><strong>Paciente:</strong> ${p.name} (${p.species})<br><strong>Raza:</strong> ${p.breed}<br><strong>Estado:</strong> ${consulta?.reproductivo || p.reproductivo || '--'}</div>
    </div>
    ${isReceta ? `<h3>INDICACIONES MEDICAMENTOSAS:</h3><div class="med-box">${consulta.tratamiento}</div>` : 
    `<h3>ANAMNESIS</h3><p>${consulta.anamnesis || 'Sin registros'}</p>
     <h3>CONSTANTES Y EXAMEN</h3>
     <div class="exam-grid">
       <div><strong>Peso:</strong> ${consulta.weight} kg</div><div><strong>T°:</strong> ${consulta.temp}°C</div><div><strong>FC/FR:</strong> ${consulta.fc}/${consulta.fr}</div>
       <div><strong>Mucosas:</strong> ${consulta.mucosas}</div><div><strong>TLLC:</strong> ${consulta.tllc}s</div><div><strong>CC:</strong> ${consulta.cc}/5</div>
       <div><strong>Hidratación:</strong> ${consulta.hidratacion}</div><div style="grid-column: span 2"><strong>Linfonodos:</strong> ${consulta.linfonodos}</div>
     </div>
     <h3>DIAGNÓSTICO</h3><p>${consulta.diagnostico}</p>
     <h3>PLAN TERAPÉUTICO</h3><p>${consulta.tratamiento}</p>`}
    <div class="footer"><p>Documento emitido en Concepción, Chile. Próximo control sugerido: ${consulta?.proximoControl || 'A necesidad'}</p></div>
  </body></html>`;
  const w = window.open("", "_blank"); w.document.write(html); w.document.close(); setTimeout(() => w.print(), 500);
};

export default function VetApp() {
  const [tab, setTab] = useState("inicio");
  const [patients, setPatients] = useState(() => JSON.parse(localStorage.getItem("vet_v25") || "[]"));
  const [finances, setFinances] = useState(() => JSON.parse(localStorage.getItem("fin_v25") || "[]"));
  const [modal, setModal] = useState(null);
  const [activePat, setActivePat] = useState(null);
  const [activeHistId, setActiveHistId] = useState(null); 
  const [search, setSearch] = useState("");

  useEffect(() => {
    localStorage.setItem("vet_v25", JSON.stringify(patients));
    localStorage.setItem("fin_v25", JSON.stringify(finances));
  }, [patients, finances]);

  // ALERTAS: Ahora incluye Vacunas, Parásitos y Controles Agendados
  const alertas = useMemo(() => {
    const hoy = new Date();
    const limite = new Date(); limite.setDate(hoy.getDate() + 30);
    return patients.flatMap(p => {
        const recordatorios = [...(p.vacunas || []), ...(p.parasitos || [])];
        if (p.history?.[0]?.proximoControl) recordatorios.push({ nombre: "Control Clínico", refuerzo: p.history[0].proximoControl });
        
        return recordatorios.filter(v => {
            const d = new Date(v.refuerzo); return d >= hoy && d <= limite;
        }).map(v => ({ ...v, pName: p.name, phone: p.ownerPhone, tutor: p.ownerName }));
    });
  }, [patients]);

  const stats = useMemo(() => {
    const ing = finances.filter(f => f.tipo === "ingreso").reduce((a, b) => a + Number(b.monto), 0);
    const gas = finances.filter(f => f.tipo === "gasto").reduce((a, b) => a + Number(b.monto), 0);
    return { neto: ing - gas };
  }, [finances]);

  // FORMS
  const [pForm, setPForm] = useState({ name: "", species: "Perro", breed: "", weight: "", reproductivo: "Entero/a", alergias: "", ownerName: "", ownerPhone: "", ownerAddress: "" });
  const [cForm, setCForm] = useState({ id: null, date: new Date().toISOString().split('T')[0], weight: "", temp: "", fc: "", fr: "", tllc: "", mucosas: "", linfonodos: "", hidratacion: "", oral: "", cc: "3", anamnesis: "", diagnostico: "", tratamiento: "", proximoControl: "", consentimiento: false });
  const [calc, setCalc] = useState({ p: "", d: "", c: "", r: 0 });

  const labelS = { fontSize: "11px", fontWeight: "bold", color: "#3a7a3a", marginBottom: "3px", display: "block" };
  const inp = { width: "100%", padding: "10px", border: "1.5px solid #d8e8d0", borderRadius: 10, marginBottom: 8, boxSizing: "border-box" };
  const btnG = { background: "#3a7a3a", color: "#fff", border: "none", borderRadius: 12, padding: "14px", fontWeight: 700, cursor: "pointer" };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#f4f7f4", minHeight: "100vh" }}>
      {/* HEADER */}
      <header style={{ background: "#1a331a", color: "#fff", padding: "15px 25px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ background: "#fff", color: "#1a331a", padding: "5px 10px", borderRadius: 8, fontWeight: 900 }}>V</div>
          <div><div style={{ fontWeight: 800, fontSize: 16 }}>VetDomicilio</div><div style={{ fontSize: 9, opacity: 0.8 }}>{DOCTOR}</div></div>
        </div>
        <nav style={{ display: "flex", gap: 15 }}>
          {["inicio", "pacientes", "finanzas"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 11, fontWeight: tab === t ? 800 : 400 }}>{t.toUpperCase()}</button>
          ))}
        </nav>
      </header>

      <main style={{ padding: 15, maxWidth: 800, margin: "0 auto" }}>
        {tab === "inicio" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
              <div style={{ background: "#fff", padding: 20, borderRadius: 20, boxShadow: "0 4px 6px rgba(0,0,0,0.02)" }}>
                <small style={{color: "#666"}}>Balance Neto</small><br/><strong style={{ fontSize: 22, color: "#27ae60" }}>${stats.neto.toLocaleString()}</strong>
              </div>
              <div style={{ background: "#fff", padding: 20, borderRadius: 20, boxShadow: "0 4px 6px rgba(0,0,0,0.02)" }}>
                <small style={{color: "#666"}}>Alertas 30d</small><br/><strong style={{ fontSize: 22, color: "#e67e22" }}>{alertas.length}</strong>
              </div>
            </div>
            <div style={{ background: "#fff", padding: 20, borderRadius: 20 }}>
              <h4 style={{marginTop: 0}}>🔔 Próximos Seguimientos</h4>
              {alertas.length === 0 ? <p style={{fontSize: 13, color: "#999"}}>Sin pendientes cercanos.</p> : alertas.map((a, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f9f9f9", alignItems: "center" }}>
                  <div><strong style={{fontSize: 14}}>{a.pName}</strong><br/><small style={{color: "#3a7a3a"}}>{a.nombre} • {a.refuerzo}</small></div>
                  <button onClick={() => window.open(`https://wa.me/56${a.phone.replace(/\D/g,"")}?text=Hola ${a.tutor}, te escribo del servicio veterinario para recordarte que ${a.pName} tiene programado su ${a.nombre} para el día ${a.refuerzo}.`)} style={{ ...btnG, background: "#25D366", padding: "8px 12px", fontSize: 10 }}>Recordar</button>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === "pacientes" && (
          <>
            <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
              <input placeholder="Buscar mascota o tutor..." style={{ ...inp, flex: 1, marginBottom: 0 }} value={search} onChange={e => setSearch(e.target.value)} />
              <button onClick={() => { setPForm({ name: "", species: "Perro", breed: "", weight: "", reproductivo: "Entero/a", alergias: "", ownerName: "", ownerPhone: "", ownerAddress: "" }); setActivePat(null); setModal("paciente"); }} style={{...btnG, padding: "0 20px"}}> + </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 15 }}>
              {patients.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.ownerName.toLowerCase().includes(search.toLowerCase())).map(p => (
                <div key={p.id} style={{ background: "#fff", padding: 20, borderRadius: 20, borderLeft: p.alergias ? "6px solid #ff4d4d" : "6px solid #3a7a3a" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ fontSize: 24 }}>{SPECIES_ICO[p.species] || "🐾"} <strong>{p.name}</strong></span>
                    <button onClick={() => { setActivePat(p); setPForm(p); setModal("paciente"); }} style={{ background: "none", border: "none", color: "#3a7a3a", cursor: "pointer" }}>⚙️</button>
                  </div>
                  <div style={{fontSize: 12, color: "#666", marginBottom: 15}}>
                    📍 {p.ownerAddress} <br/> 👤 {p.ownerName} • 📞 {p.ownerPhone}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    <button onClick={() => { setActivePat(p); setActiveHistId(null); setCForm({ ...cForm, id: Date.now(), weight: p.weight }); setModal("consulta"); }} style={{...btnG, padding: "10px", fontSize: 11}}>🩺 Consulta</button>
                    <button onClick={() => { setActivePat(p); setModal("vacuna"); }} style={{ ...btnG, background: "#4a90e2", padding: "10px", fontSize: 11 }}>💉 Prev.</button>
                    <button onClick={() => { setActivePat(p); setModal("historial"); }} style={{ ...btnG, background: "#f0f5ef", color: "#3a7a3a", padding: "10px", fontSize: 11 }}>📜 Hist.</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === "finanzas" && (
          <div style={{ background: "#fff", padding: 20, borderRadius: 20 }}>
            <h3 style={{marginTop: 0}}>💰 Registro de Caja</h3>
            <input placeholder="Descripción (Ej: Consulta Firulais)" style={inp} id="fDesc" />
            <div style={{display: "flex", gap: 10}}>
                <input placeholder="Monto" type="number" style={inp} id="fMonto" />
                <select style={inp} id="fTipo"><option value="ingreso">Ingreso</option><option value="gasto">Gasto</option></select>
            </div>
            <button style={{ ...btnG, width: "100%" }} onClick={() => {
              const d = document.getElementById("fDesc").value; const m = document.getElementById("fMonto").value; const t = document.getElementById("fTipo").value;
              if(d && m) { setFinances([{ desc: d, monto: m, tipo: t, fecha: new Date().toLocaleDateString() }, ...finances]); document.getElementById("fDesc").value = ""; document.getElementById("fMonto").value = ""; }
            }}>Guardar Transacción</button>
          </div>
        )}
      </main>

      {/* MODAL PACIENTE */}
      {modal === "paciente" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", padding: 25, borderRadius: 25, width: "90%", maxWidth: 450, maxHeight: "90vh", overflowY: "auto" }}>
            <h3>Ficha de Paciente</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <input placeholder="Nombre" value={pForm.name} style={inp} onChange={e => setPForm({...pForm, name: e.target.value})} />
              <select value={pForm.species} style={inp} onChange={e => setPForm({...pForm, species: e.target.value})}><option>Perro</option><option>Gato</option><option>Ave</option><option>Otro</option></select>
              <input placeholder="Peso Base" value={pForm.weight} style={inp} onChange={e => setPForm({...pForm, weight: e.target.value})} />
              <select value={pForm.reproductivo} style={inp} onChange={e => setPForm({...pForm, reproductivo: e.target.value})}><option>Entero/a</option><option>Castrado/a</option></select>
            </div>
            <input placeholder="Raza" value={pForm.breed} style={inp} onChange={e => setPForm({...pForm, breed: e.target.value})} />
            <input placeholder="Alergias (Opcional)" value={pForm.alergias} style={{...inp, border: "1.5px solid #ff4d4d"}} onChange={e => setPForm({...pForm, alergias: e.target.value})} />
            <hr/>
            <input placeholder="Nombre Tutor" value={pForm.ownerName} style={inp} onChange={e => setPForm({...pForm, ownerName: e.target.value})} />
            <input placeholder="WhatsApp (+569...)" value={pForm.ownerPhone} style={inp} onChange={e => setPForm({...pForm, ownerPhone: e.target.value})} />
            <input placeholder="Dirección Domicilio" value={pForm.ownerAddress} style={inp} onChange={e => setPForm({...pForm, ownerAddress: e.target.value})} />
            
            <button style={{ ...btnG, width: "100%", marginTop: 10 }} onClick={() => { 
                if(activePat) setPatients(patients.map(p => p.id === activePat.id ? {...p, ...pForm} : p));
                else setPatients([{ ...pForm, id: Date.now(), history: [], vacunas: [], parasitos: [] }, ...patients]);
                setModal(null); 
            }}>Guardar Paciente</button>
            <button onClick={() => setModal(null)} style={{ background: "none", border: "none", width: "100%", marginTop: 10, color: "#999" }}>Cancelar</button>
          </div>
        </div>
      )}

      {/* MODAL CONSULTA PROFESIONAL */}
      {modal === "consulta" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 10 }}>
          <div style={{ background: "#fff", borderRadius: 25, width: "100%", maxWidth: 600, maxHeight: "95vh", overflowY: "auto", padding: 20 }}>
            <h3 style={{margin: "0 0 15px 0"}}>Consulta: {activePat.name}</h3>
            
            <textarea placeholder="ANAMNESIS: Motivo, alimentación, conducta..." style={{...inp, height: 70}} value={cForm.anamnesis} onChange={e => setCForm({...cForm, anamnesis: e.target.value})} />

            <div style={{ border: "1.2px solid #3a7a3a33", borderRadius: 15, padding: 12, marginBottom: 12 }}>
              <span style={labelS}>PARAMETROS CLÍNICOS</span>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
                <input placeholder="Kg" value={cForm.weight} style={inp} onChange={e => setCForm({...cForm, weight: e.target.value})} />
                <input placeholder="T°C" value={cForm.temp} style={inp} onChange={e => setCForm({...cForm, temp: e.target.value})} />
                <input placeholder="FC" value={cForm.fc} style={inp} onChange={e => setCForm({...cForm, fc: e.target.value})} />
                <input placeholder="FR" value={cForm.fr} style={inp} onChange={e => setCForm({...cForm, fr: e.target.value})} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                <input placeholder="TLLC" value={cForm.tllc} style={inp} onChange={e => setCForm({...cForm, tllc: e.target.value})} />
                <select style={inp} value={cForm.cc} onChange={e => setCForm({...cForm, cc: e.target.value})}>
                    <option value="1">CC 1/5</option><option value="2">CC 2/5</option><option value="3">CC 3/5</option><option value="4">CC 4/5</option><option value="5">CC 5/5</option>
                </select>
                <input placeholder="Mucosas" value={cForm.mucosas} style={inp} onChange={e => setCForm({...cForm, mucosas: e.target.value})} />
              </div>
            </div>

            <input placeholder="Diagnóstico Presuntivo" style={inp} value={cForm.diagnostico} onChange={e => setCForm({...cForm, diagnostico: e.target.value})} />
            <textarea placeholder="PLAN TERAPÉUTICO (Receta)" style={{...inp, height: 80, border: "2px solid #3a7a3a"}} value={cForm.tratamiento} onChange={e => setCForm({...cForm, tratamiento: e.target.value})} />
            
            <div style={{display: "flex", gap: 10, alignItems: "center"}}>
                <span style={labelS}>PRÓXIMO CONTROL:</span>
                <input type="date" style={{...inp, marginBottom: 0}} value={cForm.proximoControl} onChange={e => setCForm({...cForm, proximoControl: e.target.value})} />
            </div>

            <button style={{ ...btnG, width: "100%", marginTop: 15 }} onClick={() => {
              const hist = activePat.history || [];
              setPatients(patients.map(p => p.id === activePat.id ? { ...p, weight: cForm.weight, history: [cForm, ...hist] } : p));
              setModal(null);
            }}>Finalizar Consulta</button>
          </div>
        </div>
      )}

      {/* HISTORIAL E IVENTARIOS (Mantienen lógica previa pero con estilos v25) */}
      {modal === "historial" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", padding: 25, borderRadius: 25, width: "90%", maxWidth: 500, maxHeight: "80vh", overflowY: "auto" }}>
            <h3>Historial de {activePat.name}</h3>
            {activePat.history.map((h, i) => (
              <div key={i} style={{ borderBottom: "1px solid #eee", padding: "10px 0", display: "flex", justifyContent: "space-between" }}>
                <div><strong>{h.date}</strong><br/><small>{h.diagnostico}</small></div>
                <button onClick={() => exportPDF(activePat, "receta", h)} style={{...btnG, padding: "5px 10px", fontSize: 10}}>PDF Receta</button>
              </div>
            ))}
            <button onClick={() => setModal(null)} style={{ ...btnG, width: "100%", marginTop: 15, background: "#eee", color: "#666" }}>Cerrar</button>
          </div>
        </div>
      )}

      {modal === "vacuna" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", padding: 25, borderRadius: 25, width: "90%", maxWidth: 350 }}>
            <h3>Vacuna / Antiparasitario</h3>
            <input placeholder="Nombre (Ej: Triple Felina)" style={inp} id="vNom" />
            <label style={labelS}>Fecha Refuerzo:</label>
            <input type="date" style={inp} id="vRef" />
            <button style={{ ...btnG, width: "100%" }} onClick={() => {
              const n = document.getElementById("vNom").value; const r = document.getElementById("vRef").value;
              setPatients(patients.map(p => p.id === activePat.id ? { ...p, vacunas: [{nombre: n, refuerzo: r}, ...(p.vacunas || [])] } : p));
              setModal(null);
            }}>Registrar</button>
          </div>
        </div>
      )}
    </div>
  );
}

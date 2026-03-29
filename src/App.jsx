import { useState, useEffect, useMemo } from "react";

// ─── CONFIGURACIÓN DE MARCA (DR. DIEGO VILLALOBOS) ──────────────────
const DOCTOR      = "Dr. Diego Villalobos Palacios";
const LOGO_URL    = "/logo.png"; // Asegúrate de tener tu logo en la carpeta public
const SPECIES_ICO = { Perro: "🐕", Gato: "🐈", Ave: "🦜", Conejo: "🐇", Reptil: "🦎", Otro: "🐾" };

// ─── HELPERS PROFESIONALES (PDF & WHATSAPP) ─────────────────────────
const exportPDF = (p, type = "historia", consulta = null) => {
  const isReceta = type === "receta";
  const content = isReceta ? `
    <div style="min-height:400px;">
      <h3 style="color:#1a331a; border-bottom:1px solid #1a331a;">RECETA MÉDICA</h3>
      <p style="white-space: pre-wrap; font-size:16px;">${consulta.tratamiento}</p>
    </div>
  ` : `
    <h3 style="color:#1a331a; border-bottom:1px solid #1a331a;">HISTORIAL CLÍNICO</h3>
    ${p.history.map(h => `
      <div style="margin-bottom:20px; border-bottom:1px solid #eee; padding-bottom:10px;">
        <p><strong>Fecha:</strong> ${h.date} | <strong>Peso:</strong> ${h.weight}kg | <strong>T°:</strong> ${h.temp}°C</p>
        <p><strong>Constantes:</strong> FC: ${h.fc} | FR: ${h.fr} | TLLC: ${h.tllc}s</p>
        <p><strong>Examen Físico:</strong> ${h.examenFisico}</p>
        <p><strong>Dx:</strong> ${h.diagnostico}</p>
        <p><strong>Plan:</strong> ${h.tratamiento}</p>
      </div>
    `).join("")}
  `;

  const html = `<html><head><style>
    body{font-family:Arial, sans-serif; padding:40px; color:#333;}
    .header{display:flex; justify-content:space-between; border-bottom:4px solid #3a7a3a; padding-bottom:10px; margin-bottom:20px;}
    .info{background:#f4f7f4; padding:15px; border-radius:10px; margin-bottom:20px;}
    .footer{margin-top:50px; text-align:center; font-size:12px; border-top:1px solid #ccc; padding-top:10px;}
  </style></head><body>
    <div class="header">
      <div><h1>${isReceta ? 'RECETA' : 'FICHA CLÍNICA'}</h1><p>Paciente: <strong>${p.name}</strong></p></div>
      <div style="text-align:right"><h2>${DOCTOR}</h2><p>Médico Veterinario</p></div>
    </div>
    <div class="info">
      Tutor: ${p.ownerName} | Tel: ${p.ownerPhone} | Dirección: ${p.ownerAddress}<br>
      Especie/Raza: ${p.species} ${p.breed} | Edad: ${p.age} años
    </div>
    ${content}
    <div class="footer"><p>Documento generado por VetManager Pro - Dr. Diego Villalobos</p></div>
  </body></html>`;
  
  const w = window.open("", "_blank");
  w.document.write(html); w.document.close(); setTimeout(() => w.print(), 500);
};

// ─── ESTILOS UI ─────────────────────────────────────────────────────
const inp = { width: "100%", padding: "10px", border: "1.5px solid #d8e8d0", borderRadius: 10, marginBottom: 10, boxSizing: "border-box" };
const btnG = { background: "#3a7a3a", color: "#fff", border: "none", borderRadius: 10, padding: "12px 15px", fontWeight: 700, cursor: "pointer" };
const labelS = { fontSize: "11px", fontWeight: "bold", color: "#3a7a3a", marginBottom: "3px", display: "block" };

// ─── APP PRINCIPAL ──────────────────────────────────────────────────
export default function VetApp() {
  const [tab, setTab] = useState("inicio");
  const [patients, setPatients] = useState(() => JSON.parse(localStorage.getItem("vet_final_diego") || "[]"));
  const [finances, setFinances] = useState(() => JSON.parse(localStorage.getItem("vet_finanzas_diego") || "[]"));
  const [modal, setModal] = useState(null);
  const [activePat, setActivePat] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    localStorage.setItem("vet_final_diego", JSON.stringify(patients));
    localStorage.setItem("vet_finanzas_diego", JSON.stringify(finances));
  }, [patients, finances]);

  // Lógica de Alertas de Vacunación (30 días)
  const alertasVacunas = useMemo(() => {
    const hoy = new Date();
    const limite = new Date(); limite.setDate(hoy.getDate() + 30);
    let list = [];
    patients.forEach(p => (p.vacunas || []).forEach(v => {
      const ref = new Date(v.refuerzo);
      if (ref >= hoy && ref <= limite) list.push({ pName: p.name, vName: v.nombre, ref: v.refuerzo, phone: p.ownerPhone, tutor: p.ownerName });
    }));
    return list;
  }, [patients]);

  // Totales Financieros
  const stats = useMemo(() => {
    const ing = finances.filter(f => f.tipo === "ingreso").reduce((a, b) => a + Number(b.monto), 0);
    const gas = finances.filter(f => f.tipo === "gasto").reduce((a, b) => a + Number(b.monto), 0);
    return { ing, gas, neto: ing - gas };
  }, [finances]);

  // Form States
  const [pForm, setPForm] = useState({ name: "", species: "Perro", breed: "", age: "", ownerName: "", ownerPhone: "", ownerAddress: "", notes: "" });
  const [cForm, setCForm] = useState({ date: new Date().toISOString().split('T')[0], weight: "", temp: "", fc: "", fr: "", tllc: "", examenFisico: "", diagnostico: "", tratamiento: "", consentimiento: false });
  const [calc, setCalc] = useState({ p: "", d: "", c: "", r: 0 });

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#f0f4f0", minHeight: "100vh" }}>
      {/* HEADER DE MARCA */}
      <header style={{ background: "#1a331a", color: "#fff", padding: "15px 25px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src={LOGO_URL} alt="Logo" style={{ width: 40, height: 40, borderRadius: "50%", background: "#fff" }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>{DOCTOR}</div>
            <div style={{ fontSize: 10, opacity: 0.8 }}>Médico Veterinario • Concepción</div>
          </div>
        </div>
        <nav style={{ display: "flex", gap: 15 }}>
          <button onClick={() => setTab("inicio")} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontWeight: tab === "inicio" ? 800 : 400 }}>Inicio</button>
          <button onClick={() => setTab("pacientes")} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontWeight: tab === "pacientes" ? 800 : 400 }}>Pacientes</button>
          <button onClick={() => setTab("finanzas")} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontWeight: tab === "finanzas" ? 800 : 400 }}>Finanzas</button>
        </nav>
      </header>

      <main style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
        
        {/* VISTA: INICIO (ALERTAS) */}
        {tab === "inicio" && (
          <div>
            <h2 style={{ color: "#1a331a" }}>Bienvenido, Diego</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15, marginBottom: 20 }}>
              <div style={{ background: "#fff", padding: 20, borderRadius: 20, borderLeft: "5px solid #27ae60" }}>
                <small>Saldo Neto Actual</small><br/><strong style={{ fontSize: 24 }}>${stats.neto.toLocaleString()}</strong>
              </div>
              <div style={{ background: "#fff", padding: 20, borderRadius: 20, borderLeft: "5px solid #e67e22" }}>
                <small>Vacunas este mes</small><br/><strong style={{ fontSize: 24 }}>{alertasVacunas.length}</strong>
              </div>
            </div>

            <div style={{ background: "#fff", padding: 20, borderRadius: 20 }}>
              <h3>🔔 Recordatorios de Refuerzo</h3>
              {alertasVacunas.map((a, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #eee" }}>
                  <div><strong>{a.pName}</strong> ({a.vName})<br/><small>Tutor: {a.tutor} | Fecha: {a.ref}</small></div>
                  <button onClick={() => window.open(`https://wa.me/56${a.phone.replace(/\D/g,"")}?text=Hola ${a.tutor}, le escribe el ${DOCTOR}...`)} style={{ ...btnG, background: "#25D366", fontSize: 12 }}>WhatsApp</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VISTA: PACIENTES */}
        {tab === "pacientes" && (
          <>
            <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
              <input placeholder="🔍 Buscar por mascota o tutor..." style={{ ...inp, flex: 1 }} onChange={e => setSearch(e.target.value)} />
              <button onClick={() => setModal("paciente")} style={btnG}>+ Nuevo Paciente</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 15 }}>
              {patients.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.ownerName.toLowerCase().includes(search.toLowerCase())).map(p => (
                <div key={p.id} style={{ background: "#fff", padding: 20, borderRadius: 20, boxShadow: "0 4px 10px rgba(0,0,0,0.05)", border: p.notes ? "2px solid #ff4d4d" : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 30 }}>{SPECIES_ICO[p.species]}</span>
                    <button onClick={() => exportPDF(p)} style={{ ...btnG, padding: "5px 10px", fontSize: 10 }}>Ficha PDF</button>
                  </div>
                  <h3 style={{ margin: "10px 0 5px" }}>{p.name}</h3>
                  <p style={{ fontSize: 12, color: "#666" }}>{p.breed} | {p.ownerName}</p>
                  {p.notes && <div style={{ color: "#d32f2f", fontSize: 10, fontWeight: "bold", margin: "5px 0" }}>⚠️ {p.notes}</div>}
                  
                  <div style={{ display: "flex", gap: 5, marginTop: 15 }}>
                    <button onClick={() => { setActivePat(p); setModal("consulta"); }} style={{ ...btnG, flex: 1, fontSize: 11 }}>🩺 Consulta</button>
                    <button onClick={() => { setActivePat(p); setModal("historial"); }} style={{ ...btnG, background: "#f0f5ef", color: "#3a7a3a", flex: 1, fontSize: 11 }}>📜 Historia</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* VISTA: FINANZAS */}
        {tab === "finanzas" && (
          <div style={{ background: "#fff", padding: 25, borderRadius: 20 }}>
            <h3>Gestión de Caja</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
              <input placeholder="Descripción" style={inp} id="fDesc" />
              <input placeholder="Monto" type="number" style={inp} id="fMonto" />
              <select style={inp} id="fTipo"><option value="ingreso">Ingreso</option><option value="gasto">Gasto</option></select>
            </div>
            <button style={{ ...btnG, width: "100%" }} onClick={() => {
              const d = document.getElementById("fDesc").value;
              const m = document.getElementById("fMonto").value;
              const t = document.getElementById("fTipo").value;
              if (d && m) {
                setFinances([{ desc: d, monto: m, tipo: t, fecha: new Date().toLocaleDateString() }, ...finances]);
                document.getElementById("fDesc").value = ""; document.getElementById("fMonto").value = "";
              }
            }}>Registrar Movimiento</button>
            <hr style={{ margin: "25px 0", opacity: 0.2 }} />
            {finances.map((f, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #eee" }}>
                <span>{f.desc} <small>({f.fecha})</small></span>
                <strong style={{ color: f.tipo === "ingreso" ? "#27ae60" : "#c0392b" }}>{f.tipo === "ingreso" ? "+" : "-"}${Number(f.monto).toLocaleString()}</strong>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* MODAL: CONSULTA + EXAMEN FÍSICO + CALCULADORA */}
      {modal === "consulta" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zInterx: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 15 }}>
          <div style={{ background: "#fff", borderRadius: 25, width: "100%", maxWidth: 700, maxHeight: "95vh", overflowY: "auto", padding: 30 }}>
            <h2 style={{ marginTop: 0 }}>Nueva Consulta: {activePat.name}</h2>
            
            {/* CALCULADORA EXPRESS */}
            <div style={{ background: "#e8f0e8", padding: 15, borderRadius: 15, marginBottom: 20 }}>
              <span style={labelS}>🧮 CALCULADORA DE DOSIS (mg/kg)</span>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
                <input placeholder="Kg" style={inp} onChange={e => setCalc({...calc, p: e.target.value})} />
                <input placeholder="mg/kg" style={inp} onChange={e => setCalc({...calc, d: e.target.value})} />
                <input placeholder="mg/ml" style={inp} onChange={e => setCalc({...calc, c: e.target.value})} />
                <button style={btnG} onClick={() => setCalc({...calc, r: (calc.p * calc.d / calc.c).toFixed(2)})}>CALC</button>
              </div>
              {calc.r > 0 && <div style={{ textAlign: "center", fontWeight: "bold", marginTop: 5 }}>Dosis: {calc.r} ml</div>}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
              <div><span style={labelS}>Peso</span><input style={inp} onChange={e => setCForm({...cForm, weight: e.target.value})} /></div>
              <div><span style={labelS}>T°</span><input style={inp} onChange={e => setCForm({...cForm, temp: e.target.value})} /></div>
              <div><span style={labelS}>FC</span><input style={inp} onChange={e => setCForm({...cForm, fc: e.target.value})} /></div>
              <div><span style={labelS}>TLLC</span><input style={inp} onChange={e => setCForm({...cForm, tllc: e.target.value})} /></div>
            </div>

            <span style={labelS}>Examen Físico (Piel, Mucosas, Linfonodos, Abdomen...)</span>
            <textarea style={{ ...inp, height: 80 }} placeholder="Escribe hallazgos por sistemas..." onChange={e => setCForm({...cForm, examenFisico: e.target.value})} />
            
            <span style={labelS}>Diagnóstico</span>
            <input style={inp} onChange={e => setCForm({...cForm, diagnostico: e.target.value})} />
            
            <span style={labelS}>Tratamiento e Indicaciones (Para la receta)</span>
            <textarea style={{ ...inp, height: 100, border: "2px solid #3a7a3a" }} onChange={e => setCForm({...cForm, tratamiento: e.target.value})} />

            <div style={{ background: "#fff8e1", padding: 10, borderRadius: 10, display: "flex", alignItems: "center", gap: 10, fontSize: 11, marginBottom: 15 }}>
              <input type="checkbox" onChange={e => setCForm({...cForm, consentimiento: e.target.checked})} />
              <label><strong>Consentimiento:</strong> El tutor acepta procedimientos y tratamiento descrito.</label>
            </div>

            <button style={{ ...btnG, width: "100%" }} onClick={() => {
              setPatients(patients.map(p => p.id === activePat.id ? { ...p, history: [cForm, ...(p.history || [])] } : p));
              setModal(null);
            }}>Finalizar y Guardar Consulta</button>
            <button onClick={() => setModal(null)} style={{ background: "none", border: "none", width: "100%", marginTop: 10 }}>Cerrar</button>
          </div>
        </div>
      )}

      {/* MODAL: HISTORIAL / RECETAS */}
      {modal === "historial" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 25, width: "90%", maxWidth: 600, maxHeight: "80vh", overflowY: "auto", padding: 30 }}>
            <h3>Historial Clínico: {activePat.name}</h3>
            {activePat.history.length === 0 ? <p>No hay consultas registradas.</p> : activePat.history.map((h, i) => (
              <div key={i} style={{ borderBottom: "1px solid #eee", padding: "15px 0" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <strong>{h.date} - Dx: {h.diagnostico}</strong>
                  <button onClick={() => exportPDF(activePat, "receta", h)} style={{ ...btnG, fontSize: 10, padding: "5px 10px" }}>Imprimir Receta</button>
                </div>
                <p style={{ fontSize: 12, color: "#666" }}>{h.tratamiento}</p>
              </div>
            ))}
            <button onClick={() => setModal(null)} style={{ ...btnG, width: "100%", marginTop: 20, background: "#eee", color: "#333" }}>Cerrar</button>
          </div>
        </div>
      )}

      {/* MODAL: NUEVO PACIENTE */}
      {modal === "paciente" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 25, width: "90%", maxWidth: 450, padding: 30 }}>
            <h3>Nueva Ficha</h3>
            <span style={labelS}>Nombre Mascota</span><input style={inp} onChange={e => setPForm({...pForm, name: e.target.value})} />
            <span style={labelS}>Especie</span><select style={inp} onChange={e => setPForm({...pForm, species: e.target.value})}>
              {Object.keys(SPECIES_ICO).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <span style={labelS}>Tutor (Nombre Completo)</span><input style={inp} onChange={e => setPForm({...pForm, ownerName: e.target.value})} />
            <span style={labelS}>WhatsApp (9XXXXXXXX)</span><input style={inp} onChange={e => setPForm({...pForm, ownerPhone: e.target.value})} />
            <span style={labelS}>Dirección Domicilio</span><input style={inp} onChange={e => setPForm({...pForm, ownerAddress: e.target.value})} />
            <span style={labelS}>Alergias / Notas Críticas</span><textarea style={{ ...inp, borderColor: "red" }} onChange={e => setPForm({...pForm, notes: e.target.value})} />
            <button style={{ ...btnG, width: "100%" }} onClick={() => {
              setPatients([...patients, { ...pForm, id: Date.now(), history: [], vacunas: [] }]);
              setModal(null);
            }}>Crear Ficha Médica</button>
          </div>
        </div>
      )}
    </div>
  );
}

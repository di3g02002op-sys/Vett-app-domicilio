import { useState, useEffect, useMemo } from "react";

// ─── CONFIGURACIÓN DE MARCA ─────────────────────────────────────────
const DOCTOR      = "Dr. Diego Villalobos Palacios";
const SPECIES_ICO = { Perro: "🐕", Gato: "🐈", Ave: "🦜", Conejo: "🐇", Reptil: "🦎", Otro: "🐾" };

// ─── GENERADOR DE DOCUMENTOS PDF (FICHA Y RECETA) ───────────────────
const exportPDF = (p, type = "historia", consulta = null) => {
  const isReceta = type === "receta";
  const html = `<html><head><style>
    body{font-family: 'Segoe UI', Arial, sans-serif; padding:40px; color:#333; line-height:1.6;}
    .header{display:flex; justify-content:space-between; border-bottom:4px solid #3a7a3a; padding-bottom:15px; margin-bottom:25px;}
    .info-grid{background:#f9f9f9; padding:20px; border-radius:12px; margin-bottom:25px; display:grid; grid-template-columns: 1fr 1fr; gap:15px; border:1px solid #eee;}
    .footer{margin-top:60px; text-align:center; font-size:11px; border-top:1px solid #ddd; padding-top:15px; color:#777;}
    h3{color:#1a331a; border-bottom:2px solid #3a7a3a; padding-bottom:5px; margin-top:30px;}
    .med-box{font-size:17px; white-space: pre-wrap; padding:25px; border:2px dashed #3a7a3a; border-radius:15px; background:#fff;}
  </style></head><body>
    <div class="header">
      <div><h1 style="margin:0; color:#1a331a;">${isReceta ? 'RECETA MÉDICA' : 'FICHA CLÍNICA'}</h1><p style="margin:5px 0;">Paciente: <strong>${p.name}</strong></p></div>
      <div style="text-align:right"><h2 style="margin:0; color:#3a7a3a;">${DOCTOR}</h2><p style="margin:5px 0;">Médico Veterinario</p></div>
    </div>
    <div class="info-grid">
      <div><strong>Tutor:</strong> ${p.ownerName}<br><strong>WhatsApp:</strong> ${p.ownerPhone}<br><strong>Dirección:</strong> ${p.ownerAddress}</div>
      <div><strong>Especie/Raza:</strong> ${p.species} / ${p.breed}<br><strong>Edad:</strong> ${p.age} años<br><strong>Peso:</strong> ${p.weight || '--'} kg</div>
    </div>
    ${isReceta ? `
      <h3>INDICACIONES Y TRATAMIENTO:</h3>
      <div class="med-box">${consulta.tratamiento}</div>
    ` : `
      <h3>HISTORIAL CLÍNICO DETALLADO</h3>
      ${p.history.map(h => `
        <div style="margin-bottom:25px; padding-bottom:15px; border-bottom:1px solid #eee;">
          <p><strong>Fecha:</strong> ${h.date} | <strong>T°:</strong> ${h.temp}°C | <strong>FC:</strong> ${h.fc} | <strong>FR:</strong> ${h.fr} | <strong>TLLC:</strong> ${h.tllc}s</p>
          <p><strong>Examen Físico:</strong> ${h.examenFisico}</p>
          <p><strong>Diagnóstico:</strong> ${h.diagnostico}</p>
          <p><strong>Plan Terapéutico:</strong> ${h.tratamiento}</p>
        </div>
      `).join("")}
    `}
    <div class="footer"><p>Documento emitido por VetManager Pro - Gestión Clínica Veterinaria</p></div>
  </body></html>`;
  const w = window.open("", "_blank"); w.document.write(html); w.document.close(); setTimeout(() => w.print(), 500);
};

// ─── APLICACIÓN PRINCIPAL ───────────────────────────────────────────
export default function VetApp() {
  const [tab, setTab] = useState("inicio");
  const [patients, setPatients] = useState(() => JSON.parse(localStorage.getItem("vet_master_v12") || "[]"));
  const [finances, setFinances] = useState(() => JSON.parse(localStorage.getItem("vet_fin_v12") || "[]"));
  const [modal, setModal] = useState(null);
  const [activePat, setActivePat] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    localStorage.setItem("vet_master_v12", JSON.stringify(patients));
    localStorage.setItem("vet_fin_v12", JSON.stringify(finances));
  }, [patients, finances]);

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
    return { ing, gas, neto: ing - gas };
  }, [finances]);

  // Estados Form
  const [pForm, setPForm] = useState({ name: "", species: "Perro", breed: "", age: "", ownerName: "", ownerPhone: "", ownerAddress: "", notes: "" });
  const [cForm, setCForm] = useState({ date: new Date().toISOString().split('T')[0], weight: "", temp: "", fc: "", fr: "", tllc: "", examenFisico: "", diagnostico: "", tratamiento: "", consentimiento: false });
  const [vForm, setVForm] = useState({ nombre: "", fecha: "", refuerzo: "" });
  const [calc, setCalc] = useState({ p: "", d: "", c: "", r: 0 });

  const labelS = { fontSize: "11px", fontWeight: "bold", color: "#3a7a3a", marginBottom: "3px", display: "block" };
  const inp = { width: "100%", padding: "12px", border: "1.5px solid #d8e8d0", borderRadius: 12, marginBottom: 12, boxSizing: "border-box" };
  const btnG = { background: "#3a7a3a", color: "#fff", border: "none", borderRadius: 12, padding: "14px", fontWeight: 700, cursor: "pointer" };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#f4f7f4", minHeight: "100vh" }}>
      <header style={{ background: "#1a331a", color: "#fff", padding: "15px 25px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ background: "#fff", color: "#1a331a", borderRadius: "50%", width: 35, height: 35, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>DV</div>
          <div style={{ fontWeight: 800 }}>{DOCTOR}</div>
        </div>
        <nav style={{ display: "flex", gap: 20 }}>
          <button onClick={() => setTab("inicio")} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", opacity: tab === "inicio" ? 1 : 0.7 }}>Inicio</button>
          <button onClick={() => setTab("pacientes")} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", opacity: tab === "pacientes" ? 1 : 0.7 }}>Pacientes</button>
          <button onClick={() => setTab("finanzas")} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", opacity: tab === "finanzas" ? 1 : 0.7 }}>Finanzas</button>
        </nav>
      </header>

      <main style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
        
        {tab === "inicio" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15, marginBottom: 25 }}>
              <div style={{ background: "#fff", padding: 25, borderRadius: 25, boxShadow: "0 4px 10px rgba(0,0,0,0.03)" }}>
                <small style={{ color: "#666" }}>Flujo de Caja</small><br/><strong style={{ fontSize: 26, color: "#27ae60" }}>${stats.neto.toLocaleString()}</strong>
              </div>
              <div style={{ background: "#fff", padding: 25, borderRadius: 25, boxShadow: "0 4px 10px rgba(0,0,0,0.03)" }}>
                <small style={{ color: "#666" }}>Vencimientos (30 días)</small><br/><strong style={{ fontSize: 26, color: "#e67e22" }}>{alertas.length}</strong>
              </div>
            </div>
            <div style={{ background: "#fff", padding: 25, borderRadius: 25 }}>
              <h3>📢 Próximas Vacunas</h3>
              {alertas.length === 0 ? <p style={{ color: "#999" }}>No hay recordatorios pendientes.</p> : alertas.map((a, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f0f0f0" }}>
                  <div><strong>{a.pName}</strong> • {a.nombre}<br/><small>Vence: {a.refuerzo} | Tutor: {a.tutor}</small></div>
                  <button onClick={() => window.open(`https://wa.me/56${a.phone.replace(/\D/g,"")}?text=Hola ${a.tutor}, le escribe el ${DOCTOR}. Le recuerdo que ${a.pName} tiene su refuerzo de ${a.nombre} para el día ${a.refuerzo}.`)} style={{ ...btnG, background: "#25D366", padding: "8px 15px", fontSize: 12 }}>WhatsApp</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "pacientes" && (
          <>
            <div style={{ display: "flex", gap: 12, marginBottom: 25 }}>
              <input placeholder="🔍 Buscar por mascota o tutor..." style={{ ...inp, flex: 1, marginBottom: 0 }} onChange={e => setSearch(e.target.value)} />
              <button onClick={() => setModal("paciente")} style={btnG}>+ Crear Ficha Clínica</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
              {patients.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.ownerName.toLowerCase().includes(search.toLowerCase())).map(p => (
                <div key={p.id} style={{ background: "#fff", padding: 25, borderRadius: 25, boxShadow: "0 4px 15px rgba(0,0,0,0.04)", border: p.notes ? "2px solid #ff4d4d" : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 35 }}>{SPECIES_ICO[p.species] || "🐾"}</span><button onClick={() => exportPDF(p)} style={{ ...btnG, fontSize: 11, padding: "6px 12px" }}>Ficha PDF</button></div>
                  <h3 style={{ margin: "15px 0 5px", border: "none" }}>{p.name}</h3>
                  <p style={{ fontSize: 13, color: "#666", marginBottom: 20 }}>{p.breed} | {p.ownerName}</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <button onClick={() => { setActivePat(p); setModal("consulta"); }} style={{ ...btnG, fontSize: 11 }}>🩺 Consulta</button>
                    <button onClick={() => { setActivePat(p); setModal("vacuna"); }} style={{ ...btnG, fontSize: 11, background: "#4a90e2" }}>💉 Vacuna</button>
                    <button onClick={() => { setActivePat(p); setModal("historial"); }} style={{ ...btnG, gridColumn: "span 2", fontSize: 11, background: "#f0f5ef", color: "#3a7a3a" }}>📜 Historial y Recetas</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === "finanzas" && (
          <div style={{ background: "#fff", padding: 30, borderRadius: 25 }}>
            <h3>💰 Registro de Caja</h3>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
              <div><span style={labelS}>Descripción</span><input placeholder="Ej: Consulta Bobby / Insumos" style={inp} id="fDesc" /></div>
              <div><span style={labelS}>Monto ($)</span><input placeholder="0" type="number" style={inp} id="fMonto" /></div>
              <div><span style={labelS}>Tipo</span><select style={inp} id="fTipo"><option value="ingreso">Ingreso (+)</option><option value="gasto">Gasto (-)</option></select></div>
            </div>
            <button style={{ ...btnG, width: "100%" }} onClick={() => {
              const d = document.getElementById("fDesc").value; const m = document.getElementById("fMonto").value; const t = document.getElementById("fTipo").value;
              if(d && m) { setFinances([{ desc: d, monto: m, tipo: t, fecha: new Date().toLocaleDateString() }, ...finances]); document.getElementById("fDesc").value = ""; document.getElementById("fMonto").value = ""; }
            }}>Registrar Movimiento</button>
            <div style={{ marginTop: 30 }}>
              {finances.map((f, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f0f0f0" }}>
                  <span>{f.desc} <small style={{ color: "#999" }}>({f.fecha})</small></span>
                  <strong style={{ color: f.tipo === "ingreso" ? "#27ae60" : "#c0392b" }}>{f.tipo === "ingreso" ? "+" : "-"}${Number(f.monto).toLocaleString()}</strong>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* MODAL: ALTA DE PACIENTE (TODOS LOS CAMPOS) */}
      {modal === "paciente" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", padding: 35, borderRadius: 30, width: "90%", maxWidth: 550, maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ marginTop: 0 }}>Nueva Ficha Clínica</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
              <div><span style={labelS}>Nombre Mascota</span><input style={inp} onChange={e => setPForm({...pForm, name: e.target.value})} /></div>
              <div><span style={labelS}>Especie</span><select style={inp} onChange={e => setPForm({...pForm, species: e.target.value})}><option>Perro</option><option>Gato</option><option>Ave</option><option>Otro</option></select></div>
              <div><span style={labelS}>Raza</span><input style={inp} onChange={e => setPForm({...pForm, breed: e.target.value})} /></div>
              <div><span style={labelS}>Edad (Años)</span><input type="number" style={inp} onChange={e => setPForm({...pForm, age: e.target.value})} /></div>
            </div>
            <span style={labelS}>Nombre del Tutor</span><input style={inp} onChange={e => setPForm({...pForm, ownerName: e.target.value})} />
            <span style={labelS}>WhatsApp Tutor (9XXXXXXXX)</span><input style={inp} onChange={e => setPForm({...pForm, ownerPhone: e.target.value})} />
            <span style={labelS}>Dirección (Para Domicilios)</span><input style={inp} onChange={e => setPForm({...pForm, ownerAddress: e.target.value})} />
            <span style={labelS}>Alertas Médicas / Notas Críticas</span><textarea style={{...inp, borderColor: "#ff4d4d", height: 70}} placeholder="Ej: Alergias, agresividad, enfermedades crónicas..." onChange={e => setPForm({...pForm, notes: e.target.value})} />
            <button style={{ ...btnG, width: "100%" }} onClick={() => { setPatients([...patients, { ...pForm, id: Date.now(), history: [], vacunas: [] }]); setModal(null); }}>Guardar Ficha del Paciente</button>
            <button onClick={() => setModal(null)} style={{ background: "none", border: "none", width: "100%", marginTop: 15, color: "#666" }}>Cancelar</button>
          </div>
        </div>
      )}

      {/* MODAL: CONSULTA (EXAMEN FÍSICO + CALCULADORA) */}
      {modal === "consulta" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 15 }}>
          <div style={{ background: "#fff", borderRadius: 30, width: "100%", maxWidth: 750, maxHeight: "95vh", overflowY: "auto", padding: 35 }}>
            <h2 style={{ marginTop: 0 }}>Consulta: {activePat.name}</h2>
            <div style={{ background: "#eef5ee", padding: 20, borderRadius: 20, marginBottom: 25, border: "1px solid #d8e8d0" }}>
              <span style={labelS}>🧮 CALCULADORA DE DOSIS RÁPIDA</span>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
                <input placeholder="Peso (kg)" style={inp} onChange={e => setCalc({...calc, p: e.target.value})} />
                <input placeholder="Dosis (mg/kg)" style={inp} onChange={e => setCalc({...calc, d: e.target.value})} />
                <input placeholder="Conc. (mg/ml)" style={inp} onChange={e => setCalc({...calc, c: e.target.value})} />
                <button style={btnG} onClick={() => setCalc({...calc, r: (calc.p * calc.d / calc.c).toFixed(2)})}>CALCULAR</button>
              </div>
              {calc.r > 0 && <div style={{ textAlign: "center", fontWeight: 800, marginTop: 10, color: "#1a331a" }}>Resultado: {calc.r} ml</div>}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              <div><span style={labelS}>Peso (kg)</span><input style={inp} onChange={e => setCForm({...cForm, weight: e.target.value})} /></div>
              <div><span style={labelS}>T° (°C)</span><input style={inp} onChange={e => setCForm({...cForm, temp: e.target.value})} /></div>
              <div><span style={labelS}>FC (lpm)</span><input style={inp} onChange={e => setCForm({...cForm, fc: e.target.value})} /></div>
              <div><span style={labelS}>TLLC (s)</span><input style={inp} onChange={e => setCForm({...cForm, tllc: e.target.value})} /></div>
            </div>
            <span style={labelS}>Examen Físico (Sistemas, Mucosas, Linfonodos...)</span>
            <textarea style={{ ...inp, height: 100 }} placeholder="Hallazgos detallados del examen físico..." onChange={e => setCForm({...cForm, examenFisico: e.target.value})} />
            <span style={labelS}>Diagnóstico</span><input style={inp} onChange={e => setCForm({...cForm, diagnostico: e.target.value})} />
            <span style={labelS}>Plan y Tratamiento (Se incluirá en la receta)</span><textarea style={{ ...inp, height: 120, border: "2px solid #3a7a3a" }} placeholder="Instrucciones para el tutor..." onChange={e => setCForm({...cForm, tratamiento: e.target.value})} />
            <div style={{ background: "#fff9e6", padding: 15, borderRadius: 15, display: "flex", gap: 12, fontSize: 12, marginBottom: 20, border: "1px solid #ffeeba" }}>
              <input type="checkbox" onChange={e => setCForm({...cForm, consentimiento: e.target.checked})} /><label><strong>Consentimiento:</strong> El tutor confirma estar informado y acepta el plan terapéutico descrito.</label>
            </div>
            <button style={{ ...btnG, width: "100%" }} onClick={() => {
              setPatients(patients.map(p => p.id === activePat.id ? { ...p, weight: cForm.weight || p.weight, history: [cForm, ...(p.history || [])] } : p));
              setModal(null);
            }}>Finalizar y Guardar Atención</button>
          </div>
        </div>
      )}

      {/* MODAL: VACUNA */}
      {modal === "vacuna" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", padding: 35, borderRadius: 30, width: "90%", maxWidth: 400 }}>
            <h3>Nueva Vacunación: {activePat.name}</h3>
            <span style={labelS}>Nombre de la Vacuna</span><input placeholder="Ej: Triple Felina / Séxtuple" style={inp} onChange={e => setVForm({...vForm, nombre: e.target.value})} />
            <span style={labelS}>Fecha Aplicación</span><input type="date" style={inp} onChange={e => setVForm({...vForm, fecha: e.target.value})} />
            <span style={labelS}>Fecha de Refuerzo (Alerta)</span><input type="date" style={inp} onChange={e => setVForm({...vForm, refuerzo: e.target.value})} />
            <button style={{ ...btnG, width: "100%" }} onClick={() => {
              setPatients(patients.map(p => p.id === activePat.id ? { ...p, vacunas: [vForm, ...(p.vacunas || [])] } : p));
              setModal(null);
            }}>Registrar Vacuna</button>
            <button onClick={() => setModal(null)} style={{ background: "none", border: "none", width: "100%", marginTop: 15, color: "#666" }}>Cancelar</button>
          </div>
        </div>
      )}

      {/* MODAL: HISTORIAL */}
      {modal === "historial" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", padding: 35, borderRadius: 30, width: "90%", maxWidth: 650, maxHeight: "85vh", overflowY: "auto" }}>
            <h3>Historial de Atenciones: {activePat.name}</h3>
            {activePat.history.length === 0 ? <p>No hay registros previos.</p> : activePat.history.map((h, i) => (
              <div key={i} style={{ borderBottom: "1px solid #eee", padding: "15px 0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div><strong>{h.date} — Dx: {h.diagnostico}</strong></div>
                  <button onClick={() => exportPDF(activePat, "receta", h)} style={{ ...btnG, fontSize: 10, padding: "5px 12px" }}>Generar Receta</button>
                </div>
                <p style={{ fontSize: 13, color: "#444", marginTop: 8 }}>{h.tratamiento}</p>
              </div>
            ))}
            <button onClick={() => setModal(null)} style={{ ...btnG, width: "100%", marginTop: 20, background: "#eee", color: "#333" }}>Cerrar Historial</button>
          </div>
        </div>
      )}
    </div>
  );
}

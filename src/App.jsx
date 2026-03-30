import { useState, useEffect, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

// ─── CONFIGURACIÓN GLOBAL ───────────────────────────────────────────
const DOCTOR = "Dr. Diego Villalobos Palacios";
const CLINICA = "Veterinario a Domicilio";
const LOGO_URL = "/logo.png"; 
const SPECIES_ICO = { Perro: "🐕", Gato: "🐈", Ave: "🦜", Conejo: "🐇", Reptil: "🦎", Otro: "🐾" };

const DOSIS_REF = [
  { n: "Meloxicam (0.2mg/kg)", d: 0.2, c: 5 },
  { n: "Tramadol (2mg/kg)", d: 2, c: 50 },
  { n: "Enrofloxacino (5mg/kg)", d: 5, c: 50 },
  { n: "Cefalexina (20mg/kg)", d: 20, c: 250 },
];

const PLANTILLAS = [
  { label: "Gastroenteritis", texto: "1. Ayuno hídrico 2h, luego agua en pequeñas cantidades.\n2. Dieta blanda (pollo+arroz) por 3-5 días.\n3. Metronidazol 15mg/kg c/12h por 5 días.\n4. Probiótico c/24h por 7 días.\nControl en 5 días o antes si empeora." },
  { label: "Otitis externa", texto: "1. Limpieza canal auditivo con solución fisiológica.\n2. Otomax 5 gotas en oído afectado c/12h por 7 días.\n3. Collar isabelino permanente.\n4. No bañar ni mojar cabeza.\nControl en 10 días." },
  { label: "Dermatitis alérgica", texto: "1. Apoquel 0.5mg/kg c/24h por 14 días.\n2. Shampoo hipoalergénico 2 veces/semana.\n3. Revisar dieta: eliminar proteína nueva.\n4. Evitar contacto con pasto mojado.\nControl en 14 días." },
  { label: "Desparasitación", texto: "1. Milbemax según peso: <5kg: 1 comp pequeño / >5kg: 1 comp grande.\n2. Repetir en 21 días si carga parasitaria alta.\n3. Pipeta antiparasitaria externa al día siguiente.\n4. Lavar ropa de cama del animal." },
  { label: "Herida/Laceración", texto: "1. Limpieza con clorhexidina 0.05% y suero fisiológico.\n2. Amoxicilina-clavulánico 20mg/kg c/12h por 7 días.\n3. Meloxicam 0.2mg/kg c/24h por 3 días (con comida).\n4. Curación cada 48h. Collar isabelino permanente.\nControl en 5 días." },
  { label: "Infección urinaria", texto: "1. Enrofloxacino 5mg/kg c/24h por 10 días.\n2. Aumentar consumo de agua.\n3. Urocultivo si no mejora en 5 días.\n4. Evitar alimentos con mucho fósforo.\nControl en 10 días con sedimento urinario." },
];

// ─── FUNCIONES DE UTILIDAD ──────────────────────────────────────────
const exportPDF = (p, type, consulta) => {
  if (typeof window === "undefined") return;
  const isReceta = type === "receta";
  const html = `
    <html><head><style>
      body{font-family:sans-serif;padding:40px;color:#333;line-height:1.6}
      .header{display:flex;justify-content:space-between;align-items:center;border-bottom:4px solid #1a331a;padding-bottom:15px;margin-bottom:25px}
      .info-grid{background:#f9f9f9;padding:20px;border-radius:12px;margin-bottom:25px;display:grid;grid-template-columns:1fr 1fr;gap:15px;border:1px solid #eee}
      .alerta{color:#d32f2f;font-weight:bold;border:2px solid #d32f2f;padding:8px;margin-top:10px;border-radius:8px;text-align:center;background:#fff1f1}
      .footer{margin-top:60px;text-align:center;font-size:11px;border-top:1px solid #ddd;padding-top:15px;color:#777}
      h3{color:#1a331a;border-bottom:2px solid #3a7a3a;padding-bottom:5px;margin-top:30px}
      .med-box{font-size:15px;white-space:pre-wrap;padding:25px;border:2px dashed #3a7a3a;border-radius:15px;background:#fff}
      .legal{font-size:10px;color:#666;margin-top:30px;border:1px solid #eee;padding:10px}
      .exam-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;font-size:12px}
    </style></head><body>
      <div class='header'>
        <img src='${LOGO_URL}' style='height:70px' onerror='this.style.display="none"'>
        <div style='text-align:right'>
          <h1 style='margin:0;color:#1a331a'>${isReceta ? "RECETA MÉDICA" : "FICHA CLÍNICA"}</h1>
          <h2 style='margin:0;color:#3a7a3a'>${CLINICA}</h2>
          <p style='margin:5px 0'>${DOCTOR}</p>
        </div>
      </div>
      <div class='info-grid'>
        <div><strong>Tutor:</strong> ${p.ownerName}<br><strong>WhatsApp:</strong> ${p.ownerPhone}<br><strong>Dirección:</strong> ${p.ownerAddress}</div>
        <div><strong>Paciente:</strong> ${p.name}<br><strong>Especie/Raza:</strong> ${p.species}/${p.breed}<br>
        <strong>Peso:</strong> ${(consulta?.weight || p.weight || "--")} kg | <strong>Estado:</strong> ${p.reproductivo || "Entero/a"}
        ${p.alergias ? `<div class='alerta'>ALÉRGICO A: ${p.alergias.toUpperCase()}</div>` : ""}
        </div>
      </div>
      ${isReceta ? `<h3>INDICACIONES:</h3><div class='med-box'>${consulta?.tratamiento || ""}</div>` : `
        <h3>ANAMNESIS:</h3><p>${consulta?.anamnesis || "Sin registros."}</p>
        <h3>EXAMEN FÍSICO (${consulta?.date || ""})</h3>
        <div class='exam-grid'>
          <div><b>Peso:</b> ${consulta?.weight || "--"} kg</div>
          <div><b>T:</b> ${consulta?.temp || "--"} C</div>
          <div><b>FC:</b> ${consulta?.fc || "--"} lpm</div>
          <div><b>FR:</b> ${consulta?.fr || "--"} rpm</div>
          <div><b>TLLC:</b> ${consulta?.tllc || "--"} seg</div>
          <div><b>Mucosas:</b> ${consulta?.mucosas || "--"}</div>
          <div><b>CC:</b> ${consulta?.cc || "--"}/5</div>
          <div><b>Linfonodos:</b> ${consulta?.linfonodos || "--"}</div>
          <div><b>Hidratación:</b> ${consulta?.hidratacion || "--"} %</div>
        </div>
        <h3>DIAGNÓSTICO</h3><p>${consulta?.diagnostico || ""}</p>
        <h3>PLAN TERAPÉUTICO</h3><p style='white-space:pre-wrap'>${consulta?.tratamiento || ""}</p>
      `}
      ${(!isReceta && consulta?.consentimiento) ? `
        <div class='legal'><b>CONSENTIMIENTO INFORMADO:</b> El tutor declara haber sido informado de los riesgos y autoriza al ${DOCTOR} a proceder.<br><br><br>__________________________<br>Firma del Tutor</div>
      ` : ""}
      <div class='footer'><p>Concepción, Chile. ${consulta?.proximoControl ? `| Próximo Control: ${consulta.proximoControl}` : ""}</p></div>
    </body></html>`;
  const w = window.open("", "_blank");
  if (w) {
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 500);
  }
};

const sendWAReport = (p, c) => {
  const msg = `Informe de Atención Veterinaria\nFecha: ${c.date}\n${CLINICA} - ${DOCTOR}\n\nPaciente: ${p.name} (${p.species})\nTutor: ${p.ownerName}\n\nDiagnóstico: ${c.diagnostico || "—"}\n\nIndicaciones:\n${c.tratamiento || "—"}\n\n${c.proximoControl ? `Próximo control: ${c.proximoControl}` : ""}\n\nCualquier consulta estoy a su disposición.`;
  const phone = p.ownerPhone.replace(/\D/g, "");
  window.open(`https://wa.me/56${phone}?text=${encodeURIComponent(msg)}`, "_blank");
};

// ─── ESTILOS REUTILIZABLES ──────────────────────────────────────────
const labelS = { fontSize: "11px", fontWeight: "bold", color: "#3a7a3a", marginBottom: "3px", display: "block" };
const inp = { width: "100%", padding: "10px", border: "1.5px solid #d8e8d0", borderRadius: 10, marginBottom: 8, boxSizing: "border-box", fontSize: "14px" };
const btnG = { background: "#3a7a3a", color: "#fff", border: "none", borderRadius: 12, padding: "14px", fontWeight: 700, cursor: "pointer" };

const EMPTY_C = {
  id: null,
  date: new Date().toISOString().split("T")[0],
  weight: "", temp: "", fc: "", fr: "", tllc: "", mucosas: "",
  cc: "3", linfonodos: "", hidratacion: "", oral: "",
  anamnesis: "", diagnostico: "", tratamiento: "",
  proximoControl: "", consentimiento: false,
};

export default function VetApp() {
  const [tab, setTab] = useState("inicio");
  const [patients, setPatients] = useState([]);
  const [finances, setFinances] = useState([]);
  const [isClient, setIsClient] = useState(false); // Para evitar errores de hidratación
  const [modal, setModal] = useState(null);
  const [activePatId, setActivePatId] = useState(null);
  const [activeHistId, setActiveHistId] = useState(null);
  const [search, setSearch] = useState("");
  const [statsRange, setStatsRange] = useState("3");

  const activePat = patients.find((p) => p.id === activePatId) || null;

  const [fForm, setFForm] = useState({ desc: "", monto: "", tipo: "ingreso" });
  const [pForm, setPForm] = useState({ name: "", species: "Perro", breed: "", weight: "", reproductivo: "Entero/a", alergias: "", ownerName: "", ownerPhone: "", ownerAddress: "" });
  const [cForm, setCForm] = useState(EMPTY_C);
  const [vForm, setVForm] = useState({ nombre: "", fecha: new Date().toISOString().split("T")[0], refuerzo: "", tipo: "vacuna" });
  const [calc, setCalc] = useState({ p: "", d: "", c: "", r: 0 });

  // 1. Carga inicial segura (Solo cliente)
  useEffect(() => {
    setIsClient(true);
    const savedPats = localStorage.getItem("vet_v25");
    const savedFins = localStorage.getItem("fin_v25");
    if (savedPats) setPatients(JSON.parse(savedPats));
    if (savedFins) setFinances(JSON.parse(savedFins));
  }, []);

  // 2. Persistencia automática
  useEffect(() => {
    if (isClient) {
      localStorage.setItem("vet_v25", JSON.stringify(patients));
      localStorage.setItem("fin_v25", JSON.stringify(finances));
    }
  }, [patients, finances, isClient]);

  const alertas = useMemo(() => {
    const hoy = new Date();
    const lim = new Date();
    lim.setDate(hoy.getDate() + 30);
    return patients.flatMap((p) => {
      const recs = [...(p.vacunas || []), ...(p.parasitos || [])];
      if (p.history && p.history[0]?.proximoControl) {
        recs.push({ nombre: "Control Clínico", refuerzo: p.history[0].proximoControl });
      }
      return recs
        .filter((v) => { const d = new Date(v.refuerzo); return d >= hoy && d <= lim; })
        .map((v) => ({ ...v, pName: p.name, phone: p.ownerPhone, tutor: p.ownerName }));
    });
  }, [patients]);

  const stats = useMemo(() => {
    const ing = finances.filter((f) => f.tipo === "ingreso").reduce((a, b) => a + Number(b.monto), 0);
    const gas = finances.filter((f) => f.tipo === "gasto").reduce((a, b) => a + Number(b.monto), 0);
    return { ing, gas, neto: ing - gas };
  }, [finances]);

  const clinStats = useMemo(() => {
    const months = parseInt(statsRange);
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);
    const allH = patients.flatMap((p) => (p.history || []).map((h) => ({ ...h, species: p.species })));
    const recent = allH.filter((h) => new Date(h.date) >= cutoff);
    const byMonth = {};
    recent.forEach((h) => { const key = h.date.slice(0, 7); byMonth[key] = (byMonth[key] || 0) + 1; });
    const consultasMes = Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([m, n]) => ({ mes: m.slice(5) + "/" + m.slice(2, 4), consultas: n }));
    const bySpecies = {};
    recent.forEach((h) => { bySpecies[h.species] = (bySpecies[h.species] || 0) + 1; });
    const byDx = {};
    recent.forEach((h) => { if (h.diagnostico) { const k = h.diagnostico.trim(); byDx[k] = (byDx[k] || 0) + 1; } });
    const topDx = Object.entries(byDx).sort(([, a], [, b]) => b - a).slice(0, 5);
    return { consultasMes, bySpecies, topDx, total: recent.length };
  }, [patients, statsRange]);

  const weightData = useMemo(() => {
    if (!activePat) return [];
    return [...(activePat.history || [])]
      .filter((h) => h.weight)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((h) => ({ fecha: h.date.slice(5), peso: parseFloat(h.weight) }));
  }, [activePat]);

  const exportBackup = () => {
    const data = JSON.stringify({ patients, finances, exportedAt: new Date().toISOString() }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vet_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  const importBackup = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.patients && data.finances) {
          if (window.confirm(`¿Restaurar ${data.patients.length} pacientes? Reemplazará los datos actuales.`)) {
            setPatients(data.patients);
            setFinances(data.finances);
          }
        }
      } catch (err) { alert("Error al leer archivo"); }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const exportCSV = () => {
    const csv = "Fecha,Descripcion,Monto,Tipo\n" + finances.map((f) => `${f.fecha},${f.desc},${f.monto},${f.tipo}`).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "finanzas_vet.csv";
    a.click();
  };

  const filteredPats = useMemo(() => {
    const s = search.toLowerCase();
    return patients.filter((p) => p.name.toLowerCase().includes(s) || p.ownerName.toLowerCase().includes(s));
  }, [patients, search]);

  const saveConsulta = () => {
    if (activeHistId) {
      setPatients((prev) => prev.map((p) => p.id === activePatId ? { ...p, history: p.history.map((h) => h.id === activeHistId ? cForm : h) } : p));
    } else {
      setPatients((prev) => prev.map((p) => p.id === activePatId ? { ...p, weight: cForm.weight || p.weight, history: [cForm, ...(p.history || [])] } : p));
    }
    setModal(null);
  };

  const NAV = [
    { k: "inicio", l: "Inicio", i: "🏠" },
    { k: "pacientes", l: "Pacientes", i: "🐾" },
    { k: "stats", l: "Estadísticas", i: "📊" },
    { k: "finanzas", l: "Finanzas", i: "💰" },
  ];

  if (!isClient) return null; // Previene error de renderizado en el servidor

  return (
    <div style={{ fontFamily: "sans-serif", background: "#f4f7f4", minHeight: "100vh" }}>
      <header style={{ background: "#1a331a", color: "#fff", padding: "15px 25px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 12px rgba(0,0,0,0.3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
          <img src={LOGO_URL} style={{ height: 45, background: "#fff", borderRadius: 8, padding: 3 }} alt="" onError={(e) => { e.target.style.display = "none"; }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>{CLINICA}</div>
            <div style={{ fontSize: 10, opacity: 0.7 }}>{DOCTOR}</div>
          </div>
        </div>
        <nav style={{ display: "flex", gap: 6 }}>
          {NAV.map((n) => (
            <button key={n.k} onClick={() => setTab(n.k)} style={{ background: tab === n.k ? "#3a7a3a" : "transparent", border: "none", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 13, borderRadius: 10, padding: "8px 14px" }}>
              {n.i} {n.l}
            </button>
          ))}
        </nav>
      </header>

      <main style={{ padding: 20, maxWidth: 920, margin: "0 auto" }}>
        {tab === "inicio" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 14, marginBottom: 22 }}>
              {[
                { l: "Pacientes", v: patients.length, c: "#1a331a" },
                { l: "Ingresos", v: "$" + stats.ing.toLocaleString(), c: "#27ae60" },
                { l: "Caja Neta", v: "$" + stats.neto.toLocaleString(), c: stats.neto >= 0 ? "#1a331a" : "#e74c3c" },
                { l: "Alertas", v: alertas.length, c: "#e67e22" },
              ].map((s) => (
                <div key={s.l} style={{ background: "#fff", padding: 22, borderRadius: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                  <small style={{ color: "#888" }}>{s.l}</small><br />
                  <strong style={{ fontSize: 26, color: s.c }}>{s.v}</strong>
                </div>
              ))}
            </div>
            <div style={{ background: "#fff", padding: 25, borderRadius: 20, marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <h3 style={{ margin: "0 0 14px" }}>Recordatorios próximos (30 días)</h3>
              {alertas.length === 0 ? <p style={{ color: "#aaa", margin: 0 }}>Sin pendientes</p> : 
                alertas.map((a, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f0f0f0" }}>
                    <div><strong>{a.pName}</strong> - {a.nombre}<br /><small style={{ color: "#888" }}>{a.refuerzo} - {a.tutor}</small></div>
                    <button onClick={() => window.open(`https://wa.me/56${a.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola ${a.tutor}, le recuerdo que ${a.pName} tiene su ${a.nombre} para el ${a.refuerzo}.`)}`)} style={{ ...btnG, background: "#25D366", padding: "8px 14px", fontSize: 11 }}>WhatsApp</button>
                  </div>
                ))}
            </div>
            <div style={{ background: "#fff", padding: 20, borderRadius: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <h3 style={{ margin: "0 0 12px" }}>Respaldo de Datos</h3>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={exportBackup} style={{ ...btnG, padding: "10px 18px", fontSize: 13 }}>Exportar respaldo</button>
                <label style={{ ...btnG, padding: "10px 18px", fontSize: 13, background: "#4a90e2", cursor: "pointer" }}>
                  Importar respaldo <input type="file" accept=".json" style={{ display: "none" }} onChange={importBackup} />
                </label>
              </div>
            </div>
          </div>
        )}

        {tab === "pacientes" && (
          <div>
            <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
              <input placeholder="Buscar por mascota o tutor..." style={{ ...inp, flex: 1, marginBottom: 0 }} value={search} onChange={(e) => setSearch(e.target.value)} />
              <button onClick={() => { setPForm({ name: "", species: "Perro", breed: "", weight: "", reproductivo: "Entero/a", alergias: "", ownerName: "", ownerPhone: "", ownerAddress: "" }); setActivePatId(null); setModal("paciente"); }} style={btnG}>+ Nueva Ficha</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(290px,1fr))", gap: 18 }}>
              {filteredPats.map((p) => (
                <div key={p.id} style={{ background: "#fff", padding: 22, borderRadius: 22, border: p.alergias ? "2px solid #ff4d4d" : "1.5px solid #e8f0e8", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 38 }}>{SPECIES_ICO[p.species] || "🐾"}</span>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => { setPForm({ ...p }); setActivePatId(p.id); setModal("paciente"); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16 }}>✏️</button>
                      <button onClick={() => { if(window.confirm("¿Eliminar?")) setPatients(prev => prev.filter(x => x.id !== p.id)) }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16 }}>🗑️</button>
                    </div>
                  </div>
                  <h3 style={{ margin: "0 0 2px" }}>{p.name}</h3>
                  <p style={{ fontSize: 13, color: "#666" }}>{p.species} - {p.weight}kg - {p.ownerName}</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginTop: 10 }}>
                    <button onClick={() => { setActivePatId(p.id); setActiveHistId(null); setCForm({ ...EMPTY_C, id: Date.now(), weight: p.weight }); setModal("consulta"); }} style={btnG}>Consulta</button>
                    <button onClick={() => { setActivePatId(p.id); setVForm({ nombre: "", fecha: new Date().toISOString().split("T")[0], refuerzo: "", tipo: "vacuna" }); setModal("vacuna"); }} style={{ ...btnG, background: "#4a90e2" }}>Vac/Paras</button>
                    <button onClick={() => { setActivePatId(p.id); setModal("historial"); }} style={{ ...btnG, gridColumn: "span 2", background: "#f0f5ef", color: "#3a7a3a" }}>Historial ({p.history?.length || 0})</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "stats" && clinStats.total > 0 && (
           <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ background: "#fff", padding: 22, borderRadius: 18 }}>
                <h4>Consultas por mes</h4>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={clinStats.consultasMes}><CartesianGrid stroke="#f0f0f0" /><XAxis dataKey="mes" /><YAxis allowDecimals={false} /><Tooltip /><Line type="monotone" dataKey="consultas" stroke="#3a7a3a" /></LineChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: "#fff", padding: 22, borderRadius: 18 }}>
                <h4>Especies</h4>
                {Object.entries(clinStats.bySpecies).map(([sp, n]) => (
                  <div key={sp} style={{ fontSize: 13 }}>{sp}: {n}</div>
                ))}
              </div>
           </div>
        )}

        {tab === "finanzas" && (
          <div style={{ background: "#fff", padding: 28, borderRadius: 22 }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
              <input placeholder="Descripción" style={inp} value={fForm.desc} onChange={(e) => setFForm({ ...fForm, desc: e.target.value })} />
              <input placeholder="Monto" type="number" style={inp} value={fForm.monto} onChange={(e) => setFForm({ ...fForm, monto: e.target.value })} />
              <select style={inp} value={fForm.tipo} onChange={(e) => setFForm({ ...fForm, tipo: e.target.value })}><option value="ingreso">Ingreso</option><option value="gasto">Gasto</option></select>
            </div>
            <button style={{ ...btnG, width: "100%" }} onClick={() => {
              if (!fForm.desc || !fForm.monto) return;
              setFinances([{ ...fForm, fecha: new Date().toLocaleDateString("es-CL") }, ...finances]);
              setFForm({ desc: "", monto: "", tipo: "ingreso" });
            }}>Registrar</button>
            <div style={{ marginTop: 20 }}>
              {finances.map((f, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #eee" }}>
                  <span>{f.desc} ({f.fecha})</span>
                  <strong style={{ color: f.tipo === "ingreso" ? "green" : "red" }}>${Number(f.monto).toLocaleString()}</strong>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* MODAL CONSULTA */}
      {modal === "consulta" && activePat && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 10 }}>
          <div style={{ background: "#fff", borderRadius: 28, width: "100%", maxWidth: 760, maxHeight: "95vh", overflowY: "auto", padding: 25 }}>
            <h3>Atención: {activePat.name}</h3>
            <div style={{ background: "#f0f7f0", padding: 14, borderRadius: 14, marginBottom: 14 }}>
              <span style={labelS}>CALCULADORA</span>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 0.5fr", gap: 8 }}>
                <input placeholder="kg" style={inp} value={calc.p} onChange={(e) => setCalc({ ...calc, p: e.target.value })} />
                <input placeholder="mg/kg" style={inp} value={calc.d} onChange={(e) => setCalc({ ...calc, d: e.target.value })} />
                <input placeholder="mg/ml" style={inp} value={calc.c} onChange={(e) => setCalc({ ...calc, c: e.target.value })} />
                <button style={{ ...btnG, padding: "10px" }} onClick={() => setCalc({ ...calc, r: (calc.p * calc.d / calc.c).toFixed(2) })}>ok</button>
              </div>
              {calc.r > 0 && <p style={{ textAlign: "center", fontWeight: "bold" }}>Dosis: {calc.r} ml</p>}
            </div>
            <textarea placeholder="Anamnesis" style={{ ...inp, height: 60 }} value={cForm.anamnesis} onChange={(e) => setCForm({ ...cForm, anamnesis: e.target.value })} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
               <input placeholder="Peso" value={cForm.weight} style={inp} onChange={(e) => setCForm({ ...cForm, weight: e.target.value })} />
               <input placeholder="T°" value={cForm.temp} style={inp} onChange={(e) => setCForm({ ...cForm, temp: e.target.value })} />
               <input placeholder="FC" value={cForm.fc} style={inp} onChange={(e) => setCForm({ ...cForm, fc: e.target.value })} />
               <input placeholder="FR" value={cForm.fr} style={inp} onChange={(e) => setCForm({ ...cForm, fr: e.target.value })} />
            </div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", margin: "10px 0" }}>
               {PLANTILLAS.map((pl, i) => (
                 <button key={i} onClick={() => setCForm({ ...cForm, tratamiento: pl.texto })} style={{ padding: "5px", fontSize: "10px", borderRadius: "5px" }}>{pl.label}</button>
               ))}
            </div>
            <textarea placeholder="Tratamiento" style={{ ...inp, height: 100, border: "2px solid #3a7a3a" }} value={cForm.tratamiento} onChange={(e) => setCForm({ ...cForm, tratamiento: e.target.value })} />
            <button style={{ ...btnG, width: "100%" }} onClick={saveConsulta}>Guardar Atención</button>
            <button onClick={() => setModal(null)} style={{ background: "none", width: "100%", marginTop: 10 }}>Cerrar</button>
          </div>
        </div>
      )}

      {/* MODAL PACIENTE */}
      {modal === "paciente" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", padding: 28, borderRadius: 28, width: "90%", maxWidth: 500 }}>
            <h3>Ficha de Paciente</h3>
            <input placeholder="Nombre Mascota *" value={pForm.name} style={inp} onChange={(e) => setPForm({ ...pForm, name: e.target.value })} />
            <select value={pForm.species} style={inp} onChange={(e) => setPForm({ ...pForm, species: e.target.value })}>{Object.keys(SPECIES_ICO).map(s => <option key={s}>{s}</option>)}</select>
            <input placeholder="Nombre Tutor *" value={pForm.ownerName} style={inp} onChange={(e) => setPForm({ ...pForm, ownerName: e.target.value })} />
            <input placeholder="WhatsApp Tutor" value={pForm.ownerPhone} style={inp} onChange={(e) => setPForm({ ...pForm, ownerPhone: e.target.value })} />
            <button style={{ ...btnG, width: "100%" }} onClick={() => {
              if (!pForm.name || !pForm.ownerName) return alert("Nombre y Tutor obligatorios");
              if (activePatId) setPatients(prev => prev.map(p => p.id === activePatId ? { ...p, ...pForm } : p));
              else setPatients([{ ...pForm, id: Date.now(), history: [], vacunas: [], parasitos: [] }, ...patients]);
              setModal(null);
            }}>Guardar Ficha</button>
            <button onClick={() => setModal(null)} style={{ background: "none", width: "100%", marginTop: 10 }}>Cerrar</button>
          </div>
        </div>
      )}

      {/* MODAL HISTORIAL */}
      {modal === "historial" && activePat && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", padding: 30, borderRadius: 26, width: "90%", maxWidth: 680, maxHeight: "88vh", overflowY: "auto" }}>
            <h3>Historial: {activePat.name}</h3>
            {activePat.history?.map((h, i) => (
              <div key={i} style={{ borderBottom: "1px solid #eee", padding: "14px 0" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                   <strong>{h.date} - {h.diagnostico}</strong>
                   <div style={{ display: "flex", gap: 5 }}>
                      <button onClick={() => sendWAReport(activePat, h)} style={{ background: "#25D366", color: "white", border: "none", padding: "5px", borderRadius: "5px" }}>WA</button>
                      <button onClick={() => exportPDF(activePat, "historia", h)} style={{ background: "#1a331a", color: "white", border: "none", padding: "5px", borderRadius: "5px" }}>PDF</button>
                      <button onClick={() => exportPDF(activePat, "receta", h)} style={{ background: "#4a90e2", color: "white", border: "none", padding: "5px", borderRadius: "5px" }}>Receta</button>
                   </div>
                </div>
              </div>
            ))}
            <button onClick={() => setModal(null)} style={{ ...btnG, width: "100%", marginTop: 18, background: "#eee", color: "#333" }}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}

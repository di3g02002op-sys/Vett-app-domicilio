import { useState, useEffect, useMemo } from “react”;
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from “recharts”;

const DOCTOR = “Dr. Diego Villalobos Palacios”;
const CLINICA = “Veterinario a Domicilio”;
const LOGO_URL = “/logo.png”;
const SPECIES_ICO = { Perro: “🐕”, Gato: “🐈”, Ave: “🦜”, Conejo: “🐇”, Reptil: “🦎”, Otro: “🐾” };

const DOSIS_REF = [
{ n: “Meloxicam (0.2mg/kg)”, d: 0.2, c: 5 },
{ n: “Tramadol (2mg/kg)”, d: 2, c: 50 },
{ n: “Enrofloxacino (5mg/kg)”, d: 5, c: 50 },
{ n: “Cefalexina (20mg/kg)”, d: 20, c: 250 },
];

const PLANTILLAS = [
{ label: “Gastroenteritis”, texto: “1. Ayuno hidrico 2h, luego agua en pequenas cantidades.\n2. Dieta blanda (pollo+arroz) por 3-5 dias.\n3. Metronidazol 15mg/kg c/12h por 5 dias.\n4. Probiotico c/24h por 7 dias.\nControl en 5 dias o antes si empeora.” },
{ label: “Otitis externa”, texto: “1. Limpieza canal auditivo con solucion fisiologica.\n2. Otomax 5 gotas en oido afectado c/12h por 7 dias.\n3. Collar isabelino permanente.\n4. No banar ni mojar cabeza.\nControl en 10 dias.” },
{ label: “Dermatitis alergica”, texto: “1. Apoquel 0.5mg/kg c/24h por 14 dias.\n2. Shampoo hipoalergenico 2 veces/semana.\n3. Revisar dieta: eliminar proteina nueva.\n4. Evitar contacto con pasto mojado.\nControl en 14 dias.” },
{ label: “Desparasitacion”, texto: “1. Milbemax segun peso: <5kg: 1 comp pequeno / >5kg: 1 comp grande.\n2. Repetir en 21 dias si carga parasitaria alta.\n3. Pipeta antiparasitaria externa al dia siguiente.\n4. Lavar ropa de cama del animal.” },
{ label: “Herida/Laceracion”, texto: “1. Limpieza con clorhexidina 0.05% y suero fisiologico.\n2. Amoxicilina-clavulanico 20mg/kg c/12h por 7 dias.\n3. Meloxicam 0.2mg/kg c/24h por 3 dias (con comida).\n4. Curacion cada 48h. Collar isabelino permanente.\nControl en 5 dias.” },
{ label: “Infeccion urinaria”, texto: “1. Enrofloxacino 5mg/kg c/24h por 10 dias.\n2. Aumentar consumo de agua.\n3. Urocultivo si no mejora en 5 dias.\n4. Evitar alimentos con mucho fosforo.\nControl en 10 dias con sedimento urinario.” },
];

const exportPDF = (p, type, consulta) => {
const isReceta = type === “receta”;
const html = [
“<!DOCTYPE html><html><head><style>”,
“body{font-family:sans-serif;padding:40px;color:#333;line-height:1.6}”,
“.header{display:flex;justify-content:space-between;align-items:center;border-bottom:4px solid #1a331a;padding-bottom:15px;margin-bottom:25px}”,
“.info-grid{background:#f9f9f9;padding:20px;border-radius:12px;margin-bottom:25px;display:grid;grid-template-columns:1fr 1fr;gap:15px;border:1px solid #eee}”,
“.alerta{color:#d32f2f;font-weight:bold;border:2px solid #d32f2f;padding:8px;margin-top:10px;border-radius:8px;text-align:center;background:#fff1f1}”,
“.footer{margin-top:60px;text-align:center;font-size:11px;border-top:1px solid #ddd;padding-top:15px;color:#777}”,
“h3{color:#1a331a;border-bottom:2px solid #3a7a3a;padding-bottom:5px;margin-top:30px}”,
“.med-box{font-size:15px;white-space:pre-wrap;padding:25px;border:2px dashed #3a7a3a;border-radius:15px;background:#fff}”,
“.legal{font-size:10px;color:#666;margin-top:30px;border:1px solid #eee;padding:10px}”,
“.exam-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;font-size:12px}”,
“</style></head><body>”,
“<div class='header'>”,
“<img src='" + LOGO_URL + "' style='height:70px' onerror='this.style.display=`none`'>”,
“<div style='text-align:right'>”,
“<h1 style='margin:0;color:#1a331a'>” + (isReceta ? “RECETA MEDICA” : “FICHA CLINICA”) + “</h1>”,
“<h2 style='margin:0;color:#3a7a3a'>” + CLINICA + “</h2>”,
“<p style='margin:5px 0'>” + DOCTOR + “</p>”,
“</div></div>”,
“<div class='info-grid'>”,
“<div><strong>Tutor:</strong> “ + p.ownerName + “<br><strong>WhatsApp:</strong> “ + p.ownerPhone + “<br><strong>Direccion:</strong> “ + p.ownerAddress + “</div>”,
“<div><strong>Paciente:</strong> “ + p.name + “<br><strong>Especie/Raza:</strong> “ + p.species + “/” + p.breed + “<br>”,
“<strong>Peso:</strong> “ + ((consulta && consulta.weight) || p.weight || “–”) + “ kg | <strong>Estado:</strong> “ + (p.reproductivo || “Entero/a”),
(p.alergias ? “<div class='alerta'>ALERGICO A: “ + p.alergias.toUpperCase() + “</div>” : “”),
“</div></div>”,
isReceta
? “<h3>INDICACIONES:</h3><div class='med-box'>” + (consulta ? consulta.tratamiento : “”) + “</div>”
: [
“<h3>ANAMNESIS:</h3><p>” + ((consulta && consulta.anamnesis) || “Sin registros.”) + “</p>”,
“<h3>EXAMEN FISICO (” + ((consulta && consulta.date) || “”) + “)</h3>”,
“<div class='exam-grid'>”,
“<div><b>Peso:</b> “ + ((consulta && consulta.weight) || “–”) + “ kg</div>”,
“<div><b>T:</b> “ + ((consulta && consulta.temp) || “–”) + “ C</div>”,
“<div><b>FC:</b> “ + ((consulta && consulta.fc) || “–”) + “ lpm</div>”,
“<div><b>FR:</b> “ + ((consulta && consulta.fr) || “–”) + “ rpm</div>”,
“<div><b>TLLC:</b> “ + ((consulta && consulta.tllc) || “–”) + “ seg</div>”,
“<div><b>Mucosas:</b> “ + ((consulta && consulta.mucosas) || “–”) + “</div>”,
“<div><b>CC:</b> “ + ((consulta && consulta.cc) || “–”) + “/5</div>”,
“<div><b>Linfonodos:</b> “ + ((consulta && consulta.linfonodos) || “–”) + “</div>”,
“<div><b>Hidratacion:</b> “ + ((consulta && consulta.hidratacion) || “–”) + “ %</div>”,
“</div>”,
“<h3>DIAGNOSTICO</h3><p>” + ((consulta && consulta.diagnostico) || “”) + “</p>”,
“<h3>PLAN TERAPEUTICO</h3><p style='white-space:pre-wrap'>” + ((consulta && consulta.tratamiento) || “”) + “</p>”,
].join(””),
(!isReceta && consulta && consulta.consentimiento)
? “<div class='legal'><b>CONSENTIMIENTO INFORMADO:</b> El tutor declara haber sido informado de los riesgos y autoriza al “ + DOCTOR + “ a proceder.<br><br><br>__________________________<br>Firma del Tutor</div>”
: “”,
“<div class='footer'><p>Concepcion, Chile.” + ((consulta && consulta.proximoControl) ? “ | Proximo Control: “ + consulta.proximoControl : “”) + “</p></div>”,
“</body></html>”,
].join(””);
const w = window.open(””, “_blank”);
w.document.write(html);
w.document.close();
setTimeout(() => w.print(), 500);
};

const sendWAReport = (p, c) => {
const msg = [
“Informe de Atencion Veterinaria”,
“Fecha: “ + c.date,
CLINICA + “ - “ + DOCTOR,
“”,
“Paciente: “ + p.name + “ (” + p.species + “)”,
“Tutor: “ + p.ownerName,
“”,
“Diagnostico: “ + (c.diagnostico || “—”),
“”,
“Indicaciones:”,
(c.tratamiento || “—”),
“”,
(c.proximoControl ? “Proximo control: “ + c.proximoControl : “”),
“”,
“Cualquier consulta estoy a su disposicion.”,
].join(”\n”);
const phone = p.ownerPhone.replace(/\D/g, “”);
window.open(“https://wa.me/56” + phone + “?text=” + encodeURIComponent(msg), “_blank”);
};

const labelS = { fontSize: “11px”, fontWeight: “bold”, color: “#3a7a3a”, marginBottom: “3px”, display: “block” };
const inp = { width: “100%”, padding: “10px”, border: “1.5px solid #d8e8d0”, borderRadius: 10, marginBottom: 8, boxSizing: “border-box”, fontSize: “14px” };
const btnG = { background: “#3a7a3a”, color: “#fff”, border: “none”, borderRadius: 12, padding: “14px”, fontWeight: 700, cursor: “pointer” };

const EMPTY_C = {
id: null,
date: new Date().toISOString().split(“T”)[0],
weight: “”, temp: “”, fc: “”, fr: “”, tllc: “”, mucosas: “”,
cc: “3”, linfonodos: “”, hidratacion: “”, oral: “”,
anamnesis: “”, diagnostico: “”, tratamiento: “”,
proximoControl: “”, consentimiento: false,
};

export default function VetApp() {
const [tab, setTab] = useState(“inicio”);
const [patients, setPatients] = useState(() => JSON.parse(localStorage.getItem(“vet_v25”) || “[]”));
const [finances, setFinances] = useState(() => JSON.parse(localStorage.getItem(“fin_v25”) || “[]”));
const [modal, setModal] = useState(null);
const [activePatId, setActivePatId] = useState(null);
const [activeHistId, setActiveHistId] = useState(null);
const [search, setSearch] = useState(””);
const [statsRange, setStatsRange] = useState(“3”);

const activePat = patients.find((p) => p.id === activePatId) || null;

const [fForm, setFForm] = useState({ desc: “”, monto: “”, tipo: “ingreso” });
const [pForm, setPForm] = useState({ name: “”, species: “Perro”, breed: “”, weight: “”, reproductivo: “Entero/a”, alergias: “”, ownerName: “”, ownerPhone: “”, ownerAddress: “” });
const [cForm, setCForm] = useState(EMPTY_C);
const [vForm, setVForm] = useState({ nombre: “”, fecha: new Date().toISOString().split(“T”)[0], refuerzo: “”, tipo: “vacuna” });
const [calc, setCalc] = useState({ p: “”, d: “”, c: “”, r: 0 });

useEffect(() => {
localStorage.setItem(“vet_v25”, JSON.stringify(patients));
localStorage.setItem(“fin_v25”, JSON.stringify(finances));
}, [patients, finances]);

const alertas = useMemo(() => {
const hoy = new Date();
const lim = new Date();
lim.setDate(hoy.getDate() + 30);
return patients.flatMap((p) => {
const recs = […(p.vacunas || []), …(p.parasitos || [])];
if (p.history && p.history[0] && p.history[0].proximoControl) {
recs.push({ nombre: “Control Clinico”, refuerzo: p.history[0].proximoControl });
}
return recs
.filter((v) => { const d = new Date(v.refuerzo); return d >= hoy && d <= lim; })
.map((v) => ({ …v, pName: p.name, phone: p.ownerPhone, tutor: p.ownerName }));
});
}, [patients]);

const stats = useMemo(() => {
const ing = finances.filter((f) => f.tipo === “ingreso”).reduce((a, b) => a + Number(b.monto), 0);
const gas = finances.filter((f) => f.tipo === “gasto”).reduce((a, b) => a + Number(b.monto), 0);
return { ing, gas, neto: ing - gas };
}, [finances]);

const clinStats = useMemo(() => {
const months = parseInt(statsRange);
const cutoff = new Date();
cutoff.setMonth(cutoff.getMonth() - months);
const allH = patients.flatMap((p) => (p.history || []).map((h) => ({ …h, species: p.species })));
const recent = allH.filter((h) => new Date(h.date) >= cutoff);
const byMonth = {};
recent.forEach((h) => { const key = h.date.slice(0, 7); byMonth[key] = (byMonth[key] || 0) + 1; });
const consultasMes = Object.entries(byMonth)
.sort(([a], [b]) => a.localeCompare(b))
.map(([m, n]) => ({ mes: m.slice(5) + “/” + m.slice(2, 4), consultas: n }));
const bySpecies = {};
recent.forEach((h) => { bySpecies[h.species] = (bySpecies[h.species] || 0) + 1; });
const byDx = {};
recent.forEach((h) => { if (h.diagnostico) { const k = h.diagnostico.trim(); byDx[k] = (byDx[k] || 0) + 1; } });
const topDx = Object.entries(byDx).sort(([, a], [, b]) => b - a).slice(0, 5);
return { consultasMes, bySpecies, topDx, total: recent.length };
}, [patients, statsRange]);

const weightData = useMemo(() => {
if (!activePat) return [];
return […(activePat.history || [])]
.filter((h) => h.weight)
.sort((a, b) => a.date.localeCompare(b.date))
.map((h) => ({ fecha: h.date.slice(5), peso: parseFloat(h.weight) }));
}, [activePat]);

const exportBackup = () => {
const data = JSON.stringify({ patients, finances, exportedAt: new Date().toISOString() }, null, 2);
const blob = new Blob([data], { type: “application/json” });
const url = URL.createObjectURL(blob);
const a = document.createElement(“a”);
a.href = url;
a.download = “vet_backup_” + new Date().toISOString().slice(0, 10) + “.json”;
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
if (window.confirm(“Restaurar “ + data.patients.length + “ pacientes y “ + data.finances.length + “ movimientos? Esto reemplazara los datos actuales.”)) {
setPatients(data.patients);
setFinances(data.finances);
}
} else {
alert(“Archivo de respaldo invalido.”);
}
} catch (err) {
alert(“Error al leer el archivo.”);
}
};
reader.readAsText(file);
e.target.value = “”;
};

const exportCSV = () => {
const csv = “Fecha,Descripcion,Monto,Tipo\n” + finances.map((f) => f.fecha + “,” + f.desc + “,” + f.monto + “,” + f.tipo).join(”\n”);
const blob = new Blob([csv], { type: “text/csv” });
const a = document.createElement(“a”);
a.href = URL.createObjectURL(blob);
a.download = “finanzas_vet.csv”;
a.click();
};

const filteredPats = useMemo(() => {
const s = search.toLowerCase();
return patients.filter((p) => p.name.toLowerCase().includes(s) || p.ownerName.toLowerCase().includes(s));
}, [patients, search]);

const openNewPat = () => {
setPForm({ name: “”, species: “Perro”, breed: “”, weight: “”, reproductivo: “Entero/a”, alergias: “”, ownerName: “”, ownerPhone: “”, ownerAddress: “” });
setActivePatId(null);
setModal(“paciente”);
};
const openEditPat = (p) => { setPForm({ …p }); setActivePatId(p.id); setModal(“paciente”); };
const openConsulta = (p) => { setActivePatId(p.id); setActiveHistId(null); setCForm({ …EMPTY_C, id: Date.now(), weight: p.weight }); setModal(“consulta”); };
const openEditC = (h) => { setCForm(h); setActiveHistId(h.id); setModal(“consulta”); };
const openVacuna = (p) => { setActivePatId(p.id); setVForm({ nombre: “”, fecha: new Date().toISOString().split(“T”)[0], refuerzo: “”, tipo: “vacuna” }); setModal(“vacuna”); };
const openHist = (p) => { setActivePatId(p.id); setModal(“historial”); };
const deletePat = (id) => { if (!window.confirm(“Eliminar este paciente?”)) return; setPatients((prev) => prev.filter((p) => p.id !== id)); };

const saveConsulta = () => {
if (activeHistId) {
setPatients((prev) => prev.map((p) => p.id === activePatId ? { …p, history: p.history.map((h) => h.id === activeHistId ? cForm : h) } : p));
} else {
setPatients((prev) => prev.map((p) => p.id === activePatId ? { …p, weight: cForm.weight || p.weight, history: [cForm, …(p.history || [])] } : p));
}
setModal(null);
};

const NAV = [
{ k: “inicio”, l: “Inicio”, i: “🏠” },
{ k: “pacientes”, l: “Pacientes”, i: “🐾” },
{ k: “stats”, l: “Estadisticas”, i: “📊” },
{ k: “finanzas”, l: “Finanzas”, i: “💰” },
];

return (
<div style={{ fontFamily: “sans-serif”, background: “#f4f7f4”, minHeight: “100vh” }}>
<header style={{ background: “#1a331a”, color: “#fff”, padding: “15px 25px”, display: “flex”, justifyContent: “space-between”, alignItems: “center”, position: “sticky”, top: 0, zIndex: 100, boxShadow: “0 2px 12px rgba(0,0,0,0.3)” }}>
<div style={{ display: “flex”, alignItems: “center”, gap: 15 }}>
<img src={LOGO_URL} style={{ height: 45, background: “#fff”, borderRadius: 8, padding: 3 }} alt=”” onError={(e) => { e.target.style.display = “none”; }} />
<div>
<div style={{ fontWeight: 800, fontSize: 18 }}>{CLINICA}</div>
<div style={{ fontSize: 10, opacity: 0.7 }}>{DOCTOR}</div>
</div>
</div>
<nav style={{ display: “flex”, gap: 6 }}>
{NAV.map((n) => (
<button key={n.k} onClick={() => setTab(n.k)} style={{ background: tab === n.k ? “#3a7a3a” : “transparent”, border: tab === n.k ? “none” : “1px solid rgba(255,255,255,.2)”, color: “#fff”, cursor: “pointer”, fontWeight: 700, fontSize: 13, borderRadius: 10, padding: “8px 14px” }}>
{n.i} {n.l}
</button>
))}
</nav>
</header>

```
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
              <small style={{ color: "#888" }}>{s.l}</small>
              <br />
              <strong style={{ fontSize: 26, color: s.c }}>{s.v}</strong>
            </div>
          ))}
        </div>
        <div style={{ background: "#fff", padding: 25, borderRadius: 20, marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <h3 style={{ margin: "0 0 14px" }}>Recordatorios proximos (30 dias)</h3>
          {alertas.length === 0 ? (
            <p style={{ color: "#aaa", margin: 0 }}>Sin pendientes</p>
          ) : (
            alertas.map((a, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f0f0f0" }}>
                <div>
                  <strong>{a.pName}</strong> - {a.nombre}
                  <br />
                  <small style={{ color: "#888" }}>{a.refuerzo} - {a.tutor}</small>
                </div>
                <button onClick={() => window.open("https://wa.me/56" + a.phone.replace(/\D/g, "") + "?text=" + encodeURIComponent("Hola " + a.tutor + ", le recuerdo que " + a.pName + " tiene su " + a.nombre + " para el " + a.refuerzo + "."))} style={{ ...btnG, background: "#25D366", padding: "8px 14px", fontSize: 11 }}>
                  WhatsApp
                </button>
              </div>
            ))
          )}
        </div>
        <div style={{ background: "#fff", padding: 20, borderRadius: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <h3 style={{ margin: "0 0 12px" }}>Respaldo de Datos</h3>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={exportBackup} style={{ ...btnG, padding: "10px 18px", fontSize: 13 }}>Exportar respaldo JSON</button>
            <label style={{ ...btnG, padding: "10px 18px", fontSize: 13, display: "inline-flex", alignItems: "center", cursor: "pointer", background: "#4a90e2" }}>
              Importar respaldo
              <input type="file" accept=".json" style={{ display: "none" }} onChange={importBackup} />
            </label>
          </div>
        </div>
      </div>
    )}

    {tab === "pacientes" && (
      <div>
        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          <input placeholder="Buscar por mascota o tutor..." style={{ ...inp, flex: 1, marginBottom: 0 }} value={search} onChange={(e) => setSearch(e.target.value)} />
          <button onClick={openNewPat} style={btnG}>+ Nueva Ficha</button>
        </div>
        {filteredPats.length === 0 && <p style={{ textAlign: "center", color: "#aaa", padding: "40px 0" }}>No hay pacientes registrados.</p>}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(290px,1fr))", gap: 18 }}>
          {filteredPats.map((p) => (
            <div key={p.id} style={{ background: "#fff", padding: 22, borderRadius: 22, border: p.alergias ? "2px solid #ff4d4d" : "1.5px solid #e8f0e8", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <span style={{ fontSize: 38 }}>{SPECIES_ICO[p.species] || "🐾"}</span>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => openEditPat(p)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16 }}>✏️</button>
                  <button onClick={() => deletePat(p.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16 }}>🗑️</button>
                </div>
              </div>
              <h3 style={{ margin: "0 0 2px" }}>{p.name}</h3>
              <p style={{ fontSize: 13, color: "#666", margin: "0 0 8px" }}>
                {p.species}{p.breed ? " - " + p.breed : ""} - {p.weight ? p.weight + "kg" : "sin peso"} - {p.reproductivo}
                <br />
                {p.ownerName}
              </p>
              {p.alergias && (
                <div style={{ background: "#fff1f1", border: "1px solid #ff4d4d", borderRadius: 8, padding: "4px 10px", fontSize: 12, color: "#d32f2f", marginBottom: 8 }}>
                  Alergico a: {p.alergias}
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
                <button onClick={() => openConsulta(p)} style={btnG}>Consulta</button>
                <button onClick={() => openVacuna(p)} style={{ ...btnG, background: "#4a90e2" }}>Vac/Paras</button>
                <button onClick={() => openHist(p)} style={{ ...btnG, gridColumn: "span 2", background: "#f0f5ef", color: "#3a7a3a" }}>
                  Historial ({(p.history && p.history.length) || 0})
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    {tab === "stats" && (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, color: "#1a331a" }}>Estadisticas Clinicas</h2>
          <select value={statsRange} onChange={(e) => setStatsRange(e.target.value)} style={{ ...inp, width: "auto", marginBottom: 0 }}>
            <option value="1">Ultimo mes</option>
            <option value="3">Ultimos 3 meses</option>
            <option value="6">Ultimos 6 meses</option>
            <option value="12">Ultimo año</option>
          </select>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 14, marginBottom: 22 }}>
          {[
            { l: "Consultas", v: clinStats.total, c: "#1a331a" },
            { l: "Pacientes", v: patients.length, c: "#3a7a3a" },
            { l: "Alertas", v: alertas.length, c: "#e67e22" },
          ].map((s) => (
            <div key={s.l} style={{ background: "#fff", padding: 22, borderRadius: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <small style={{ color: "#888" }}>{s.l}</small>
              <br />
              <strong style={{ fontSize: 30, color: s.c }}>{s.v}</strong>
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div style={{ background: "#fff", padding: 22, borderRadius: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <h4 style={{ margin: "0 0 14px", color: "#1a331a" }}>Consultas por mes</h4>
            {clinStats.consultasMes.length === 0 ? (
              <p style={{ color: "#aaa", fontSize: 13 }}>Sin datos en este periodo.</p>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={clinStats.consultasMes}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="consultas" stroke="#3a7a3a" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
          <div style={{ background: "#fff", padding: 22, borderRadius: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <h4 style={{ margin: "0 0 14px", color: "#1a331a" }}>Consultas por especie</h4>
            {Object.keys(clinStats.bySpecies).length === 0 ? (
              <p style={{ color: "#aaa", fontSize: 13 }}>Sin datos en este periodo.</p>
            ) : (
              Object.entries(clinStats.bySpecies).sort(([, a], [, b]) => b - a).map(([sp, n]) => {
                const total = clinStats.total || 1;
                return (
                  <div key={sp} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 3 }}>
                      <span>{(SPECIES_ICO[sp] || "") + " " + sp}</span>
                      <span style={{ fontWeight: 700 }}>{n} ({Math.round((n / total) * 100)}%)</span>
                    </div>
                    <div style={{ background: "#f0f5ef", borderRadius: 20, height: 8 }}>
                      <div style={{ background: "#3a7a3a", borderRadius: 20, height: 8, width: Math.round((n / total) * 100) + "%" }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
        <div style={{ background: "#fff", padding: 22, borderRadius: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <h4 style={{ margin: "0 0 14px", color: "#1a331a" }}>Diagnosticos mas frecuentes</h4>
          {clinStats.topDx.length === 0 ? (
            <p style={{ color: "#aaa", fontSize: 13 }}>Sin diagnosticos registrados en este periodo.</p>
          ) : (
            clinStats.topDx.map(([dx, n], i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid #f0f0f0" }}>
                <span style={{ fontSize: 14 }}>
                  <span style={{ background: "#f0f5ef", color: "#3a7a3a", fontWeight: 800, borderRadius: 8, padding: "2px 8px", marginRight: 10, fontSize: 12 }}>{"#" + (i + 1)}</span>
                  {dx}
                </span>
                <span style={{ fontWeight: 700, color: "#3a7a3a" }}>{n + " caso" + (n > 1 ? "s" : "")}</span>
              </div>
            ))
          )}
        </div>
      </div>
    )}

    {tab === "finanzas" && (
      <div style={{ background: "#fff", padding: 28, borderRadius: 22, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
          <h3 style={{ margin: 0 }}>Contabilidad</h3>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={exportCSV} style={{ background: "#1D6F42", color: "#fff", border: "none", padding: "8px 14px", borderRadius: 10, cursor: "pointer", fontSize: 12 }}>Descargar CSV</button>
            <button onClick={exportBackup} style={{ background: "#4a90e2", color: "#fff", border: "none", padding: "8px 14px", borderRadius: 10, cursor: "pointer", fontSize: 12 }}>Respaldo JSON</button>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
          {[
            { l: "Ingresos", v: stats.ing, c: "#27ae60" },
            { l: "Gastos", v: stats.gas, c: "#e74c3c" },
            { l: "Neto", v: stats.neto, c: stats.neto >= 0 ? "#1a331a" : "#e74c3c" },
          ].map((s) => (
            <div key={s.l} style={{ background: "#f9fdf7", borderRadius: 14, padding: "14px 16px" }}>
              <small style={{ color: "#888" }}>{s.l}</small>
              <br />
              <strong style={{ fontSize: 22, color: s.c }}>{"$" + s.v.toLocaleString()}</strong>
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
          <input placeholder="Descripcion" style={inp} value={fForm.desc} onChange={(e) => setFForm((f) => ({ ...f, desc: e.target.value }))} />
          <input placeholder="Monto" type="number" style={inp} value={fForm.monto} onChange={(e) => setFForm((f) => ({ ...f, monto: e.target.value }))} />
          <select style={inp} value={fForm.tipo} onChange={(e) => setFForm((f) => ({ ...f, tipo: e.target.value }))}>
            <option value="ingreso">Ingreso</option>
            <option value="gasto">Gasto</option>
          </select>
        </div>
        <button style={{ ...btnG, width: "100%", marginBottom: 22 }} onClick={() => {
          if (!fForm.desc || !fForm.monto) return;
          setFinances((prev) => [{ desc: fForm.desc, monto: fForm.monto, tipo: fForm.tipo, fecha: new Date().toLocaleDateString("es-CL") }, ...prev]);
          setFForm({ desc: "", monto: "", tipo: "ingreso" });
        }}>
          Registrar
        </button>
        {finances.length === 0 && <p style={{ color: "#aaa", textAlign: "center" }}>Sin movimientos registrados.</p>}
        {finances.map((f, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f0f0f0" }}>
            <div>
              <strong style={{ color: f.tipo === "ingreso" ? "#27ae60" : "#e74c3c" }}>{(f.tipo === "ingreso" ? "+" : "-") + "$" + Number(f.monto).toLocaleString()}</strong>
              <span style={{ color: "#666", marginLeft: 10, fontSize: 13 }}>{f.desc}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <small style={{ color: "#aaa" }}>{f.fecha}</small>
              <button onClick={() => setFinances((prev) => prev.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: "#e74c3c", cursor: "pointer", fontWeight: 700, fontSize: 16 }}>x</button>
            </div>
          </div>
        ))}
      </div>
    )}
  </main>

  {modal === "consulta" && activePat && (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 10 }}>
      <div style={{ background: "#fff", borderRadius: 28, width: "100%", maxWidth: 760, maxHeight: "95vh", overflowY: "auto", padding: 25 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h3 style={{ margin: 0 }}>{activeHistId ? "Editar Atencion" : "Nueva Atencion"}: {activePat.name}</h3>
          <input type="date" value={cForm.date} style={{ ...inp, width: "auto", marginBottom: 0 }} onChange={(e) => setCForm((f) => ({ ...f, date: e.target.value }))} />
        </div>
        <div style={{ background: "#f0f7f0", padding: 14, borderRadius: 14, marginBottom: 14 }}>
          <span style={labelS}>CALCULADORA DE DOSIS</span>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 0.5fr", gap: 8 }}>
            <input placeholder="kg" style={inp} value={calc.p} onChange={(e) => setCalc((c) => ({ ...c, p: e.target.value }))} />
            <input placeholder="mg/kg" style={inp} value={calc.d} onChange={(e) => setCalc((c) => ({ ...c, d: e.target.value }))} />
            <input placeholder="mg/ml" style={inp} value={calc.c} onChange={(e) => setCalc((c) => ({ ...c, c: e.target.value }))} />
            <button style={{ ...btnG, padding: "10px" }} onClick={() => setCalc((c) => ({ ...c, r: (c.p * c.d / c.c).toFixed(2) }))}>ok</button>
          </div>
          <div style={{ display: "flex", gap: 5, overflowX: "auto", paddingBottom: 4 }}>
            {DOSIS_REF.map((dr, i) => (
              <button key={i} onClick={() => setCalc((c) => ({ ...c, d: dr.d, c: dr.c }))} style={{ background: "#fff", border: "1px solid #3a7a3a", borderRadius: 8, padding: "4px 8px", fontSize: 10, whiteSpace: "nowrap", cursor: "pointer" }}>{dr.n}</button>
            ))}
          </div>
          {calc.r > 0 && <p style={{ textAlign: "center", fontWeight: "bold", margin: "8px 0 0", color: "#1a331a" }}>Dosis: {calc.r} ml</p>}
        </div>
        <span style={labelS}>ANAMNESIS</span>
        <textarea style={{ ...inp, height: 52 }} value={cForm.anamnesis} onChange={(e) => setCForm((f) => ({ ...f, anamnesis: e.target.value }))} />
        <div style={{ border: "1px solid #d8e8d0", borderRadius: 14, padding: 14, marginBottom: 14 }}>
          <span style={labelS}>EXAMEN FISICO</span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
            {[["Peso(kg)", "weight"], ["T(C)", "temp"], ["FC(lpm)", "fc"], ["FR(rpm)", "fr"]].map(([l, k]) => (
              <div key={k}>
                <small style={{ fontSize: "9px", color: "#666" }}>{l}</small>
                <input value={cForm[k]} style={inp} onChange={(e) => setCForm((f) => ({ ...f, [k]: e.target.value }))} />
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            <input placeholder="Mucosas" value={cForm.mucosas} style={inp} onChange={(e) => setCForm((f) => ({ ...f, mucosas: e.target.value }))} />
            <input placeholder="TLLC(seg)" value={cForm.tllc} style={inp} onChange={(e) => setCForm((f) => ({ ...f, tllc: e.target.value }))} />
            <select value={cForm.cc} style={inp} onChange={(e) => setCForm((f) => ({ ...f, cc: e.target.value }))}>
              {["1", "2", "3", "4", "5"].map((n) => <option key={n} value={n}>{"CC " + n + "/5"}</option>)}
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <input placeholder="Linfonodos" value={cForm.linfonodos} style={inp} onChange={(e) => setCForm((f) => ({ ...f, linfonodos: e.target.value }))} />
            <input placeholder="Hidratacion %" value={cForm.hidratacion} style={inp} onChange={(e) => setCForm((f) => ({ ...f, hidratacion: e.target.value }))} />
          </div>
          <input placeholder="Cavidad Oral / Otros" value={cForm.oral} style={inp} onChange={(e) => setCForm((f) => ({ ...f, oral: e.target.value }))} />
        </div>
        <input placeholder="Diagnostico..." style={inp} value={cForm.diagnostico} onChange={(e) => setCForm((f) => ({ ...f, diagnostico: e.target.value }))} />
        <div style={{ marginBottom: 6 }}>
          <span style={labelS}>PLANTILLAS DE TRATAMIENTO</span>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 8 }}>
            {PLANTILLAS.map((pl, i) => (
              <button key={i} onClick={() => setCForm((f) => ({ ...f, tratamiento: pl.texto }))} style={{ background: "#f0f5ef", border: "1px solid #d0e8d0", borderRadius: 8, padding: "4px 10px", fontSize: 11, cursor: "pointer", color: "#3a7a3a", fontWeight: 600 }}>
                {pl.label}
              </button>
            ))}
          </div>
        </div>
        <textarea style={{ ...inp, height: 100, border: "2px solid #3a7a3a" }} placeholder="Tratamiento / Indicaciones..." value={cForm.tratamiento} onChange={(e) => setCForm((f) => ({ ...f, tratamiento: e.target.value }))} />
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
          <span style={{ ...labelS, margin: 0 }}>PROXIMO CONTROL:</span>
          <input type="date" style={{ ...inp, marginBottom: 0, flex: 1 }} value={cForm.proximoControl} onChange={(e) => setCForm((f) => ({ ...f, proximoControl: e.target.value }))} />
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, marginBottom: 14 }}>
          <input type="checkbox" checked={cForm.consentimiento} onChange={(e) => setCForm((f) => ({ ...f, consentimiento: e.target.checked }))} />
          Incluir consentimiento informado en PDF
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
          <button style={btnG} onClick={saveConsulta}>Guardar</button>
          <button style={{ ...btnG, background: "#25D366" }} onClick={() => sendWAReport(activePat, cForm)}>WhatsApp</button>
          <button style={{ ...btnG, background: "#4a90e2" }} onClick={() => exportPDF(activePat, "receta", cForm)}>Receta PDF</button>
        </div>
        <button onClick={() => setModal(null)} style={{ background: "none", border: "none", width: "100%", color: "#888", cursor: "pointer", marginTop: 4 }}>Cancelar</button>
      </div>
    </div>
  )}

  {modal === "paciente" && (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", padding: 28, borderRadius: 28, width: "90%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto" }}>
        <h3 style={{ margin: "0 0 14px" }}>{activePatId ? "Editar Ficha" : "Nueva Ficha"}</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <input placeholder="Nombre Mascota *" value={pForm.name} style={inp} onChange={(e) => setPForm((f) => ({ ...f, name: e.target.value }))} />
          <select value={pForm.species} style={inp} onChange={(e) => setPForm((f) => ({ ...f, species: e.target.value }))}>
            {Object.keys(SPECIES_ICO).map((s) => <option key={s}>{s}</option>)}
          </select>
          <input placeholder="Peso (kg)" type="number" value={pForm.weight} style={inp} onChange={(e) => setPForm((f) => ({ ...f, weight: e.target.value }))} />
          <select value={pForm.reproductivo} style={inp} onChange={(e) => setPForm((f) => ({ ...f, reproductivo: e.target.value }))}>
            <option>Entero/a</option>
            <option>Castrado/a</option>
          </select>
        </div>
        <input placeholder="Raza" value={pForm.breed} style={inp} onChange={(e) => setPForm((f) => ({ ...f, breed: e.target.value }))} />
        <input placeholder="Alergias conocidas" style={{ ...inp, border: "1.5px solid #ff4d4d" }} value={pForm.alergias} onChange={(e) => setPForm((f) => ({ ...f, alergias: e.target.value }))} />
        <input placeholder="Nombre Tutor *" value={pForm.ownerName} style={inp} onChange={(e) => setPForm((f) => ({ ...f, ownerName: e.target.value }))} />
        <input placeholder="WhatsApp Tutor" value={pForm.ownerPhone} style={inp} onChange={(e) => setPForm((f) => ({ ...f, ownerPhone: e.target.value }))} />
        <input placeholder="Direccion" value={pForm.ownerAddress} style={inp} onChange={(e) => setPForm((f) => ({ ...f, ownerAddress: e.target.value }))} />
        <button style={{ ...btnG, width: "100%", marginBottom: 8 }} onClick={() => {
          if (!pForm.name || !pForm.ownerName) return;
          if (activePatId) {
            setPatients((prev) => prev.map((p) => p.id === activePatId ? { ...p, ...pForm } : p));
          } else {
            setPatients((prev) => [{ ...pForm, id: Date.now(), history: [], vacunas: [], parasitos: [] }, ...prev]);
          }
          setModal(null);
        }}>
          Guardar Ficha
        </button>
        <button onClick={() => setModal(null)} style={{ background: "none", border: "none", width: "100%", cursor: "pointer", color: "#888" }}>Cerrar</button>
      </div>
    </div>
  )}

  {modal === "vacuna" && activePat && (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", padding: 28, borderRadius: 24, width: "90%", maxWidth: 420 }}>
        <h3 style={{ margin: "0 0 14px" }}>{"Vac/Paras - " + activePat.name}</h3>
        <select style={inp} value={vForm.tipo} onChange={(e) => setVForm((f) => ({ ...f, tipo: e.target.value }))}>
          <option value="vacuna">Vacuna</option>
          <option value="parasito">Antiparasitario</option>
        </select>
        <input placeholder="Nombre (Ej: Octuple, Bravecto)" style={inp} value={vForm.nombre} onChange={(e) => setVForm((f) => ({ ...f, nombre: e.target.value }))} />
        <label style={labelS}>Fecha de aplicacion</label>
        <input type="date" style={inp} value={vForm.fecha} onChange={(e) => setVForm((f) => ({ ...f, fecha: e.target.value }))} />
        <label style={labelS}>Fecha de refuerzo</label>
        <input type="date" style={inp} value={vForm.refuerzo} onChange={(e) => setVForm((f) => ({ ...f, refuerzo: e.target.value }))} />
        <button style={{ ...btnG, width: "100%", marginBottom: 8 }} onClick={() => {
          if (!vForm.nombre) return;
          const list = vForm.tipo === "vacuna" ? "vacunas" : "parasitos";
          setPatients((prev) => prev.map((p) => p.id === activePatId ? { ...p, [list]: [vForm, ...(p[list] || [])] } : p));
          setModal(null);
        }}>
          Guardar
        </button>
        <button onClick={() => setModal(null)} style={{ background: "none", border: "none", width: "100%", cursor: "pointer", color: "#888" }}>Cancelar</button>
      </div>
    </div>
  )}

  {modal === "historial" && activePat && (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", padding: 30, borderRadius: 26, width: "90%", maxWidth: 680, maxHeight: "88vh", overflowY: "auto" }}>
        <h3 style={{ margin: "0 0 6px" }}>{"Historial: " + activePat.name}</h3>
        {weightData.length > 1 && (
          <div style={{ background: "#f0f7f0", borderRadius: 14, padding: "14px 16px", marginBottom: 16 }}>
            <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: 13, color: "#1a331a" }}>Curva de Peso</p>
            <ResponsiveContainer width="100%" height={130}>
              <LineChart data={weightData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d8ead8" />
                <XAxis dataKey="fecha" tick={{ fontSize: 10 }} />
                <YAxis unit="kg" tick={{ fontSize: 10 }} domain={["auto", "auto"]} />
                <Tooltip formatter={(v) => v + " kg"} />
                <Line type="monotone" dataKey="peso" stroke="#3a7a3a" strokeWidth={2.5} dot={{ r: 4, fill: "#3a7a3a" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        {(!activePat.history || activePat.history.length === 0) ? (
          <p style={{ color: "#aaa" }}>Sin registros de atenciones.</p>
        ) : (
          activePat.history.map((h, i) => (
            <div key={i} style={{ borderBottom: "1px solid #eee", padding: "14px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <strong>{h.date}</strong>
                  {h.weight && <span style={{ background: "#f0f5ef", color: "#3a7a3a", fontSize: 11, borderRadius: 6, padding: "1px 7px", marginLeft: 8, fontWeight: 700 }}>{h.weight + "kg"}</span>}
                  <span style={{ marginLeft: 8, fontSize: 13, color: "#555" }}>{"Dx: " + (h.diagnostico || "Sin diagnostico")}</span>
                </div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  <button onClick={() => openEditC(h)} style={{ ...btnG, padding: "5px 10px", background: "#f39c12", fontSize: 11 }}>Editar</button>
                  <button onClick={() => sendWAReport(activePat, h)} style={{ ...btnG, padding: "5px 10px", background: "#25D366", fontSize: 11 }}>WA</button>
                  <button onClick={() => exportPDF(activePat, "historia", h)} style={{ ...btnG, padding: "5px 9px", fontSize: 11 }}>PDF</button>
                  <button onClick={() => exportPDF(activePat, "receta", h)} style={{ ...btnG, padding: "5px 9px", fontSize: 11, background: "#4a90e2" }}>Receta</button>
                </div>
              </div>
              {h.tratamiento && <p style={{ fontSize: 12, color: "#666", margin: "6px 0 0", whiteSpace: "pre-wrap" }}>{h.tratamiento.slice(0, 120) + (h.tratamiento.length > 120 ? "..." : "")}</p>}
            </div>
          ))
        )}
        <button onClick={() => setModal(null)} style={{ ...btnG, width: "100%", marginTop: 18, background: "#eee", color: "#333" }}>Cerrar</button>
      </div>
    </div>
  )}
</div>
```

);
}

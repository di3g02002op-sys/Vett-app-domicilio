import React, { useState, useEffect, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const DOCTOR      = "Dr. Diego Villalobos Palacios";
const CLINICA     = "Veterinario a Domicilio";
const LOGO_URL    = "/logo.png";
const SPECIES_ICO = { Perro: "🐕", Gato: "🐈", Ave: "🦜", Conejo: "🐇", Reptil: "🦎", Otro: "🐾" };

const DOSIS_REF = [
  { n: "Meloxicam (0.2mg/kg)", d: 0.2, c: 5 },
  { n: "Tramadol (2mg/kg)", d: 2, c: 50 },
  { n: "Enrofloxacino (5mg/kg)", d: 5, c: 50 },
  { n: "Cefalexina (20mg/kg)", d: 20, c: 250 },
];

const exportPDF = (p, type, consulta) => {
  const isReceta = type === "receta";
  const sexoEdad = [p.sexo, p.edad ? p.edad + " años" : ""].filter(Boolean).join(" | ");
  const html = [
    "<!DOCTYPE html><html><head><style>",
    "body{font-family:sans-serif;padding:40px;color:#333;line-height:1.6}",
    ".header{display:flex;justify-content:space-between;align-items:center;border-bottom:4px solid #1a331a;padding-bottom:15px;margin-bottom:25px}",
    ".info-grid{background:#f9f9f9;padding:20px;border-radius:12px;margin-bottom:25px;display:grid;grid-template-columns:1fr 1fr;gap:15px;border:1px solid #eee}",
    ".alerta{color:#d32f2f;font-weight:bold;border:2px solid #d32f2f;padding:8px;margin-top:10px;border-radius:8px;text-align:center;background:#fff1f1}",
    ".footer{margin-top:60px;text-align:center;font-size:11px;border-top:1px solid #ddd;padding-top:15px;color:#777}",
    "h3{color:#1a331a;border-bottom:2px solid #3a7a3a;padding-bottom:5px;margin-top:30px}",
    ".med-box{font-size:15px;white-space:pre-wrap;padding:25px;border:2px dashed #3a7a3a;border-radius:15px;background:#fff}",
    ".legal{font-size:10px;color:#666;margin-top:30px;border:1px solid #eee;padding:10px}",
    ".exam-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;font-size:12px}",
    "</style></head><body>",
    "<div class='header'>",
    "<img src='" + LOGO_URL + "' style='height:70px' onerror='this.style.display=`none`'>",
    "<div style='text-align:right'>",
    "<h1 style='margin:0;color:#1a331a'>" + (isReceta ? "RECETA MEDICA" : "FICHA CLINICA") + "</h1>",
    "<h2 style='margin:0;color:#3a7a3a'>" + CLINICA + "</h2>",
    "<p style='margin:5px 0'>" + DOCTOR + "</p>",
    "</div></div>",
    "<div class='info-grid'>",
    "<div><strong>Tutor:</strong> " + p.ownerName + "<br><strong>WhatsApp:</strong> " + p.ownerPhone + "<br><strong>Direccion:</strong> " + p.ownerAddress + "</div>",
    "<div><strong>Paciente:</strong> " + p.name + "<br>",
    "<strong>Especie/Raza:</strong> " + p.species + "/" + p.breed + "<br>",
    "<strong>Peso:</strong> " + ((consulta && consulta.weight) || p.weight || "--") + " kg | <strong>Estado:</strong> " + (p.reproductivo || "Entero/a") + "<br>",
    (sexoEdad ? "<strong>Sexo/Edad:</strong> " + sexoEdad + "<br>" : ""),
    (p.alergias ? "<div class='alerta'>ALERGICO A: " + p.alergias.toUpperCase() + "</div>" : ""),
    "</div></div>",
    isReceta
      ? "<h3>INDICACIONES:</h3><div class='med-box'>" + (consulta ? consulta.tratamiento : "") + "</div>"
      : [
          "<h3>ANAMNESIS:</h3><p>" + ((consulta && consulta.anamnesis) || "Sin registros.") + "</p>",
          "<h3>EXAMEN FISICO (" + ((consulta && consulta.date) || "") + ")</h3>",
          "<div class='exam-grid'>",
          "<div><b>Peso:</b> " + ((consulta && consulta.weight) || "--") + " kg</div>",
          "<div><b>T:</b> " + ((consulta && consulta.temp) || "--") + " C</div>",
          "<div><b>FC:</b> " + ((consulta && consulta.fc) || "--") + " lpm</div>",
          "<div><b>FR:</b> " + ((consulta && consulta.fr) || "--") + " rpm</div>",
          "<div><b>TLLC:</b> " + ((consulta && consulta.tllc) || "--") + " seg</div>",
          "<div><b>Mucosas:</b> " + ((consulta && consulta.mucosas) || "--") + "</div>",
          "<div><b>CC:</b> " + ((consulta && consulta.cc) || "--") + "/5</div>",
          "<div><b>Linfonodos:</b> " + ((consulta && consulta.linfonodos) || "--") + "</div>",
          "<div><b>Hidratacion:</b> " + ((consulta && consulta.hidratacion) || "--") + " %</div>",
          "</div>",
          "<h3>DIAGNOSTICO</h3><p>" + ((consulta && consulta.diagnostico) || "") + "</p>",
          "<h3>PLAN TERAPEUTICO</h3><p style='white-space:pre-wrap'>" + ((consulta && consulta.tratamiento) || "") + "</p>",
        ].join(""),
    (!isReceta && consulta && consulta.consentimiento)
      ? "<div class='legal'><b>CONSENTIMIENTO INFORMADO:</b> El tutor declara haber sido informado de los riesgos y autoriza al " + DOCTOR + " a proceder.<br><br><br>__________________________<br>Firma del Tutor</div>"
      : "",
    "<div class='footer'><p>Concepcion, Chile." + ((consulta && consulta.proximoControl) ? " | Proximo Control: " + consulta.proximoControl : "") + "</p></div>",
    "</body></html>",
  ].join("");
  const w = window.open("", "_blank");
  w.document.write(html);
  w.document.close();
  setTimeout(() => w.print(), 500);
};

const labelS = { fontSize: "11px", fontWeight: "bold", color: "#3a7a3a", marginBottom: "3px", display: "block" };
const inp = { width: "100%", padding: "10px", border: "1.5px solid #d8e8d0", borderRadius: 10, marginBottom: 8, boxSizing: "border-box", fontSize: "14px" };
const btnG = { background: "#3a7a3a", color: "#fff", border: "none", borderRadius: 12, padding: "14px", fontWeight: 700, cursor: "pointer" };

const EMPTY_PAT = {
  name: "", species: "Perro", breed: "", weight: "",
  reproductivo: "Entero/a",
  sexo: "Macho",
  edad: "",
  edadUnidad: "años",
  alergias: "", ownerName: "", ownerPhone: "", ownerAddress: "",
};

const EMPTY_C = {
  id: null, date: new Date().toISOString().split("T")[0],
  weight: "", temp: "", fc: "", fr: "", tllc: "", mucosas: "",
  cc: "3", linfonodos: "", hidratacion: "", oral: "",
  anamnesis: "", diagnostico: "", tratamiento: "",
  proximoControl: "", consentimiento: false,
};

export default function VetApp() {
  const [tab, setTab] = useState("inicio");
  const [patients, setPatients] = useState(() => {
    if (typeof window !== 'undefined') {
      return JSON.parse(localStorage.getItem("vet_v25") || "[]");
    }
    return [];
  });
  const [finances, setFinances] = useState(() => {
    if (typeof window !== 'undefined') {
      return JSON.parse(localStorage.getItem("fin_v25") || "[]");
    }
    return [];
  });
  
  const [modal,        setModal]       = useState(null);
  const [activePatId,  setActivePatId] = useState(null);
  const [activeHistId, setActiveHistId]= useState(null);
  const [search,       setSearch]      = useState("");
  const [fForm,        setFForm]       = useState({ desc: "", monto: "", tipo: "ingreso" });
  const [pForm,        setPForm]       = useState(EMPTY_PAT);
  const [cForm,        setCForm]       = useState(EMPTY_C);
  const [vForm,        setVForm]       = useState({ nombre: "", fecha: new Date().toISOString().split("T")[0], refuerzo: "", tipo: "vacuna" });
  const [calc,         setCalc]        = useState({ p: "", d: "", c: "", r: 0 });

  const activePat = patients.find((p) => p.id === activePatId) || null;

  useEffect(() => {
    localStorage.setItem("vet_v25", JSON.stringify(patients));
    localStorage.setItem("fin_v25", JSON.stringify(finances));
  }, [patients, finances]);

  const alertas = useMemo(() => {
    const hoy = new Date();
    const lim = new Date(); 
    lim.setDate(hoy.getDate() + 30);
    return patients.flatMap((p) => {
      const recs = [...(p.vacunas || []), ...(p.parasitos || [])];
      if (p.history && p.history[0] && p.history[0].proximoControl) {
        recs.push({ nombre: "Control Clinico", refuerzo: p.history[0].proximoControl });
      }
      return recs
        .filter((v) => { 
          if (!v.refuerzo) return false; 
          const d = new Date(v.refuerzo); 
          return d >= hoy && d <= lim; 
        })
        .map((v) => ({ ...v, pName: p.name, phone: p.ownerPhone, tutor: p.ownerName }));
    });
  }, [patients]);

  const stats = useMemo(() => {
    const ing = finances.filter((f) => f.tipo === "ingreso").reduce((a, b) => a + Number(b.monto), 0);
    const gas = finances.filter((f) => f.tipo === "gasto").reduce((a, b) => a + Number(b.monto), 0);
    return { ing, gas, neto: ing - gas };
  }, [finances]);

  const weightData = useMemo(() => {
    if (!activePat) return [];
    return [...(activePat.history || [])]
      .filter((h) => h.weight)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((h) => ({ fecha: h.date.slice(5), peso: parseFloat(h.weight) }));
  }, [activePat]);

  const exportCSV = () => {
    const csv = "Fecha,Descripcion,Monto,Tipo\n" + finances.map((f) => f.fecha + "," + f.desc + "," + f.monto + "," + f.tipo).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "finanzas_vet.csv"; a.click();
  };

  const filteredPatients = useMemo(() => {
    const s = search.toLowerCase();
    return patients.filter((p) => p.name.toLowerCase().includes(s) || p.ownerName.toLowerCase().includes(s));
  }, [patients, search]);

  const openNewPat = () => { setPForm(EMPTY_PAT); setActivePatId(null); setModal("paciente"); };
  const openEditPat = (p) => { setPForm({ ...EMPTY_PAT, ...p }); setActivePatId(p.id); setModal("paciente"); };
  const openConsulta = (p) => { setActivePatId(p.id); setActiveHistId(null); setCForm({ ...EMPTY_C, id: Date.now(), weight: p.weight }); setModal("consulta"); };
  const openEditC = (h) => { setCForm(h); setActiveHistId(h.id); setModal("consulta"); };
  const openVacuna = (p) => { setActivePatId(p.id); setVForm({ nombre: "", fecha: new Date().toISOString().split("T")[0], refuerzo: "", tipo: "vacuna" }); setModal("vacuna"); };
  const openHist = (p) => { setActivePatId(p.id); setModal("historial"); };
  const deletePat = (id) => { if (!window.confirm("Eliminar este paciente?")) return; setPatients((prev) => prev.filter((p) => p.id !== id)); };

  const saveConsulta = () => {
    if (activeHistId) {
      setPatients((prev) => prev.map((p) => p.id === activePatId ? { ...p, history: p.history.map((h) => h.id === activeHistId ? cForm : h) } : p));
    } else {
      setPatients((prev) => prev.map((p) => p.id === activePatId ? { ...p, weight: cForm.weight || p.weight, history: [cForm, ...(p.history || [])] } : p));
    }
    setModal(null);
  };

  const savePat = () => {
    if (!pForm.name || !pForm.ownerName) return;
    if (activePatId) {
      setPatients((prev) => prev.map((p) => p.id === activePatId ? { ...p, ...pForm } : p));
    } else {
      setPatients((prev) => [{ ...pForm, id: Date.now(), history: [], vacunas: [], parasitos: [] }, ...prev]);
    }
    setModal(null);
  };

  return (
    <div style={{ fontFamily: "sans-serif", background: "#f4f7f4", minHeight: "100vh" }}>
      <header style={{ background: "#1a331a", color: "#fff", padding: "15px 25px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
          <img src={LOGO_URL} style={{ height: 45, background: "#fff", borderRadius: 8, padding: 3 }} alt="" onError={(e) => { e.target.style.display = "none"; }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>{CLINICA}</div>
            <div style={{ fontSize: 10, opacity: 0.8 }}>{DOCTOR}</div>
          </div>
        </div>
        <nav style={{ display: "flex", gap: 20 }}>
          {["inicio", "pacientes", "finanzas"].map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", opacity: tab === t ? 1 : 0.6, fontWeight: tab === t ? 800 : 400, fontSize: 14 }}>
              {t.toUpperCase()}
            </button>
          ))}
        </nav>
      </header>

      <main style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
        {tab === "inicio" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15, marginBottom: 25 }}>
              <div style={{ background: "#fff", padding: 25, borderRadius: 25 }}>
                <small>Caja Neta</small><br />
                <strong style={{ fontSize: 26, color: "#27ae60" }}>{"$" + stats.neto.toLocaleString()}</strong>
              </div>
              <div style={{ background: "#fff", padding: 25, borderRadius: 25 }}>
                <small>Alertas Proximas</small><br />
                <strong style={{ fontSize: 26, color: "#e67e22" }}>{alertas.length}</strong>
              </div>
            </div>
            <div style={{ background: "#fff", padding: 25, borderRadius: 25 }}>
              <h3 style={{ margin: "0 0 15px" }}>Recordatorios y Seguimientos (30 dias)</h3>
              {alertas.length === 0 ? (
                <p style={{ color: "#aaa" }}>No hay pendientes.</p>
              ) : (
                alertas.map((a, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f0f0f0", alignItems: "center" }}>
                    <div>
                      <strong>{a.pName}</strong> - {a.nombre}<br />
                      <small style={{ color: "#888" }}>Refuerzo el: {a.refuerzo}</small>
                    </div>
                    <button onClick={() => window.open("https://wa.me/56" + a.phone.replace(/\D/g, "") + "?text=" + encodeURIComponent("Hola " + a.tutor + ", le recuerdo que " + a.pName + " tiene programado su " + a.nombre + " para el dia " + a.refuerzo + ". Saludos!"))} style={{ ...btnG, background: "#25D366", padding: "8px 15px", fontSize: 11 }}>
                      WhatsApp
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {tab === "pacientes" && (
          <div>
            <div style={{ display: "flex", gap: 12, marginBottom: 25 }}>
              <input placeholder="Buscar por mascota o tutor..." style={{ ...inp, flex: 1, marginBottom: 0 }} value={search} onChange={(e) => setSearch(e.target.value)} />
              <button onClick={openNewPat} style={btnG}>+ Nueva Ficha</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
              {filteredPatients.map((p) => (
                <div key={p.id} style={{ background: "#fff", padding: 25, borderRadius: 25, border: p.alergias ? "2px solid #ff4d4d" : "1px solid #eee" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 35 }}>{SPECIES_ICO[p.species] || "🐾"}</span>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => openEditPat(p)} style={{ background: "none", border: "none", color: "#3a7a3a", fontWeight: "bold", cursor: "pointer" }}>Editar</button>
                      <button onClick={() => deletePat(p.id)} style={{ background: "none", border: "none", color: "#e74c3c", fontWeight: "bold", cursor: "pointer" }}>Eliminar</button>
                    </div>
                  </div>
                  <h3 style={{ margin: "5px 0" }}>{p.name}</h3>
                  <p style={{ fontSize: 13, color: "#666", margin: "0 0 4px" }}>
                    {p.species}{p.breed ? " - " + p.breed : ""}{p.weight ? " | " + p.weight + " kg" : ""}
                  </p>
                  {(p.sexo || p.edad) && (
                    <p style={{ fontSize: 12, color: "#3a7a3a", margin: "0 0 6px", fontWeight: 600 }}>
                      {[p.sexo, p.edad ? p.edad + " " + (p.edadUnidad || "años") : ""].filter(Boolean).join("  |  ")}
                    </p>
                  )}
                  <p style={{ fontSize: 13, color: "#666", margin: "0 0 4px" }}>
                    {p.reproductivo}<br />Tutor: {p.ownerName}
                  </p>
                  {p.alergias && (
                    <div style={{ background: "#fff1f1", border: "1px solid #ff4d4d", borderRadius: 8, padding: "4px 10px", fontSize: 12, color: "#d32f2f", marginBottom: 8 }}>
                      Alergico a: {p.alergias}
                    </div>
                  )}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
                    <button onClick={() => openConsulta(p)} style={btnG}>Consulta</button>
                    <button onClick={() => openVacuna(p)} style={{ ...btnG, background: "#4a90e2" }}>Vac/Paras</button>
                    <button onClick={() => openHist(p)} style={{ ...btnG, gridColumn: "span 2", background: "#f0f5ef", color: "#3a7a3a" }}>
                      {"Historial (" + ((p.history && p.history.length) || 0) + ")"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "finanzas" && (
          <div style={{ background: "#fff", padding: 30, borderRadius: 25 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }}>
              <h3 style={{ margin: 0 }}>Contabilidad</h3>
              <button onClick={exportCSV} style={{ background: "#1D6F42", color: "#fff", border: "none", padding: "8px 15px", borderRadius: 10, cursor: "pointer", fontSize: 12 }}>Descargar CSV</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
              <input placeholder="Descripcion" style={inp} value={fForm.desc} onChange={(e) => setFForm((f) => ({ ...f, desc: e.target.value }))} />
              <input placeholder="Monto" type="number" style={inp} value={fForm.monto} onChange={(e) => setFForm((f) => ({ ...f, monto: e.target.value }))} />
              <select style={inp} value={fForm.tipo} onChange={(e) => setFForm((f) => ({ ...f, tipo: e.target.value }))}>
                <option value="ingreso">Ingreso</option>
                <option value="gasto">Gasto</option>
              </select>
            </div>
            <button style={{ ...btnG, width: "100%", marginBottom: 20 }} onClick={() => {
              if (!fForm.desc || !fForm.monto) return;
              setFinances((prev) => [{ desc: fForm.desc, monto: fForm.monto, tipo: fForm.tipo, fecha: new Date().toLocaleDateString("es-CL") }, ...prev]);
              setFForm({ desc: "", monto: "", tipo: "ingreso" });
            }}>Registrar</button>
            {finances.map((f, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f0f0f0" }}>
                <div>
                  <strong style={{ color: f.tipo === "ingreso" ? "#27ae60" : "#e74c3c" }}>{(f.tipo === "ingreso" ? "+" : "-") + "$" + Number(f.monto).toLocaleString()}</strong>
                  <span style={{ color: "#666", marginLeft: 10, fontSize: 13 }}>{f.desc}</span>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <small style={{ color: "#aaa" }}>{f.fecha}</small>
                  <button onClick={() => setFinances((prev) => prev.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: "#e74c3c", cursor: "pointer", fontWeight: 700 }}>x</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* MODAL CONSULTA */}
      {modal === "consulta" && activePat && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 10 }}>
          <div style={{ background: "#fff", borderRadius: 30, width: "100%", maxWidth: 750, maxHeight: "95vh", overflowY: "auto", padding: 25 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }}>
              <h3 style={{ margin: 0 }}>{activeHistId ? "Editar Atencion" : "Atencion"}: {activePat.name}</h3>
              <input type="date" value={cForm.date} style={{ ...inp, width: "auto", marginBottom: 0 }} onChange={(e) => setCForm((f) => ({ ...f, date: e.target.value }))} />
            </div>
            {/* Calculadora */}
            <div style={{ background: "#f0f7f0", padding: 15, borderRadius: 15, marginBottom: 15 }}>
              <span style={labelS}>CALCULADORA Y DOSIS COMUNES</span>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 0.5fr", gap: 8 }}>
                <input placeholder="kg" style={inp} value={calc.p} onChange={(e) => setCalc((c) => ({ ...c, p: e.target.value }))} />
                <input placeholder="mg/kg" style={inp} value={calc.d} onChange={(e) => setCalc((c) => ({ ...c, d: e.target.value }))} />
                <input placeholder="mg/ml" style={inp} value={calc.c} onChange={(e) => setCalc((c) => ({ ...c, c: e.target.value }))} />
                <button style={{ ...btnG, padding: "10px" }} onClick={() => setCalc((c) => ({ ...c, r: (c.p * c.d / c.c).toFixed(2) }))}>ok</button>
              </div>
              {calc.r > 0 && <p style={{ textAlign: "center", fontWeight: "bold", margin: "10px 0 0", color: "#1a331a" }}>Dosis: {calc.r} ml</p>}
            </div>
            {/* Formulario */}
            <span style={labelS}>ANAMNESIS</span>
            <textarea style={{ ...inp, height: 40 }} value={cForm.anamnesis} onChange={(e) => setCForm((f) => ({ ...f, anamnesis: e.target.value }))} />
            <div style={{ border: "1px solid #d8e8d0", borderRadius: 15, padding: 15, marginBottom: 15 }}>
              <span style={labelS}>EXAMEN FISICO</span>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                {[["Peso", "weight"], ["T (C)", "temp"], ["FC", "fc"], ["FR", "fr"]].map(([l, k]) => (
                  <div key={k}>
                    <small style={{ fontSize: "9px" }}>{l}</small>
                    <input value={cForm[k]} style={inp} onChange={(e) => setCForm((f) => ({ ...f, [k]: e.target.value }))} />
                  </div>
                ))}
              </div>
            </div>
            <textarea style={{ ...inp, height: 70, border: "2px solid #3a7a3a" }} placeholder="Tratamiento..." value={cForm.tratamiento} onChange={(e) => setCForm((f) => ({ ...f, tratamiento: e.target.value }))} />
            <button style={{ ...btnG, width: "100%" }} onClick={saveConsulta}>Guardar Atencion</button>
            <button onClick={() => setModal(null)} style={{ background: "none", border: "none", width: "100%", marginTop: 10, color: "#666", cursor: "pointer" }}>Cancelar</button>
          </div>
        </div>
      )}

      {/* MODAL PACIENTE */}
      {modal === "paciente" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", padding: 30, borderRadius: 30, width: "90%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto" }}>
            <h3 style={{ margin: "0 0 15px" }}>{activePatId ? "Editar Ficha" : "Nueva Ficha"}</h3>
            <span style={labelS}>NOMBRE MASCOTA</span>
            <input placeholder="Ej: Firulais" value={pForm.name} style={inp} onChange={(e) => setPForm((f) => ({ ...f, name: e.target.value }))} />
            <button style={{ ...btnG, width: "100%", marginTop: 6 }} onClick={savePat}>Guardar Ficha</button>
            <button onClick={() => setModal(null)} style={{ background: "none", border: "none", width: "100%", marginTop: 10, cursor: "pointer", color: "#666" }}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}

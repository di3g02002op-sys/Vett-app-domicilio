import { useState, useEffect, useMemo } from "react";

// ─── CONFIGURACIÓN ──────────────────────────────────────────────────
const DOCTOR = "Dr. Diego Villalobos Palacios";
const SPECIES_ICO = { Perro: "🐕", Gato: "🐈", Ave: "🦜", Conejo: "🐇", Reptil: "🦎", Otro: "🐾" };

// ─── ESTILOS ────────────────────────────────────────────────────────
const inp = { width: "100%", padding: "10px", border: "1.5px solid #d8e8d0", borderRadius: 10, marginBottom: 10, boxSizing: "border-box" };
const btnG = { background: "#3a7a3a", color: "#fff", border: "none", borderRadius: 10, padding: "12px 15px", fontWeight: 700, cursor: "pointer" };
const cardStyle = { background: "#fff", padding: "20px", borderRadius: "20px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)", marginBottom: "15px" };

export default function VetApp() {
  const [tab, setTab] = useState("inicio");
  const [patients, setPatients] = useState(() => JSON.parse(localStorage.getItem("vet_master_v7") || "[]"));
  const [finances, setFinances] = useState(() => JSON.parse(localStorage.getItem("vet_finanzas_v7") || "[]"));
  const [modal, setModal] = useState(null);
  const [activePat, setActivePat] = useState(null);

  // Estados Formularios
  const [transForm, setTransForm] = useState({ desc: "", monto: "", tipo: "ingreso", fecha: new Date().toISOString().split('T')[0] });
  const [pForm, setPForm] = useState({ name: "", species: "Perro", ownerPhone: "", ownerName: "" });

  useEffect(() => {
    localStorage.setItem("vet_master_v7", JSON.stringify(patients));
    localStorage.setItem("vet_finanzas_v7", JSON.stringify(finances));
  }, [patients, finances]);

  // LÓGICA FINANCIERA
  const stats = useMemo(() => {
    const ingresos = finances.filter(f => f.tipo === "ingreso").reduce((acc, curr) => acc + Number(curr.monto), 0);
    const gastos = finances.filter(f => f.tipo === "gasto").reduce((acc, curr) => acc + Number(curr.monto), 0);
    return { ingresos, gastos, saldo: ingresos - gastos };
  }, [finances]);

  // ALERTAS VACUNAS (30 días)
  const alertas = useMemo(() => {
    const hoy = new Date();
    const limite = new Date();
    limite.setDate(hoy.getDate() + 30);
    let list = [];
    patients.forEach(p => (p.vacunas || []).forEach(v => {
      const ref = new Date(v.refuerzo);
      if (ref >= hoy && ref <= limite) list.push({ pName: p.name, vName: v.nombre, ref: v.refuerzo, phone: p.ownerPhone });
    }));
    return list;
  }, [patients]);

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#f4f7f4", minHeight: "100vh" }}>
      <header style={{ background: "#1a331a", color: "#fff", padding: "15px 20px", display: "flex", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <div><strong>{DOCTOR}</strong></div>
        <nav style={{ display: "flex", gap: "15px" }}>
          <button onClick={() => setTab("inicio")} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}>Inicio</button>
          <button onClick={() => setTab("pacientes")} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}>Pacientes</button>
          <button onClick={() => setTab("finanzas")} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}>💰 Finanzas</button>
        </nav>
      </header>

      <main style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
        
        {/* PESTAÑA: FINANZAS */}
        {tab === "finanzas" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "20px" }}>
              <div style={{ ...cardStyle, textAlign: "center", borderBottom: "4px solid #2ecc71" }}>
                <small>Ingresos</small><br/><strong>${stats.ingresos.toLocaleString()}</strong>
              </div>
              <div style={{ ...cardStyle, textAlign: "center", borderBottom: "4px solid #e74c3c" }}>
                <small>Gastos</small><br/><strong>${stats.gastos.toLocaleString()}</strong>
              </div>
              <div style={{ ...cardStyle, textAlign: "center", borderBottom: "4px solid #3498db" }}>
                <small>Saldo Neto</small><br/><strong>${stats.saldo.toLocaleString()}</strong>
              </div>
            </div>

            <div style={cardStyle}>
              <h3>Registrar Movimiento</h3>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "10px" }}>
                <input placeholder="Descripción (Ej: Consulta Bobby / Bencina)" style={inp} value={transForm.desc} onChange={e => setTransForm({...transForm, desc: e.target.value})} />
                <input placeholder="Monto" type="number" style={inp} value={transForm.monto} onChange={e => setTransForm({...transForm, monto: e.target.value})} />
                <select style={inp} value={transForm.tipo} onChange={e => setTransForm({...transForm, tipo: e.target.value})}>
                  <option value="ingreso">Ingreso (+)</option>
                  <option value="gasto">Gasto (-)</option>
                </select>
              </div>
              <button style={{ ...btnG, width: "100%" }} onClick={() => {
                if(!transForm.monto || !transForm.desc) return;
                setFinances([transForm, ...finances]);
                setTransForm({ desc: "", monto: "", tipo: "ingreso", fecha: new Date().toISOString().split('T')[0] });
              }}>Guardar Transacción</button>
            </div>

            <div style={cardStyle}>
              <h3>Historial de Caja</h3>
              {finances.map((f, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #eee" }}>
                  <span>{f.desc} <small style={{ color: "#999" }}>({f.fecha})</small></span>
                  <strong style={{ color: f.tipo === "ingreso" ? "#27ae60" : "#c0392b" }}>
                    {f.tipo === "ingreso" ? "+" : "-"}${Number(f.monto).toLocaleString()}
                  </strong>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PESTAÑA: INICIO (ALERTAS) */}
        {tab === "inicio" && (
          <div>
            <h2>Hola, Diego.</h2>
            <div style={cardStyle}>
              <h4>📢 Alertas de Vacunación</h4>
              {alertas.length === 0 ? <p>Todo al día por ahora.</p> : alertas.map((a, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", background: "#fff9e6", padding: "10px", borderRadius: "10px" }}>
                  <span>{a.pName}: {a.vName} ({a.ref})</span>
                  <button style={{ ...btnG, background: "#25D366", padding: "5px 10px", fontSize: "10px" }} onClick={() => window.open(`https://wa.me/56${a.phone}?text=Hola, le recuerdo el refuerzo de ${a.pName}...`)}>Avisar</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PESTAÑA: PACIENTES */}
        {tab === "pacientes" && (
          <div>
            <button onClick={() => setModal("paciente")} style={{ ...btnG, width: "100%", marginBottom: "20px" }}>+ Nuevo Paciente</button>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
              {patients.map(p => (
                <div key={p.id} style={cardStyle}>
                  <span style={{ fontSize: "30px" }}>{SPECIES_ICO[p.species]}</span>
                  <h3>{p.name}</h3>
                  <p style={{ fontSize: "12px", color: "#666" }}>Tutor: {p.ownerName}</p>
                  <button onClick={() => { setActivePat(p); setModal("vacuna"); }} style={{ ...btnG, width: "100%", fontSize: "11px", background: "#4a90e2" }}>💉 Vacuna</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* MODAL NUEVO PACIENTE */}
      {modal === "paciente" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
          <div style={{ background: "#fff", padding: "30px", borderRadius: "20px", width: "90%", maxWidth: "400px" }}>
            <h3>Registrar Paciente</h3>
            <input placeholder="Nombre Mascota" style={inp} onChange={e => setPForm({...pForm, name: e.target.value})} />
            <select style={inp} onChange={e => setPForm({...pForm, species: e.target.value})}>
              {Object.keys(SPECIES_ICO).map(s => <option key={s}>{s}</option>)}
            </select>
            <input placeholder="Nombre Tutor" style={inp} onChange={e => setPForm({...pForm, ownerName: e.target.value})} />
            <input placeholder="WhatsApp (Ej: 912345678)" style={inp} onChange={e => setPForm({...pForm, ownerPhone: e.target.value})} />
            <button style={{ ...btnG, width: "100%" }} onClick={() => {
              setPatients([...patients, { ...pForm, id: Date.now(), vacunas: [], history: [] }]);
              setModal(null);
            }}>Guardar</button>
            <button onClick={() => setModal(null)} style={{ background: "none", border: "none", width: "100%", marginTop: "10px" }}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}

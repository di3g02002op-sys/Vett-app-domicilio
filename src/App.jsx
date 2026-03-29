
import { useState, useMemo, useEffect } from "react";

// ==============================================================================
// ⚙️ CONFIGURACIÓN Y CONSTANTES
// ==============================================================================
const DOCTOR     = "Diego Villalobos Palacios";
const LOGO_URL   = "/logo.png"; // Asegúrate de que esté en la carpeta /public
const SPECIES    = ["Perro", "Gato", "Ave", "Conejo", "Reptil", "Otro"];
const SPECIES_ICO = { Perro: "🐕", Gato: "🐈", Ave: "🦜", Conejo: "🐇", Reptil: "🦎", Otro: "🐾" };
const STATUSES   = ["Pendiente", "Confirmada", "Completada", "Cancelada"];

const STATUS_CFG = {
  Pendiente:  { bg: "#FFF3CD", text: "#856404", dot: "#FFC107" },
  Confirmada: { bg: "#D1E7DD", text: "#0A3622", dot: "#198754" },
  Completada: { bg: "#E2E3E5", text: "#41464B", dot: "#6C757D" },
  Cancelada:  { bg: "#F8D7DA", text: "#58151C", dot: "#DC3545" },
};

// ==============================================================================
// 📱 COMPONENTES DE INTERFAZ
// ==============================================================================
function Badge({ status }) {
  const c = STATUS_CFG[status] || STATUS_CFG.Pendiente;
  return (
    <span style={{ background: c.bg, color: c.text, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 5 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot, flexShrink: 0 }} />{status}
    </span>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={styles.modalOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={styles.modalContent}>
        <div style={styles.modalHeader}>
          <h2 style={{ margin: 0, fontSize: 18, color: "#1a2e1a" }}>{title}</h2>
          <button onClick={onClose} style={styles.closeBtn}>×</button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}

// ==============================================================================
// 🏆 APP PRINCIPAL (CON LOCAL STORAGE)
// ==============================================================================
export default function VetApp() {
  const [tab, setTab] = useState("inicio");
  const [patients, setPatients] = useState([]);
  const [appts, setAppts] = useState([]);
  const [search, setSearch] = useState("");

  const [apptModal, setApptModal] = useState(null);
  const [patModal, setPatModal] = useState(null);

  const E_APPT = { patientId: "", date: "", time: "", motivo: "", status: "Pendiente" };
  const E_PAT = { name: "", species: "Perro", ownerName: "", ownerPhone: "" };
  const [apptForm, setApptForm] = useState(E_APPT);
  const [patForm, setPatForm] = useState(E_PAT);

  // ─── PERSISTENCIA (LOCAL STORAGE) ───
  useEffect(() => {
    const p = localStorage.getItem("vet_pats_diego");
    const a = localStorage.getItem("vet_appts_diego");
    if (p) setPatients(JSON.parse(p));
    if (a) setAppts(JSON.parse(a));
  }, []);

  useEffect(() => {
    localStorage.setItem("vet_pats_diego", JSON.stringify(patients));
    localStorage.setItem("vet_appts_diego", JSON.stringify(appts));
  }, [patients, appts]);

  // ─── RECORDATORIO WHATSAPP ───
  const sendWhatsApp = (appt, patient) => {
    if (!patient?.ownerPhone) return alert("Falta el teléfono.");
    const phone = patient.ownerPhone.replace(/\D/g, "");
    const finalPhone = phone.length === 9 ? `56${phone}` : phone;
    const fechaStr = new Date(appt.date + "T12:00").toLocaleDateString("es-CL", { 
      weekday: 'long', day: 'numeric', month: 'long' 
    });
    const message = `Hola ${patient.ownerName}, le escribe el Dr. Diego Villalobos. Le recuerdo su cita para ${patient.name} este ${fechaStr} a las ${appt.time} hrs. ¡Nos vemos!`;
    window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`, "_blank");
  };

  // ─── ACCIONES ───
  const saveAppt = () => {
    if (!apptForm.date || !apptForm.patientId) return;
    if (apptModal === "new") setAppts([...appts, { ...apptForm, id: Date.now() }]);
    else setAppts(appts.map(a => a.id === apptModal.id ? { ...apptForm, id: a.id } : a));
    setApptModal(null);
  };

  const savePat = () => {
    if (!patForm.name || !patForm.ownerName) return;
    if (patModal === "new") setPatients([...patients, { ...patForm, id: Date.now() }]);
    else setPatients(patients.map(p => p.id === patModal.id ? { ...patForm, id: p.id } : p));
    setPatModal(null);
  };

  const filteredPats = patients.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || p.ownerName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ fontFamily: "sans-serif", background: "#f0f5ef", minHeight: "100vh" }}>
      
      {/* HEADER CON LOGO */}
      <header style={styles.header}>
        <img src={LOGO_URL} alt="Logo" style={styles.logo} />
        <h1 style={{ margin: "10px 0 2px", fontSize: 22 }}>VetDomicilio</h1>
        <p style={{ margin: 0, fontSize: 12, opacity: 0.8 }}>Dr. Diego Villalobos</p>
        <nav style={{ display: "flex", gap: 10, marginTop: 15 }}>
          {["inicio", "agenda", "pacientes"].map(n => (
            <button key={n} onClick={() => setTab(n)} style={{ ...styles.navBtn, background: tab === n ? "#fff" : "transparent", color: tab === n ? "#1a365d" : "#fff" }}>
              {n.toUpperCase()}
            </button>
          ))}
        </nav>
      </header>

      <main style={{ padding: 20, maxWidth: 800, margin: "0 auto" }}>
        {/* VISTA AGENDA */}
        {tab === "agenda" && (
          <>
            <div style={styles.flexRow}>
              <h2>Próximas Citas</h2>
              <button onClick={() => { setApptForm(E_APPT); setApptModal("new"); }} style={styles.btnG}>+ Nueva Cita</button>
            </div>
            {appts.sort((a,b) => a.date.localeCompare(b.date)).map(a => {
              const pt = patients.find(p => p.id === a.patientId);
              return (
                <div key={a.id} style={styles.card}>
                  <div style={styles.timeBadge}>{a.time}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{pt?.name} {SPECIES_ICO[pt?.species]}</div>
                    <div style={{ fontSize: 12, color: "#666" }}>{a.date} · {a.motivo}</div>
                  </div>
                  <button onClick={() => sendWhatsApp(a, pt)} style={styles.btnW}>💬 Recordar</button>
                  <Badge status={a.status} />
                </div>
              );
            })}
          </>
        )}

        {/* VISTA PACIENTES */}
        {tab === "pacientes" && (
          <>
            <div style={styles.flexRow}>
              <h2>Pacientes</h2>
              <button onClick={() => { setPatForm(E_PAT); setPatModal("new"); }} style={styles.btnG}>+ Nuevo</button>
            </div>
            <input placeholder="Buscar..." style={styles.inp} onChange={e => setSearch(e.target.value)} />
            <div style={styles.grid}>
              {filteredPats.map(p => (
                <div key={p.id} style={styles.cardPat}>
                  <div style={{ fontSize: 28 }}>{SPECIES_ICO[p.species]}</div>
                  <div style={{ fontWeight: 700 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: "#666" }}>{p.ownerName}</div>
                  <button onClick={() => { setPatForm(p); setPatModal(p); }} style={styles.btnEdit}>Ver Ficha</button>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* MODALES */}
      {apptModal && (
        <Modal title="Agendar" onClose={() => setApptModal(null)}>
          <select style={styles.inp} value={apptForm.patientId} onChange={e => setApptForm({...apptForm, patientId: Number(e.target.value)})}>
            <option value="">Elegir Paciente...</option>
            {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input type="date" style={styles.inp} value={apptForm.date} onChange={e => setApptForm({...apptForm, date: e.target.value})} />
          <input type="time" style={styles.inp} value={apptForm.time} onChange={e => setApptForm({...apptForm, time: e.target.value})} />
          <input placeholder="Motivo" style={styles.inp} value={apptForm.motivo} onChange={e => setApptForm({...apptForm, motivo: e.target.value})} />
          <button onClick={saveAppt} style={{ ...styles.btnG, width: "100%" }}>Guardar</button>
        </Modal>
      )}

      {patModal && (
        <Modal title="Paciente" onClose={() => setPatModal(null)}>
          <input placeholder="Nombre Mascota" style={styles.inp} value={patForm.name} onChange={e => setPatForm({...patForm, name: e.target.value})} />
          <select style={styles.inp} value={patForm.species} onChange={e => setPatForm({...patForm, species: e.target.value})}>
            {SPECIES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input placeholder="Nombre Tutor" style={styles.inp} value={patForm.ownerName} onChange={e => setPatForm({...patForm, ownerName: e.target.value})} />
          <input placeholder="WhatsApp (Ej: 912345678)" style={styles.inp} value={patForm.ownerPhone} onChange={e => setPatForm({...patForm, ownerPhone: e.target.value})} />
          <button onClick={savePat} style={{ ...styles.btnG, width: "100%" }}>Guardar</button>
        </Modal>
      )}
    </div>
  );
}

const styles = {
  header: { background: "#1a365d", color: "#fff", padding: "20px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" },
  logo: { width: 65, height: 65, borderRadius: "50%", background: "#fff", padding: 2, boxShadow: "0 4px 10px rgba(0,0,0,0.2)" },
  navBtn: { border: "none", padding: "6px 12px", borderRadius: 20, fontWeight: 700, cursor: "pointer", fontSize: 11 },
  flexRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  btnG: { background: "#3a7a3a", color: "#fff", border: "none", padding: "10px 15px", borderRadius: 8, cursor: "pointer", fontWeight: 700 },
  btnW: { background: "#25D366", color: "#fff", border: "none", padding: "6px 10px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 700 },
  btnEdit: { width: "100%", marginTop: 10, background: "#f0f5ef", border: "1px solid #3a7a3a", color: "#3a7a3a", padding: "5px", borderRadius: 5, fontSize: 12 },
  card: { background: "#fff", padding: 12, borderRadius: 12, marginBottom: 8, display: "flex", alignItems: "center", gap: 10, boxShadow: "0 2px 4px rgba(0,0,0,0.05)" },
  cardPat: { background: "#fff", padding: 15, borderRadius: 12, boxShadow: "0 2px 4px rgba(0,0,0,0.05)", textAlign: "center" },
  timeBadge: { background: "#e8f0e8", padding: "5px 10px", borderRadius: 6, fontWeight: 800, fontSize: 14, color: "#1a365d" },
  inp: { width: "100%", padding: "10px", marginBottom: 10, borderRadius: 8, border: "1px solid #ddd", boxSizing: "border-box" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
  modalContent: { background: "#fff", borderRadius: 15, width: "90%", maxWidth: 400, overflow: "hidden" },
  modalHeader: { background: "#f8faf8", padding: "15px 20px", display: "flex", justifyContent: "space-between", borderBottom: "1px solid #eee" },
  closeBtn: { background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#aaa" }
};

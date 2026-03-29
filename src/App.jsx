import { useState, useMemo, useEffect } from "react";

const DOCTOR     = "Diego Villalobos Palacios";
const SPECIES    = ["Perro","Gato","Ave","Conejo","Reptil","Otro"];
const STATUSES   = ["Pendiente","Confirmada","Completada","Cancelada"];
const SPECIES_ICO= { Perro:"🐕", Gato:"🐈", Ave:"🦜", Conejo:"🐇", Reptil:"🦎", Otro:"🐾" };
const DAYS_ES    = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const STATUS_CFG = {
  Pendiente:  { bg:"#FFF3CD", text:"#856404",  dot:"#FFC107" },
  Confirmada: { bg:"#D1E7DD", text:"#0A3622",  dot:"#198754" },
  Completada: { bg:"#E2E3E5", text:"#41464B",  dot:"#6C757D" },
  Cancelada:  { bg:"#F8D7DA", text:"#58151C",  dot:"#DC3545" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function vaccStatus(nextDue) {
  if (!nextDue) return { label:"Sin fecha", color:"#6c757d", bg:"#e9ecef", dot:"#6c757d" };
  const d = Math.ceil((new Date(nextDue) - new Date()) / 864e5);
  if (d < 0)   return { label:"Vencida",   color:"#b91c1c", bg:"#fee2e2", dot:"#dc2626" };
  if (d <= 30) return { label:`En ${d}d`,  color:"#92400e", bg:"#fef3c7", dot:"#d97706" };
  return               { label:"Al día",   color:"#065f46", bg:"#d1fae5", dot:"#059669" };
}

function exportPDF(patient, appts, doctor) {
  const vRows = (patient.vaccines||[]).map(v =>
    `<tr><td>${v.name}</td><td>${v.lastDate||"—"}</td><td>${v.nextDue||"—"}</td><td>${v.notes||""}</td></tr>`).join("");
  const hRows = (patient.history||[]).map(h => {
    const meds = (h.medications||[]).map(m=>`${m.name} ${m.dose} ${m.frequency}`).join(", ") || "—";
    return `<tr><td>${h.date}</td><td>${h.motivo}</td><td>${h.diagnostico||"—"}</td><td>${h.tratamiento||"—"}</td><td style="font-size:11px">${meds}</td></tr>`;
  }).join("");
  const aRows = appts.filter(a=>a.patientId===patient.id).map(a =>
    `<tr><td>${a.date}</td><td>${a.time}</td><td>${a.motivo}</td><td>${a.status}</td></tr>`).join("");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Ficha — ${patient.name}</title>
  <style>
    body{font-family:Georgia,serif;color:#1a2e1a;padding:40px;max-width:800px;margin:0 auto}
    .hdr{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #3a7a3a;padding-bottom:16px;margin-bottom:24px}
    .logo{font-size:20px;font-weight:700;color:#1e3a1e;margin-bottom:4px}
    h2{font-size:12px;text-transform:uppercase;color:#3a7a3a;border-bottom:1px solid #d8e8d0;padding-bottom:4px;letter-spacing:.06em;margin:20px 0 10px}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px}
    .f{background:#f2f7f0;padding:8px 12px;border-radius:6px}
    .f label{font-size:10px;color:#5a7a5a;text-transform:uppercase;display:block}
    .f span{font-size:14px;font-weight:600}
    table{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:16px}
    th{background:#1e3a1e;color:#fff;padding:8px 10px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.04em}
    td{padding:7px 10px;border-bottom:1px solid #e8f0e8;vertical-align:top}
    tr:nth-child(even) td{background:#f9fdf7}
    .alert{background:#fffbeb;border-left:3px solid #fbbf24;padding:10px 14px;border-radius:6px;font-size:13px;color:#78350f;margin:0 0 16px}
    .footer{margin-top:40px;border-top:1px solid #d8e8d0;padding-top:14px;font-size:11px;color:#5a7a5a;display:flex;justify-content:space-between}
    @media print { .no-print { display: none; } }
  </style></head><body>
  <div class="hdr">
    <div><div class="logo">🏥 VetDomicilio</div><div style="font-size:12px;color:#5a7a5a">Medicina Veterinaria a Domicilio</div></div>
    <div style="text-align:right;font-size:12px;color:#5a7a5a"><strong style="color:#1a2e1a">Méd. Vet. ${doctor}</strong><br>Fecha impresión: ${new Date().toLocaleDateString("es-CL")}</div>
  </div>
  <h2>Datos del Paciente</h2>
  <div class="grid">
    <div class="f"><label>Nombre</label><span>${patient.name}</span></div>
    <div class="f"><label>Especie / Raza</label><span>${patient.species}${patient.breed?" · "+patient.breed:""}</span></div>
    <div class="f"><label>Edad</label><span>${patient.age?patient.age+" años":"—"}</span></div>
    <div class="f"><label>Peso</label><span>${patient.weight?patient.weight+" kg":"—"}</span></div>
  </div>
  ${patient.notes?`<div class="alert">⚠️ ${patient.notes}</div>`:""}
  <h2>Propietario</h2>
  <div class="grid">
    <div class="f"><label>Nombre</label><span>${patient.ownerName}</span></div>
    <div class="f"><label>Teléfono</label><span>${patient.ownerPhone||"—"}</span></div>
    <div class="f" style="grid-column:1/-1"><label>Dirección</label><span>${patient.ownerAddress||"—"}</span></div>
  </div>
  ${vRows?`<h2>Registro de Vacunas</h2><table><thead><tr><th>Vacuna</th><th>Última aplicación</th><th>Próxima dosis</th><th>Notas</th></tr></thead><tbody>${vRows}</tbody></table>`:""}
  ${hRows?`<h2>Historial Clínico</h2><table><thead><tr><th>Fecha</th><th>Motivo</th><th>Diagnóstico</th><th>Tratamiento</th><th>Medicamentos</th></tr></thead><tbody>${hRows}</tbody></table>`:""}
  ${aRows?`<h2>Citas</h2><table><thead><tr><th>Fecha</th><th>Hora</th><th>Motivo</th><th>Estado</th></tr></thead><tbody>${aRows}</tbody></table>`:""}
  <div class="footer"><span>VetDomicilio · Medicina Veterinaria a Domicilio</span><span>Méd. Vet. ${doctor}</span></div>
  </body></html>`;

  const w = window.open("","_blank");
  if (!w) { alert("Permite ventanas emergentes para exportar PDF"); return; }
  w.document.write(html); w.document.close(); setTimeout(()=>w.print(), 600);
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const inp  = { width:"100%", padding:"9px 12px", border:"1.5px solid #d8e8d0", borderRadius:8, fontSize:14, color:"#1a2e1a", background:"#f9fdf7", boxSizing:"border-box", outline:"none" };
const btnG = { background:"#3a7a3a", color:"#fff", border:"none", borderRadius:9, padding:"9px 20px", fontSize:13, fontWeight:700, cursor:"pointer" };
const btnO = { background:"transparent", color:"#3a7a3a", border:"1.5px solid #3a7a3a", borderRadius:9, padding:"9px 18px", fontSize:13, fontWeight:700, cursor:"pointer" };

// ─── UI Components ─────────────────────────────────────────────────────
function Badge({ status }) {
  const c = STATUS_CFG[status]||STATUS_CFG.Pendiente;
  return <span style={{ background:c.bg, color:c.text, borderRadius:20, padding:"3px 10px", fontSize:11, fontWeight:700, display:"inline-flex", alignItems:"center", gap:5 }}>
    <span style={{ width:6, height:6, borderRadius:"50%", background:c.dot, flexShrink:0 }}/>{status}
  </span>;
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,30,15,0.55)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}
         onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ background:"#fff", borderRadius:18, width:"100%", maxWidth:wide?730:560, maxHeight:"93vh", overflowY:"auto", boxShadow:"0 24px 64px rgba(0,0,0,0.28)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"22px 28px 0", position:"sticky", top:0, background:"#fff", borderRadius:"18px 18px 0 0", zIndex:1 }}>
          <h2 style={{ margin:0, fontSize:18, color:"#1a2e1a", fontFamily:"'Lora',serif" }}>{title}</h2>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:24, cursor:"pointer", color:"#aaa", lineHeight:1, padding:"0 4px" }}>×</button>
        </div>
        <div style={{ padding:"16px 28px 28px" }}>{children}</div>
      </div>
    </div>
  );
}

function Fld({ label, children }) {
  return <div style={{ marginBottom:11 }}>
    <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#4a6741", marginBottom:4, textTransform:"uppercase", letterSpacing:".05em" }}>{label}</label>
    {children}
  </div>;
}

function SecTitle({ children }) {
  return <div style={{ fontSize:11, fontWeight:800, color:"#3a7a3a", textTransform:"uppercase", letterSpacing:".07em", margin:"16px 0 10px", borderBottom:"2px solid #e8f0e8", paddingBottom:5 }}>{children}</div>;
}

// ─── Calendar ─────────────────────────────────────────────────────────────────
function Calendar({ appointments, patients, onNewAppt }) {
  const [current, setCurrent] = useState(() => { const d=new Date(); return new Date(d.getFullYear(),d.getMonth(),1); });
  const [selDay, setSelDay]   = useState(null);

  const yr=current.getFullYear(), mo=current.getMonth();

  const byDay = useMemo(() => {
    const m={};
    appointments.forEach(a=>{
      const d=new Date(a.date+"T12:00");
      if(d.getFullYear()===yr&&d.getMonth()===mo){ const k=d.getDate(); (m[k]||(m[k]=[])).push(a); }
    });
    return m;
  }, [appointments,yr,mo]);

  const firstDow = new Date(yr,mo,1).getDay();
  const daysAmt  = new Date(yr,mo+1,0).getDate();
  const todayNum = (()=>{ const t=new Date(); return t.getFullYear()===yr&&t.getMonth()===mo?t.getDate():-1; })();
  const cells    = [...Array(firstDow).fill(null),...Array.from({length:daysAmt},(_,i)=>i+1)];
  const selAppts = selDay?(byDay[selDay]||[]):[];

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <button onClick={()=>{setCurrent(new Date(yr,mo-1,1));setSelDay(null);}} style={{ ...btnO, padding:"5px 14px" }}>‹</button>
        <span style={{ fontFamily:"'Lora',serif", fontSize:17, color:"#1a2e1a", fontWeight:700, textTransform:"capitalize" }}>
          {current.toLocaleDateString("es-CL",{month:"long",year:"numeric"})}
        </span>
        <button onClick={()=>{setCurrent(new Date(yr,mo+1,1));setSelDay(null);}} style={{ ...btnO, padding:"5px 14px" }}>›</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2, marginBottom:3 }}>
        {DAYS_ES.map(d=><div key={d} style={{ textAlign:"center", fontSize:11, fontWeight:700, color:"#5a7a5a", padding:"5px 0" }}>{d}</div>)}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3 }}>
        {cells.map((day,i)=>{
          if(!day) return <div key={i}/>;
          const da=byDay[day]||[], isTod=day===todayNum, isSel=day===selDay;
          const isPast = new Date(yr, mo, day) < new Date().setHours(0,0,0,0);
          return (
            <div key={i} onClick={()=>setSelDay(isSel?null:day)} style={{ 
              minHeight:54, 
              background:isSel?"#1e3a1e":isTod?"#d1e7dd":isPast?"#f9f9f9":"#fff", 
              border:`${isTod?"2":"1.5"}px solid ${isTod?"#3a7a3a":"#e8f0e8"}`, 
              borderRadius:8, padding:"5px 6px", cursor:"pointer", transition:"background .15s",
              opacity: isPast && !isTod ? 0.7 : 1
            }}>
              <div style={{ fontSize:12, fontWeight:isTod?800:600, color:isSel?"#fff":"#1a2e1a", marginBottom:2 }}>{day}</div>
              {da.slice(0,2).map((a,j)=>{
                const pt=patients.find(p=>p.id===a.patientId);
                return <div key={j} style={{ fontSize:9, background:isSel?"rgba(255,255,255,.25)":STATUS_CFG[a.status].bg, color:isSel?"#fff":STATUS_CFG[a.status].text, borderRadius:3, padding:"1px 4px", marginBottom:1, overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>{a.time} {pt?.name}</div>;
              })}
              {da.length>2&&<div style={{ fontSize:9, color:isSel?"rgba(255,255,255,.7)":"#5a7a5a" }}>+{da.length-2}</div>}
            </div>
          );
        })}
      </div>
      {selDay&&(
        <div style={{ marginTop:14, background:"#f2f7f0", borderRadius:10, padding:14 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <span style={{ fontWeight:700, color:"#1a2e1a", fontSize:14 }}>
              {selDay} de {current.toLocaleDateString("es-CL",{month:"long"})}
              {selAppts.length===0&&<span style={{ color:"#5a7a5a", fontWeight:400, fontSize:13, marginLeft:8 }}>— Sin citas</span>}
            </span>
            <button onClick={()=>onNewAppt(new Date(yr,mo,selDay).toISOString().split("T")[0])} style={{ ...btnG, padding:"5px 12px", fontSize:12 }}>+ Agendar</button>
          </div>
          {selAppts.map(a=>{
            const pt=patients.find(p=>p.id===a.patientId);
            return (
              <div key={a.id} style={{ background:"#fff", borderRadius:8, padding:"9px 12px", marginBottom:5, display:"flex", justifyContent:"space-between", alignItems:"center", borderLeft:`3px solid ${STATUS_CFG[a.status].dot}` }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:13, color:"#1a2e1a" }}>{a.time} — {pt?.name||"?"}</div>
                  <div style={{ fontSize:12, color:"#5a7a5a" }}>{a.motivo}</div>
                </div>
                <Badge status={a.status}/>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function VetApp() {
  const [tab,        setTab]        = useState("inicio");
  const [patients,   setPatients]   = useState([]);
  const [appts,      setAppts]      = useState([]);
  const [agendaView, setAgendaView] = useState("lista");
  const [search,     setSearch]     = useState("");

  // Persistencia de datos
  useEffect(() => {
    const p = localStorage.getItem("vet_patients");
    const a = localStorage.getItem("vet_appts");
    if (p) setPatients(JSON.parse(p));
    if (a) setAppts(JSON.parse(a));
  }, []);

  useEffect(() => {
    if (patients.length > 0) localStorage.setItem("vet_patients", JSON.stringify(patients));
    if (appts.length > 0) localStorage.setItem("vet_appts", JSON.stringify(appts));
  }, [patients, appts]);

  const [apptModal, setApptModal] = useState(null);
  const [patModal,  setPatModal]  = useState(null);
  const [histPid,   setHistPid]   = useState(null);

  const E_APPT = { patientId:"", date:"", time:"", motivo:"", status:"Pendiente", notes:"" };
  const E_PAT  = { name:"", species:"Perro", breed:"", age:"", weight:"", ownerName:"", ownerPhone:"", ownerAddress:"", notes:"" };
  const E_HIST = { date:"", motivo:"", diagnostico:"", tratamiento:"", medications:[] };
  const E_MED  = { name:"", dose:"", frequency:"", duration:"" };
  const E_VACC = { name:"", lastDate:"", nextDue:"", notes:"" };

  const [apptForm, setApptForm] = useState(E_APPT);
  const [patForm,  setPatForm]  = useState(E_PAT);
  const [histForm, setHistForm] = useState(E_HIST);
  const [medForm,  setMedForm]  = useState(E_MED);
  const [vaccForm, setVaccForm] = useState(E_VACC);

  const today   = new Date().toISOString().split("T")[0];
  const histPat = patients.find(p=>p.id===histPid)||null;

  const todayAppts    = appts.filter(a=>a.date===today&&a.status!=="Cancelada");
  const upcomingAppts = appts.filter(a=>a.date>=today&&a.status!=="Cancelada");

  const allVaccines = useMemo(()=>{
    const arr=[];
    patients.forEach(p=>(p.vaccines||[]).forEach(v=>{
      if(v.nextDue){ const diff=Math.ceil((new Date(v.nextDue)-new Date())/864e5); arr.push({...v,patientId:p.id,patientName:p.name,ownerName:p.ownerName,diff}); }
    }));
    return arr.sort((a,b)=>a.diff-b.diff);
  },[patients]);

  const urgentVacc    = allVaccines.filter(v=>v.diff<=30);
  const filteredPats  = useMemo(()=>patients.filter(p=>
    p.name.toLowerCase().includes(search.toLowerCase())||
    p.ownerName.toLowerCase().includes(search.toLowerCase())||
    p.species.toLowerCase().includes(search.toLowerCase())
  ),[patients,search]);

  // ── Appointments ──
  function saveAppt() {
    if(!apptForm.date||!apptForm.time||!apptForm.patientId||!apptForm.motivo) return;
    const data={...apptForm,patientId:parseInt(apptForm.patientId)};
    if(apptModal==="new") setAppts(prev=>[...prev,{...data,id:Date.now()}]);
    else setAppts(prev=>prev.map(a=>a.id===apptModal.id?{...data,id:a.id}:a));
    setApptModal(null);
  }
  function openNewAppt(date="") { setApptForm({...E_APPT,date}); setApptModal("new"); }
  function openEditAppt(a) { setApptForm({...a,patientId:String(a.patientId)}); setApptModal(a); }
  function delAppt(id) { 
    if(!confirm("¿Eliminar esta cita permanentemente?")) return;
    setAppts(prev=>prev.filter(a=>a.id!==id)); 
  }

  // ── Patients ──
  function savePat() {
    if(!patForm.name||!patForm.ownerName) return;
    if(patModal==="new") setPatients(prev=>[...prev,{...patForm,id:Date.now(),history:[],vaccines:[]}]);
    else setPatients(prev=>prev.map(p=>p.id===patModal.id?{...patForm,id:p.id,history:p.history,vaccines:p.vaccines}:p));
    setPatModal(null);
  }
  function openNewPat() { setPatForm(E_PAT); setPatModal("new"); }
  function openEditPat(p) { setPatForm({...p}); setPatModal(p); }
  function delPat(id) {
    if(!confirm("¿Eliminar este paciente y todo su historial? Esta acción no se puede deshacer.")) return;
    setPatients(prev=>prev.filter(p=>p.id!==id));
    setAppts(prev=>prev.filter(a=>a.patientId!==id));
  }

  // ── History & Auto-Appt ──
  function addHist() {
    if(!histForm.date||!histForm.motivo) return;
    setPatients(prev=>prev.map(p=>p.id===histPid?{...p,history:[...p.history,{...histForm,id:Date.now()}]}:p));
    setHistForm(E_HIST); setMedForm(E_MED);
    alert("Consulta guardada exitosamente.");
  }

  function addVacc(pid) {
    if(!vaccForm.name) return;
    setPatients(prev=>prev.map(p=>p.id===pid?{...p,vaccines:[...(p.vaccines||[]),{...vaccForm,id:Date.now()}]}:p));
    
    // Auto-agendar cita si hay fecha de próxima dosis
    if (vaccForm.nextDue) {
      const newAppt = {
        id: Date.now() + 1,
        patientId: pid,
        date: vaccForm.nextDue,
        time: "10:00",
        motivo: `Refuerzo: ${vaccForm.name}`,
        status: "Pendiente",
        notes: "Agendado automáticamente desde registro de vacunas."
      };
      setAppts(prev => [...prev, newAppt]);
      alert(`Vacuna registrada y cita de refuerzo agendada para el ${vaccForm.nextDue}`);
    } else {
      alert("Vacuna registrada.");
    }
    setVaccForm(E_VACC);
  }

  function remVacc(pid,vid) {
    if(!confirm("¿Eliminar este registro de vacuna?")) return;
    setPatients(prev=>prev.map(p=>p.id===pid?{...p,vaccines:p.vaccines.filter(v=>v.id!==vid)}:p));
  }

  const navItems=[
    {key:"inicio",    label:"Inicio",  icon:"🏠"},
    {key:"agenda",    label:"Agenda",  icon:"📅"},
    {key:"pacientes", label:"Fichas",  icon:"🐾"},
    {key:"vacunas",   label:"Vacunas", icon:"💉", badge:urgentVacc.length},
  ];

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", minHeight:"100vh", background:"#f0f5ef" }}>
      <link href="https://fonts.googleapis.com/css2?family=Lora:wght@600;700&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet"/>

      {/* ═══ HEADER ═══ */}
      <header style={{ background:"#1e3a1e", padding:"0 22px", display:"flex", alignItems:"center", justifyContent:"space-between", height:64, boxShadow:"0 2px 16px rgba(0,0,0,0.25)", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:26 }}>🏥</span>
          <div>
            <div style={{ color:"#fff", fontFamily:"'Lora',serif", fontSize:17, fontWeight:700, lineHeight:1.1 }}>VetDomicilio</div>
            <div style={{ color:"#7ec87e", fontSize:11 }}>Méd. Vet. {DOCTOR}</div>
          </div>
        </div>
        <nav style={{ display:"flex", gap:4 }}>
          {navItems.map(n=>(
            <button key={n.key} onClick={()=>setTab(n.key)} style={{ background:tab===n.key?"#3a7a3a":"transparent", border:tab===n.key?"none":"1px solid rgba(255,255,255,.2)", color:"#fff", borderRadius:9, padding:"7px 14px", cursor:"pointer", fontSize:13, fontWeight:600, display:"flex", alignItems:"center", gap:5 }}>
              {n.icon} {n.label}
              {n.badge>0&&<span style={{ background:"#ef4444", borderRadius:10, fontSize:10, padding:"1px 6px", fontWeight:800 }}>{n.badge}</span>}
            </button>
          ))}
        </nav>
      </header>

      <main style={{ padding:"24px", maxWidth:990, margin:"0 auto", width:"100%", boxSizing:"border-box" }}>

        {/* ═══ INICIO ═══ */}
        {tab==="inicio"&&<>
          <div style={{ marginBottom:22 }}>
            <h1 style={{ margin:0, fontFamily:"'Lora',serif", color:"#1a2e1a", fontSize:26 }}>Bienvenido 👋</h1>
            <p style={{ margin:"4px 0 0", color:"#5a7a5a", fontSize:14 }}>Méd. Vet. {DOCTOR}</p>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(155px,1fr))", gap:12, marginBottom:22 }}>
            {[
              {label:"Pacientes",       value:patients.length,      icon:"🐾", c:"#3a7a3a", bg:"#d1fae5"},
              {label:"Citas hoy",       value:todayAppts.length,    icon:"📅", c:"#1d4ed8", bg:"#dbeafe"},
              {label:"Citas próximas",  value:upcomingAppts.length, icon:"🗓️", c:"#7c3aed", bg:"#ede9fe"},
              {label:"Vacunas urgentes",value:urgentVacc.length,    icon:"💉", c:"#dc2626", bg:"#fee2e2"},
            ].map(s=>(
              <div key={s.label} style={{ background:"#fff", borderRadius:14, padding:"16px 18px", boxShadow:"0 2px 8px rgba(0,0,0,0.06)", display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:44, height:44, borderRadius:12, background:s.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>{s.icon}</div>
                <div>
                  <div style={{ fontSize:26, fontWeight:800, color:s.c, lineHeight:1 }}>{s.value}</div>
                  <div style={{ fontSize:11, color:"#5a7a5a" }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <div style={{ background:"#fff", borderRadius:14, padding:"18px 20px", boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                <div style={{ fontFamily:"'Lora',serif", fontSize:16, color:"#1a2e1a", fontWeight:700 }}>📅 Citas de Hoy</div>
                <button onClick={()=>{setTab("agenda");openNewAppt(today);}} style={{ ...btnG, padding:"5px 12px", fontSize:11 }}>+ Nueva</button>
              </div>
              {todayAppts.length===0
                ?<p style={{ color:"#8aaa8a", textAlign:"center", padding:"20px 0", margin:0, fontSize:13 }}>Sin citas para hoy</p>
                :todayAppts.map(a=>{const pt=patients.find(p=>p.id===a.patientId); return(
                  <div key={a.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:"1px solid #f0f5ef" }}>
                    <div style={{ minWidth:46, textAlign:"center", background:"#f2f7f0", borderRadius:7, padding:"5px", flexShrink:0 }}>
                      <div style={{ fontSize:13, fontWeight:800, color:"#3a7a3a" }}>{a.time}</div>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:700, color:"#1a2e1a", fontSize:13, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{pt?.name||"?"} — {a.motivo}</div>
                      <div style={{ fontSize:11, color:"#5a7a5a" }}>📍 {pt?.ownerAddress}</div>
                    </div>
                    <Badge status={a.status}/>
                  </div>
                );})}
            </div>

            <div style={{ background:"#fff", borderRadius:14, padding:"18px 20px", boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
              <div style={{ fontFamily:"'Lora',serif", fontSize:16, color:"#1a2e1a", fontWeight:700, marginBottom:12 }}>
                {urgentVacc.length>0?"⚠️ Vacunas Urgentes":"✅ Vacunas al Día"}
              </div>
              {urgentVacc.length===0
                ?<p style={{ color:"#8aaa8a", textAlign:"center", padding:"20px 0", margin:0, fontSize:13 }}>Sin vacunas urgentes 🎉</p>
                :urgentVacc.slice(0,4).map((v,i)=>{const vs=vaccStatus(v.nextDue); return(
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:"1px solid #f0f5ef" }}>
                    <div>
                      <div style={{ fontWeight:700, color:"#1a2e1a", fontSize:13 }}>💉 {v.name}</div>
                      <div style={{ fontSize:11, color:"#5a7a5a" }}>🐾 {v.patientName} · {v.ownerName}</div>
                    </div>
                    <span style={{ background:vs.bg, color:vs.color, borderRadius:20, padding:"2px 9px", fontSize:11, fontWeight:700, flexShrink:0 }}>{vs.label}</span>
                  </div>
                );})}
            </div>
          </div>
        </>}

        {/* ═══ AGENDA ═══ */}
        {tab==="agenda"&&<>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:18 }}>
            <div>
              <h1 style={{ margin:0, fontFamily:"'Lora',serif", color:"#1a2e1a", fontSize:26 }}>Agenda de Citas</h1>
              <p style={{ margin:"4px 0 0", color:"#5a7a5a", fontSize:14 }}>{upcomingAppts.length} citas próximas</p>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <div style={{ display:"flex", background:"#fff", borderRadius:9, border:"1.5px solid #e8f0e8", overflow:"hidden" }}>
                {[["lista","☰ Lista"],["calendario","📅 Calendario"]].map(([v,l])=>(
                  <button key={v} onClick={()=>setAgendaView(v)} style={{ padding:"7px 14px", fontSize:12, fontWeight:700, cursor:"pointer", border:"none", background:agendaView===v?"#1e3a1e":"transparent", color:agendaView===v?"#fff":"#5a7a5a" }}>{l}</button>
                ))}
              </div>
              <button onClick={()=>openNewAppt()} style={{ ...btnG, display:"flex", alignItems:"center", gap:6 }}>+ Nueva Cita</button>
            </div>
          </div>

          {agendaView==="lista"
            ?<div style={{ display:"flex", flexDirection:"column", gap:10 }}>
               {appts.length===0&&<div style={{ textAlign:"center", padding:"50px 0", color:"#8aaa8a" }}><div style={{ fontSize:48 }}>📅</div><p>Sin citas registradas</p></div>}
               {[...appts].sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)).map(a=>{
                 const pt=patients.find(p=>p.id===a.patientId);
                 const d=new Date(a.date+"T12:00");
                 return(
                   <div key={a.id} style={{ background:"#fff", borderRadius:12, padding:"13px 16px", display:"flex", alignItems:"center", gap:14, boxShadow:"0 2px 6px rgba(0,0,0,0.05)", borderLeft:`4px solid ${STATUS_CFG[a.status].dot}` }}>
                     <div style={{ minWidth:62, textAlign:"center", background:"#f2f7f0", borderRadius:9, padding:"8px 5px", flexShrink:0 }}>
                       <div style={{ fontSize:9, color:"#5a7a5a", fontWeight:700, textTransform:"uppercase" }}>{d.toLocaleDateString("es-CL",{month:"short"})}</div>
                       <div style={{ fontSize:22, fontWeight:800, color:"#1a2e1a", lineHeight:1 }}>{d.getDate()}</div>
                       <div style={{ fontSize:12, color:"#3a7a3a", fontWeight:700 }}>{a.time}</div>
                     </div>
                     <div style={{ flex:1, minWidth:0 }}>
                       <div style={{ fontWeight:700, color:"#1a2e1a", fontSize:14 }}>{pt?`${pt.name} (${pt.species})`:"Paciente eliminado"}</div>
                       <div style={{ color:"#5a7a5a", fontSize:12 }}>{pt?.ownerName&&<span>👤 {pt.ownerName} · </span>}📋 {a.motivo}</div>
                       {a.notes&&<div style={{ color:"#7a9a7a", fontSize:11, fontStyle:"italic" }}>💬 {a.notes}</div>}
                     </div>
                     <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:7, flexShrink:0 }}>
                       <Badge status={a.status}/>
                       <div style={{ display:"flex", gap:5 }}>
                         <button onClick={()=>openEditAppt(a)} style={{ ...btnO, padding:"5px 10px", fontSize:11 }}>Editar</button>
                         <button onClick={()=>delAppt(a.id)} style={{ background:"#fee2e2", color:"#b91c1c", border:"none", borderRadius:7, padding:"5px 8px", fontSize:12, cursor:"pointer", fontWeight:700 }}>×</button>
                       </div>
                     </div>
                   </div>
                 );
               })}
             </div>
            :<div style={{ background:"#fff", borderRadius:14, padding:"20px 22px", boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
               <Calendar appointments={appts} patients={patients} onNewAppt={openNewAppt}/>
             </div>
          }
        </>}

        {/* ═══ FICHAS ═══ */}
        {tab==="pacientes"&&<>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:18 }}>
            <div>
              <h1 style={{ margin:0, fontFamily:"'Lora',serif", color:"#1a2e1a", fontSize:26 }}>Fichas de Pacientes</h1>
              <p style={{ margin:"4px 0 0", color:"#5a7a5a", fontSize:14 }}>{patients.length} pacientes registrados</p>
            </div>
            <button onClick={openNewPat} style={{ ...btnG, display:"flex", alignItems:"center", gap:6 }}>+ Nuevo Paciente</button>
          </div>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍  Buscar por nombre, dueño o especie…" style={{ ...inp, marginBottom:16, padding:"10px 16px" }}/>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14 }}>
            {filteredPats.map(p=>{
              const ic=SPECIES_ICO[p.species]||"🐾";
              const ov=(p.vaccines||[]).filter(v=>v.nextDue&&new Date(v.nextDue)<new Date()).length;
              return(
                <div key={p.id} style={{ background:"#fff", borderRadius:16, padding:18, boxShadow:"0 2px 8px rgba(0,0,0,0.06)", border:"1.5px solid #e8f0e8" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <span style={{ fontSize:34 }}>{ic}</span>
                      <div>
                        <div style={{ fontFamily:"'Lora',serif", fontWeight:700, fontSize:17, color:"#1a2e1a" }}>{p.name}</div>
                        <div style={{ color:"#5a7a5a", fontSize:12 }}>{p.species}{p.breed?` · ${p.breed}`:""}</div>
                      </div>
                    </div>
                    {ov>0&&<span style={{ background:"#fee2e2", color:"#b91c1c", fontSize:10, fontWeight:700, borderRadius:20, padding:"2px 7px", flexShrink:0 }}>💉 {ov} vencida{ov>1?"s":""}</span>}
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:5, marginBottom:9 }}>
                    {[["⚖️",p.weight?`${p.weight} kg`:"—"],["🎂",p.age?`${p.age} años`:"—"]].map(([ic,v])=>(
                      <div key={ic} style={{ background:"#f2f7f0", borderRadius:7, padding:"5px 8px" }}>
                        <div style={{ fontSize:10, color:"#7a9a7a" }}>{ic}</div>
                        <div style={{ fontSize:13, fontWeight:700, color:"#1a2e1a" }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ borderTop:"1px solid #e8f0e8", paddingTop:8, marginBottom:9 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:"#1a2e1a" }}>👤 {p.ownerName}</div>
                    <div style={{ fontSize:11, color:"#5a7a5a" }}>📞 {p.ownerPhone||"—"}</div>
                    <div style={{ fontSize:11, color:"#5a7a5a" }}>📍 {p.ownerAddress||"—"}</div>
                  </div>
                  {p.notes&&<div style={{ background:"#fffbeb", border:"1px solid #fde68a", borderRadius:7, padding:"6px 9px", marginBottom:9, fontSize:11, color:"#92400e" }}>⚠️ {p.notes}</div>}
                  <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                    <button onClick={()=>{setHistPid(p.id);setHistForm(E_HIST);setVaccForm(E_VACC);}} style={{ ...btnG, padding:"7px 10px", fontSize:11, flex:1 }}>📋 Historial ({p.history.length})</button>
                    <button onClick={()=>exportPDF(p,appts,DOCTOR)} style={{ ...btnO, padding:"7px 10px", fontSize:11 }}>📄 PDF</button>
                    <button onClick={()=>openEditPat(p)} style={{ ...btnO, padding:"7px 9px", fontSize:11 }}>✏️</button>
                    <button onClick={()=>delPat(p.id)} style={{ background:"#fee2e2", color:"#b91c1c", border:"none", borderRadius:8, padding:"7px 8px", fontSize:11, cursor:"pointer", fontWeight:700 }}>🗑️</button>
                  </div>
                </div>
              );
            })}
          </div>
        </>}

        {/* ═══ VACUNAS ═══ */}
        {tab==="vacunas"&&<>
          <div style={{ marginBottom:18 }}>
            <h1 style={{ margin:0, fontFamily:"'Lora',serif", color:"#1a2e1a", fontSize:26 }}>Recordatorios de Vacunas</h1>
            <p style={{ margin:"4px 0 0", color:"#5a7a5a", fontSize:14 }}>{allVaccines.length} vacunas · {urgentVacc.length} requieren atención</p>
          </div>
          {allVaccines.length===0
            ?<div style={{ textAlign:"center", padding:"50px 0", color:"#8aaa8a" }}><div style={{ fontSize:48 }}>💉</div><p>Sin vacunas registradas.</p></div>
            :<div style={{ display:"flex", flexDirection:"column", gap:8 }}>
               {allVaccines.map((v,i)=>{
                 const vs=vaccStatus(v.nextDue);
                 return(
                   <div key={i} style={{ background:"#fff", borderRadius:12, padding:"13px 16px", display:"flex", alignItems:"center", gap:14, boxShadow:"0 2px 6px rgba(0,0,0,0.05)", borderLeft:`4px solid ${vs.dot}` }}>
                     <span style={{ fontSize:24, flexShrink:0 }}>💉</span>
                     <div style={{ flex:1 }}>
                       <div style={{ fontWeight:700, color:"#1a2e1a", fontSize:14 }}>{v.name}</div>
                       <div style={{ fontSize:12, color:"#5a7a5a" }}>🐾 {v.patientName} · 👤 {v.ownerName}</div>
                       {v.lastDate&&<div style={{ fontSize:11, color:"#7a9a7a" }}>Última aplicación: {v.lastDate}</div>}
                       {v.notes&&<div style={{ fontSize:11, color:"#7a9a7a", fontStyle:"italic" }}>{v.notes}</div>}
                     </div>
                     <div style={{ textAlign:"right", flexShrink:0 }}>
                       <span style={{ background:vs.bg, color:vs.color, borderRadius:20, padding:"4px 12px", fontSize:12, fontWeight:700, display:"block", marginBottom:4 }}>{vs.label}</span>
                       {v.nextDue&&<div style={{ fontSize:11, color:"#5a7a5a" }}>Próxima: {v.nextDue}</div>}
                     </div>
                   </div>
                 );
               })}
             </div>
          }
        </>}
      </main>

      {/* ═══ MODALES (CITA, PACIENTE, HISTORIAL) ═══ */}
      {/* (Se mantienen los modales igual que en tu versión previa, solo asegurando que llamen a las funciones actualizadas) */}
      
      {apptModal&&(
        <Modal title={apptModal==="new"?"Nueva Cita":"Editar Cita"} onClose={()=>setApptModal(null)}>
          <Fld label="Paciente *">
            <select value={apptForm.patientId} onChange={e=>setApptForm(f=>({...f,patientId:e.target.value}))} style={inp}>
              <option value="">Seleccionar paciente…</option>
              {patients.map(p=><option key={p.id} value={p.id}>{p.name} — {p.ownerName}</option>)}
            </select>
          </Fld>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Fld label="Fecha *"><input type="date" value={apptForm.date} onChange={e=>setApptForm(f=>({...f,date:e.target.value}))} style={inp}/></Fld>
            <Fld label="Hora *"><input type="time" value={apptForm.time} onChange={e=>setApptForm(f=>({...f,time:e.target.value}))} style={inp}/></Fld>
          </div>
          <Fld label="Motivo *"><input value={apptForm.motivo} onChange={e=>setApptForm(f=>({...f,motivo:e.target.value}))} placeholder="Vacunación, control, urgencia…" style={inp}/></Fld>
          <Fld label="Estado">
            <select value={apptForm.status} onChange={e=>setApptForm(f=>({...f,status:e.target.value}))} style={inp}>
              {STATUSES.map(s=><option key={s}>{s}</option>)}
            </select>
          </Fld>
          <Fld label="Notas"><textarea value={apptForm.notes} onChange={e=>setApptForm(f=>({...f,notes:e.target.value}))} rows={2} style={{ ...inp, resize:"vertical" }}/></Fld>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:8 }}>
            <button onClick={()=>setApptModal(null)} style={btnO}>Cancelar</button>
            <button onClick={saveAppt} style={btnG}>Guardar Cita</button>
          </div>
        </Modal>
      )}

      {patModal&&(
        <Modal title={patModal==="new"?"Nuevo Paciente":"Editar Paciente"} onClose={()=>setPatModal(null)} wide>
          <SecTitle>Datos del Paciente</SecTitle>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Fld label="Nombre *"><input value={patForm.name} onChange={e=>setPatForm(f=>({...f,name:e.target.value}))} style={inp}/></Fld>
            <Fld label="Especie">
              <select value={patForm.species} onChange={e=>setPatForm(f=>({...f,species:e.target.value}))} style={inp}>
                {SPECIES.map(s=><option key={s}>{s}</option>)}
              </select>
            </Fld>
            <Fld label="Raza"><input value={patForm.breed} onChange={e=>setPatForm(f=>({...f,breed:e.target.value}))} placeholder="Ej: Labrador" style={inp}/></Fld>
            <Fld label="Edad (años)"><input type="number" value={patForm.age} onChange={e=>setPatForm(f=>({...f,age:e.target.value}))} style={inp}/></Fld>
            <Fld label="Peso (kg)"><input type="number" step="0.1" value={patForm.weight} onChange={e=>setPatForm(f=>({...f,weight:e.target.value}))} style={inp}/></Fld>
          </div>
          <Fld label="Notas clínicas (alergias, condiciones)"><textarea value={patForm.notes} onChange={e=>setPatForm(f=>({...f,notes:e.target.value}))} rows={2} style={{ ...inp, resize:"vertical" }}/></Fld>
          <SecTitle>Datos del Propietario</SecTitle>
          <Fld label="Nombre *"><input value={patForm.ownerName} onChange={e=>setPatForm(f=>({...f,ownerName:e.target.value}))} style={inp}/></Fld>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Fld label="Teléfono"><input value={patForm.ownerPhone} onChange={e=>setPatForm(f=>({...f,ownerPhone:e.target.value}))} placeholder="9 XXXX XXXX" style={inp}/></Fld>
          </div>
          <Fld label="Dirección"><input value={patForm.ownerAddress} onChange={e=>setPatForm(f=>({...f,ownerAddress:e.target.value}))} placeholder="Calle, número, comuna" style={inp}/></Fld>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:14 }}>
            <button onClick={()=>setPatModal(null)} style={btnO}>Cancelar</button>
            <button onClick={savePat} style={btnG}>Guardar Paciente</button>
          </div>
        </Modal>
      )}

      {histPid&&histPat&&(
        <Modal title={`${SPECIES_ICO[histPat.species]||"🐾"} ${histPat.name} — Historial & Vacunas`} onClose={()=>setHistPid(null)} wide>
          
          <SecTitle>💉 Vacunas</SecTitle>
          {(histPat.vaccines||[]).length===0&&<p style={{ color:"#8aaa8a", fontSize:13, margin:"0 0 8px" }}>Sin vacunas registradas.</p>}
          <div style={{ display:"flex", flexDirection:"column", gap:5, marginBottom:10 }}>
            {(histPat.vaccines||[]).map(v=>{
              const vs=vaccStatus(v.nextDue);
              return(
                <div key={v.id} style={{ display:"flex", alignItems:"center", gap:10, background:"#f9fdf7", borderRadius:8, padding:"8px 12px", border:"1px solid #e8f0e8" }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:13, color:"#1a2e1a" }}>{v.name}</div>
                    <div style={{ fontSize:11, color:"#5a7a5a" }}>Última: {v.lastDate||"—"} · Próxima: {v.nextDue||"—"}</div>
                  </div>
                  <span style={{ background:vs.bg, color:vs.color, borderRadius:20, padding:"2px 9px", fontSize:11, fontWeight:700, flexShrink:0 }}>{vs.label}</span>
                  <button onClick={()=>remVacc(histPid,v.id)} style={{ background:"#fee2e2", color:"#b91c1c", border:"none", borderRadius:6, padding:"4px 7px", cursor:"pointer", fontWeight:700, flexShrink:0 }}>×</button>
                </div>
              );
            })}
          </div>
          <div style={{ background:"#f2f7f0", borderRadius:10, padding:"12px 14px", marginBottom:12 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#4a6741", marginBottom:8 }}>+ Agregar Vacuna</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:8 }}>
              <Fld label="Vacuna *"><input value={vaccForm.name} onChange={e=>setVaccForm(f=>({...f,name:e.target.value}))} placeholder="Séxtuple, Rabia…" style={inp}/></Fld>
              <Fld label="Última aplicación"><input type="date" value={vaccForm.lastDate} onChange={e=>setVaccForm(f=>({...f,lastDate:e.target.value}))} style={inp}/></Fld>
              <Fld label="Próxima dosis (Agendará cita)"><input type="date" value={vaccForm.nextDue} onChange={e=>setVaccForm(f=>({...f,nextDue:e.target.value}))} style={inp}/></Fld>
            </div>
            <div style={{ display:"flex", justifyContent:"flex-end" }}>
              <button onClick={()=>addVacc(histPid)} style={{ ...btnG, padding:"7px 16px", fontSize:12 }}>Guardar Vacuna</button>
            </div>
          </div>

          <SecTitle>📋 Historial Clínico</SecTitle>
          <div style={{ maxHeight:200, overflowY:"auto", marginBottom:10 }}>
            {(histPat.history||[]).map((h,i)=>(
              <div key={i} style={{ background:"#f2f7f0", borderRadius:10, padding:"11px 13px", marginBottom:7, borderLeft:"3px solid #3a7a3a" }}>
                <div style={{ fontWeight:700, color:"#1a2e1a", fontSize:13, marginBottom:3 }}>📅 {h.date} — {h.motivo}</div>
                {h.diagnostico&&<div style={{ fontSize:12, color:"#3a5a3a" }}>🔬 <strong>Dx:</strong> {h.diagnostico}</div>}
                {h.tratamiento&&<div style={{ fontSize:12, color:"#3a5a3a" }}>🩺 <strong>Tto:</strong> {h.tratamiento}</div>}
              </div>
            ))}
          </div>

          <div style={{ background:"#f2f7f0", borderRadius:10, padding:"12px 14px" }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#4a6741", marginBottom:8 }}>+ Agregar Consulta</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:8 }}>
              <Fld label="Fecha *"><input type="date" value={histForm.date} onChange={e=>setHistForm(f=>({...f,date:e.target.value}))} style={inp}/></Fld>
              <Fld label="Motivo *"><input value={histForm.motivo} onChange={e=>setHistForm(f=>({...f,motivo:e.target.value}))} placeholder="Consulta, urgencia…" style={inp}/></Fld>
              <Fld label="Diagnóstico"><input value={histForm.diagnostico} onChange={e=>setHistForm(f=>({...f,diagnostico:e.target.value}))} placeholder="Ej: Gastroenteritis" style={inp}/></Fld>
              <Fld label="Tratamiento"><input value={histForm.tratamiento} onChange={e=>setHistForm(f=>({...f,tratamiento:e.target.value}))} placeholder="Indicaciones generales" style={inp}/></Fld>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <button onClick={()=>exportPDF(histPat,appts,DOCTOR)} style={{ ...btnO, padding:"7px 14px", fontSize:12 }}>📄 Exportar PDF</button>
              <button onClick={addHist} style={{ ...btnG, padding:"8px 18px", fontSize:12 }}>Guardar Consulta</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}


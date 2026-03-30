import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  BookOpen, LogOut, Bell, Fingerprint, GraduationCap, Users,
  CalendarCheck, Megaphone, Clock, CheckCircle2, BookMarked,
  Monitor, FileText, ClipboardList, PartyPopper, Wifi,
  TrendingUp, ShieldCheck, Smartphone, Zap, Lock,
  Search, AlertCircle, Calendar, PlusCircle, RefreshCw,
} from 'lucide-react';
import FloatingOrbs from '../components/FloatingOrbs';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getRole(email = '') {
  const d = email.split('@')[1] || '';
  return d.startsWith('faculty') || d.startsWith('prof') ? 'faculty' : 'student';
}
const attColor = p => p >= 85 ? '#059669' : p >= 75 ? '#d97706' : '#dc2626';
const attBg    = p => p >= 85 ? '#dcfce7' : p >= 75 ? '#fef3c7' : '#fee2e2';
const gradeCol = g => !g ? '#64748b' : g[0]==='A' ? '#059669' : g[0]==='B' ? '#4f46e5' : g[0]==='C' ? '#d97706' : '#dc2626';

function Ring({ pct, color, size = 54, sw = 5 }) {
  const r = (size - sw * 2) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (Math.min(pct, 100) / 100) * c;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', display: 'block' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={sw} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={sw}
        strokeDasharray={c} strokeDashoffset={off}
        strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1.2s ease' }} />
    </svg>
  );
}

function Bar({ pct, color, h = 5 }) {
  return (
    <div style={{ height: h, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden', minWidth: 60 }}>
      <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: color, borderRadius: 99, transition: 'width 1.2s ease' }} />
    </div>
  );
}

function Tag({ label, color, bg }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color, background: bg, padding: '2px 8px', borderRadius: 6, whiteSpace: 'nowrap', display: 'inline-block' }}>
      {label}
    </span>
  );
}

const card = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' };

// ─── Mock Data ────────────────────────────────────────────────────────────────
const STU = {
  roll: '21ETC S002159', sem: 6, branch: 'Electronics & Telecommunication Engg.',
  cgpa: 8.7, creditsEarned: 134, creditsTotal: 180,
  schedule: [
    { time:'09:00', end:'10:00', sub:'Digital Signal Processing', room:'ECE-301', fac:'Dr. R. Sharma',  type:'theory' },
    { time:'10:00', end:'11:00', sub:'VLSI Design',               room:'ECE-302', fac:'Prof. S. Reddy', type:'theory' },
    { time:'11:15', end:'12:15', sub:'Computer Networks',         room:'ECE-303', fac:'Dr. A. Kumar',   type:'theory' },
    { time:'12:15', end:'13:00', sub:'Lunch Break',               room:'',        fac:'',               type:'break'  },
    { time:'13:00', end:'15:00', sub:'Embedded Systems Lab',      room:'Lab-B2',  fac:'Prof. V. Iyer',  type:'lab'    },
    { time:'15:00', end:'16:00', sub:'Technical Communication',   room:'ECE-105', fac:'Dr. P. Nair',    type:'theory' },
  ],
  subjects: [
    { code:'EC601', name:'Digital Signal Processing', cr:4, ia:[18,17,19], att:92, tot:48, pre:44, grade:'A',  gp:9   },
    { code:'EC602', name:'VLSI Design',               cr:4, ia:[16,18,17], att:88, tot:44, pre:39, grade:'A-', gp:8.5 },
    { code:'EC603', name:'Computer Networks',         cr:3, ia:[15,16,18], att:74, tot:38, pre:28, grade:'B+', gp:8   },
    { code:'EC604', name:'Embedded Systems',          cr:4, ia:[20,19,20], att:96, tot:50, pre:48, grade:'A+', gp:10  },
    { code:'EC605', name:'Antenna & Wave Propagation',cr:3, ia:[14,15,16], att:80, tot:42, pre:34, grade:'B',  gp:7   },
    { code:'EC606', name:'Technical Communication',   cr:2, ia:[18,19,-1], att:90, tot:30, pre:27, grade:'A',  gp:9   },
  ],
  books: [
    { id:'LIB001', title:'Digital Signal Processing', author:'Proakis & Manolakis', issued:'Mar 1',  due:'Apr 5',  daysLeft:6  },
    { id:'LIB002', title:'VLSI Design Methodologies', author:'Weste & Harris',       issued:'Mar 10', due:'Apr 14', daysLeft:15 },
  ],
  labs: [
    { name:'Signal Processing Lab',  cap:30, avail:8,  opens:'9 AM', closes:'5 PM', status:'open' },
    { name:'VLSI & Embedded Lab',    cap:25, avail:0,  opens:'9 AM', closes:'5 PM', status:'full' },
    { name:'Communication Lab',      cap:20, avail:12, opens:'9 AM', closes:'5 PM', status:'open' },
    { name:'Computer Lab A',         cap:40, avail:20, opens:'8 AM', closes:'8 PM', status:'open' },
  ],
  notices: [
    { id:1, title:'End-Sem Exam Schedule Released',      body:'End-semester exams begin April 15. Hall tickets available on portal from April 10.',         time:'2h ago', type:'exam',        pri:'high'   },
    { id:2, title:'Assignment Deadline Extended — DSP',  body:'DSP Assignment 3 deadline extended to April 8 due to lab maintenance.',                       time:'5h ago', type:'assignment',  pri:'medium' },
    { id:3, title:'Campus Recruitment Drive — TCS',      body:'TCS is visiting campus on April 20. Register on placement portal before April 10.',            time:'1d ago', type:'placement',   pri:'high'   },
    { id:4, title:'Library Fine Waiver — Last Date Apr 5',body:'One-time fine waiver for all borrowers. Return books by April 5 to avail.',                  time:'2d ago', type:'library',     pri:'low'    },
  ],
};

const FAC = {
  dept:'Electronics & Communication', designation:'Associate Professor', empId:'FAC-2019-042',
  schedule: [
    { time:'09:00', end:'10:00', sub:'Digital Signal Processing', cls:'ETC-6A', room:'ECE-301', students:45, type:'theory'  },
    { time:'11:00', end:'12:00', sub:'VLSI Design',               cls:'ETC-6B', room:'ECE-302', students:42, type:'theory'  },
    { time:'13:00', end:'15:00', sub:'DSP Lab',                   cls:'ETC-6A', room:'Lab-B1',  students:23, type:'lab'     },
    { time:'15:30', end:'16:30', sub:'Dept. Meeting',             cls:'Staff',  room:'Conf-1',  students:0,  type:'meeting' },
  ],
  courses: [
    { code:'EC601',  name:'Digital Signal Processing', cls:'ETC-6A', students:45, avgAtt:84, avgGrade:'B+' },
    { code:'EC602',  name:'VLSI Design',               cls:'ETC-6B', students:42, avgAtt:79, avgGrade:'B'  },
    { code:'EC601L', name:'DSP Lab',                   cls:'ETC-6A', students:23, avgAtt:91, avgGrade:'A-' },
  ],
  students: [
    { roll:'21ETC001', name:'Arjun Sharma',  att:92, ia:[18,17,19], grade:'A',  status:'good'     },
    { roll:'21ETC002', name:'Priya Reddy',   att:85, ia:[16,18,17], grade:'B+', status:'good'     },
    { roll:'21ETC003', name:'Rohan Mehta',   att:68, ia:[12,13,14], grade:'C',  status:'risk'     },
    { roll:'21ETC004', name:'Ananya Iyer',   att:96, ia:[20,19,20], grade:'A+', status:'good'     },
    { roll:'21ETC005', name:'Vikram Singh',  att:72, ia:[13,15,14], grade:'C+', status:'risk'     },
    { roll:'21ETC006', name:'Sneha Pillai',  att:89, ia:[17,16,18], grade:'A-', status:'good'     },
    { roll:'21ETC007', name:'Aditya Nair',   att:61, ia:[10,11,12], grade:'D',  status:'critical' },
    { roll:'21ETC008', name:'Kavya Rao',     att:94, ia:[19,20,19], grade:'A+', status:'good'     },
    { roll:'21ETC009', name:'Kiran Bhat',    att:77, ia:[15,14,16], grade:'B-', status:'good'     },
    { roll:'21ETC010', name:'Deepa Thomas',  att:65, ia:[11,13,12], grade:'D',  status:'critical' },
  ],
  leaveBalance: { earned:{total:15,used:5}, casual:{total:8,used:2}, medical:{total:10,used:2} },
  leaves: [
    { id:1, type:'Academic', from:'Apr 3',  to:'Apr 4',  days:2, reason:'Conference — IIT Hyderabad', status:'approved', applied:'Mar 25' },
    { id:2, type:'Personal', from:'Apr 18', to:'Apr 18', days:1, reason:'Personal',                   status:'pending',  applied:'Mar 28' },
    { id:3, type:'Medical',  from:'Mar 10', to:'Mar 11', days:2, reason:'Medical appointment',        status:'approved', applied:'Mar 9'  },
  ],
  tasks: [
    { task:'Submit IA Marks — EC601 (DSP)',     deadline:'Apr 5',  pri:'high'   },
    { task:'Review Project Reports — Batch A',  deadline:'Apr 3',  pri:'high'   },
    { task:'Upload Lesson Plan for Sem 7',      deadline:'Apr 10', pri:'medium' },
    { task:'Research Grant Application — DRDO', deadline:'Apr 30', pri:'low'    },
  ],
  notices: [
    { id:1, title:'Submit Final Marks by Apr 10',     body:'All faculty must submit end-semester marks through ERP by April 10, 5 PM.',  time:'1h ago', pri:'high'   },
    { id:2, title:'Faculty Meeting — Main Hall 3 PM', body:'Mandatory faculty meeting today at 3 PM in Main Conference Hall.',           time:'3h ago', pri:'high'   },
    { id:3, title:'Research Grant Applications Open', body:'DRDO research grant applications are now open. Deadline April 30.',          time:'2d ago', pri:'medium' },
    { id:4, title:'Anti-Ragging Committee Meeting',   body:'Committee meeting on April 7 at 10 AM in Admin Block Room 201.',            time:'3d ago', pri:'low'    },
  ],
};

// ─── Today's Schedule ─────────────────────────────────────────────────────────
function TodaySchedule({ schedule, now }) {
  const typeStyle = {
    theory:  { bg:'#eef2ff', border:'#c7d2fe', color:'#4f46e5', label:'Theory'  },
    lab:     { bg:'#ecfdf5', border:'#a7f3d0', color:'#059669', label:'Lab'     },
    break:   { bg:'#f8fafc', border:'#e2e8f0', color:'#94a3b8', label:'Break'   },
    meeting: { bg:'#fff7ed', border:'#fed7aa', color:'#ea580c', label:'Meeting' },
  };
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const isActive = s => {
    const [sh, sm] = s.time.split(':').map(Number);
    const [eh, em] = s.end.split(':').map(Number);
    return nowMin >= sh * 60 + sm && nowMin < eh * 60 + em;
  };
  return (
    <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
      <div style={{ display: 'flex', gap: 10, minWidth: 'max-content' }}>
        {schedule.map((s, i) => {
          const ts = typeStyle[s.type] || typeStyle.theory;
          const active = isActive(s);
          return (
            <div key={i} style={{
              minWidth: s.type === 'break' ? 90 : 170,
              borderRadius: 12,
              padding: '12px 14px',
              background: active ? ts.color : ts.bg,
              border: `1.5px solid ${active ? ts.color : ts.border}`,
              boxShadow: active ? `0 4px 18px ${ts.color}35` : 'none',
              position: 'relative',
              flexShrink: 0,
            }}>
              {active && (
                <div style={{ position:'absolute', top:8, right:8, display:'flex', alignItems:'center', gap:4 }}>
                  <div style={{ width:6, height:6, borderRadius:'50%', background:'#fff', opacity:0.9 }} />
                  <span style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.85)' }}>NOW</span>
                </div>
              )}
              <p style={{ fontSize: 10, fontWeight: 700, color: active ? 'rgba(255,255,255,0.75)' : '#94a3b8', marginBottom: 4 }}>
                {s.time} – {s.end}
              </p>
              <p style={{ fontSize: 12, fontWeight: 700, color: active ? '#fff' : '#0f172a', lineHeight: 1.3, marginBottom: s.type === 'break' ? 0 : 4 }}>
                {s.sub}
              </p>
              {s.type !== 'break' && (
                <>
                  <p style={{ fontSize: 11, color: active ? 'rgba(255,255,255,0.78)' : '#64748b' }}>{s.room}</p>
                  {s.fac     && <p style={{ fontSize: 10, color: active ? 'rgba(255,255,255,0.65)' : '#94a3b8', marginTop: 2 }}>{s.fac}</p>}
                  {s.cls     && <p style={{ fontSize: 10, color: active ? 'rgba(255,255,255,0.65)' : '#94a3b8', marginTop: 2 }}>{s.cls} · {s.students} students</p>}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── STUDENT: Academic ────────────────────────────────────────────────────────
function StuAcademic() {
  const [tab, setTab] = useState('grades');
  const subTabs = [['grades','Grades & CIA Marks'],['attendance','Attendance'],['exams','Exam Schedule']];

  return (
    <div>
      <div style={{ display:'flex', gap:4, marginBottom:16, background:'#f8fafc', borderRadius:10, padding:4 }}>
        {subTabs.map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            flex:1, padding:'7px 0', borderRadius:7, border:'none', cursor:'pointer',
            fontSize:12, fontWeight:700,
            background: tab===k ? '#fff' : 'transparent',
            color: tab===k ? '#4f46e5' : '#64748b',
            boxShadow: tab===k ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
          }}>{l}</button>
        ))}
      </div>

      {tab === 'grades' && (
        <div>
          <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap' }}>
            {[
              { label:'CGPA',           value:'8.7',                             color:'#4f46e5' },
              { label:'Credits Earned', value:`${STU.creditsEarned}/${STU.creditsTotal}`, color:'#059669' },
              { label:'Semester',       value:`Sem ${STU.sem}`,                  color:'#7c3aed' },
              { label:'Branch',         value:'ETC',                             color:'#d97706' },
            ].map(s => (
              <div key={s.label} style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:10, padding:'8px 14px' }}>
                <p style={{ fontSize:10, color:'#94a3b8', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em' }}>{s.label}</p>
                <p style={{ fontSize:16, fontWeight:900, color:s.color, marginTop:2 }}>{s.value}</p>
              </div>
            ))}
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ borderBottom:'2px solid #f1f5f9' }}>
                  {['Code','Subject','Cr','CIA-1','CIA-2','CIA-3','Total','Grade'].map(h => (
                    <th key={h} style={{ padding:'8px 8px', textAlign:'left', fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {STU.subjects.map((s, i) => (
                  <tr key={s.code} style={{ borderBottom:'1px solid #f1f5f9', background: i%2===0 ? '#fff' : '#fafafe' }}>
                    <td style={{ padding:'10px 8px', color:'#94a3b8', fontFamily:'monospace', fontSize:11 }}>{s.code}</td>
                    <td style={{ padding:'10px 8px', color:'#0f172a', fontWeight:600 }}>{s.name}</td>
                    <td style={{ padding:'10px 8px', color:'#64748b', textAlign:'center' }}>{s.cr}</td>
                    {s.ia.map((m, j) => (
                      <td key={j} style={{ padding:'10px 8px', textAlign:'center', fontWeight:700, color: m<0?'#94a3b8': m>=18?'#059669': m>=14?'#d97706':'#dc2626' }}>
                        {m < 0 ? '—' : `${m}/20`}
                      </td>
                    ))}
                    <td style={{ padding:'10px 8px', textAlign:'center', fontWeight:700, color:'#0f172a' }}>
                      {s.ia.filter(x => x >= 0).reduce((a,b) => a+b, 0)}/60
                    </td>
                    <td style={{ padding:'10px 8px' }}>
                      <span style={{ fontWeight:900, color:gradeCol(s.grade), fontSize:15 }}>{s.grade}</span>
                      <span style={{ fontSize:10, color:'#94a3b8', marginLeft:4 }}>({s.gp})</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'attendance' && (
        <div style={{ display:'grid', gap:10, gridTemplateColumns:'repeat(auto-fill, minmax(290px, 1fr))' }}>
          {STU.subjects.map(s => (
            <div key={s.code} style={{ background:'#f8fafc', border:`1.5px solid ${attBg(s.att)}`, borderLeft:`4px solid ${attColor(s.att)}`, borderRadius:'0 12px 12px 0', padding:'14px 16px' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:13, fontWeight:700, color:'#0f172a' }}>{s.name}</p>
                  <p style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>{s.code} · {s.pre}/{s.tot} classes attended</p>
                </div>
                <div style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'center', marginLeft:12 }}>
                  <Ring pct={s.att} color={attColor(s.att)} size={54} sw={5} />
                  <span style={{ position:'absolute', fontSize:11, fontWeight:900, color:attColor(s.att) }}>{s.att}%</span>
                </div>
              </div>
              <Bar pct={s.att} color={attColor(s.att)} h={6} />
              {s.att < 75 && (
                <p style={{ fontSize:11, color:'#dc2626', marginTop:6, fontWeight:600 }}>
                  ⚠ Need {Math.ceil((0.75 * s.tot - s.pre) / 0.25)} more classes to reach 75%
                </p>
              )}
              {s.att >= 75 && s.att < 85 && (
                <p style={{ fontSize:11, color:'#d97706', marginTop:6 }}>
                  Can miss {Math.floor(s.pre - 0.75 * s.tot)} more classes safely
                </p>
              )}
              {s.att >= 85 && (
                <p style={{ fontSize:11, color:'#059669', marginTop:6, fontWeight:600 }}>✓ Attendance is safe</p>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'exams' && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {[
            { sub:'Digital Signal Processing', date:'Apr 15', day:'Wednesday', time:'10:00 AM', room:'Hall A — Row 3, Seat 12' },
            { sub:'VLSI Design',               date:'Apr 17', day:'Friday',    time:'10:00 AM', room:'Hall B — Row 1, Seat 8'  },
            { sub:'Computer Networks',         date:'Apr 19', day:'Sunday',    time:'2:00 PM',  room:'Hall A — Row 3, Seat 12' },
            { sub:'Embedded Systems',          date:'Apr 21', day:'Tuesday',   time:'10:00 AM', room:'Hall C — Row 2, Seat 5'  },
            { sub:'Antenna & Wave Propagation',date:'Apr 23', day:'Thursday',  time:'10:00 AM', room:'Hall B — Row 4, Seat 9'  },
            { sub:'Technical Communication',   date:'Apr 25', day:'Saturday',  time:'2:00 PM',  room:'Hall D — Row 1, Seat 3'  },
          ].map((e, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:14, ...card }}>
              <div style={{ minWidth:50, textAlign:'center', background:'#eef2ff', border:'1px solid #c7d2fe', borderRadius:10, padding:'7px 6px' }}>
                <p style={{ fontSize:9, fontWeight:700, color:'#4f46e5', textTransform:'uppercase' }}>APR</p>
                <p style={{ fontSize:22, fontWeight:900, color:'#4f46e5', lineHeight:1 }}>{e.date.split(' ')[1]}</p>
              </div>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:13, fontWeight:700, color:'#0f172a' }}>{e.sub}</p>
                <p style={{ fontSize:11, color:'#64748b', marginTop:2 }}>{e.day} · {e.time}</p>
                <p style={{ fontSize:11, color:'#94a3b8', marginTop:1 }}>{e.room}</p>
              </div>
              <Tag label="End Sem" color="#4f46e5" bg="#eef2ff" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── STUDENT: Library ─────────────────────────────────────────────────────────
function StuLibrary() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:10 }}>
        {[
          { label:'Books Borrowed',  value:'2', color:'#4f46e5', sub:'of 3 max' },
          { label:'Due Soon',        value:'1', color:'#dc2626', sub:'within 7 days' },
          { label:'Total Fine',      value:'₹0',color:'#059669', sub:'no outstanding' },
          { label:'Books Available', value:'1', color:'#7c3aed', sub:'can borrow more' },
        ].map(s => (
          <div key={s.label} style={{ ...card, display:'flex', alignItems:'center', gap:12 }}>
            <div>
              <p style={{ fontSize:22, fontWeight:900, color:s.color, lineHeight:1 }}>{s.value}</p>
              <p style={{ fontSize:12, fontWeight:600, color:'#0f172a', marginTop:3 }}>{s.label}</p>
              <p style={{ fontSize:10, color:'#94a3b8', marginTop:1 }}>{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <p style={{ fontSize:13, fontWeight:700, color:'#0f172a' }}>Currently Borrowed</p>
      {STU.books.map(b => (
        <div key={b.id} style={{ ...card }}>
          <div style={{ display:'flex', alignItems:'start', justifyContent:'space-between', gap:12 }}>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:14, fontWeight:700, color:'#0f172a' }}>{b.title}</p>
              <p style={{ fontSize:12, color:'#64748b', marginTop:2 }}>{b.author}</p>
              <div style={{ display:'flex', gap:14, marginTop:8, flexWrap:'wrap' }}>
                <span style={{ fontSize:11, color:'#94a3b8' }}>Issued: <strong style={{color:'#64748b'}}>{b.issued}</strong></span>
                <span style={{ fontSize:11, color:'#94a3b8' }}>Due: <strong style={{color:b.daysLeft<=7?'#dc2626':'#059669'}}>{b.due}</strong></span>
                <span style={{ fontSize:11, color:'#94a3b8' }}>Acc. No: <strong style={{color:'#64748b'}}>{b.id}</strong></span>
              </div>
            </div>
            <div style={{ textAlign:'center', flexShrink:0 }}>
              <div style={{ position:'relative', display:'inline-flex', alignItems:'center', justifyContent:'center' }}>
                <Ring pct={(b.daysLeft/21)*100} color={b.daysLeft<=7?'#dc2626':'#059669'} size={58} sw={5} />
                <div style={{ position:'absolute', textAlign:'center', lineHeight:1 }}>
                  <p style={{ fontSize:15, fontWeight:900, color:b.daysLeft<=7?'#dc2626':'#059669' }}>{b.daysLeft}</p>
                  <p style={{ fontSize:9, color:'#94a3b8' }}>days</p>
                </div>
              </div>
            </div>
          </div>
          <div style={{ marginTop:12 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
              <span style={{ fontSize:11, color:'#94a3b8' }}>Return progress</span>
              <span style={{ fontSize:11, fontWeight:700, color:b.daysLeft<=7?'#dc2626':'#059669' }}>{b.daysLeft} days left</span>
            </div>
            <Bar pct={(b.daysLeft/21)*100} color={b.daysLeft<=7?'#dc2626':'#059669'} h={6} />
          </div>
          {b.daysLeft <= 7 && (
            <div style={{ marginTop:10, padding:'9px 12px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:9, display:'flex', alignItems:'center', gap:8 }}>
              <AlertCircle size={13} color='#dc2626' />
              <p style={{ fontSize:11, color:'#dc2626', fontWeight:600 }}>Due soon — return by {b.due} to avoid fine (₹2/day after due date)</p>
            </div>
          )}
        </div>
      ))}

      <div style={{ padding:'20px', background:'#f8fafc', border:'1.5px dashed #e2e8f0', borderRadius:14, textAlign:'center' }}>
        <BookOpen size={28} color='#c7d2fe' style={{ margin:'0 auto 8px', display:'block' }} />
        <p style={{ fontSize:13, fontWeight:600, color:'#64748b' }}>You can borrow 1 more book</p>
        <p style={{ fontSize:11, color:'#94a3b8', marginTop:4 }}>Max 3 books per student · Visit library counter with your ID card</p>
      </div>
    </div>
  );
}

// ─── STUDENT: Labs ────────────────────────────────────────────────────────────
function StuLabs() {
  const [booked, setBooked] = useState(null);
  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:12 }}>
        {STU.labs.map(l => {
          const pct = Math.round((l.avail / l.cap) * 100);
          const col = pct > 50 ? '#059669' : pct > 20 ? '#d97706' : '#dc2626';
          return (
            <div key={l.name} style={{ ...card }}>
              <div style={{ display:'flex', alignItems:'start', justifyContent:'space-between', marginBottom:12 }}>
                <div>
                  <p style={{ fontSize:13, fontWeight:700, color:'#0f172a' }}>{l.name}</p>
                  <p style={{ fontSize:11, color:'#94a3b8', marginTop:3 }}>{l.opens} – {l.closes}</p>
                </div>
                <Tag label={l.status==='open'?'Open':'Full'} color={l.status==='open'?'#059669':'#dc2626'} bg={l.status==='open'?'#dcfce7':'#fee2e2'} />
              </div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                <span style={{ fontSize:12, color:'#64748b' }}>{l.avail} of {l.cap} seats free</span>
                <span style={{ fontSize:12, fontWeight:700, color:col }}>{pct}% available</span>
              </div>
              <Bar pct={pct} color={col} h={7} />
              {l.status === 'open' ? (
                <button onClick={() => setBooked(booked===l.name ? null : l.name)}
                  style={{ marginTop:12, width:'100%', padding:'9px 0', borderRadius:9,
                    border: booked===l.name ? 'none' : '1.5px solid #c7d2fe',
                    background: booked===l.name ? 'linear-gradient(135deg,#6366f1,#4f46e5)' : '#eef2ff',
                    color: booked===l.name ? '#fff' : '#4f46e5',
                    fontWeight:700, fontSize:12, cursor:'pointer' }}>
                  {booked === l.name ? '✓ Slot Booked!' : 'Book a Slot'}
                </button>
              ) : (
                <div style={{ marginTop:12, padding:'8px', background:'#fee2e2', borderRadius:9, textAlign:'center' }}>
                  <p style={{ fontSize:11, color:'#dc2626', fontWeight:600 }}>Lab Full — check back later</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ marginTop:14, padding:'12px 16px', background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:12, display:'flex', alignItems:'center', gap:10 }}>
        <RefreshCw size={14} color='#059669' />
        <p style={{ fontSize:12, color:'#059669', fontWeight:600 }}>Live availability · Last updated just now</p>
      </div>
    </div>
  );
}

// ─── STUDENT: Notices ─────────────────────────────────────────────────────────
function StuNotices() {
  const [filter, setFilter] = useState('all');
  const typeMap = {
    exam:       { color:'#dc2626', bg:'#fee2e2', label:'Exam'       },
    assignment: { color:'#7c3aed', bg:'#f5f3ff', label:'Assignment' },
    placement:  { color:'#059669', bg:'#dcfce7', label:'Placement'  },
    library:    { color:'#d97706', bg:'#fef3c7', label:'Library'    },
  };
  const priColor = { high:'#dc2626', medium:'#d97706', low:'#94a3b8' };
  const shown = filter==='all' ? STU.notices : STU.notices.filter(n => n.type===filter);

  return (
    <div>
      <div style={{ display:'flex', gap:6, marginBottom:14, flexWrap:'wrap' }}>
        {['all','exam','assignment','placement','library'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding:'5px 13px', borderRadius:20, border:'1.5px solid',
            fontSize:12, fontWeight:600, cursor:'pointer',
            borderColor: filter===f ? '#4f46e5' : '#e2e8f0',
            background: filter===f ? '#4f46e5' : '#fff',
            color: filter===f ? '#fff' : '#64748b',
          }}>{f.charAt(0).toUpperCase()+f.slice(1)}</button>
        ))}
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {shown.map(n => {
          const tm = typeMap[n.type] || { color:'#64748b', bg:'#f1f5f9', label:n.type };
          return (
            <div key={n.id} style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderLeft:`4px solid ${priColor[n.pri]}`, borderRadius:'0 12px 12px 0', padding:'14px 16px' }}>
              <div style={{ display:'flex', alignItems:'start', justifyContent:'space-between', gap:8, marginBottom:6 }}>
                <p style={{ fontSize:13, fontWeight:700, color:'#0f172a', flex:1 }}>{n.title}</p>
                <span style={{ fontSize:10, color:'#94a3b8', whiteSpace:'nowrap' }}>{n.time}</span>
              </div>
              <p style={{ fontSize:12, color:'#64748b', lineHeight:1.6 }}>{n.body}</p>
              <div style={{ marginTop:8, display:'flex', gap:6, flexWrap:'wrap' }}>
                <Tag label={tm.label} color={tm.color} bg={tm.bg} />
                <Tag label={n.pri.toUpperCase()} color={priColor[n.pri]} bg={`${priColor[n.pri]}18`} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── FACULTY: My Courses ──────────────────────────────────────────────────────
function FacCourses() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:10 }}>
        {[
          { label:'Total Students', value:'110', color:'#4f46e5', sub:'across 3 courses' },
          { label:'Active Courses',  value:'3',   color:'#7c3aed', sub:'this semester' },
          { label:'Avg Attendance',  value:'84%', color:'#059669', sub:'class average' },
          { label:'Pending Tasks',   value:'4',   color:'#d97706', sub:'action needed' },
        ].map(s => (
          <div key={s.label} style={{ ...card, display:'flex', alignItems:'center', gap:12 }}>
            <div>
              <p style={{ fontSize:24, fontWeight:900, color:s.color, lineHeight:1 }}>{s.value}</p>
              <p style={{ fontSize:12, fontWeight:600, color:'#0f172a', marginTop:3 }}>{s.label}</p>
              <p style={{ fontSize:10, color:'#94a3b8', marginTop:1 }}>{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {FAC.courses.map(c => (
        <div key={c.code} style={{ ...card }}>
          <div style={{ display:'flex', alignItems:'start', justifyContent:'space-between', gap:12 }}>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                <span style={{ fontFamily:'monospace', fontSize:11, fontWeight:700, color:'#94a3b8', background:'#f1f5f9', padding:'2px 8px', borderRadius:5 }}>{c.code}</span>
                <Tag label={c.cls} color='#4f46e5' bg='#eef2ff' />
              </div>
              <p style={{ fontSize:15, fontWeight:700, color:'#0f172a' }}>{c.name}</p>
              <p style={{ fontSize:12, color:'#64748b', marginTop:4 }}>{c.students} students enrolled</p>
              <div style={{ marginTop:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ fontSize:11, color:'#94a3b8' }}>Class avg. attendance</span>
                  <span style={{ fontSize:11, fontWeight:700, color:attColor(c.avgAtt) }}>{c.avgAtt}%</span>
                </div>
                <Bar pct={c.avgAtt} color={attColor(c.avgAtt)} h={6} />
              </div>
            </div>
            <div style={{ textAlign:'center', flexShrink:0 }}>
              <div style={{ position:'relative', display:'inline-flex', alignItems:'center', justifyContent:'center', marginBottom:6 }}>
                <Ring pct={c.avgAtt} color={attColor(c.avgAtt)} size={60} sw={5} />
                <div style={{ position:'absolute', textAlign:'center' }}>
                  <p style={{ fontSize:12, fontWeight:900, color:attColor(c.avgAtt), lineHeight:1 }}>{c.avgAtt}%</p>
                  <p style={{ fontSize:9, color:'#94a3b8', lineHeight:1.2 }}>att.</p>
                </div>
              </div>
              <p style={{ fontSize:26, fontWeight:900, color:gradeCol(c.avgGrade), lineHeight:1 }}>{c.avgGrade}</p>
              <p style={{ fontSize:10, color:'#94a3b8' }}>avg grade</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── FACULTY: Students ────────────────────────────────────────────────────────
function FacStudents() {
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('all');
  const statusMap = {
    good:     { color:'#059669', bg:'#dcfce7', label:'Good'     },
    risk:     { color:'#d97706', bg:'#fef3c7', label:'At Risk'  },
    critical: { color:'#dc2626', bg:'#fee2e2', label:'Critical' },
  };
  const shown = FAC.students.filter(s => {
    const q = search.toLowerCase();
    const matchQ = s.name.toLowerCase().includes(q) || s.roll.toLowerCase().includes(q);
    return matchQ && (filter==='all' || s.status===filter);
  });

  const counts = { good: FAC.students.filter(s=>s.status==='good').length, risk: FAC.students.filter(s=>s.status==='risk').length, critical: FAC.students.filter(s=>s.status==='critical').length };

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:14 }}>
        {[
          { k:'good',     label:'On Track',  count:counts.good,     color:'#059669', bg:'#dcfce7' },
          { k:'risk',     label:'At Risk',   count:counts.risk,     color:'#d97706', bg:'#fef3c7' },
          { k:'critical', label:'Critical',  count:counts.critical, color:'#dc2626', bg:'#fee2e2' },
        ].map(s => (
          <button key={s.k} onClick={() => setFilter(filter===s.k?'all':s.k)}
            style={{ padding:'10px', borderRadius:12, border:`2px solid ${filter===s.k?s.color:'#e2e8f0'}`, background:filter===s.k?s.bg:'#fff', cursor:'pointer', textAlign:'center' }}>
            <p style={{ fontSize:24, fontWeight:900, color:s.color, lineHeight:1 }}>{s.count}</p>
            <p style={{ fontSize:11, fontWeight:700, color:s.color, marginTop:3 }}>{s.label}</p>
          </button>
        ))}
      </div>

      <div style={{ position:'relative', marginBottom:12 }}>
        <Search size={14} color='#94a3b8' style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or roll number…"
          style={{ width:'100%', paddingLeft:34, paddingRight:12, paddingTop:10, paddingBottom:10, borderRadius:10, border:'1.5px solid #e2e8f0', background:'#f8fafc', fontSize:13, color:'#0f172a', outline:'none', boxSizing:'border-box' }} />
      </div>

      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          <thead>
            <tr style={{ borderBottom:'2px solid #f1f5f9' }}>
              {['Roll No','Student Name','Attendance','CIA-1','CIA-2','CIA-3','Grade','Status'].map(h => (
                <th key={h} style={{ padding:'8px 8px', textAlign:'left', fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em', whiteSpace:'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((s, i) => {
              const sm = statusMap[s.status];
              return (
                <tr key={s.roll} style={{ borderBottom:'1px solid #f1f5f9', background: i%2===0?'#fff':'#fafafe' }}>
                  <td style={{ padding:'10px 8px', color:'#94a3b8', fontFamily:'monospace', fontSize:11 }}>{s.roll}</td>
                  <td style={{ padding:'10px 8px', color:'#0f172a', fontWeight:600 }}>{s.name}</td>
                  <td style={{ padding:'10px 8px', minWidth:130 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:12, fontWeight:700, color:attColor(s.att), minWidth:36 }}>{s.att}%</span>
                      <div style={{ flex:1 }}><Bar pct={s.att} color={attColor(s.att)} h={5} /></div>
                    </div>
                  </td>
                  {s.ia.map((m, j) => (
                    <td key={j} style={{ padding:'10px 8px', textAlign:'center', fontWeight:700, color:m>=18?'#059669':m>=14?'#d97706':'#dc2626' }}>{m}/20</td>
                  ))}
                  <td style={{ padding:'10px 8px', fontWeight:900, color:gradeCol(s.grade), fontSize:15 }}>{s.grade}</td>
                  <td style={{ padding:'10px 8px' }}><Tag label={sm.label} color={sm.color} bg={sm.bg} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {shown.length === 0 && (
          <div style={{ padding:'28px', textAlign:'center', color:'#94a3b8', fontSize:13 }}>No students match your search</div>
        )}
      </div>
    </div>
  );
}

// ─── FACULTY: Leave ───────────────────────────────────────────────────────────
function FacLeave() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type:'Academic Leave', from:'', to:'', reason:'' });
  const [submitted, setSubmitted] = useState(false);

  const lb = FAC.leaveBalance;
  const leaveTypes = [
    { label:'Earned Leave',  total:lb.earned.total,  used:lb.earned.used,  color:'#4f46e5' },
    { label:'Casual Leave',  total:lb.casual.total,  used:lb.casual.used,  color:'#7c3aed' },
    { label:'Medical Leave', total:lb.medical.total, used:lb.medical.used, color:'#059669' },
  ];
  const statusMap = {
    approved: { color:'#059669', bg:'#dcfce7' },
    pending:  { color:'#d97706', bg:'#fef3c7' },
    rejected: { color:'#dc2626', bg:'#fee2e2' },
  };

  function handleSubmit() {
    if (!form.from || !form.to || !form.reason) return;
    setSubmitted(true);
    setShowForm(false);
    setTimeout(() => setSubmitted(false), 4000);
  }

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:16 }}>
        {leaveTypes.map(l => (
          <div key={l.label} style={{ ...card }}>
            <p style={{ fontSize:10, color:'#94a3b8', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>{l.label}</p>
            <div style={{ display:'flex', alignItems:'end', gap:6, marginBottom:8 }}>
              <span style={{ fontSize:30, fontWeight:900, color:l.color, lineHeight:1 }}>{l.total-l.used}</span>
              <span style={{ fontSize:12, color:'#94a3b8', marginBottom:4 }}>/ {l.total}</span>
            </div>
            <Bar pct={((l.total-l.used)/l.total)*100} color={l.color} h={6} />
            <p style={{ fontSize:11, color:'#94a3b8', marginTop:6 }}>{l.used} used this year</p>
          </div>
        ))}
      </div>

      {submitted && (
        <div style={{ marginBottom:12, padding:'10px 16px', background:'#dcfce7', border:'1px solid #bbf7d0', borderRadius:10, display:'flex', alignItems:'center', gap:8 }}>
          <CheckCircle2 size={14} color='#059669' />
          <p style={{ fontSize:12, fontWeight:600, color:'#059669' }}>Leave application submitted successfully! Pending approval.</p>
        </div>
      )}

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <p style={{ fontSize:13, fontWeight:700, color:'#0f172a' }}>Leave History</p>
        <button onClick={() => setShowForm(!showForm)}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#6366f1,#4f46e5)', color:'#fff', fontWeight:700, fontSize:12, cursor:'pointer' }}>
          <PlusCircle size={13} /> Apply Leave
        </button>
      </div>

      {showForm && (
        <div style={{ marginBottom:14, background:'#eef2ff', border:'1.5px solid #c7d2fe', borderRadius:14, padding:'16px 18px' }}>
          <p style={{ fontSize:13, fontWeight:700, color:'#4f46e5', marginBottom:12 }}>New Leave Application</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:10 }}>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:4 }}>Leave Type</label>
              <select value={form.type} onChange={e => setForm({...form, type:e.target.value})}
                style={{ width:'100%', padding:'8px 10px', borderRadius:8, border:'1.5px solid #c7d2fe', background:'#fff', fontSize:13, color:'#0f172a', outline:'none' }}>
                {['Academic Leave','Casual Leave','Medical Leave','Earned Leave'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:4 }}>From Date</label>
              <input type="date" value={form.from} onChange={e => setForm({...form, from:e.target.value})}
                style={{ width:'100%', padding:'8px 10px', borderRadius:8, border:'1.5px solid #c7d2fe', background:'#fff', fontSize:13, color:'#0f172a', outline:'none', boxSizing:'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:4 }}>To Date</label>
              <input type="date" value={form.to} onChange={e => setForm({...form, to:e.target.value})}
                style={{ width:'100%', padding:'8px 10px', borderRadius:8, border:'1.5px solid #c7d2fe', background:'#fff', fontSize:13, color:'#0f172a', outline:'none', boxSizing:'border-box' }} />
            </div>
          </div>
          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:11, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:4 }}>Reason</label>
            <textarea rows={2} value={form.reason} onChange={e => setForm({...form, reason:e.target.value})} placeholder="Enter reason for leave…"
              style={{ width:'100%', padding:'8px 10px', borderRadius:8, border:'1.5px solid #c7d2fe', background:'#fff', fontSize:13, color:'#0f172a', outline:'none', resize:'none', boxSizing:'border-box' }} />
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={handleSubmit} style={{ flex:1, padding:'9px', borderRadius:9, border:'none', background:'linear-gradient(135deg,#6366f1,#4f46e5)', color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer' }}>
              Submit Application
            </button>
            <button onClick={() => setShowForm(false)} style={{ padding:'9px 16px', borderRadius:9, border:'1.5px solid #e2e8f0', background:'#fff', color:'#64748b', fontWeight:600, fontSize:13, cursor:'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {FAC.leaves.map(l => {
          const sm = statusMap[l.status];
          return (
            <div key={l.id} style={{ display:'flex', alignItems:'center', gap:14, ...card }}>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                  <Tag label={l.type} color='#4f46e5' bg='#eef2ff' />
                  <span style={{ fontSize:11, color:'#94a3b8' }}>Applied: {l.applied}</span>
                </div>
                <p style={{ fontSize:13, fontWeight:600, color:'#0f172a' }}>{l.reason}</p>
                <p style={{ fontSize:11, color:'#64748b', marginTop:2 }}>{l.from} → {l.to} · {l.days} day{l.days>1?'s':''}</p>
              </div>
              <Tag label={l.status.charAt(0).toUpperCase()+l.status.slice(1)} color={sm.color} bg={sm.bg} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── FACULTY: Notices & Duties ────────────────────────────────────────────────
function FacNotices() {
  const priColor = { high:'#dc2626', medium:'#d97706', low:'#94a3b8' };
  const priBg    = { high:'#fee2e2', medium:'#fef3c7', low:'#f1f5f9' };

  return (
    <div>
      <p style={{ fontSize:13, fontWeight:700, color:'#0f172a', marginBottom:10 }}>Pending Tasks</p>
      <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:20 }}>
        {FAC.tasks.map((t, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:12, background:'#f8fafc', border:'1px solid #e2e8f0', borderLeft:`4px solid ${priColor[t.pri]}`, borderRadius:'0 12px 12px 0', padding:'12px 16px' }}>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:13, fontWeight:600, color:'#0f172a' }}>{t.task}</p>
              <p style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>
                Deadline: <strong style={{ color:t.pri==='high'?'#dc2626':'#64748b' }}>{t.deadline}</strong>
              </p>
            </div>
            <Tag label={t.pri.toUpperCase()} color={priColor[t.pri]} bg={priBg[t.pri]} />
          </div>
        ))}
      </div>

      <p style={{ fontSize:13, fontWeight:700, color:'#0f172a', marginBottom:10 }}>Announcements</p>
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {FAC.notices.map(n => (
          <div key={n.id} style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderLeft:`4px solid ${priColor[n.pri]}`, borderRadius:'0 12px 12px 0', padding:'14px 16px' }}>
            <div style={{ display:'flex', alignItems:'start', justifyContent:'space-between', gap:8, marginBottom:6 }}>
              <p style={{ fontSize:13, fontWeight:700, color:'#0f172a', flex:1 }}>{n.title}</p>
              <span style={{ fontSize:10, color:'#94a3b8', whiteSpace:'nowrap' }}>{n.time}</span>
            </div>
            <p style={{ fontSize:12, color:'#64748b', lineHeight:1.6 }}>{n.body}</p>
            <div style={{ marginTop:8 }}>
              <Tag label={n.pri.toUpperCase()} color={priColor[n.pri]} bg={priBg[n.pri]} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Security Tab ─────────────────────────────────────────────────────────────
function SecurityTab({ logs, loading }) {
  const riskColor = { low:'#059669', medium:'#d97706', high:'#dc2626' };
  const riskBg    = { low:'#dcfce7', medium:'#fef3c7', high:'#fee2e2' };
  const actionLabel = {
    login_success   : 'Login successful',
    login_failure   : 'Login failed',
    register_success: 'Passkey registered',
    admin_revoke    : 'Access revoked by admin',
  };

  const ssoSystems = [
    { name:'Student ERP',    status:'Active',  color:'#059669' },
    { name:'LMS Portal',     status:'Active',  color:'#059669' },
    { name:'Library System', status:'Active',  color:'#059669' },
    { name:'Labs Booking',   status:'Active',  color:'#059669' },
    { name:'Campus Wi-Fi',   status:'Active',  color:'#059669' },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

      {/* SSO status */}
      <div>
        <p style={{ fontSize:13, fontWeight:700, color:'#0f172a', marginBottom:10 }}>Single Sign-On Status</p>
        <p style={{ fontSize:12, color:'#64748b', marginBottom:12, lineHeight:1.6 }}>
          Your one biometric login through CampusKey gives you access to all the systems below. You do not need to log into each one separately.
        </p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:10 }}>
          {ssoSystems.map(s => (
            <div key={s.name} style={{ borderRadius:12, padding:'12px 14px', background:'#f8fafc', border:'1px solid #e2e8f0', display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:'#22c55e', flexShrink:0 }} />
              <div>
                <p style={{ fontSize:12, fontWeight:700, color:'#0f172a', margin:0 }}>{s.name}</p>
                <p style={{ fontSize:10, color:'#22c55e', fontWeight:600, margin:'2px 0 0' }}>Authenticated</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Audit trail */}
      <div>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
          <p style={{ fontSize:13, fontWeight:700, color:'#0f172a', margin:0 }}>Your Security Log</p>
          <Tag label="Compliance Trail" color='#4f46e5' bg='#eef2ff' />
        </div>
        <p style={{ fontSize:12, color:'#64748b', marginBottom:12, lineHeight:1.6 }}>
          Every time you log in or register, a record is created here. This is your personal compliance audit trail that shows all activity on your account.
        </p>

        {loading && (
          <div style={{ textAlign:'center', padding:'32px 0', color:'#94a3b8', fontSize:13 }}>Loading your security log…</div>
        )}

        {!loading && logs.length === 0 && (
          <div style={{ textAlign:'center', padding:'32px 0', background:'#f8fafc', borderRadius:12, border:'1px solid #e2e8f0' }}>
            <ShieldCheck size={28} color='#c7d2fe' style={{ margin:'0 auto 8px' }} />
            <p style={{ fontSize:13, color:'#94a3b8' }}>No activity recorded yet. Your log will appear here after your next login.</p>
          </div>
        )}

        {!loading && logs.length > 0 && (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {logs.map(log => (
              <div key={log.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', background:'#f8fafc', borderRadius:12, border:'1px solid #e2e8f0' }}>
                <div style={{ width:36, height:36, borderRadius:10, background: log.status === 'success' ? '#dcfce7' : '#fee2e2', border:`1px solid ${log.status === 'success' ? '#bbf7d0' : '#fecaca'}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <ShieldCheck size={16} color={log.status === 'success' ? '#059669' : '#dc2626'} />
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:12, fontWeight:700, color:'#0f172a', margin:0 }}>{actionLabel[log.action] || log.action}</p>
                  <p style={{ fontSize:11, color:'#94a3b8', margin:'2px 0 0' }}>
                    {new Date(log.created_at).toLocaleString('en-IN', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit', hour12:true })}
                    {log.ip && log.ip !== 'unknown' ? ` · ${log.ip}` : ''}
                  </p>
                </div>
                <Tag
                  label={log.risk_level.toUpperCase()}
                  color={riskColor[log.risk_level] || '#64748b'}
                  bg={riskBg[log.risk_level] || '#f1f5f9'}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FIDO2 security info */}
      <div style={{ borderRadius:14, padding:'16px 18px', background:'linear-gradient(135deg,#eef2ff,#f0f9ff)', border:'1.5px solid #c7d2fe' }}>
        <p style={{ fontSize:13, fontWeight:700, color:'#4f46e5', marginBottom:8 }}>How your account stays secure</p>
        {[
          'Your fingerprint or face is stored only on your device and never sent to any server.',
          'Every login request is signed by your device using a unique key that only you have.',
          'Even if someone knows your email, they cannot log in without your physical device.',
          'This login system follows the FIDO2 and WebAuthn global security standards.',
        ].map(t => (
          <div key={t} style={{ display:'flex', gap:8, marginBottom:6, alignItems:'flex-start' }}>
            <ShieldCheck size={12} color='#4f46e5' style={{ marginTop:2, flexShrink:0 }} />
            <p style={{ fontSize:12, color:'#475569', margin:0, lineHeight:1.6 }}>{t}</p>
          </div>
        ))}
      </div>

    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate        = useNavigate();
  const { user, logout } = useAuth();
  const confettiFired   = useRef(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [now, setNow]   = useState(new Date());

  const role    = user?.role || getRole(user?.email);
  const name    = user?.name || user?.email?.split('@')[0] || 'User';
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const studentTabs = [
    { id:'academic',  icon:GraduationCap, label:'Academic',   color:'#4f46e5' },
    { id:'library',   icon:BookMarked,    label:'Library',    color:'#7c3aed' },
    { id:'labs',      icon:Monitor,       label:'Lab Access', color:'#059669' },
    { id:'notices',   icon:Bell,          label:'Notices',    color:'#d97706' },
    { id:'security',  icon:ShieldCheck,   label:'Security',   color:'#0ea5e9' },
  ];
  const facultyTabs = [
    { id:'courses',   icon:GraduationCap, label:'My Courses', color:'#4f46e5' },
    { id:'students',  icon:Users,         label:'Students',   color:'#7c3aed' },
    { id:'leave',     icon:CalendarCheck, label:'Leave',      color:'#059669' },
    { id:'notices',   icon:Megaphone,     label:'Notices',    color:'#d97706' },
    { id:'security',  icon:ShieldCheck,   label:'Security',   color:'#0ea5e9' },
  ];
  const tabs = role === 'faculty' ? facultyTabs : studentTabs;
  const [activeTab,  setActiveTab]  = useState(tabs[0].id);
  const [auditLogs,  setAuditLogs]  = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'security' && auditLogs.length === 0) {
      setAuditLoading(true);
      api.auditMe()
        .then(data => setAuditLogs(data.logs || []))
        .catch(() => setAuditLogs([]))
        .finally(() => setAuditLoading(false));
    }
  }, [activeTab]);

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Confetti on first login
  useEffect(() => {
    if (!confettiFired.current && !sessionStorage.getItem('ck_welcomed')) {
      confettiFired.current = true;
      sessionStorage.setItem('ck_welcomed', '1');
      setShowWelcome(true);
      setTimeout(() => setShowWelcome(false), 4000);
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 }, colors: ['#6366f1','#8b5cf6','#4f46e5','#a5b4fc'] });
    }
  }, []);

  function handleLogout() { logout(); navigate('/', { replace: true }); }

  const hr = now.getHours();
  const greeting = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';

  const stats = role === 'faculty' ? [
    { icon:Users,         label:'Total Students', value:'110',  sub:'across 3 courses', color:'#4f46e5' },
    { icon:BookOpen,      label:'Active Courses',  value:'3',    sub:'this semester',    color:'#7c3aed' },
    { icon:ClipboardList, label:'Pending Tasks',   value:'4',    sub:'action required',  color:'#d97706' },
    { icon:TrendingUp,    label:'Avg Attendance',  value:'84%',  sub:'class average',    color:'#059669' },
  ] : [
    { icon:TrendingUp,   label:'CGPA',          value:'8.7',  sub:'Sem 1–5 aggregate', color:'#4f46e5' },
    { icon:CheckCircle2, label:'Attendance',    value:'88%',  sub:'overall this sem',  color:'#059669' },
    { icon:BookMarked,   label:'Books Issued',  value:'2',    sub:'1 due in 6 days',   color:'#d97706' },
    { icon:FileText,     label:'Assignments',   value:'3',    sub:'2 pending',          color:'#7c3aed' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9' }}>
      <FloatingOrbs />

      {/* ── Navbar ── */}
      <nav style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(14px)', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 18px', height: 54, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          {/* Logo */}
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <Link to="/" style={{ display:'flex', alignItems:'center', gap:8, textDecoration:'none' }}>
              <div style={{ width:30, height:30, borderRadius:10, background:'linear-gradient(135deg,#6366f1,#4f46e5)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Fingerprint size={15} color='#fff' />
              </div>
              <span style={{ fontSize:17, fontWeight:800, color:'#0f172a' }}>Campus<span style={{color:'#4f46e5'}}>Key</span></span>
            </Link>
            <span style={{ fontSize:11, fontWeight:700, color:'#4f46e5', background:'#eef2ff', border:'1px solid #c7d2fe', padding:'2px 10px', borderRadius:20 }}>
              {role === 'faculty' ? 'Faculty' : 'Student'}
            </span>
          </div>

          {/* Live clock */}
          <div style={{ display:'flex', alignItems:'center', gap:6, background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:9, padding:'5px 12px' }}>
            <Clock size={12} color='#94a3b8' />
            <span style={{ fontSize:12, fontWeight:700, color:'#475569', fontFamily:'monospace', letterSpacing:'0.02em' }}>
              {now.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:true })}
            </span>
          </div>

          {/* Right controls */}
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#6366f1,#4f46e5)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color:'#fff', flexShrink:0 }}>
              {initials}
            </div>
            <button onClick={handleLogout}
              style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:9, border:'1px solid #e2e8f0', background:'#fff', color:'#64748b', fontSize:12, fontWeight:600, cursor:'pointer' }}>
              <LogOut size={12} /> Sign out
            </button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 1140, margin: '0 auto', padding: '20px 18px 40px' }}>

        {/* ── Welcome Banner ── */}
        <AnimatePresence>
          {showWelcome && (
            <motion.div initial={{ opacity:0, y:-14 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-14 }}
              style={{ marginBottom:16, display:'flex', alignItems:'center', gap:12, padding:'13px 18px', borderRadius:14, background:'linear-gradient(135deg,#eef2ff,#f0f9ff)', border:'1.5px solid #c7d2fe', boxShadow:'0 4px 20px rgba(99,102,241,0.10)' }}>
              <PartyPopper size={18} color='#4f46e5' />
              <div>
                <p style={{ fontWeight:700, fontSize:13, color:'#0f172a' }}>Welcome, {name.split(' ')[0]}! Passkey authentication successful.</p>
                <p style={{ fontSize:11, color:'#64748b', marginTop:1 }}>Signed in without a password · FIDO2 verified</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Greeting ── */}
        <div style={{ marginBottom:16 }}>
          <h1 style={{ fontSize:22, fontWeight:800, color:'#0f172a', margin:0 }}>
            {greeting}, <span style={{color:'#4f46e5'}}>{name.split(' ')[0]}</span>
          </h1>
          <p style={{ fontSize:12, color:'#64748b', marginTop:4 }}>
            {now.toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
            {role === 'student'
              ? ` · ${STU.branch} · Sem ${STU.sem} · Roll: ${STU.roll}`
              : ` · ${FAC.dept} · ${FAC.designation} · ${FAC.empId}`}
          </p>
          <div style={{ marginTop:8, display:'inline-flex', alignItems:'center', gap:6, background:'#dcfce7', border:'1px solid #bbf7d0', borderRadius:20, padding:'3px 12px' }}>
            <ShieldCheck size={11} color='#059669' />
            <span style={{ fontSize:11, fontWeight:600, color:'#16a34a' }}>Passwordless session active · WebAuthn verified · No password used</span>
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:12, marginBottom:16 }}>
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.06 }}
              style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:14, padding:'14px 16px', display:'flex', alignItems:'center', gap:12, boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ width:40, height:40, borderRadius:12, background:`${s.color}14`, border:`1px solid ${s.color}28`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <s.icon size={18} color={s.color} />
              </div>
              <div>
                <p style={{ fontSize:22, fontWeight:900, color:'#0f172a', lineHeight:1 }}>{s.value}</p>
                <p style={{ fontSize:11, fontWeight:600, color:'#475569', marginTop:2 }}>{s.label}</p>
                <p style={{ fontSize:10, color:'#94a3b8', marginTop:1 }}>{s.sub}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── SSO Connected Campus Systems ── */}
        <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:14, padding:'12px 18px', marginBottom:16, boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
            <Wifi size={13} color='#4f46e5' />
            <span style={{ fontSize:12, fontWeight:700, color:'#0f172a' }}>Campus Systems — All authenticated via CampusKey</span>
            <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:5, background:'#dcfce7', border:'1px solid #bbf7d0', borderRadius:6, padding:'2px 8px' }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:'#22c55e' }} />
              <span style={{ fontSize:10, fontWeight:700, color:'#16a34a' }}>SSO ACTIVE</span>
            </div>
          </div>
          <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:2 }}>
            {[
              { label:'Student ERP',      sub:'Grades & Results',   color:'#4f46e5', bg:'#eef2ff' },
              { label:'LMS Portal',       sub:'Course Materials',   color:'#7c3aed', bg:'#f5f3ff' },
              { label:'Library System',   sub:'Books & Resources',  color:'#059669', bg:'#ecfdf5' },
              { label:'Labs Booking',     sub:'Lab Availability',   color:'#d97706', bg:'#fffbeb' },
              { label:'Campus Wi-Fi',     sub:'Network Access',     color:'#0ea5e9', bg:'#f0f9ff' },
            ].map(s => (
              <div key={s.label} style={{ flexShrink:0, minWidth:130, borderRadius:10, padding:'9px 12px', background:s.bg, border:`1px solid ${s.color}22` }}>
                <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:3 }}>
                  <div style={{ width:7, height:7, borderRadius:'50%', background:'#22c55e', flexShrink:0 }} />
                  <span style={{ fontSize:11, fontWeight:700, color:s.color }}>{s.label}</span>
                </div>
                <p style={{ fontSize:10, color:'#94a3b8', margin:0 }}>{s.sub}</p>
                <p style={{ fontSize:9, color:'#22c55e', fontWeight:600, margin:'3px 0 0' }}>Signed in</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Today's Schedule ── */}
        <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:16, padding:'16px 18px', marginBottom:16, boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
            <div style={{ width:30, height:30, borderRadius:8, background:'#eef2ff', border:'1px solid #c7d2fe', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Calendar size={15} color='#4f46e5' />
            </div>
            <p style={{ fontSize:14, fontWeight:700, color:'#0f172a' }}>Today's Schedule</p>
            <span style={{ fontSize:10, color:'#64748b', marginLeft:4 }}>
              {now.toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'short' })}
            </span>
            <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:5, background:'#dcfce7', border:'1px solid #bbf7d0', borderRadius:6, padding:'2px 8px' }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:'#22c55e' }} />
              <span style={{ fontSize:10, fontWeight:700, color:'#16a34a' }}>LIVE</span>
            </div>
          </div>
          <TodaySchedule schedule={role === 'faculty' ? FAC.schedule : STU.schedule} now={now} />
        </div>

        {/* ── Section Tabs ── */}
        <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:16, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
          {/* Tab bar */}
          <div style={{ display:'flex', borderBottom:'1px solid #f1f5f9', overflowX:'auto' }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                flex:1, minWidth:100, display:'flex', alignItems:'center', justifyContent:'center', gap:7,
                padding:'14px 10px', border:'none', cursor:'pointer',
                background: activeTab===t.id ? '#fff' : '#f8fafc',
                borderBottom: `3px solid ${activeTab===t.id ? t.color : 'transparent'}`,
                color: activeTab===t.id ? t.color : '#94a3b8',
                fontWeight: activeTab===t.id ? 700 : 600,
                fontSize: 13,
                transition: 'all 0.18s',
              }}>
                <t.icon size={15} />
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ padding: '20px 18px' }}>
            <AnimatePresence mode="wait">
              <motion.div key={activeTab}
                initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
                transition={{ duration: 0.18 }}>
                {role === 'student' && (
                  <>
                    {activeTab === 'academic'  && <StuAcademic />}
                    {activeTab === 'library'   && <StuLibrary />}
                    {activeTab === 'labs'      && <StuLabs />}
                    {activeTab === 'notices'   && <StuNotices />}
                    {activeTab === 'security'  && <SecurityTab logs={auditLogs} loading={auditLoading} />}
                  </>
                )}
                {role === 'faculty' && (
                  <>
                    {activeTab === 'courses'   && <FacCourses />}
                    {activeTab === 'students'  && <FacStudents />}
                    {activeTab === 'leave'     && <FacLeave />}
                    {activeTab === 'notices'   && <FacNotices />}
                    {activeTab === 'security'  && <SecurityTab logs={auditLogs} loading={auditLoading} />}
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* ── Security Strip ── */}
        <div style={{ marginTop:12, display:'flex', alignItems:'center', gap:18, padding:'10px 14px', background:'#fff', border:'1px solid #e2e8f0', borderRadius:12, flexWrap:'wrap', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
          {[
            { icon:Wifi,       label:'FIDO2 Verified',       color:'#4f46e5' },
            { icon:Lock,       label:'Zero-knowledge auth',  color:'#059669' },
            { icon:Smartphone, label:'Device-bound passkey', color:'#7c3aed' },
            { icon:Zap,        label:'Session: 24h JWT',     color:'#d97706' },
          ].map(b => (
            <div key={b.label} style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, fontWeight:600, color:'#475569' }}>
              <b.icon size={12} color={b.color} />
              {b.label}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

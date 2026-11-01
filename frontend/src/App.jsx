import React, { useEffect, useMemo, useState } from 'react';
import { api } from './api';
import {
  LayoutDashboard, Users, Building2, FolderKanban, CheckSquare, Activity,
  LogOut, Plus, Bell, Sun, Moon
} from 'lucide-react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area
} from 'recharts';

const statuses = [
  { id: 'Todo', label: 'Yapılacak' },
  { id: 'InProgress', label: 'Devam ediyor' },
  { id: 'Review', label: 'Kontrolde' },
  { id: 'Done', label: 'Tamamlandı' }
];

const statusColors = { Todo: '#aab0cc', InProgress: '#4f6bff', Review: '#ffb938', Done: '#12c2a4' };

const tooltipStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--line)',
  borderRadius: 12,
  fontSize: 12,
  color: 'var(--ink)',
  boxShadow: '0 10px 30px rgba(40,40,120,.18)'
};

function getInitialTheme() {
  try {
    const saved = localStorage.getItem('devflow_theme');
    if (saved === 'dark' || saved === 'light') return saved;
  } catch (_) { /* yoksay */ }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function App() {
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem('devflow_token');
    const user = localStorage.getItem('devflow_user');
    return token && user ? { token, user: JSON.parse(user) } : null;
  });
  const [theme, setTheme] = useState(getInitialTheme);
  const [page, setPage] = useState('overview');
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [activities, setActivities] = useState([]);
  const [error, setError] = useState('');
  const [modal, setModal] = useState('');
  const [busy, setBusy] = useState(false);

  const role = auth?.user?.role || 'Employee';
  const isManager = role === 'Admin' || role === 'DepartmentManager';

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('devflow_theme', theme); } catch (_) { /* yoksay */ }
  }, [theme]);

  async function load() {
    if (!auth) return;
    setError('');
    try {
      const [t, d, p] = await Promise.all([api('/tasks'), api('/departments'), api('/projects')]);
      setTasks(t); setDepartments(d); setProjects(p);
      if (isManager) {
        const [e, a] = await Promise.all([api('/employees'), api('/activity')]);
        setEmployees(e); setActivities(a);
      }
    } catch (e) { setError(e.message); }
  }
  useEffect(() => { load(); }, [auth]);

  async function login(email, password) {
    setBusy(true); setError('');
    try {
      const result = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      localStorage.setItem('devflow_token', result.token);
      localStorage.setItem('devflow_user', JSON.stringify(result.user));
      setAuth({ token: result.token, user: result.user });
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  function logout() {
    localStorage.removeItem('devflow_token'); localStorage.removeItem('devflow_user');
    setAuth(null); setTasks([]);
  }

  // İyimser güncelleme: kart anında taşınır, hata olursa sunucudaki hâle döner.
  async function updateStatus(id, status) {
    setTasks(old => old.map(t => (t.id === id ? { ...t, status } : t)));
    try {
      await api(`/tasks/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
      if (isManager) {
        const a = await api('/activity');
        setActivities(a);
      }
    } catch (e) { setError(e.message); await load(); }
  }
  async function createEntity(path, body) {
    try { await api(path, { method: 'POST', body: JSON.stringify(body) }); setModal(''); await load(); }
    catch (e) { setError(e.message); }
  }

  if (!auth) return <Login onLogin={login} error={error} busy={busy} />;

  const nav = [
    ['overview', 'Genel Bakış', LayoutDashboard],
    ...(isManager ? [['employees', 'Çalışanlar', Users], ['departments', 'Departmanlar', Building2]] : []),
    ['projects', 'Projeler', FolderKanban],
    ['tasks', 'Görevler', CheckSquare],
    ...(isManager ? [['activity', 'Aktivite Geçmişi', Activity]] : [])
  ];

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">D</span><span>DevFlow</span></div>
      <div className="workspace"><span className="workspace-dot"></span><div><b>Şirket Alanı</b><small>Çalışma alanı</small></div></div>
      <div className="nav-label">MENÜ</div>
      {nav.map(([id, label, Icon]) => <button key={id} className={`nav-item ${page === id ? 'active' : ''}`} onClick={() => setPage(id)}><Icon size={18}/>{label}</button>)}
      <div className="sidebar-bottom"><div className="avatar">{auth.user.firstName?.[0] || 'U'}</div><div className="profile"><b>{auth.user.firstName} {auth.user.lastName}</b><small>{roleLabel(role)}</small></div><button className="icon-button" title="Çıkış" onClick={logout}><LogOut size={17}/></button></div>
    </aside>
    <main className="main-area">
      <header className="topbar">
        <div><span className="breadcrumb">Çalışma alanı</span><span className="slash">/</span><b>{nav.find(x => x[0] === page)?.[1] || 'Genel Bakış'}</b></div>
        <div className="top-actions">
          <button className="icon-button theme-toggle" title={theme === 'dark' ? 'Aydınlık mod' : 'Karanlık mod'} aria-label="Tema değiştir" onClick={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))}>
            {theme === 'dark' ? <Sun size={18}/> : <Moon size={18}/>}
          </button>
          <button className="icon-button"><Bell size={18}/></button>
          <div className="top-avatar">{auth.user.firstName?.[0] || 'U'}</div>
        </div>
      </header>
      <section className="content">
        {error && <div className="alert">{error}<button onClick={() => setError('')}>×</button></div>}
        {page === 'overview' && <Overview tasks={tasks} employees={employees} projects={projects} isManager={isManager} user={auth.user} setPage={setPage}/>}
        {page === 'tasks' && <Tasks tasks={tasks} isManager={isManager} onStatus={updateStatus} onAdd={() => setModal('task')}/>}
        {page === 'projects' && <Projects projects={projects} tasks={tasks} canCreate={isManager} onAdd={() => setModal('project')}/>}
        {page === 'employees' && <Employees employees={employees} departments={departments} onAdd={() => setModal('employee')}/>}
        {page === 'departments' && <Departments departments={departments} onAdd={() => setModal('department')}/>}
        {page === 'activity' && <ActivityList activities={activities}/>}
      </section>
    </main>
    {modal && <Modal type={modal} onClose={() => setModal('')} onSubmit={createEntity} employees={employees} departments={departments} projects={projects}/>}
  </div>;
}

function Login({ onLogin, error, busy }) {
  const [email, setEmail] = useState('admin@devflow.local');
  const [password, setPassword] = useState('DevFlow123!');
  return <div className="login-screen"><div className="login-art"><div className="brand light"><span className="brand-mark">D</span><span>DevFlow</span></div><div className="art-copy"><span className="eyebrow">WORK SMARTER, TOGETHER</span><h1>Ekibinizin tüm iş akışı<br/>tek bir yerde.</h1><p>Projeleri yönetin, görevleri takip edin ve ekibinizle uyum içinde çalışın.</p><div className="art-shape"><div className="shape-card card-one">✓ &nbsp; Sprint planı tamamlandı</div><div className="shape-card card-two">↗ &nbsp; Proje ilerlemesi %78</div></div></div></div>
    <div className="login-form-wrap"><form className="login-form" onSubmit={e => { e.preventDefault(); onLogin(email, password); }}><span className="eyebrow blue">DEVFLOW WORKSPACE</span><h2>Tekrar hoş geldiniz</h2><p className="muted">Devam etmek için hesabınıza giriş yapın.</p><label>E-posta adresi</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} required/><label>Şifre</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} required/>{error && <div className="form-error">{error}</div>}<button className="primary full" disabled={busy}>{busy ? 'Giriş yapılıyor...' : 'Giriş yap'} <span>→</span></button><small className="login-hint">Demo yönetici: admin@devflow.local / DevFlow123!</small></form></div></div>;
}

function roleLabel(role) { return role === 'Admin' ? 'Yönetici' : role === 'DepartmentManager' ? 'Departman yöneticisi' : 'Çalışan'; }
function PageTitle({ title, desc, action, onAction }) { return <div className="page-title"><div><h1>{title}</h1><p>{desc}</p></div>{action && <button className="primary" onClick={onAction}><Plus size={17}/>{action}</button>}</div>; }

function Overview({ tasks, employees, projects, isManager, user, setPage }) {
  const done = tasks.filter(x => x.status === 'Done').length;
  const progress = tasks.length ? Math.round(done / tasks.length * 100) : 0;

  const statusData = useMemo(
    () => statuses.map(s => ({ id: s.id, name: s.label, value: tasks.filter(t => t.status === s.id).length })),
    [tasks]
  );

  const projectData = useMemo(() => {
    const rows = projects.map(p => ({
      name: p.name.length > 12 ? p.name.slice(0, 11) + '…' : p.name,
      Toplam: tasks.filter(t => t.projectId === p.id).length,
      Biten: tasks.filter(t => t.projectId === p.id && t.status === 'Done').length
    }));
    return rows.filter(r => r.Toplam > 0).slice(0, 6);
  }, [projects, tasks]);

  const upcomingData = useMemo(() => {
    const days = [];
    const start = new Date(); start.setHours(0, 0, 0, 0);
    for (let i = 0; i < 7; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i);
      const count = tasks.filter(t => {
        if (!t.dueDate || t.status === 'Done') return false;
        const due = new Date(t.dueDate);
        return due.getFullYear() === d.getFullYear() && due.getMonth() === d.getMonth() && due.getDate() === d.getDate();
      }).length;
      days.push({ gun: d.toLocaleDateString('tr-TR', { weekday: 'short' }), Teslim: count });
    }
    return days;
  }, [tasks]);

  const stats = isManager ? [
    ['Toplam çalışan', employees.length, 'Kayıtlı ekip üyesi', Users],
    ['Aktif projeler', projects.filter(x => x.status !== 'Completed').length, 'Devam eden çalışmalar', FolderKanban],
    ['Toplam görev', tasks.length, 'Tüm görevler', CheckSquare],
    ['Tamamlanma oranı', `%${progress}`, 'Görev tamamlama', Activity]
  ] : [
    ['Görevlerim', tasks.length, 'Bana atanan görev', CheckSquare],
    ['Devam eden', tasks.filter(x => x.status === 'InProgress').length, 'Üzerinde çalıştıklarım', Activity],
    ['Kontrolde', tasks.filter(x => x.status === 'Review').length, 'Onay bekleyenler', Bell],
    ['Tamamlanan', done, 'Bitirdiğim görevler', CheckSquare]
  ];
  return <><div className="welcome"><div><span className="eyebrow blue">GENEL BAKIŞ</span><h1>Merhaba, {user.firstName} 👋</h1><p>Bugün ekibinizde neler olup bittiğine göz atın.</p></div><div className="date-chip">{new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}</div></div>
    <div className="stats-grid">{stats.map(([label, value, hint, Icon]) => <div className="stat-card" key={label}><div className="stat-top"><span>{label}</span><span className="stat-icon"><Icon size={18}/></span></div><strong>{value}</strong><small>{hint}</small></div>)}</div>
    <div className="dashboard-grid"><div className="panel"><div className="panel-head"><div><h3>Son görevler</h3><p>Görev durumlarına genel bakış</p></div><button className="text-button" onClick={() => setPage('tasks')}>Tümünü gör →</button></div><TasksTable tasks={tasks.slice(0, 6)}/></div><div className="panel progress-panel"><div className="panel-head"><div><h3>Görev ilerlemesi</h3><p>Genel tamamlanma oranı</p></div></div><div className="progress-ring" style={{'--progress': `${progress * 3.6}deg`}}><div><strong>%{progress}</strong><small>Tamamlandı</small></div></div><div className="progress-legend"><span><i className="dot blue-dot"></i>Tamamlanan <b>{done}</b></span><span><i className="dot gray-dot"></i>Diğer <b>{tasks.length-done}</b></span></div></div></div>

    <div className="charts-grid">
      <div className="panel">
        <div className="panel-head"><div><h3>Durum dağılımı</h3><p>Görevlerin aşamalara göre payı</p></div></div>
        {tasks.length ? <>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="86%" paddingAngle={3} stroke="none">
                  {statusData.map(s => <Cell key={s.id} fill={statusColors[s.id]}/>)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-legend">{statusData.map(s => <span key={s.id}><i className="dot" style={{ background: statusColors[s.id] }}></i>{s.name}<b>{s.value}</b></span>)}</div>
        </> : <div className="empty">Henüz veri yok.</div>}
      </div>

      <div className="panel">
        <div className="panel-head"><div><h3>Projelere göre görevler</h3><p>Toplam ve biten görev sayısı</p></div></div>
        {projectData.length ? <div className="chart-box tall">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={projectData} barGap={4}>
              <defs>
                <linearGradient id="gBar1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7c5cff"/><stop offset="100%" stopColor="#4f6bff"/></linearGradient>
                <linearGradient id="gBar2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#12c2a4"/><stop offset="100%" stopColor="#23b8ff"/></linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="4 4"/>
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: 'var(--ink-3)', fontSize: 11 }}/>
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={26} tick={{ fill: 'var(--ink-3)', fontSize: 11 }}/>
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(124,92,255,.08)' }}/>
              <Bar dataKey="Toplam" fill="url(#gBar1)" radius={[8, 8, 0, 0]} maxBarSize={26}/>
              <Bar dataKey="Biten" fill="url(#gBar2)" radius={[8, 8, 0, 0]} maxBarSize={26}/>
            </BarChart>
          </ResponsiveContainer>
        </div> : <div className="empty">Projelere atanmış görev yok.</div>}
      </div>

      <div className="panel">
        <div className="panel-head"><div><h3>Yaklaşan teslimler</h3><p>Önümüzdeki 7 gün</p></div></div>
        <div className="chart-box tall">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={upcomingData}>
              <defs>
                <linearGradient id="gArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ff5c9d" stopOpacity={.5}/><stop offset="100%" stopColor="#7c5cff" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="4 4"/>
              <XAxis dataKey="gun" tickLine={false} axisLine={false} tick={{ fill: 'var(--ink-3)', fontSize: 11 }}/>
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={26} tick={{ fill: 'var(--ink-3)', fontSize: 11 }}/>
              <Tooltip contentStyle={tooltipStyle}/>
              <Area type="monotone" dataKey="Teslim" stroke="#ff5c9d" strokeWidth={3} fill="url(#gArea)" dot={{ r: 3, fill: '#ff5c9d', strokeWidth: 0 }} activeDot={{ r: 6 }}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  </>;
}

function Tasks({ tasks, isManager, onStatus, onAdd }) {
  const [dragId, setDragId] = useState(null);
  const [over, setOver] = useState(null);

  function drop(e, statusId) {
    e.preventDefault();
    const id = dragId ?? e.dataTransfer.getData('text/plain');
    const task = tasks.find(t => String(t.id) === String(id));
    setDragId(null); setOver(null);
    if (task && task.status !== statusId) onStatus(task.id, statusId);
  }

  return <><PageTitle title="Görevler" desc="Kartları sürükleyip bırakarak durumlarını değiştirin." action={isManager ? 'Yeni görev' : null} onAction={onAdd}/>
    <div className="kanban">{statuses.map(s => {
      const col = tasks.filter(t => t.status === s.id);
      return <div
        className={`kanban-col ${over === s.id ? 'drag-over' : ''}`}
        key={s.id}
        onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (over !== s.id) setOver(s.id); }}
        onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setOver(o => (o === s.id ? null : o)); }}
        onDrop={e => drop(e, s.id)}
      >
        <div className="kanban-head"><span className={`status-dot ${s.id.toLowerCase()}`}></span><b>{s.label}</b><span className="count">{col.length}</span></div>
        {col.map(t => <div
          className={`task-card ${String(dragId) === String(t.id) ? 'dragging' : ''}`}
          key={t.id}
          draggable
          onDragStart={e => { e.dataTransfer.setData('text/plain', String(t.id)); e.dataTransfer.effectAllowed = 'move'; setDragId(t.id); }}
          onDragEnd={() => { setDragId(null); setOver(null); }}
        >
          <div className="task-card-top"><span className={`priority ${String(t.priority).toLowerCase()}`}>{priorityLabel(t.priority)}</span><span className="task-id">#{t.id}</span></div>
          <h4>{t.title}</h4>
          <p>{t.description || 'Açıklama eklenmemiş.'}</p>
          <div className="task-card-foot"><span>◷ {t.dueDate ? new Date(t.dueDate).toLocaleDateString('tr-TR') : 'Tarih yok'}</span><select value={t.status} onChange={e => onStatus(t.id, e.target.value)} aria-label="Görev durumu">{statuses.map(x => <option value={x.id} key={x.id}>{x.label}</option>)}</select></div>
        </div>)}
        {!col.length && <div className="drop-hint">Kartı buraya bırakın</div>}
      </div>;
    })}</div></>;
}

function priorityLabel(p) { return ({Low:'Düşük',Normal:'Normal',High:'Yüksek',Urgent:'Acil'})[p] || p; }
function TasksTable({ tasks }) { return <div className="table-wrap"><table><thead><tr><th>Görev</th><th>Öncelik</th><th>Durum</th><th>Son tarih</th></tr></thead><tbody>{tasks.map(t => <tr key={t.id}><td><b>{t.title}</b></td><td><span className={`priority ${String(t.priority).toLowerCase()}`}>{priorityLabel(t.priority)}</span></td><td><span className={`status-pill ${t.status.toLowerCase()}`}>{statuses.find(s=>s.id===t.status)?.label || t.status}</span></td><td>{t.dueDate ? new Date(t.dueDate).toLocaleDateString('tr-TR') : '—'}</td></tr>)}</tbody></table>{!tasks.length && <div className="empty">Henüz görev bulunmuyor.</div>}</div>; }

function Projects({ projects, tasks, canCreate, onAdd }) {
  return <><PageTitle title="Projeler" desc="Şirket projelerini ve çalışma durumlarını takip edin." action={canCreate ? 'Yeni proje' : null} onAction={onAdd}/>
    <div className="cards-grid">{projects.map(p => {
      const list = tasks.filter(t => t.projectId === p.id);
      const done = list.filter(t => t.status === 'Done').length;
      const pct = list.length ? Math.round(done / list.length * 100) : 0;
      return <div className="panel project-card" key={p.id}>
        <div className="project-icon"><FolderKanban/></div>
        <span className="status-pill">{p.status}</span>
        <h3>{p.name}</h3>
        <p>{p.description || 'Proje açıklaması bulunmuyor.'}</p>
        <div className="project-progress">
          <div className="project-progress-top"><span>İlerleme</span><b>%{pct}</b></div>
          <div className="bar"><div className="bar-fill" style={{ width: `${pct}%` }}></div></div>
          <small>{done} / {list.length} görev tamamlandı</small>
        </div>
        <div className="project-meta"><span>Başlangıç</span><b>{new Date(p.startDate).toLocaleDateString('tr-TR')}</b></div>
      </div>;
    })}</div>{!projects.length && <div className="panel empty">Henüz proje oluşturulmamış.</div>}</>;
}

function Employees({ employees, departments, onAdd }) { return <><PageTitle title="Çalışanlar" desc="Şirket ekibini ve çalışan bilgilerini yönetin." action="Çalışan ekle" onAction={onAdd}/><div className="panel"><div className="table-wrap"><table><thead><tr><th>Çalışan</th><th>E-posta</th><th>Pozisyon</th><th>Departman</th></tr></thead><tbody>{employees.map(e=><tr key={e.id}><td><b>{e.firstName} {e.lastName}</b></td><td>{e.email}</td><td>{e.position}</td><td>{departments.find(d=>d.id===e.departmentId)?.name || 'Atanmamış'}</td></tr>)}</tbody></table></div></div></>; }
function Departments({ departments, onAdd }) { return <><PageTitle title="Departmanlar" desc="Organizasyon yapınızı düzenleyin." action="Departman ekle" onAction={onAdd}/><div className="cards-grid">{departments.map(d=><div className="panel department-card" key={d.id}><div className="department-icon"><Building2/></div><h3>{d.name}</h3><p>{d.description || 'Departman açıklaması bulunmuyor.'}</p></div>)}</div>{!departments.length && <div className="panel empty">Henüz departman bulunmuyor.</div>}</>; }
function ActivityList({ activities }) { return <><PageTitle title="Aktivite geçmişi" desc="Sistemde gerçekleşen son işlemler."/><div className="panel activity-list">{activities.map(a=><div className="activity-row" key={a.id}><span className="activity-bullet"><Activity size={16}/></span><div><b>{a.details}</b><small>{a.action} · {new Date(a.createdAt).toLocaleString('tr-TR')}</small></div></div>)}</div></>; }

function Modal({ type, onClose, onSubmit, employees, departments, projects }) {
  const [form, setForm] = useState({});
  const set = (k,v) => setForm(old => ({...old,[k]:v}));
  const config = {
    task: { title:'Yeni görev', path:'/tasks', fields:[['title','Görev başlığı','text'],['description','Açıklama','textarea'],['projectId','Proje','project'],['assigneeId','Atanacak çalışan','employee'],['priority','Öncelik','priority'],['dueDate','Son teslim tarihi','date']] },
    project: { title:'Yeni proje', path:'/projects', fields:[['name','Proje adı','text'],['description','Açıklama','textarea'],['endDate','Bitiş tarihi','date'],['departmentId','Departman','department']] },
    department: { title:'Yeni departman', path:'/departments', fields:[['name','Departman adı','text'],['description','Açıklama','textarea']] },
    employee: { title:'Yeni çalışan', path:'/employees', fields:[['firstName','Ad','text'],['lastName','Soyad','text'],['email','E-posta','email'],['position','Pozisyon','text'],['departmentId','Departman','department'],['role','Rol','role'],['password','İlk şifre','password']] }
  }[type];
  function submit(e) {
    e.preventDefault();
    const body = {...form};
    ['projectId','departmentId'].forEach(k => { if (body[k] === '') body[k] = null; else if (body[k]) body[k] = Number(body[k]); });
    if (type === 'task' && !body.priority) body.priority = 'Normal';
    if (type === 'employee' && !body.role) body.role = 'Employee';
    onSubmit(config.path, body);
  }
  return <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><form className="modal" onSubmit={submit}><div className="modal-head"><h2>{config.title}</h2><button type="button" className="icon-button" onClick={onClose}>×</button></div>{config.fields.map(([key,label,kind])=><label className="field" key={key}>{label}{kind==='textarea'?<textarea value={form[key]||''} onChange={e=>set(key,e.target.value)}/>:kind==='department'||kind==='employee'||kind==='project'||kind==='role'||kind==='priority'?<select required={key==='assigneeId'} value={form[key]||''} onChange={e=>set(key,e.target.value)}><option value="">Seçiniz</option>{(kind==='department'?departments:kind==='employee'?employees:kind==='project'?projects:kind==='role'?[{id:'Employee',name:'Çalışan'},{id:'DepartmentManager',name:'Departman yöneticisi'}]:[{id:'Low',name:'Düşük'},{id:'Normal',name:'Normal'},{id:'High',name:'Yüksek'},{id:'Urgent',name:'Acil'}]).map(x=><option key={x.id} value={x.id}>{kind==='employee'?`${x.firstName} ${x.lastName}`:x.name}</option>)}</select>:<input type={kind} value={form[key]||''} onChange={e=>set(key,e.target.value)} required={['title','name','firstName','lastName','email','password'].includes(key)}/>}</label>)}<div className="modal-actions"><button type="button" className="secondary" onClick={onClose}>Vazgeç</button><button className="primary">Kaydet</button></div></form></div>;
}
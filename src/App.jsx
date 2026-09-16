import React, { useState, useEffect, useMemo } from "react";
import {
  Home as HomeIcon,
  ListTodo,
  Calendar as CalendarIcon,
  BookOpen,
  StickyNote,
  Files as FilesIcon,
  Languages,
  BarChart3,
  Plus,
  Trash2,
  Check,
  Download,
  Clock,
  ChevronLeft,
  ChevronRight,
  Sprout,
  X,
  Play,
  Link2,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

// Simple localStorage-based storage shim (data stays on this browser/device)
const storage = {
  async get(key) {
    const v = localStorage.getItem(key);
    return v !== null ? { key, value: v } : null;
  },
  async set(key, value) {
    localStorage.setItem(key, value);
    return { key, value };
  },
};


const PRIORITIES = ["High", "Medium", "Low"];

const PRIORITY_STYLE = {
  High: { bg: "#FDE2DE", text: "#C6503F", dot: "#FD6A5F" },
  Medium: { bg: "#FFF3D6", text: "#B8860B", dot: "#FFD97D" },
  Low: { bg: "#E1F3E6", text: "#4C9367", dot: "#B7E4C7" },
};

const QUOTES = [
  "Progress looks different for everyone, but it always means you're moving forward.",
  "Small steps, done daily, add up to big results.",
  "You don't have to be perfect. You just have to keep going.",
  "Discipline today, freedom tomorrow.",
];

function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}
function fmtDateLong(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
}
function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
function minutesToLabel(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

const TASKS_KEY = "bloom_tasks_v2";
const COURSES_KEY = "bloom_courses_v1";
const NOTES_KEY = "bloom_notes_v1";
const FILES_KEY = "bloom_files_v1";
const VOCAB_KEY = "bloom_vocab_v1";

const DEFAULT_COURSES = [
  { id: uid(), name: "Machine Learning", progress: 68, color: "#A7C7E7" },
  { id: uid(), name: "Deep Learning", progress: 32, color: "#FFB6C1" },
  { id: uid(), name: "Mathematics", progress: 45, color: "#FFD97D" },
  { id: uid(), name: "NLP", progress: 20, color: "#B7E4C7" },
];

export default function Bloom() {
  const [tasks, setTasks] = useState(null);
  const [courses, setCourses] = useState(null);
  const [notes, setNotes] = useState(null);
  const [files, setFiles] = useState(null);
  const [vocab, setVocab] = useState(null);
  const [view, setView] = useState("home");
  const [showAdd, setShowAdd] = useState(false);
  const [calMonth, setCalMonth] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const [selectedDay, setSelectedDay] = useState(todayISO());
  const [taskFilter, setTaskFilter] = useState("today");
  const [saveError, setSaveError] = useState(false);
  const quote = useMemo(() => QUOTES[Math.floor(Math.random() * QUOTES.length)], []);

  useEffect(() => {
    (async () => {
      try {
        const res = await storage.get(TASKS_KEY, false);
        setTasks(res ? JSON.parse(res.value) : []);
      } catch (e) { setTasks([]); }
      try {
        const res = await storage.get(COURSES_KEY, false);
        setCourses(res ? JSON.parse(res.value) : DEFAULT_COURSES);
      } catch (e) { setCourses(DEFAULT_COURSES); }
      try {
        const res = await storage.get(NOTES_KEY, false);
        setNotes(res ? JSON.parse(res.value) : []);
      } catch (e) { setNotes([]); }
      try {
        const res = await storage.get(FILES_KEY, false);
        setFiles(res ? JSON.parse(res.value) : []);
      } catch (e) { setFiles([]); }
      try {
        const res = await storage.get(VOCAB_KEY, false);
        setVocab(res ? JSON.parse(res.value) : []);
      } catch (e) { setVocab([]); }
    })();
  }, []);

  async function persist(key, setter, next) {
    setter(next);
    try {
      const res = await storage.set(key, JSON.stringify(next), false);
      setSaveError(!res);
    } catch (e) { setSaveError(true); }
  }

  function addTask(t) {
    const next = [
      ...tasks,
      {
        id: uid(), title: t.title, priority: t.priority, date: t.date,
        startTime: t.startTime, duration: Number(t.duration) || 30,
        status: "todo", startedAt: null, completedAt: null, createdAt: new Date().toISOString(),
      },
    ];
    persist(TASKS_KEY, setTasks, next);
  }

  function startTask(id) {
    const next = tasks.map((t) => t.id === id ? { ...t, status: "in_progress", startedAt: new Date().toISOString() } : t);
    persist(TASKS_KEY, setTasks, next);
  }

  function completeTask(id) {
    const next = tasks.map((t) => {
      if (t.id !== id) return t;
      const startedAt = t.startedAt || new Date().toISOString();
      return { ...t, status: "done", startedAt, completedAt: new Date().toISOString() };
    });
    persist(TASKS_KEY, setTasks, next);
  }

  function reopenTask(id) {
    const next = tasks.map((t) => t.id === id ? { ...t, status: "todo", startedAt: null, completedAt: null } : t);
    persist(TASKS_KEY, setTasks, next);
  }

  function deleteTask(id) {
    persist(TASKS_KEY, setTasks, tasks.filter((t) => t.id !== id));
  }

  function updateCourseProgress(id, progress) {
    persist(COURSES_KEY, setCourses, courses.map((c) => c.id === id ? { ...c, progress } : c));
  }
  function addCourse(name) {
    const palette = ["#A7C7E7", "#FFB6C1", "#FFD97D", "#B7E4C7", "#E1C6F5"];
    persist(COURSES_KEY, setCourses, [...courses, { id: uid(), name, progress: 0, color: palette[courses.length % palette.length] }]);
  }
  function deleteCourse(id) {
    persist(COURSES_KEY, setCourses, courses.filter((c) => c.id !== id));
  }

  function addNote(text) {
    persist(NOTES_KEY, setNotes, [{ id: uid(), text, createdAt: new Date().toISOString() }, ...notes]);
  }
  function deleteNote(id) {
    persist(NOTES_KEY, setNotes, notes.filter((n) => n.id !== id));
  }

  function addFileRef(name, link) {
    persist(FILES_KEY, setFiles, [{ id: uid(), name, link, createdAt: new Date().toISOString() }, ...files]);
  }
  function deleteFileRef(id) {
    persist(FILES_KEY, setFiles, files.filter((f) => f.id !== id));
  }

  function addVocab(word, meaning) {
    persist(VOCAB_KEY, setVocab, [{ id: uid(), word, meaning, learned: false }, ...vocab]);
  }
  function toggleVocab(id) {
    persist(VOCAB_KEY, setVocab, vocab.map((v) => v.id === id ? { ...v, learned: !v.learned } : v));
  }
  function deleteVocab(id) {
    persist(VOCAB_KEY, setVocab, vocab.filter((v) => v.id !== id));
  }

  function exportData() {
    const payload = { tasks, courses, notes, files, vocab, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bloom-data-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const loading = tasks === null || courses === null || notes === null || files === null || vocab === null;
  if (loading) {
    return (
      <div style={{ fontFamily: "Inter, sans-serif", height: "100%", minHeight: 500, display: "flex", alignItems: "center", justifyContent: "center", background: "#FDF6F0", color: "#9C9188" }}>
        Loading your garden…
      </div>
    );
  }

  const todayList = tasks.filter((t) => t.date === todayISO()).sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));
  const completedToday = todayList.filter((t) => t.status === "done").length;
  const remainingToday = todayList.length - completedToday;
  const pct = todayList.length ? Math.round((completedToday / todayList.length) * 100) : 0;

  const NAV = [
    { key: "home", label: "Home", icon: HomeIcon },
    { key: "tasks", label: "Tasks", icon: ListTodo },
    { key: "calendar", label: "Calendar", icon: CalendarIcon },
    { key: "courses", label: "Courses", icon: BookOpen },
    { key: "notes", label: "Notes", icon: StickyNote },
    { key: "files", label: "Files", icon: FilesIcon },
    { key: "vocabulary", label: "Vocabulary", icon: Languages },
    { key: "insights", label: "Insights", icon: BarChart3 },
  ];

  return (
    <div style={{ fontFamily: "Inter, sans-serif", background: "#FDF6F0", color: "#4A4036", minHeight: 640, display: "flex", borderRadius: 16, overflow: "hidden", border: "1px solid #F0E5DA" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        .bloom-heading { font-family: 'Poppins', sans-serif; }
        .bloom-nav-item:hover { background: #FBEFE6 !important; }
        .bloom-card { box-shadow: 0 2px 10px rgba(180,150,120,0.08); }
        .bloom-scroll::-webkit-scrollbar { width: 6px; }
        .bloom-scroll::-webkit-scrollbar-thumb { background: #EAD9C8; border-radius: 3px; }
        input, select, textarea { font-family: 'Inter', sans-serif; }
      `}</style>

      <aside style={{ width: 210, background: "#FFFDFB", borderRight: "1px solid #F0E5DA", padding: "24px 16px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 8px 20px" }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg,#FFB6C1,#FFD97D)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Sprout size={18} color="#fff" />
          </div>
          <div>
            <div className="bloom-heading" style={{ fontSize: 15, fontWeight: 600 }}>Olivia</div>
            <div style={{ fontSize: 11, color: "#B0A296" }}>your space to grow</div>
          </div>
        </div>

        <div className="bloom-scroll" style={{ overflowY: "auto" }}>
          {NAV.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setView(key)} className="bloom-nav-item"
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, border: "none",
                background: view === key ? "#FFE3DF" : "transparent", color: view === key ? "#C6503F" : "#7A6E62",
                fontWeight: view === key ? 600 : 500, fontSize: 13.5, cursor: "pointer", textAlign: "left", marginBottom: 2 }}>
              <Icon size={16} />{label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        <button onClick={exportData} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 10, border: "1px dashed #E3D5C6", background: "transparent", color: "#9C8B7A", fontSize: 12.5, cursor: "pointer" }}>
          <Download size={14} /> Export my data
        </button>
        {saveError && <div style={{ fontSize: 10.5, color: "#C6503F", marginTop: 6, padding: "0 4px" }}>Couldn't save last change — try again.</div>}
      </aside>

      <main className="bloom-scroll" style={{ flex: 1, padding: 28, overflowY: "auto", maxHeight: 760 }}>
        {view === "home" && (
          <HomeView quote={quote} todayList={todayList} completedToday={completedToday} remainingToday={remainingToday} pct={pct}
            onStart={startTask} onComplete={completeTask} onReopen={reopenTask} onAddClick={() => setShowAdd(true)} onGoTasks={() => setView("tasks")} />
        )}
        {view === "tasks" && (
          <TasksView tasks={tasks} filter={taskFilter} setFilter={setTaskFilter} onStart={startTask} onComplete={completeTask}
            onReopen={reopenTask} onDelete={deleteTask} onAddClick={() => setShowAdd(true)} />
        )}
        {view === "calendar" && (
          <CalendarView tasks={tasks} calMonth={calMonth} setCalMonth={setCalMonth} selectedDay={selectedDay} setSelectedDay={setSelectedDay}
            onStart={startTask} onComplete={completeTask} onReopen={reopenTask} onDelete={deleteTask} onAddClick={() => setShowAdd(true)} />
        )}
        {view === "courses" && <CoursesView courses={courses} onUpdate={updateCourseProgress} onAdd={addCourse} onDelete={deleteCourse} />}
        {view === "notes" && <NotesView notes={notes} onAdd={addNote} onDelete={deleteNote} />}
        {view === "files" && <FilesView files={files} onAdd={addFileRef} onDelete={deleteFileRef} />}
        {view === "vocabulary" && <VocabView vocab={vocab} onAdd={addVocab} onToggle={toggleVocab} onDelete={deleteVocab} />}
        {view === "insights" && <InsightsView tasks={tasks} />}
      </main>

      {showAdd && (
        <AddTaskModal defaultDate={view === "calendar" ? selectedDay : todayISO()} onClose={() => setShowAdd(false)}
          onSave={(t) => { addTask(t); setShowAdd(false); }} />
      )}
    </div>
  );
}

function StatCard({ label, value, bg, color }) {
  return (
    <div className="bloom-card" style={{ background: bg, borderRadius: 14, padding: "14px 16px", flex: 1, minWidth: 100 }}>
      <div className="bloom-heading" style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 12, color, opacity: 0.75, marginTop: 2 }}>{label}</div>
    </div>
  );
}

function StatusControl({ task, onStart, onComplete, onReopen }) {
  if (task.status === "done") {
    return (
      <button onClick={() => onReopen(task.id)} style={{ width: 22, height: 22, borderRadius: 6, border: "none", background: "#B7E4C7", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }} title="Completed — click to reopen">
        <Check size={13} color="#fff" />
      </button>
    );
  }
  if (task.status === "in_progress") {
    return (
      <button onClick={() => onComplete(task.id)} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10.5, fontWeight: 600, padding: "4px 8px", borderRadius: 8, border: "none", background: "#FFD97D", color: "#8A6B00", cursor: "pointer", flexShrink: 0 }}>
        <Check size={11} /> Done
      </button>
    );
  }
  return (
    <button onClick={() => onStart(task.id)} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10.5, fontWeight: 600, padding: "4px 8px", borderRadius: 8, border: "1px solid #D9CBBC", background: "#fff", color: "#7A6E62", cursor: "pointer", flexShrink: 0 }}>
    <Play size={11} /> Start
    </button>
  );
}

function TaskRow({ task, onStart, onComplete, onReopen, onDelete }) {
  const s = PRIORITY_STYLE[task.priority] || PRIORITY_STYLE.Medium;
  const done = task.status === "done";
  const inProgress = task.status === "in_progress";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 4px", borderBottom: "1px solid #F3E9DE" }}>
      <StatusControl task={task} onStart={onStart} onComplete={onComplete} onReopen={onReopen} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 500, textDecoration: done ? "line-through" : "none", color: done ? "#B0A296" : "#4A4036" }}>
          {task.title}{inProgress && <span style={{ fontSize: 10, color: "#B8860B", marginLeft: 6 }}>in progress</span>}
        </div>
        <div style={{ fontSize: 11, color: "#B0A296", display: "flex", gap: 8, marginTop: 2, flexWrap: "wrap" }}>
          {task.startTime && <span>{task.startTime}</span>}
          <span>{minutesToLabel(task.duration)} planned</span>
          <span>{task.date}</span>
        </div>
      </div>
      <span style={{ fontSize: 10.5, fontWeight: 600, background: s.bg, color: s.text, padding: "3px 9px", borderRadius: 20, flexShrink: 0 }}>{task.priority}</span>
      {onDelete && (
        <button onClick={() => onDelete(task.id)} style={{ border: "none", background: "transparent", cursor: "pointer", color: "#D9CBBC" }}>
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}

function HomeView({ quote, todayList, completedToday, remainingToday, pct, onStart, onComplete, onReopen, onAddClick, onGoTasks }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
        <div>
          <h1 className="bloom-heading" style={{ fontSize: 22, margin: 0 }}>Welcome back, Olivia ✨</h1>
          <p style={{ fontSize: 13, color: "#9C8B7A", margin: "4px 0 0" }}>Your goals, your pace, your journey.</p>
        </div>
        <button onClick={onAddClick} style={{ display: "flex", alignItems: "center", gap: 6, background: "#4A4036", color: "#fff", border: "none", borderRadius: 10, padding: "9px 14px", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
          <Plus size={15} /> Add Task
        </button>
      </div>

      <div className="bloom-card" style={{ background: "linear-gradient(135deg,#FFE3DF,#FFF3D6)", borderRadius: 16, padding: "18px 22px", marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontStyle: "italic", color: "#7A6E62", maxWidth: 420 }}>"{quote}"</div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 22, flexWrap: "wrap" }}>
        <StatCard label="Today's Tasks" value={todayList.length} bg="#FDE2DE" color="#C6503F" />
        <StatCard label="Completed" value={completedToday} bg="#E1F3E6" color="#4C9367" />
        <StatCard label="Remaining" value={remainingToday} bg="#FFF3D6" color="#B8860B" />
        <StatCard label="Progress" value={`${pct}%`} bg="#EAE3F5" color="#8A6FC2" />
      </div>

      <div className="bloom-card" style={{ background: "#fff", borderRadius: 16, padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div className="bloom-heading" style={{ fontSize: 14.5, fontWeight: 600 }}>Today's Schedule</div>
          <button onClick={onGoTasks} style={{ border: "none", background: "transparent", color: "#C6503F", fontSize: 12, cursor: "pointer" }}>View all →</button>
        </div>
        {todayList.length === 0 ? (
          <div style={{ fontSize: 12.5, color: "#B0A296", padding: "10px 4px" }}>Nothing planned yet today — add a task to get started.</div>
        ) : (
          todayList.slice(0, 6).map((t) => <TaskRow key={t.id} task={t} onStart={onStart} onComplete={onComplete} onReopen={onReopen} />)
        )}
      </div>
    </div>
  );
}

function TasksView({ tasks, filter, setFilter, onStart, onComplete, onReopen, onDelete, onAddClick }) {
  const today = todayISO();
  const now = new Date();
  const weekEnd = new Date(now);
  weekEnd.setDate(now.getDate() + 7);

  const filtered = tasks.filter((t) => {
    if (filter === "today") return t.date === today;
    if (filter === "week") return new Date(t.date) >= new Date(today) && new Date(t.date) <= weekEnd;
    return true;
  }).sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h1 className="bloom-heading" style={{ fontSize: 20, margin: 0 }}>Tasks</h1>
        <button onClick={onAddClick} style={{ display: "flex", alignItems: "center", gap: 6, background: "#4A4036", color: "#fff", border: "none", borderRadius: 10, padding: "9px 14px", fontSize: 13, cursor: "pointer" }}>
          <Plus size={15} /> Add Task
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[["today", "Today"], ["week", "This Week"], ["all", "All"]].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} style={{ border: "none", borderRadius: 20, padding: "6px 14px", fontSize: 12.5, cursor: "pointer", background: filter === k ? "#4A4036" : "#F3E9DE", color: filter === k ? "#fff" : "#7A6E62" }}>{l}</button>
        ))}
      </div>

      <div className="bloom-card" style={{ background: "#fff", borderRadius: 16, padding: 18 }}>
        {filtered.length === 0 ? (
          <div style={{ fontSize: 12.5, color: "#B0A296", padding: "16px 4px" }}>No tasks here yet.</div>
        ) : (
          filtered.map((t) => <TaskRow key={t.id} task={t} onStart={onStart} onComplete={onComplete} onReopen={onReopen} onDelete={onDelete} />)
        )}
      </div>
    </div>
  );
}

function CalendarView({ tasks, calMonth, setCalMonth, selectedDay, setSelectedDay, onStart, onComplete, onReopen, onDelete, onAddClick }) {
  const { y, m } = calMonth;
  const first = new Date(y, m, 1);
  const startOffset = first.getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const monthLabel = first.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const countsByDay = useMemo(() => {
    const map = {};
    tasks.forEach((t) => { map[t.date] = (map[t.date] || 0) + 1; });
    return map;
  }, [tasks]);

  const dayTasks = tasks.filter((t) => t.date === selectedDay).sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h1 className="bloom-heading" style={{ fontSize: 20, margin: 0 }}>Calendar</h1>
        <button onClick={onAddClick} style={{ display: "flex", alignItems: "center", gap: 6, background: "#4A4036", color: "#fff", border: "none", borderRadius: 10, padding: "9px 14px", fontSize: 13, cursor: "pointer" }}>
          <Plus size={15} /> Add Task
        </button>
      </div>

      <div style={{ display: "flex", gap: 18, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div className="bloom-card" style={{ background: "#fff", borderRadius: 16, padding: 18, flex: "1 1 320px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <button onClick={() => setCalMonth((c) => (c.m === 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m: c.m - 1 }))} style={{ border: "none", background: "#F3E9DE", borderRadius: 8, padding: 6, cursor: "pointer" }}><ChevronLeft size={15} /></button>
            <div className="bloom-heading" style={{ fontWeight: 600, fontSize: 14 }}>{monthLabel}</div>
            <button onClick={() => setCalMonth((c) => (c.m === 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m: c.m + 1 }))} style={{ border: "none", background: "#F3E9DE", borderRadius: 8, padding: 6, cursor: "pointer" }}><ChevronRight size={15} /></button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, fontSize: 10.5, color: "#B0A296", marginBottom: 4 }}>
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <div key={i} style={{ textAlign: "center" }}>{d}</div>)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
            {cells.map((d, i) => {
              if (d === null) return <div key={i} />;
              const iso = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
              const isSel = iso === selectedDay;
              const isToday = iso === todayISO();
              const count = countsByDay[iso] || 0;
              return (
                <button key={i} onClick={() => setSelectedDay(iso)} style={{ aspectRatio: "1", border: isToday ? "1.5px solid #FD6A5F" : "none", borderRadius: 10, background: isSel ? "#FFE3DF" : "transparent", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontSize: 12, color: isSel ? "#C6503F" : "#4A4036", fontWeight: isSel ? 600 : 400 }}>
                  {d}
                  {count > 0 && <span style={{ width: 4, height: 4, borderRadius: 4, background: "#FFD97D", marginTop: 2 }} />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="bloom-card" style={{ background: "#fff", borderRadius: 16, padding: 18, flex: "1 1 280px" }}>
          <div className="bloom-heading" style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>{fmtDateLong(selectedDay)}</div>
          {dayTasks.length === 0 ? (
            <div style={{ fontSize: 12.5, color: "#B0A296" }}>No tasks on this day.</div>
          ) : (
            dayTasks.map((t) => <TaskRow key={t.id} task={t} onStart={onStart} onComplete={onComplete} onReopen={onReopen} onDelete={onDelete} />)
          )}
        </div>
      </div>
    </div>
  );
}

function CoursesView({ courses, onUpdate, onAdd, onDelete }) {
  const [name, setName] = useState("");
  return (
    <div>
      <h1 className="bloom-heading" style={{ fontSize: 20, margin: "0 0 18px" }}>Courses</h1>
      <div className="bloom-card" style={{ background: "#fff", borderRadius: 16, padding: 18, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Add a course, e.g. Data Engineering"
            style={{ flex: 1, padding: "8px 10px", borderRadius: 10, border: "1px solid #EAD9C8", fontSize: 13 }} />
          <button onClick={() => { if (name.trim()) { onAdd(name.trim()); setName(""); } }}
            style={{ background: "#4A4036", color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 13, cursor: "pointer" }}>Add</button>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))", gap: 14 }}>
        {courses.map((c) => (
          <div key={c.id} className="bloom-card" style={{ background: "#fff", borderRadius: 16, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>{c.name}</div>
              <button onClick={() => onDelete(c.id)} style={{ border: "none", background: "transparent", cursor: "pointer", color: "#D9CBBC" }}><Trash2 size={13} /></button>
            </div>
            <div style={{ height: 8, borderRadius: 8, background: "#F3E9DE", overflow: "hidden", marginBottom: 8 }}>
              <div style={{ height: "100%", width: `${c.progress}%`, background: c.color }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11.5, color: "#9C8B7A" }}>{c.progress}% complete</span>
              <input type="range" min={0} max={100} value={c.progress} onChange={(e) => onUpdate(c.id, Number(e.target.value))} style={{ width: 90 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NotesView({ notes, onAdd, onDelete }) {
  const [text, setText] = useState("");
  return (
    <div>
      <h1 className="bloom-heading" style={{ fontSize: 20, margin: "0 0 18px" }}>Notes</h1>
      <div className="bloom-card" style={{ background: "#fff", borderRadius: 16, padding: 18, marginBottom: 16 }}>
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Jot something down…" rows={3}
          style={{ width: "100%", padding: "8px 10px", borderRadius: 10, border: "1px solid #EAD9C8", fontSize: 13, boxSizing: "border-box", resize: "vertical" }} />
        <button onClick={() => { if (text.trim()) { onAdd(text.trim()); setText(""); } }}
          style={{ marginTop: 8, background: "#4A4036", color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 13, cursor: "pointer" }}>Save Note</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))", gap: 14 }}>
        {notes.map((n) => (
          <div key={n.id} className="bloom-card" style={{ background: "#FFF9EE", borderRadius: 16, padding: 16 }}>
            <div style={{ fontSize: 13, whiteSpace: "pre-wrap", marginBottom: 10 }}>{n.text}</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 10.5, color: "#B0A296" }}>{new Date(n.createdAt).toLocaleDateString()}</span>
              <button onClick={() => onDelete(n.id)} style={{ border: "none", background: "transparent", cursor: "pointer", color: "#D9CBBC" }}><Trash2 size={13} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FilesView({ files, onAdd, onDelete }) {
  const [name, setName] = useState("");
  const [link, setLink] = useState("");
  return (
    <div>
      <h1 className="bloom-heading" style={{ fontSize: 20, margin: "0 0 6px" }}>Files</h1>
      <p style={{ fontSize: 12, color: "#9C8B7A", margin: "0 0 16px" }}>Keep links to your files (Drive, GitHub, notes app) organized here.</p>
      <div className="bloom-card" style={{ background: "#fff", borderRadius: 16, padding: 18, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="File name" style={{ flex: "1 1 140px", padding: "8px 10px", borderRadius: 10, border: "1px solid #EAD9C8", fontSize: 13 }} />
          <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Link (optional)" style={{ flex: "1 1 160px", padding: "8px 10px", borderRadius: 10, border: "1px solid #EAD9C8", fontSize: 13 }} />
          <button onClick={() => { if (name.trim()) { onAdd(name.trim(), link.trim()); setName(""); setLink(""); } }}
            style={{ background: "#4A4036", color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 13, cursor: "pointer" }}>Add</button>
        </div>
      </div>
      <div className="bloom-card" style={{ background: "#fff", borderRadius: 16, padding: 18 }}>
        {files.length === 0 ? <div style={{ fontSize: 12.5, color: "#B0A296" }}>No files yet.</div> : files.map((f) => (
          <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 4px", borderBottom: "1px solid #F3E9DE" }}>
            <FilesIcon size={15} color="#A7C7E7" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13 }}>{f.name}</div>
              {f.link && <a href={f.link} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "#8A6FC2", display: "flex", alignItems: "center", gap: 3 }}><Link2 size={10} />{f.link}</a>}
            </div>
            <button onClick={() => onDelete(f.id)} style={{ border: "none", background: "transparent", cursor: "pointer", color: "#D9CBBC" }}><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function VocabView({ vocab, onAdd, onToggle, onDelete }) {
  const [word, setWord] = useState("");
  const [meaning, setMeaning] = useState("");
  return (
    <div>
      <h1 className="bloom-heading" style={{ fontSize: 20, margin: "0 0 18px" }}>Vocabulary</h1>
      <div className="bloom-card" style={{ background: "#fff", borderRadius: 16, padding: 18, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input value={word} onChange={(e) => setWord(e.target.value)} placeholder="Word" style={{ flex: "1 1 120px", padding: "8px 10px", borderRadius: 10, border: "1px solid #EAD9C8", fontSize: 13 }} />
          <input value={meaning} onChange={(e) => setMeaning(e.target.value)} placeholder="Meaning" style={{ flex: "1 1 160px", padding: "8px 10px", borderRadius: 10, border: "1px solid #EAD9C8", fontSize: 13 }} />
          <button onClick={() => { if (word.trim()) { onAdd(word.trim(), meaning.trim()); setWord(""); setMeaning(""); } }}
            style={{ background: "#4A4036", color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 13, cursor: "pointer" }}>Add</button>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))", gap: 12 }}>
        {vocab.map((v) => (
          <div key={v.id} className="bloom-card" onClick={() => onToggle(v.id)}
            style={{ background: v.learned ? "#E1F3E6" : "#fff", borderRadius: 14, padding: 14, cursor: "pointer" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>{v.word}</div>
              <button onClick={(e) => { e.stopPropagation(); onDelete(v.id); }} style={{ border: "none", background: "transparent", cursor: "pointer", color: "#D9CBBC" }}><Trash2 size={12} /></button>
            </div>
            {v.meaning && <div style={{ fontSize: 12, color: "#7A6E62", marginTop: 4 }}>{v.meaning}</div>}
            <div style={{ fontSize: 10.5, color: v.learned ? "#4C9367" : "#B0A296", marginTop: 8 }}>{v.learned ? "Learned ✓" : "Tap to mark learned"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InsightsView({ tasks }) {
  const done = tasks.filter((t) => t.status === "done");

  const last7 = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString(undefined, { weekday: "short" });
      const count = done.filter((t) => t.completedAt && t.completedAt.slice(0, 10) === iso).length;
      days.push({ label, count });
    }
    return days;
  }, [done]);

  const byPriority = PRIORITIES.map((p) => ({ name: p, value: tasks.filter((t) => t.priority === p).length }));
  const priorityColors = { High: "#FD6A5F", Medium: "#FFD97D", Low: "#B7E4C7" };

  const withDurations = done.filter((t) => t.startedAt && t.completedAt);
  const avgActualMin = withDurations.length
    ? Math.round(withDurations.reduce((sum, t) => sum + (new Date(t.completedAt) - new Date(t.startedAt)) / 60000, 0) / withDurations.length)
    : null;
  const avgPlannedMin = withDurations.length
    ? Math.round(withDurations.reduce((sum, t) => sum + t.duration, 0) / withDurations.length)
    : null;

  return (
    <div>
      <h1 className="bloom-heading" style={{ fontSize: 20, margin: "0 0 6px" }}>Insights</h1>
      <p style={{ fontSize: 12, color: "#9C8B7A", margin: "0 0 18px" }}>What your data looks like so far — this is what your ML model will eventually learn from.</p>

      <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <StatCard label="Tasks logged" value={tasks.length} bg="#FDE2DE" color="#C6503F" />
        <StatCard label="Completed" value={done.length} bg="#E1F3E6" color="#4C9367" />
        <StatCard label="Avg planned time" value={avgPlannedMin ? `${avgPlannedMin}m` : "—"} bg="#FFF3D6" color="#B8860B" />
        <StatCard label="Avg actual time" value={avgActualMin ? `${avgActualMin}m` : "—"} bg="#EAE3F5" color="#8A6FC2" />
      </div>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <div className="bloom-card" style={{ background: "#fff", borderRadius: 16, padding: 18, flex: "2 1 320px", height: 260 }}>
          <div className="bloom-heading" style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Completed tasks, last 7 days</div>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={last7}>
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9C8B7A" }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#9C8B7A" }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#FFB6C1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bloom-card" style={{ background: "#fff", borderRadius: 16, padding: 18, flex: "1 1 220px", height: 260 }}>
          <div className="bloom-heading" style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>By priority</div>
          <ResponsiveContainer width="100%" height="85%">
            <PieChart>
              <Pie data={byPriority} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={3}>
                {byPriority.map((p) => <Cell key={p.name} fill={priorityColors[p.name]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {avgActualMin !== null && avgPlannedMin !== null && (
        <div className="bloom-card" style={{ background: "#FFF9EE", borderRadius: 16, padding: 16, marginTop: 14, fontSize: 12.5, color: "#7A6E62" }}>
          {avgActualMin > avgPlannedMin
            ? `You're taking about ${avgActualMin - avgPlannedMin}m longer than planned, on average. Worth padding your estimates a bit.`
            : avgActualMin < avgPlannedMin
            ? `You're finishing about ${avgPlannedMin - avgActualMin}m faster than planned, on average — nice.`
            : `Your planned and actual time match closely — good estimating instincts.`}
        </div>
      )}
    </div>
  );
}

function AddTaskModal({ defaultDate, onClose, onSave }) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [date, setDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState("09:00");
  const [duration, setDuration] = useState(30);

  function submit() {
    if (!title.trim()) return;
    onSave({ title: title.trim(), priority, date, startTime, duration });
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(74,64,54,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 18, padding: 24, width: 340, fontFamily: "Inter, sans-serif" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div className="bloom-heading" style={{ fontSize: 16, fontWeight: 600 }}>New Task</div>
          <button onClick={onClose} style={{ border: "none", background: "transparent", cursor: "pointer" }}><X size={16} color="#B0A296" /></button>
        </div>

        <label style={{ fontSize: 11.5, color: "#9C8B7A" }}>Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Study Machine Learning"
          style={{ width: "100%", padding: "8px 10px", borderRadius: 10, border: "1px solid #EAD9C8", fontSize: 13, marginTop: 4, marginBottom: 12, boxSizing: "border-box" }} />

        <label style={{ fontSize: 11.5, color: "#9C8B7A" }}>Priority</label>
        <div style={{ display: "flex", gap: 6, marginTop: 4, marginBottom: 12 }}>
          {PRIORITIES.map((p) => (
            <button key={p} onClick={() => setPriority(p)}
              style={{ flex: 1, padding: "7px 0", borderRadius: 10, fontSize: 12, cursor: "pointer",
                border: priority === p ? "1.5px solid #C6503F" : "1px solid #EAD9C8",
                background: priority === p ? PRIORITY_STYLE[p].bg : "#fff",
                color: priority === p ? PRIORITY_STYLE[p].text : "#7A6E62" }}>{p}</button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11.5, color: "#9C8B7A" }}>Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              style={{ width: "100%", padding: "7px 8px", borderRadius: 10, border: "1px solid #EAD9C8", fontSize: 12.5, marginTop: 4, boxSizing: "border-box" }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11.5, color: "#9C8B7A" }}>Time</label>
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
              style={{ width: "100%", padding: "7px 8px", borderRadius: 10, border: "1px solid #EAD9C8", fontSize: 12.5, marginTop: 4, boxSizing: "border-box" }} />
          </div>
        </div>

        <label style={{ fontSize: 11.5, color: "#9C8B7A" }}>Duration (minutes)</label>
        <input type="number" min={5} step={5} value={duration} onChange={(e) => setDuration(e.target.value)}
          style={{ width: "100%", padding: "8px 10px", borderRadius: 10, border: "1px solid #EAD9C8", fontSize: 13, marginTop: 4, marginBottom: 18, boxSizing: "border-box" }} />

        <button onClick={submit} style={{ width: "100%", background: "#4A4036", color: "#fff", border: "none", borderRadius: 10, padding: "10px 0", fontSize: 13.5, fontWeight: 500, cursor: "pointer" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Clock size={14} /> Save Task</div>
        </button>
      </div>
    </div>
  );
}

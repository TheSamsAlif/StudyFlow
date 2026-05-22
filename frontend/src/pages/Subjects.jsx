import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useToast } from "../lib/toast";
import { Plus, Trash2, BookOpen } from "lucide-react";

const COLORS = ["#E07A5F", "#81B29A", "#F2CC8F", "#3D7DCA", "#9B5DE5", "#FB8500"];

export default function Subjects() {
  const { toast } = useToast();
  const [subjects, setSubjects] = useState([]);
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);

  const load = () => api.get("/subjects").then(r => setSubjects(r.data));
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!name.trim()) return;
    await api.post("/subjects", { name, color });
    setName(""); load();
    toast("যোগ হয়েছে", "success");
  };

  const del = async (id) => {
    if (!window.confirm("মুছবেন?")) return;
    await api.delete(`/subjects/${id}`); load();
  };

  return (
    <div className="space-y-6 animate-fadeUp">
      <h1 className="font-bn-h text-3xl font-bold">📚 বিষয়সমূহ</h1>
      <div className="glass rounded-3xl p-5 space-y-3">
        <input data-testid="subject-name" placeholder="বিষয়ের নাম (যেমন: গণিত)" value={name} onChange={e => setName(e.target.value)} className="w-full glass rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary border-0" />
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-ink-muted">রঙ:</span>
          {COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)} className={`w-8 h-8 rounded-full border-2 transition ${color === c ? "border-white scale-110" : "border-transparent"}`} style={{ background: c }} />
          ))}
        </div>
        <button data-testid="add-subject-btn" onClick={add} className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-full font-bn-h font-semibold flex items-center gap-2 shadow-lg shadow-primary/30"><Plus size={16} /> যোগ করুন</button>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {subjects.map(s => (
          <div key={s.id} className="glass rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl grid place-items-center text-white" style={{ background: s.color }}><BookOpen size={18} /></div>
              <span className="font-bn-h font-medium">{s.name}</span>
            </div>
            <button onClick={() => del(s.id)} className="text-ink-muted hover:text-red-400"><Trash2 size={16} /></button>
          </div>
        ))}
        {subjects.length === 0 && <p className="text-ink-muted text-sm col-span-2 text-center py-6">কোনো বিষয় নেই</p>}
      </div>
    </div>
  );
}

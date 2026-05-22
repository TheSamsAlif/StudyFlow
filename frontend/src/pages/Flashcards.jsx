import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useToast } from "../lib/toast";
import { Plus, Trash2, Sparkles, Layers, ChevronLeft, ChevronRight } from "lucide-react";

export default function Flashcards() {
  const { toast } = useToast();
  const [cards, setCards] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showGen, setShowGen] = useState(false);
  const [form, setForm] = useState({ question: "", answer: "", deck: "Default" });
  const [genText, setGenText] = useState("");
  const [genCount, setGenCount] = useState(5);
  const [study, setStudy] = useState(false);
  const [idx, setIdx] = useState(0);
  const [flip, setFlip] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = () => api.get("/flashcards").then(r => setCards(r.data));
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!form.question || !form.answer) return toast("সব ফিল্ড পূরণ করুন", "error");
    await api.post("/flashcards", form);
    setForm({ question: "", answer: "", deck: "Default" });
    setShowAdd(false); load();
  };

  const gen = async () => {
    if (genText.length < 50) return toast("আরো text দরকার (৫০+)", "error");
    setBusy(true);
    try {
      const { data } = await api.post("/ai/generate-flashcards", { text: genText, count: genCount, deck: "AI Generated" });
      toast(`${data.count}টি কার্ড তৈরি হয়েছে`, "success");
      setGenText(""); setShowGen(false); load();
    } catch { toast("AI ত্রুটি", "error"); }
    setBusy(false);
  };

  const del = async (id) => { await api.delete(`/flashcards/${id}`); load(); };

  const review = async (correct) => {
    await api.post(`/flashcards/${cards[idx].id}/review?correct=${correct}`);
    setFlip(false);
    if (idx + 1 < cards.length) setIdx(idx + 1);
    else { setStudy(false); setIdx(0); toast("রিভিউ সম্পন্ন!", "success"); load(); }
  };

  const inp = "w-full glass rounded-xl p-3 outline-none border-0";

  if (study && cards.length > 0) {
    const c = cards[idx];
    return (
      <div className="space-y-6 animate-fadeUp max-w-xl mx-auto">
        <div className="flex items-center justify-between">
          <button onClick={() => { setStudy(false); setFlip(false); setIdx(0); }} className="text-ink-muted hover:text-ink flex items-center gap-1"><ChevronLeft size={18} /> ফেরত</button>
          <span className="text-sm text-ink-muted">{idx + 1} / {cards.length}</span>
        </div>
        <div className="flip-card h-80 cursor-pointer" onClick={() => setFlip(!flip)}>
          <div className={`flip-inner relative w-full h-full ${flip ? "flipped" : ""}`}>
            <div className="flip-face absolute inset-0 glass rounded-3xl p-8 grid place-items-center">
              <p className="font-bn-h text-2xl text-center">{c.question}</p>
              <span className="absolute bottom-4 text-xs text-ink-muted">Tap to flip</span>
            </div>
            <div className="flip-face flip-back absolute inset-0 bg-secondary text-white rounded-3xl p-8 grid place-items-center">
              <p className="font-bn-h text-xl text-center">{c.answer}</p>
            </div>
          </div>
        </div>
        {flip && (
          <div className="flex gap-3">
            <button onClick={() => review(false)} className="flex-1 glass py-3 rounded-full font-bn-h">আবার দেখাও</button>
            <button onClick={() => review(true)} className="flex-1 bg-primary text-white py-3 rounded-full font-bn-h font-semibold">পেরেছি</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeUp">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="font-bn-h text-3xl font-bold">🃏 ফ্ল্যাশকার্ড</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowGen(true)} className="bg-secondary hover:bg-secondary-hover text-white px-4 py-2 rounded-full flex items-center gap-2"><Sparkles size={16} /> AI</button>
          <button onClick={() => setShowAdd(true)} className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-full flex items-center gap-2"><Plus size={16} /> নতুন</button>
        </div>
      </div>

      {cards.length > 0 && (
        <button onClick={() => { setStudy(true); setIdx(0); setFlip(false); }} className="w-full bg-gradient-to-r from-primary to-primary-hover text-white p-5 rounded-3xl flex items-center justify-between font-bn-h font-semibold text-lg shadow-lg shadow-primary/30">
          <span className="flex items-center gap-2"><Layers /> পড়াশোনা শুরু করুন</span>
          <ChevronRight />
        </button>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowAdd(false)} />
          <div className="relative glass w-full max-w-md rounded-3xl p-5 space-y-3">
            <h3 className="font-bn-h font-bold text-lg">নতুন কার্ড</h3>
            <textarea placeholder="প্রশ্ন" rows={2} value={form.question} onChange={e => setForm({ ...form, question: e.target.value })} className={inp} />
            <textarea placeholder="উত্তর" rows={2} value={form.answer} onChange={e => setForm({ ...form, answer: e.target.value })} className={inp} />
            <div className="flex gap-2">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-3 rounded-full glass">বাতিল</button>
              <button onClick={add} className="flex-1 py-3 rounded-full bg-primary text-white font-semibold">যোগ</button>
            </div>
          </div>
        </div>
      )}

      {showGen && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowGen(false)} />
          <div className="relative glass w-full max-w-md rounded-3xl p-5 space-y-3">
            <h3 className="font-bn-h font-bold text-lg flex items-center gap-2"><Sparkles /> AI দিয়ে তৈরি</h3>
            <textarea placeholder="text বা notes paste করুন..." rows={6} value={genText} onChange={e => setGenText(e.target.value)} className={inp} />
            <div className="flex items-center gap-2">
              <input type="number" min={1} max={20} value={genCount} onChange={e => setGenCount(+e.target.value)} className="w-24 glass rounded-xl p-2 outline-none border-0" />
              <span className="text-xs text-ink-muted">কতগুলো কার্ড?</span>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowGen(false)} className="flex-1 py-3 rounded-full glass">বাতিল</button>
              <button onClick={gen} disabled={busy} className="flex-1 py-3 rounded-full bg-secondary text-white font-semibold disabled:opacity-50">{busy ? "তৈরি হচ্ছে..." : "তৈরি করুন"}</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        {cards.map(c => (
          <div key={c.id} className="glass rounded-2xl p-4 group">
            <p className="font-bn-h font-medium">{c.question}</p>
            <p className="text-sm text-ink-muted mt-2 line-clamp-2">{c.answer}</p>
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-ink-muted">{c.deck} · {c.review_count} রিভিউ</span>
              <button onClick={() => del(c.id)} className="text-ink-muted hover:text-red-400"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
        {cards.length === 0 && <p className="text-ink-muted text-center py-8 col-span-2">কোনো কার্ড নেই</p>}
      </div>
    </div>
  );
}

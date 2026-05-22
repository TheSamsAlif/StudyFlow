import { useState } from "react";
import { api } from "../lib/api";
import { useToast } from "../lib/toast";
import { Upload, Sparkles, FileText } from "lucide-react";

export default function Solver() {
  const { toast } = useToast();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [question, setQuestion] = useState("");
  const [solution, setSolution] = useState("");
  const [busy, setBusy] = useState(false);

  const onPick = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    setFile(f); setSolution("");
    if (f.type.startsWith("image/")) setPreview(URL.createObjectURL(f));
    else setPreview(null);
  };

  const solve = async () => {
    if (!file) return toast("ফাইল আপলোড করুন", "error");
    setBusy(true); setSolution("");
    try {
      const fd = new FormData();
      fd.append("file", file); fd.append("question", question);
      const { data } = await api.post("/ai/solve-image", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setSolution(data.solution);
    } catch (e) { toast(e?.response?.data?.detail || "AI ত্রুটি", "error"); }
    setBusy(false);
  };

  return (
    <div className="space-y-6 animate-fadeUp">
      <div>
        <h1 className="font-bn-h text-3xl font-bold flex items-center gap-2"><Sparkles className="text-primary" /> AI সমাধান</h1>
        <p className="text-ink-muted text-sm mt-1">ছবি বা PDF আপলোড করুন — AI সমাধান দিবে</p>
      </div>

      <div className="glass rounded-3xl p-6 space-y-4">
        <label className="block">
          <input type="file" accept="image/*,application/pdf" onChange={onPick} className="hidden" />
          <div className="border-2 border-dashed border-outline rounded-2xl p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition">
            {preview ? <img src={preview} alt="" className="max-h-64 mx-auto rounded-xl" />
              : file ? <div className="flex flex-col items-center gap-2"><FileText size={36} className="text-primary" /><span className="font-bn-h font-medium">{file.name}</span></div>
              : <div className="flex flex-col items-center gap-2 text-ink-muted"><Upload size={36} /><p className="font-bn-h">ছবি বা PDF বাছাই করুন</p><p className="text-xs">JPEG, PNG, PDF (সর্বোচ্চ ১০MB)</p></div>}
          </div>
        </label>
        <textarea value={question} onChange={e => setQuestion(e.target.value)} placeholder="অতিরিক্ত নির্দেশনা (ঐচ্ছিক)" rows={2} className="w-full glass rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary border-0" />
        <button onClick={solve} disabled={busy || !file} className="w-full bg-primary hover:bg-primary-hover text-white py-3 rounded-full font-bn-h font-semibold flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-primary/30">
          <Sparkles size={18} /> {busy ? "সমাধান হচ্ছে..." : "AI দিয়ে সমাধান করুন"}
        </button>
      </div>

      {solution && (
        <div className="glass border-secondary/30 rounded-3xl p-6 animate-fadeUp">
          <h3 className="font-bn-h font-bold text-lg mb-3 text-secondary">📘 সমাধান</h3>
          <p className="whitespace-pre-wrap leading-relaxed">{solution}</p>
        </div>
      )}
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BookOpen, Brain, Check, ChevronLeft, ChevronRight, CircleHelp, Clock3, Crosshair, Flame, LayoutDashboard, RotateCcw, ShieldCheck, Sparkles, Target, Trophy, X, Zap } from "lucide-react";
import { exercises, categories, categoryLessons, type Exercise } from "@/data/exercises";

type ResultMap = Record<number, { correct: boolean; selected?: number; completedAt: number }>;
type View = "dashboard" | "practice" | "guide";

const STORAGE_KEY = "sc900-sprint-lab-v1";

const categoryColors: Record<string, string> = {
  violet: "text-violet-300 bg-violet-400/10 border-violet-300/20",
  cyan: "text-cyan-300 bg-cyan-400/10 border-cyan-300/20",
  orange: "text-orange-300 bg-orange-400/10 border-orange-300/20",
  pink: "text-pink-300 bg-pink-400/10 border-pink-300/20",
  emerald: "text-emerald-300 bg-emerald-400/10 border-emerald-300/20",
  amber: "text-amber-300 bg-amber-400/10 border-amber-300/20",
};

function loadProgress(): { results: ResultMap; streak: number; lastStudy: string | null } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // The app remains usable if browser storage is disabled.
  }
  return { results: {}, streak: 0, lastStudy: null };
}

function saveProgress(results: ResultMap, streak: number) {
  const payload = { results, streak, lastStudy: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function ProgressRing({ value }: { value: number }) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <div className="relative h-28 w-28 shrink-0">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 110 110" aria-label={`${value}% de progression`}>
        <circle cx="55" cy="55" r={radius} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="9" />
        <circle cx="55" cy="55" r={radius} fill="none" stroke="url(#ringGradient)" strokeWidth="9" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} />
        <defs><linearGradient id="ringGradient" x1="0" x2="1"><stop stopColor="#8b5cf6" /><stop offset="1" stopColor="#22d3ee" /></linearGradient></defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-2xl font-bold text-white">{value}%</span>
        <span className="text-[10px] uppercase tracking-widest text-white/45">maîtrise</span>
      </div>
    </div>
  );
}

function AppShell({ children, view, setView, answered, wrong }: { children: React.ReactNode; view: View; setView: (view: View) => void; answered: number; wrong: number }) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#090b16] text-slate-100 selection:bg-violet-400/30">
      <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-violet-600/10 blur-[110px]" />
        <div className="absolute -right-32 top-[36%] h-[500px] w-[500px] rounded-full bg-cyan-500/8 blur-[120px]" />
        <div className="absolute bottom-[-12%] left-[34%] h-[420px] w-[420px] rounded-full bg-fuchsia-500/7 blur-[120px]" />
      </div>
      <header className="sticky top-0 z-30 border-b border-white/[.07] bg-[#090b16]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1480px] items-center justify-between px-4 py-3 sm:px-7 lg:px-10">
          <button onClick={() => setView("dashboard")} className="group flex items-center gap-3 text-left" aria-label="Retour au tableau de bord">
            <div className="grid h-10 w-10 place-items-center rounded-2xl border border-violet-300/25 bg-gradient-to-br from-violet-500 to-cyan-400 text-[#0b0d19] shadow-[0_0_32px_rgba(139,92,246,.28)] transition duration-200 group-hover:scale-105">
              <ShieldCheck size={21} strokeWidth={2.5} />
            </div>
            <div className="hidden sm:block">
              <div className="font-display text-sm font-extrabold tracking-tight text-white">SC-900 <span className="text-violet-300">Sprint Lab</span></div>
              <div className="text-[10px] font-medium uppercase tracking-[.2em] text-white/35">Chapitre 01 · SCI fundamentals</div>
            </div>
          </button>
          <nav className="flex items-center gap-1 rounded-2xl border border-white/[.07] bg-white/[.03] p-1">
            <button onClick={() => setView("dashboard")} className={`nav-pill ${view === "dashboard" ? "nav-pill-active" : ""}`}><LayoutDashboard size={15} /> <span className="hidden sm:inline">Dashboard</span></button>
            <button onClick={() => setView("practice")} className={`nav-pill ${view === "practice" ? "nav-pill-active" : ""}`}><Crosshair size={15} /> <span className="hidden sm:inline">Pratiquer</span></button>
            <button onClick={() => setView("guide")} className={`nav-pill ${view === "guide" ? "nav-pill-active" : ""}`}><BookOpen size={15} /> <span className="hidden sm:inline">Repères</span></button>
          </nav>
          <div className="hidden items-center gap-4 md:flex">
            <div className="text-right"><div className="text-xs font-semibold text-white/80">{answered}/100</div><div className="text-[10px] uppercase tracking-widest text-white/35">répondues</div></div>
            <div className="h-7 w-px bg-white/10" />
            <div className="flex items-center gap-1.5 text-orange-300"><Flame size={16} fill="currentColor" /><span className="text-sm font-bold">{Math.max(1, Math.min(answered + 1, 7))}</span><span className="text-xs text-white/35">jours</span></div>
            {wrong > 0 && <div className="rounded-full border border-rose-300/20 bg-rose-400/10 px-2 py-1 text-[10px] font-bold text-rose-200">{wrong} à revoir</div>}
          </div>
        </div>
      </header>
      <main className="relative z-10">{children}</main>
      <footer className="mx-auto mt-20 max-w-[1480px] px-4 pb-10 sm:px-7 lg:px-10"><div className="flex flex-col justify-between gap-3 border-t border-white/[.07] pt-5 text-xs text-white/30 sm:flex-row"><span>SC-900 Sprint Lab · entraînement local, progression sauvegardée dans votre navigateur</span><span>Objectif conseillé : 85/100 deux fois de suite</span></div></footer>
    </div>
  );
}

function Dashboard({ results, setView, startCategory }: { results: ResultMap; setView: (view: View) => void; startCategory: (category: string) => void }) {
  const answered = Object.keys(results).length;
  const correct = Object.values(results).filter((r) => r.correct).length;
  const mastery = answered ? Math.round((correct / answered) * 100) : 0;
  const wrongIds = Object.entries(results).filter(([, r]) => !r.correct).map(([id]) => Number(id));
  const recent = exercises.filter((x) => results[x.id]).sort((a, b) => (results[b.id]?.completedAt ?? 0) - (results[a.id]?.completedAt ?? 0)).slice(0, 4);

  return <div className="mx-auto max-w-[1480px] px-4 py-8 sm:px-7 lg:px-10 lg:py-12">
    <section className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
      <div className="relative overflow-hidden rounded-[28px] border border-white/[.09] bg-gradient-to-br from-[#19122b] via-[#111426] to-[#0d1c29] p-7 shadow-2xl sm:p-10">
        <div className="absolute right-[-8%] top-[-35%] h-[420px] w-[420px] rounded-full border border-violet-300/10 bg-violet-500/5 blur-sm" />
        <div className="absolute bottom-[-45%] right-[12%] h-[340px] w-[340px] rounded-full border border-cyan-300/10" />
        <div className="relative max-w-2xl">
          <div className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[.22em] text-cyan-300"><Sparkles size={14} /> apprendre en répondant</div>
          <h1 className="font-display max-w-xl text-4xl font-black leading-[.98] tracking-[-.045em] text-white sm:text-6xl">Rendez vos réflexes <span className="text-gradient">SC-900</span> tranchants.</h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-slate-300/75">100 exercices pour comprendre littéralement la sécurité cloud : un problème, un concept, un service Microsoft, puis la logique qui relie les trois.</p>
          <div className="mt-8 flex flex-wrap gap-3"><button onClick={() => setView("practice")} className="primary-button"><Zap size={17} fill="currentColor" /> Continuer l’entraînement <ArrowRight size={16} /></button><button onClick={() => setView("guide")} className="ghost-button"><BookOpen size={16} /> Voir les repères</button></div>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-white/45"><span className="flex items-center gap-2"><Target size={14} className="text-violet-300" /> 5 thèmes</span><span className="flex items-center gap-2"><Brain size={14} className="text-cyan-300" /> corrections littérales</span><span className="flex items-center gap-2"><Clock3 size={14} className="text-orange-300" /> 10–15 min / session</span></div>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        <div className="flex items-center justify-between rounded-[28px] border border-white/[.09] bg-white/[.035] p-6"><div><div className="eyebrow">Votre tableau de bord</div><div className="mt-2 font-display text-2xl font-bold text-white">Progression réelle</div><p className="mt-2 max-w-xs text-sm leading-6 text-white/45">Chaque réponse reste dans votre navigateur. Les erreurs deviennent votre prochaine séance.</p></div><ProgressRing value={mastery} /></div>
        <div className="grid grid-cols-3 divide-x divide-white/[.08] rounded-[28px] border border-white/[.09] bg-white/[.035] p-5"><Stat value={answered} label="répondues" color="text-cyan-300" /><Stat value={correct} label="correctes" color="text-emerald-300" /><Stat value={wrongIds.length} label="à revoir" color="text-rose-300" /></div>
      </div>
    </section>

    <section className="mt-12"><div className="mb-5 flex items-end justify-between"><div><div className="eyebrow">Parcours par compétence</div><h2 className="section-title">Choisissez votre angle d’attaque</h2></div><button onClick={() => setView("practice")} className="hidden text-sm font-semibold text-violet-300 transition hover:text-white sm:flex sm:items-center sm:gap-2">Voir les 100 <ArrowRight size={15} /></button></div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">{categories.slice(1).map((cat) => { const subset = exercises.filter((x) => x.category === cat.name); const done = subset.filter((x) => results[x.id]).length; const good = subset.filter((x) => results[x.id]?.correct).length; return <button key={cat.name} onClick={() => startCategory(cat.name)} className="category-card group text-left"><div className={`category-icon ${categoryColors[cat.color]}`}>{cat.icon}</div><div className="mt-5 flex items-start justify-between gap-2"><div><div className="font-display text-base font-bold text-white">{cat.short}</div><div className="mt-1 text-xs leading-5 text-white/40">{cat.name === "Responsabilité partagée" ? "Qui sécurise quoi ?" : cat.name === "Défense en profondeur" ? "Couches & triade CID" : cat.name === "Confiance Zéro" ? "Vérifier, limiter, supposer" : cat.name === "Chiffrement & hachage" ? "Cacher ou contrôler" : "Règles, risques, preuves"}</div></div><span className="text-xs font-bold text-white/35">{done}/{subset.length}</span></div><div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/[.08]"><div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-cyan-300 transition-all" style={{ width: `${(done / subset.length) * 100}%` }} /></div><div className="mt-2 text-[10px] uppercase tracking-widest text-white/25">{good}/{subset.length} justes</div><ArrowRight className="absolute bottom-5 right-5 text-white/15 transition group-hover:translate-x-1 group-hover:text-white/70" size={17} /></button> })}</div>
    </section>

    <section className="mt-12 grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
      <div className="rounded-[28px] border border-white/[.09] bg-white/[.035] p-6 sm:p-7"><div className="flex items-center justify-between"><div><div className="eyebrow">Mode intelligent</div><h2 className="mt-2 font-display text-2xl font-bold text-white">Votre prochaine meilleure action</h2></div><div className="grid h-10 w-10 place-items-center rounded-xl bg-orange-300/10 text-orange-300"><Crosshair size={19} /></div></div><p className="mt-5 text-sm leading-6 text-white/55">{wrongIds.length > 0 ? `Vous avez ${wrongIds.length} erreur${wrongIds.length > 1 ? "s" : ""} à revoir. Le mode ciblé vous les repropose en priorité.` : answered === 0 ? "Commencez par une série de 10 questions. L’application vous donnera une correction littérale après chaque réponse." : "Continuez jusqu’à atteindre 85 % de bonnes réponses sur les exercices déjà tentés."}</p><button onClick={() => setView("practice")} className="mt-6 secondary-button">{wrongIds.length > 0 ? "Revoir mes erreurs" : "Démarrer une session"} <ArrowRight size={15} /></button></div>
      <div className="rounded-[28px] border border-white/[.09] bg-white/[.035] p-6 sm:p-7"><div className="flex items-center justify-between"><div><div className="eyebrow">Activité récente</div><h2 className="mt-2 font-display text-2xl font-bold text-white">Les derniers réflexes</h2></div><Trophy size={22} className="text-amber-300" /></div>{recent.length === 0 ? <div className="mt-7 rounded-2xl border border-dashed border-white/10 p-5 text-sm text-white/40">Aucune réponse pour le moment. Votre historique apparaîtra ici.</div> : <div className="mt-6 space-y-3">{recent.map((item) => <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-white/[.06] bg-black/10 p-3"><div className={`grid h-8 w-8 place-items-center rounded-xl ${results[item.id].correct ? "bg-emerald-400/10 text-emerald-300" : "bg-rose-400/10 text-rose-300"}`}>{results[item.id].correct ? <Check size={15} /> : <X size={15} />}</div><div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold text-white/80">#{item.id} · {item.categoryShort}</div><div className="truncate text-xs text-white/35">{item.question}</div></div><span className="text-xs font-bold text-white/30">{item.difficulty}</span></div>)}</div>}</div>
    </section>
  </div>;
}

function Stat({ value, label, color }: { value: number; label: string; color: string }) { return <div className="px-3 text-center first:pl-0 last:pr-0"><div className={`font-display text-2xl font-black ${color}`}>{value}</div><div className="mt-1 text-[10px] uppercase tracking-widest text-white/35">{label}</div></div>; }

function Practice({ results, setResults, initialCategory }: { results: ResultMap; setResults: (r: ResultMap) => void; initialCategory: string | null }) {
  const [selectedCategory, setSelectedCategory] = useState(initialCategory ?? "Toutes");
  const [mode, setMode] = useState<"all" | "mistakes" | "random10">(initialCategory ? "all" : "all");
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [sessionIds, setSessionIds] = useState<number[]>([]);

  const pool = useMemo(() => {
    let filtered = selectedCategory === "Toutes" ? exercises : exercises.filter((x) => x.category === selectedCategory);
    if (mode === "mistakes") filtered = filtered.filter((x) => results[x.id] && !results[x.id].correct);
    if (mode === "random10") filtered = [...filtered].sort(() => Math.random() - .5).slice(0, 10);
    return filtered;
  }, [selectedCategory, mode, results]);

  useEffect(() => {
    const ids = pool.map((x) => x.id);
    if (sessionIds.join(",") !== ids.join(",")) { setSessionIds(ids); setIndex(0); setSelected(null); setRevealed(false); }
  }, [pool, sessionIds]);

  const current = pool[index];
  const answered = Object.keys(results).length;
  const correct = Object.values(results).filter((r) => r.correct).length;
  const isChoice = current?.answer !== undefined;

  function submit() {
    if (!current || revealed) return;
    if (isChoice && selected === null) return;
    if (isChoice) {
      const isCorrect = selected === current.answer;
      setResults({ ...results, [current.id]: { correct: isCorrect, selected: selected ?? undefined, completedAt: Date.now() } });
    }
    setRevealed(true);
  }
  function rateOpen(correctAnswer: boolean) {
    if (!current) return;
    setResults({ ...results, [current.id]: { correct: correctAnswer, completedAt: Date.now() } });
  }
  function next() { setIndex((value) => Math.min(value + 1, pool.length - 1)); setSelected(null); setRevealed(false); }
  function previous() { setIndex((value) => Math.max(value - 1, 0)); setSelected(null); setRevealed(false); }
  function resetQuestion() { setSelected(null); setRevealed(false); }

  if (!current) return <div className="mx-auto max-w-3xl px-4 py-20 text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-emerald-400/10 text-emerald-300"><Check size={30} /></div><h1 className="mt-6 font-display text-4xl font-black text-white">Rien à revoir ici.</h1><p className="mx-auto mt-4 max-w-md text-white/50">Ce filtre ne contient aucune question. Essayez un autre thème ou revenez après une nouvelle session.</p><button onClick={() => { setMode("all"); setSelectedCategory("Toutes"); }} className="primary-button mt-7">Voir toutes les questions</button></div>;

  const progress = ((index + 1) / pool.length) * 100;
  const selfRated = current ? results[current.id] : undefined;
  const correctNow = isChoice ? (revealed && selected === current.answer) : selfRated?.correct;

  return <div className="mx-auto max-w-[1480px] px-4 py-7 sm:px-7 lg:px-10 lg:py-10"><div className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><div className="eyebrow flex items-center gap-2"><Crosshair size={13} /> Session active</div><h1 className="mt-2 font-display text-3xl font-black tracking-tight text-white sm:text-5xl">Pratiquez le raisonnement.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">Répondez, observez la logique, puis reformulez-la à voix haute. C’est cette étape qui transforme une bonne réponse en réflexe.</p></div><div className="flex flex-wrap gap-2"><div className="rounded-2xl border border-white/[.08] bg-white/[.035] px-4 py-3 text-right"><div className="text-sm font-bold text-white">{correct}/{answered || 0}</div><div className="text-[10px] uppercase tracking-widest text-white/35">bonnes réponses</div></div><div className="rounded-2xl border border-white/[.08] bg-white/[.035] px-4 py-3 text-right"><div className="text-sm font-bold text-cyan-300">{index + 1}/{pool.length}</div><div className="text-[10px] uppercase tracking-widest text-white/35">dans la session</div></div></div></div>

    <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-white/[.07] bg-white/[.025] p-3 xl:flex-row xl:items-center xl:justify-between"><div className="flex flex-wrap gap-2">{categories.map((cat) => <button key={cat.name} onClick={() => { setSelectedCategory(cat.name); setMode("all"); }} className={`filter-chip ${selectedCategory === cat.name && mode === "all" ? "filter-chip-active" : ""}`}><span className={categoryColors[cat.color]?.split(" ")[0]}>{cat.icon}</span>{cat.short}</button>)}</div><div className="flex flex-wrap gap-2 border-t border-white/[.07] pt-3 xl:border-l xl:border-t-0 xl:pl-3 xl:pt-0"><button onClick={() => setMode("random10")} className={`filter-chip ${mode === "random10" ? "filter-chip-active-orange" : ""}`}><Zap size={13} /> Sprint 10</button><button onClick={() => setMode("mistakes")} className={`filter-chip ${mode === "mistakes" ? "filter-chip-active-rose" : ""}`}><RotateCcw size={13} /> Mes erreurs</button></div></div>

    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_330px]"><div className="min-w-0"><div className="mb-3 flex items-center justify-between text-xs text-white/35"><span>Question {current.id} · {current.categoryShort}</span><span>{Math.round(progress)} % de la session</span></div><div className="mb-5 h-1 overflow-hidden rounded-full bg-white/[.08]"><div className="h-full rounded-full bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-300 transition-all duration-300" style={{ width: `${progress}%` }} /></div><article className="question-card"><div className="flex flex-wrap items-center gap-2"><span className="soft-badge">{current.type === "case" ? "Étude de cas" : current.type === "open" ? "Réponse construite" : current.type === "truefalse" ? "Vrai / faux" : "QCM"}</span><span className={`soft-badge ${current.difficulty === "Fondation" ? "text-cyan-200" : current.difficulty === "Réflexe" ? "text-violet-200" : "text-orange-200"}`}>{current.difficulty}</span><span className="ml-auto text-xs font-semibold text-white/25">#{current.id.toString().padStart(3, "0")}</span></div><h2 className="mt-7 max-w-4xl font-display text-2xl font-bold leading-[1.15] tracking-tight text-white sm:text-4xl">{current.question}</h2>{isChoice ? <div className="mt-8 grid gap-3">{current.options?.map((option, optionIndex) => { const isSelected = selected === optionIndex; const isAnswer = current.answer === optionIndex; const state = revealed ? isAnswer ? "option-correct" : isSelected ? "option-wrong" : "option-muted" : isSelected ? "option-selected" : "option-default"; return <button key={option} disabled={revealed} onClick={() => setSelected(optionIndex)} className={`option-button ${state}`}><span className="option-letter">{String.fromCharCode(65 + optionIndex)}</span><span className="flex-1 text-left">{option}</span>{revealed && isAnswer && <Check size={18} />}{revealed && isSelected && !isAnswer && <X size={18} />}</button>; })}</div> : <div className="mt-8 rounded-2xl border border-dashed border-violet-300/20 bg-violet-400/[.045] p-5"><div className="flex gap-3"><CircleHelp className="mt-0.5 shrink-0 text-violet-300" size={19} /><div><div className="text-sm font-bold text-violet-100">Répondez d’abord sans regarder</div><p className="mt-1 text-sm leading-6 text-white/50">Formulez votre réponse à voix haute ou dans une feuille. Ensuite, révélez la correction pour comparer votre raisonnement.</p></div></div></div>}{revealed && <div className={`mt-7 rounded-2xl border p-5 ${correctNow === true ? "border-emerald-300/20 bg-emerald-400/[.07]" : correctNow === false ? "border-rose-300/20 bg-rose-400/[.07]" : "border-violet-300/20 bg-violet-400/[.06]"}`}><div className="flex items-start gap-3"><div className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full ${correctNow === true ? "bg-emerald-300 text-emerald-950" : correctNow === false ? "bg-rose-300 text-rose-950" : "bg-violet-300 text-violet-950"}`}>{correctNow === true ? <Check size={15} /> : correctNow === false ? <X size={15} /> : <CircleHelp size={15} />}</div><div><div className={`text-sm font-bold ${correctNow === true ? "text-emerald-200" : correctNow === false ? "text-rose-200" : "text-violet-200"}`}>{correctNow === true ? "Bonne réponse — maintenant ancrez la logique." : correctNow === false ? "À corriger — ne mémorisez pas seulement la lettre." : "Comparez votre réponse puis auto-évaluez-vous."}</div>{current.answerLabel && <p className="mt-2 text-sm font-semibold text-white/80">Réponse attendue : {current.answerLabel}</p>}<p className="mt-3 text-sm leading-6 text-white/65"><span className="font-semibold text-white">Pourquoi :</span> {current.explanation}</p><div className="mt-4 rounded-xl border border-white/[.07] bg-black/15 p-3 text-sm leading-6 text-white/60"><span className="font-semibold text-cyan-200">Lecture littérale :</span> {current.literal}</div><div className="mt-3 flex flex-col gap-2 text-xs leading-5 text-white/45 sm:flex-row sm:gap-5"><span><b className="text-rose-200">Piège :</b> {current.trap}</span><span><b className="text-amber-200">Mémo :</b> {current.memory}</span></div></div></div></div>}<div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/[.07] pt-5"><button onClick={previous} disabled={index === 0} className="icon-button"><ChevronLeft size={17} /> Précédente</button><div className="flex flex-wrap justify-end gap-2">{revealed && !isChoice && !selfRated && <><button onClick={() => rateOpen(false)} className="ghost-button border-rose-300/20 text-xs text-rose-200"><X size={14} /> À revoir</button><button onClick={() => rateOpen(true)} className="secondary-button border-emerald-300/20 text-xs text-emerald-200"><Check size={14} /> Je maîtrise</button></>}{revealed && <button onClick={resetQuestion} className="ghost-button text-xs"><RotateCcw size={14} /> Refaire</button>}{!revealed ? <button disabled={isChoice && selected === null} onClick={submit} className="primary-button">{isChoice ? "Valider ma réponse" : "Révéler la correction"} <ArrowRight size={15} /></button> : (!isChoice && !selfRated) ? null : <button onClick={next} disabled={index === pool.length - 1} className="primary-button">Question suivante <ChevronRight size={15} /></button>}</div></div></article></div><aside className="space-y-4"><div className="rounded-[24px] border border-white/[.08] bg-white/[.035] p-5"><div className="eyebrow">Repère du thème</div><h3 className="mt-2 font-display text-xl font-bold text-white">{current.category}</h3>{categoryLessons[current.category] && <><p className="mt-3 text-sm leading-6 text-white/50">{categoryLessons[current.category].text}</p><ul className="mt-4 space-y-2 text-xs leading-5 text-white/55">{categoryLessons[current.category].bullets.map((bullet) => <li key={bullet} className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300" />{bullet}</li>)}</ul></>}</div><div className="rounded-[24px] border border-orange-300/10 bg-orange-400/[.045] p-5"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-orange-200"><Brain size={14} /> Rituel de mémorisation</div><p className="mt-3 text-sm leading-6 text-white/55">Après chaque correction, dites : « Le problème est ___ ; le concept est ___ ; le service Microsoft est ___ parce que ___. »</p></div></aside></div>
  </div>;
}

function Guide({ setView, startCategory }: { setView: (view: View) => void; startCategory: (category: string) => void }) {
  return <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-7 lg:px-10"><div className="max-w-3xl"><div className="eyebrow">Repères de compréhension</div><h1 className="mt-3 font-display text-4xl font-black tracking-tight text-white sm:text-6xl">Comprendre avant de mémoriser.</h1><p className="mt-5 text-base leading-7 text-white/55">Utilisez ces cinq phrases comme des cartes mentales. Ensuite, lancez la série correspondante et vérifiez que vous pouvez les appliquer à un scénario.</p></div><div className="mt-10 grid gap-4 md:grid-cols-2">{categories.slice(1).map((cat, index) => { const lesson = categoryLessons[cat.name]; return <article key={cat.name} className="guide-card" style={{ animationDelay: `${index * 70}ms` }}><div className="flex items-start justify-between gap-4"><div className={`category-icon ${categoryColors[cat.color]}`}>{cat.icon}</div><span className="text-xs font-bold text-white/20">0{index + 1}</span></div><div className="mt-6 text-xs font-bold uppercase tracking-[.18em] text-white/35">{lesson.eyebrow}</div><h2 className="mt-2 font-display text-2xl font-bold text-white">{lesson.title}</h2><p className="mt-4 text-sm leading-6 text-white/55">{lesson.text}</p><div className="my-5 h-px bg-white/[.07]" /><ul className="space-y-3">{lesson.bullets.map((bullet) => <li key={bullet} className="flex gap-3 text-sm leading-6 text-white/70"><Check size={16} className="mt-1 shrink-0 text-emerald-300" />{bullet}</li>)}</ul><button onClick={() => startCategory(cat.name)} className="mt-6 flex items-center gap-2 text-sm font-bold text-violet-300 transition hover:gap-3 hover:text-white">Tester cette notion <ArrowRight size={15} /></button></article>; })}</div><div className="mt-10 rounded-[28px] border border-violet-300/15 bg-gradient-to-r from-violet-500/10 to-cyan-400/10 p-7 sm:p-9"><div className="flex flex-col justify-between gap-6 md:flex-row md:items-center"><div><div className="eyebrow text-violet-200">Méthode Sprint Lab</div><h2 className="mt-2 font-display text-2xl font-bold text-white">Une erreur devient utile quand vous l’expliquez.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">Répondez sans aide, lisez la correction, reformulez la logique à voix haute, puis refaites la question deux jours plus tard.</p></div><button onClick={() => setView("practice")} className="primary-button shrink-0">Lancer une session <ArrowRight size={15} /></button></div></div></div>;
}

export default function Home() {
  const [view, setView] = useState<View>("dashboard");
  const [results, setResultsState] = useState<ResultMap>(() => loadProgress().results);
  const [initialCategory, setInitialCategory] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const answered = Object.keys(results).length;
  const wrong = Object.values(results).filter((r) => !r.correct).length;

  useEffect(() => { if (toast) { const timeout = window.setTimeout(() => setToast(null), 2600); return () => window.clearTimeout(timeout); } }, [toast]);

  function setResults(next: ResultMap) { setResultsState(next); saveProgress(next, 0); }
  function startCategory(category: string) { setInitialCategory(category); setView("practice"); setToast(`Session « ${category} » lancée`); }
  function clearProgress() { if (window.confirm("Réinitialiser toute votre progression locale ?")) { setResultsState({}); localStorage.removeItem(STORAGE_KEY); setToast("Progression réinitialisée"); } }

  return <AppShell view={view} setView={(next) => { setView(next); if (next !== "practice") setInitialCategory(null); }} answered={answered} wrong={wrong}>
    {view === "dashboard" && <Dashboard results={results} setView={setView} startCategory={startCategory} />}
    {view === "practice" && <Practice results={results} setResults={setResults} initialCategory={initialCategory} />}
    {view === "guide" && <Guide setView={setView} startCategory={startCategory} />}
    <div className="mx-auto flex max-w-[1480px] justify-end px-4 pb-4 sm:px-7 lg:px-10"><button onClick={clearProgress} className="text-[11px] text-white/20 transition hover:text-rose-300">Réinitialiser ma progression locale</button></div>
    {toast && <div className="toast"><Check size={15} className="text-emerald-300" /> {toast}</div>}
  </AppShell>;
}

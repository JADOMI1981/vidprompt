"use client";

import { useState, useRef } from "react";

interface VeoClip {
  clip_number: string;
  clip_duration: string;
  content_type: string;
  clip_function: string;
  style: string;
  shot: {
    composition: string;
    camera_motion: string;
    frame_rate: string;
  };
  subject: {
    description: string;
    wardrobe: string;
  };
  scene: {
    environment: string;
    lighting: string;
  };
  direction: {
    expression_or_behavior: string;
    body_language: string;
    emotional_note: string;
  };
  visual_action: string;
  audio: {
    dialogue: {
      character: string;
      line: string;
    };
    background_music: string;
    vocal_style: {
      voice_tone: string;
      delivery_speed: string;
      vocal_volume: string;
    };
  };
}

interface Social {
  slug: string;
  title: string;
  post: string;
}

interface Parsed {
  transcript: string;
  breakdown: string;
  clips: VeoClip[];
  tips: string;
  social: Social;
  raw: string;
}

function parseOutput(text: string): Parsed {
  const transcript = text.match(/🎤 AUDIO TRANSCRIPT([\s\S]*?)---/)?.[1]?.trim() || "";
  const breakdown = text.match(/🎬 VIDEO BREAKDOWN([\s\S]*?)---/)?.[1]?.trim() || "";
  const tips = text.match(/✅ VEO 3 TIPS:([\s\S]*?)(?:---|📱|$)/)?.[1]?.trim() || "";

  const socialBlock = text.match(/📱 SOCIAL MEDIA([\s\S]*?)$/)?.[1]?.trim() || "";
  const slug = socialBlock.match(/SLUG:\s*(.+)/)?.[1]?.trim() || "";
  const title = socialBlock.match(/TITLE:\s*(.+)/)?.[1]?.trim() || "";
  const post = socialBlock.match(/FACEBOOK REEL POST:\n([\s\S]+)/)?.[1]?.trim() || "";

  // Extract JSON array from CLIPS section
  let clips: VeoClip[] = [];
  const clipsBlock = text.match(/📽️ CLIPS\s*([\s\S]*?)---/)?.[1]?.trim() || "";
  if (clipsBlock) {
    try {
      const jsonStr = clipsBlock.replace(/```json|```/g, "").trim();
      clips = JSON.parse(jsonStr);
    } catch {
      // fallback: try to find any JSON array in the full text
      try {
        const jsonMatch = text.match(/\[\s*\{[\s\S]*?\}\s*\]/);
        if (jsonMatch) clips = JSON.parse(jsonMatch[0]);
      } catch { /* leave empty */ }
    }
  }

  return {
    transcript,
    breakdown,
    clips,
    tips,
    social: { slug, title, post },
    raw: text,
  };
}

function CopyButton({ text, label = "Copier" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="text-xs px-3 py-1 rounded-lg border border-white/10 hover:border-violet-500/40 hover:bg-violet-500/10 text-white/50 hover:text-violet-300 transition-all shrink-0"
    >
      {copied ? "✓ Copié !" : label}
    </button>
  );
}

function durationColor(d: string) {
  if (d === "4s") return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
  if (d === "6s") return "bg-amber-500/20 text-amber-300 border-amber-500/30";
  return "bg-violet-500/20 text-violet-300 border-violet-500/30";
}

function functionColor(f: string) {
  if (f?.includes("introduction")) return "text-blue-400";
  if (f?.includes("development")) return "text-amber-400";
  if (f?.includes("peak")) return "text-red-400";
  return "text-green-400";
}

function Row({ label, value }: { label: string; value: string }) {
  if (!value || value === "none") return null;
  return (
    <div className="flex gap-2 text-xs">
      <span className="text-white/25 w-32 shrink-0">{label}</span>
      <span className="text-white/65 leading-relaxed">{value}</span>
    </div>
  );
}

function ClipCard({ clip, index }: { clip: VeoClip; index: number }) {
  const [showDetails, setShowDetails] = useState(false);
  const jsonString = JSON.stringify(clip, null, 2);
  const dur = clip.clip_duration || "8s";

  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4 mb-3">
      {/* Header */}
      <div className="flex items-center gap-2 flex-wrap mb-3">
        <span className="w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold shrink-0">
          {index + 1}
        </span>
        <span className="text-sm font-medium text-white/90">{clip.clip_number}</span>
        <span className={`text-xs border px-2 py-0.5 rounded-full font-bold ${durationColor(dur)}`}>
          ⏱️ {dur}
        </span>
        {clip.clip_function && (
          <span className={`text-xs font-medium ${functionColor(clip.clip_function)}`}>
            {clip.clip_function}
          </span>
        )}
        {clip.content_type && (
          <span className="text-xs text-white/25 border border-white/8 px-2 py-0.5 rounded-full">
            {clip.content_type}
          </span>
        )}
      </div>

      {/* JSON prompt — copy-ready */}
      <div className="bg-black/40 rounded-lg p-3 mb-3 border border-violet-500/10">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-violet-400 font-medium">✨ Prompt JSON Veo 3</p>
          <CopyButton text={jsonString} label="Copier le JSON" />
        </div>
        <pre className="text-xs text-white/70 leading-relaxed overflow-x-auto whitespace-pre-wrap max-h-48 overflow-y-auto">{jsonString}</pre>
      </div>

      {/* Dialogue highlight */}
      {clip.audio?.dialogue?.line && clip.audio.dialogue.line !== "none" && (
        <div className="bg-indigo-500/5 border border-indigo-500/15 rounded-lg p-3 mb-3">
          <p className="text-xs text-indigo-400 mb-1">🗣️ {clip.audio.dialogue.character}</p>
          <p className="text-sm text-white/80 italic">"{clip.audio.dialogue.line}"</p>
        </div>
      )}

      {/* Voice */}
      {clip.audio?.vocal_style?.voice_tone && (
        <div className="bg-orange-500/5 border border-orange-500/15 rounded-lg p-2 mb-3">
          <p className="text-xs text-orange-400 mb-1">🎙️ Voice</p>
          <p className="text-xs text-white/60">{clip.audio.vocal_style.voice_tone} • {clip.audio.vocal_style.delivery_speed} • {clip.audio.vocal_style.vocal_volume}</p>
        </div>
      )}

      {/* Wardrobe reskin */}
      {clip.subject?.wardrobe && clip.subject.wardrobe !== "not applicable" && (
        <div className="bg-green-500/5 border border-green-500/15 rounded-lg p-2 mb-3">
          <p className="text-xs text-green-400 mb-1">✨ Wardrobe Reskin</p>
          <p className="text-xs text-white/70">{clip.subject.wardrobe}</p>
        </div>
      )}

      {/* Toggle details */}
      <button onClick={() => setShowDetails(!showDetails)}
        className="text-xs text-white/30 hover:text-white/60 transition-colors">
        {showDetails ? "▲ Masquer les détails" : "▼ Voir tous les détails"}
      </button>

      {showDetails && (
        <div className="mt-3 space-y-2 border-t border-white/5 pt-3">
          <Row label="Style" value={clip.style} />
          <Row label="Composition" value={clip.shot?.composition} />
          <Row label="Camera" value={clip.shot?.camera_motion} />
          <Row label="Subject" value={clip.subject?.description} />
          <Row label="Environment" value={clip.scene?.environment} />
          <Row label="Lighting" value={clip.scene?.lighting} />
          <Row label="Expression" value={clip.direction?.expression_or_behavior} />
          <Row label="Body language" value={clip.direction?.body_language} />
          <Row label="Director note" value={clip.direction?.emotional_note} />
          <Row label="Visual action" value={clip.visual_action} />
          <Row label="Music" value={clip.audio?.background_music} />
        </div>
      )}
    </div>
  );
}

function SocialCard({ social }: { social: Social }) {
  if (!social.slug && !social.title && !social.post) return null;
  return (
    <div className="mt-4 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 space-y-3">
      <p className="text-xs text-blue-300 font-medium">📱 Social Media</p>
      {social.slug && (
        <div className="flex items-center justify-between gap-3 bg-black/30 rounded-lg px-3 py-2">
          <div className="min-w-0">
            <p className="text-xs text-white/30 mb-0.5">SLUG</p>
            <p className="text-xs text-white/70 font-mono truncate">{social.slug}</p>
          </div>
          <CopyButton text={social.slug} />
        </div>
      )}
      {social.title && (
        <div className="flex items-center justify-between gap-3 bg-black/30 rounded-lg px-3 py-2">
          <div className="min-w-0">
            <p className="text-xs text-white/30 mb-0.5">TITLE</p>
            <p className="text-sm text-white/90 font-medium">{social.title}</p>
          </div>
          <CopyButton text={social.title} />
        </div>
      )}
      {social.post && (
        <div className="bg-black/30 rounded-lg px-3 py-2">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-white/30">FACEBOOK REEL POST</p>
            <CopyButton text={social.post} label="Copier le post" />
          </div>
          <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">{social.post}</p>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [context, setContext] = useState("");
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"url" | "file">("url");
  const [activeTab, setActiveTab] = useState<"clips" | "transcript" | "raw">("clips");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleGenerate = async () => {
    if (!url && !file) return;
    setLoading(true);
    setParsed(null);
    try {
      const formData = new FormData();
      if (file) formData.append("file", file);
      if (url) formData.append("url", url);
      if (context) formData.append("context", context);
      const res = await fetch("/api/generate", { method: "POST", body: formData });
      const data = await res.json();
      if (data.prompt) {
        setParsed(parseOutput(data.prompt));
        setActiveTab("clips");
      } else {
        setParsed({ transcript: "", breakdown: "", clips: [], tips: data.error || "Erreur inconnue", social: { slug: "", title: "", post: "" }, raw: data.error });
      }
    } catch {
      setParsed({ transcript: "", breakdown: "", clips: [], tips: "Erreur de connexion.", social: { slug: "", title: "", post: "" }, raw: "Erreur de connexion." });
    }
    setLoading(false);
  };

  const totalDuration = parsed?.clips.reduce((acc, c) => {
    const d = parseInt(c.clip_duration || "8");
    return acc + (isNaN(d) ? 8 : d);
  }, 0) || 0;

  const allJson = parsed?.clips ? JSON.stringify(parsed.clips, null, 2) : "";

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white font-sans">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-violet-600/10 rounded-full blur-[120px]" />
      </div>

      <nav className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xs font-bold">V</div>
          <span className="font-semibold text-sm">VidPrompt</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-white/30">
          <span className="border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full">4s</span>
          <span className="border border-amber-500/30 text-amber-400 px-2 py-0.5 rounded-full">6s</span>
          <span className="border border-violet-500/30 text-violet-400 px-2 py-0.5 rounded-full">8s</span>
        </div>
      </nav>

      <section className="relative z-10 text-center px-4 pt-14 pb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          JSON Prompts • Reskin couleurs • Voice Direction • Veo 3 🇺🇸
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-3 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
          Vidéo → Prompts Veo 3
        </h1>
        <p className="text-white/40 text-sm max-w-md mx-auto">
          Prompts JSON structurés • Reskin minimal • Post Facebook inclus
        </p>
      </section>

      <section className="relative z-10 max-w-2xl mx-auto px-4 pb-24">
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5 mb-4">
          <div className="flex gap-1 p-1 rounded-xl bg-white/5 mb-4 w-fit">
            <button onClick={() => setMode("url")} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${mode === "url" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60"}`}>🔗 Lien URL</button>
            <button onClick={() => setMode("file")} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${mode === "file" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60"}`}>📁 Fichier vidéo</button>
          </div>

          {mode === "url" && (
            <input type="text" value={url} onChange={(e) => setUrl(e.target.value)}
              placeholder="Collez un lien YouTube, TikTok..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-500/50 transition-all mb-3" />
          )}

          {mode === "file" && (
            <div onClick={() => fileRef.current?.click()}
              className="mb-3 border-2 border-dashed border-white/10 rounded-xl p-6 text-center cursor-pointer hover:border-violet-500/40 hover:bg-violet-500/5 transition-all">
              <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])} />
              {file ? (
                <div>
                  <p className="text-sm text-violet-300 font-medium">{file.name}</p>
                  <p className="text-xs text-white/30 mt-1">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                </div>
              ) : (
                <div>
                  <p className="text-2xl mb-1">🎬</p>
                  <p className="text-sm text-white/40">Cliquez pour choisir une vidéo</p>
                  <p className="text-xs text-white/20 mt-1">MP4, MOV — max 50 MB</p>
                </div>
              )}
            </div>
          )}

          <input type="text" value={context} onChange={(e) => setContext(e.target.value)}
            placeholder="Contexte additionnel (optionnel) — ex: style cinématique, ambiance..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-500/50 transition-all mb-3" />

          <button onClick={handleGenerate} disabled={loading || (!url && !file)}
            className="w-full py-3 rounded-xl font-medium text-sm bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-900/30">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Analyse en cours...
              </span>
            ) : "✨ Générer les clips Veo 3"}
          </button>
        </div>

        {parsed && (
          <div>
            {/* Stats bar */}
            <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-white/[0.03] border border-white/8 flex-wrap">
              <span className="text-xs text-white/40">Résultat :</span>
              <span className="text-xs bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full">🎬 {parsed.clips.length} clips</span>
              <span className="text-xs bg-white/10 text-white/50 px-2 py-0.5 rounded-full">⏱️ ~{totalDuration}s</span>
              {parsed.clips.filter(c => c.clip_duration === "4s").length > 0 && <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">{parsed.clips.filter(c => c.clip_duration === "4s").length}× 4s</span>}
              {parsed.clips.filter(c => c.clip_duration === "6s").length > 0 && <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full">{parsed.clips.filter(c => c.clip_duration === "6s").length}× 6s</span>}
              {parsed.clips.filter(c => c.clip_duration === "8s").length > 0 && <span className="text-xs bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full">{parsed.clips.filter(c => c.clip_duration === "8s").length}× 8s</span>}
              <div className="ml-auto"><CopyButton text={allJson} label="Tout copier" /></div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-xl bg-white/5 mb-4 w-fit">
              {(["clips", "transcript", "raw"] as const).map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60"}`}>
                  {tab === "clips" ? `📽️ Clips (${parsed.clips.length})` : tab === "transcript" ? "🎤 Transcription" : "📄 Brut"}
                </button>
              ))}
            </div>

            {activeTab === "clips" && (
              <div>
                {parsed.breakdown && (
                  <div className="mb-3 rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3">
                    <pre className="text-xs text-white/40 whitespace-pre-wrap">{parsed.breakdown}</pre>
                  </div>
                )}
                {parsed.clips.length > 0
                  ? parsed.clips.map((clip, i) => <ClipCard key={i} clip={clip} index={i} />)
                  : <p className="text-sm text-white/30 text-center py-8">Aucun clip JSON parsé — voir l'onglet Brut</p>
                }
                {parsed.tips && (
                  <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                    <p className="text-xs text-white/40 font-medium mb-2">✅ Veo 3 Tips</p>
                    <p className="text-sm text-white/60 leading-relaxed whitespace-pre-wrap">{parsed.tips}</p>
                  </div>
                )}
                <SocialCard social={parsed.social} />
              </div>
            )}

            {activeTab === "transcript" && (
              <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-green-300 font-medium">🎤 Transcription complète</span>
                  <CopyButton text={parsed.transcript} />
                </div>
                <pre className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">{parsed.transcript || "Aucune transcription disponible"}</pre>
              </div>
            )}

            {activeTab === "raw" && (
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-white/40 font-medium">📄 Réponse complète</span>
                  <CopyButton text={parsed.raw} />
                </div>
                <pre className="text-sm text-white/60 leading-relaxed whitespace-pre-wrap">{parsed.raw}</pre>
              </div>
            )}
          </div>
        )}
      </section>

      <footer className="relative z-10 border-t border-white/5 py-6 text-center text-xs text-white/20">
        VidPrompt — Gratuit • Propulsé par Gemini • Optimisé Veo 3 🇺🇸
      </footer>
    </main>
  );
}
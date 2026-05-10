import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const url = formData.get("url") as string;
    const context = formData.get("context") as string;
    const file = formData.get("file") as File | null;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const systemPrompt = `You are an expert AI video director and prompt engineer specialized in Veo 3, targeting an AMERICAN audience.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 CORE PHILOSOPHY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Minimal reskin — same scene, same people, same energy.
90% identical. 10% different (clothing colors + decor only).
Characters keep exact same ethnicity, age, gender, body type, gestures, and emotional tone.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🇺🇸 AMERICAN LOCALIZATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Replace non-American brand logos/signs with American equivalents
• If setting is clearly foreign, replace with similar American location (same vibe, same type)
• DO NOT change: ethnicity, age, gender, body type, gestures, blocking, energy, dialogue

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1 — MEASURE VIDEO DURATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXACT total duration in seconds = VIDEO_DURATION

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 2 — CALCULATE CLIPS (MANDATORY MATH)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Veo 3 only supports: 4s, 6s, 8s per clip.

IF VIDEO_DURATION <= 4s  → 1 clip of 4s
IF VIDEO_DURATION <= 6s  → 1 clip of 6s
IF VIDEO_DURATION <= 8s  → 1 clip of 8s
IF VIDEO_DURATION <= 12s → 2 clips of 6s
IF VIDEO_DURATION <= 16s → 2 clips of 8s
IF VIDEO_DURATION <= 20s → 3 clips (8s+8s+4s or 8s+6s+6s)
IF VIDEO_DURATION <= 24s → 3 clips of 8s
IF VIDEO_DURATION <= 28s → 4 clips (mix of 6s and 8s)
IF VIDEO_DURATION > 28s  → divide by 8, round up, all 8s clips

NEVER create more clips than the formula requires.
Both versions (REAL and CARTOON) must have the EXACT same number of clips.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 3 — TRANSCRIBE DIALOGUE (ONCE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Full dialogue ONCE with timestamps. Split chronologically across clips.
Each clip gets ONLY its own unique portion — NEVER repeat any word across clips.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 4 — ANALYZE VOICE (for vocal_style)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
For each speaker analyze from the original video:
• voice_tone: specific accent + texture + emotion (e.g. "warm Midwestern male, slightly raspy, confident but relaxed")
• delivery_speed: slow / moderate / fast / rushed — with any variation notes
• vocal_volume: soft / moderate / loud / dynamic — note any peaks or drops
These three values are COPY-PASTED identically across all clips for the same speaker.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 5 — RESKIN (MINIMAL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Change ONLY:
1. Clothing color (same type, different color)
2. Background/decor color or details (same room, American aesthetic)

COPY-PASTE subject description, environment, lighting, and vocal_style EXACTLY across all clips.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 6A — GENERATE REAL VERSION CLIPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Output each clip as a valid JSON object using EXACTLY this structure.
Output ALL clips as a JSON array inside the REAL VERSION CLIPS section.

{
  "clip_number": "Clip X (Xs - Xs)",
  "clip_duration": "4s | 6s | 8s",
  "content_type": "animal | elderly | child | nature | comedy | drama | daily life",
  "clip_function": "introduction | development | peak moment | resolution",
  "style": "realistic cinematic, warm and authentic, flawless continuity",
  "shot": {
    "composition": "Wide Shot | Medium Shot | Close-Up | Extreme Close-Up",
    "camera_motion": "Very slow dolly in | Static | Gentle pan | Slow push-in",
    "frame_rate": "30fps"
  },
  "subject": {
    "description": "COPY-PASTE EXACTLY from Clip 1 for all subsequent clips. Animals: species, breed, size, fur/texture, posture, behavior. Humans: age, ethnicity, hair, eyes, skin texture, expression.",
    "wardrobe": "RESKINNED wardrobe — same type as original, DIFFERENT color. Write 'not applicable' for animals."
  },
  "scene": {
    "environment": "COPY-PASTE EXACTLY from Clip 1. American-localized. Fixed background elements with reskinned colors/details.",
    "lighting": "COPY-PASTE EXACTLY from Clip 1. e.g. Soft natural window light from the left / Golden hour sunlight / Overcast outdoor diffused light"
  },
  "direction": {
    "expression_or_behavior": "Exact facial expression (humans) or behavioral state (animals) for THIS clip.",
    "body_language": "Posture, movement, gesture — specific to this moment.",
    "emotional_note": "Director note on the feeling this clip must convey."
  },
  "visual_action": "Specific physical movement or event in this clip window. Subject is ALWAYS visible.",
  "audio": {
    "dialogue": {
      "character": "Name or 'narrator' or 'none'",
      "line": "ONLY the exact dialogue for THIS clip's timeframe, or 'none'. Never repeat lines from other clips."
    },
    "background_music": "'none' if dialogue present. If no dialogue: ambient description, COPY-PASTE EXACTLY from Clip 1.",
    "vocal_style": {
      "voice_tone": "COPY-PASTE EXACTLY from Clip 1 — specific accent, texture, emotion",
      "delivery_speed": "COPY-PASTE EXACTLY from Clip 1",
      "vocal_volume": "COPY-PASTE EXACTLY from Clip 1"
    }
  }
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 6B — GENERATE CARTOON VERSION CLIPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Generate the EXACT same clips as the REAL version BUT adapted for Pixar-style 3D animation.
Same dialogue, same timing, same clip count, same camera logic.

CARTOON RULES:
• style: "Pixar-style 3D animation, vibrant saturated colors, expressive cartoon characters, comedic timing, smooth animation"
• subject.description: Rewrite as a cartoon character — exaggerated facial features, big expressive eyes, rounded proportions, same ethnicity/age/gender kept but stylized
• subject.wardrobe: Same reskinned color but described in cartoon style (e.g. "bright cobalt blue oversized hoodie, cartoon stitching detail")
• scene.environment: Same American location but cartoon version — "cozy animated American living room, warm saturated tones, soft cartoon shadows, Pixar-quality render"
• scene.lighting: Cartoon-adapted version — "warm animated rim light, soft cartoon ambient glow"
• direction.expression_or_behavior: Exaggerated cartoon expression (e.g. "jaw-drop comedic expression, eyes wide as saucers")
• direction.emotional_note: Add comedic cartoon energy note
• audio.vocal_style.voice_tone: Keep same voice profile but add "animated voice actor style"
• Everything else (dialogue, timing, clip_function) stays IDENTICAL to the real version

Use EXACTLY the same JSON structure as the real version.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 7 — SOCIAL MEDIA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SLUG: lowercase, hyphens, max 60 chars
TITLE: punchy English, max 70 chars, Facebook Reels optimized
FACEBOOK REEL POST: 2-4 sentences casual American English, strong hook, CTA, then exactly 4 hashtags separated by spaces on same line

${context ? `User context: ${context}` : ""}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT — follow exactly
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎤 AUDIO TRANSCRIPT
[Full transcript with timestamps — written ONCE]

---

🎬 VIDEO BREAKDOWN
Video duration: [X]s
Clip formula: [formula] = [N] clips of [duration]

---

🎭 VERSION RÉEL — CLIPS
[
  { ...clip 1 real JSON... },
  { ...clip 2 real JSON... }
]

---

🎨 VERSION CARTOON — CLIPS
[
  { ...clip 1 cartoon JSON... },
  { ...clip 2 cartoon JSON... }
]

---

✅ VEO 3 TIPS:
[Tips for generating this video — include voice tips to avoid robotic sound]

---

📱 SOCIAL MEDIA
SLUG: [slug-here]
TITLE: [Title here]
FACEBOOK REEL POST:
[2-4 sentence viral post]
#hashtag1 #hashtag2 #hashtag3 #hashtag4`;

    let result;

    if (file) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64 = buffer.toString("base64");

      result = await model.generateContent([
        systemPrompt,
        {
          inlineData: {
            mimeType: file.type,
            data: base64,
          },
        },
      ]);
    } else if (url) {
      result = await model.generateContent([
        systemPrompt,
        `Analyze this video. Measure EXACT duration, apply clip formula, split dialogue without repetition, apply minimal reskin (colors + decor only), generate BOTH the real version clips AND the cartoon version clips using the exact same structure, and generate social media metadata: ${url}`,
      ]);
    } else {
      return NextResponse.json(
        { error: "Veuillez fournir un fichier vidéo ou une URL" },
        { status: 400 }
      );
    }

    const text = result.response.text();
    return NextResponse.json({ prompt: text });
  } catch (error) {
    console.error("Gemini API error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération. Vérifiez votre clé API." },
      { status: 500 }
    );
  }
}
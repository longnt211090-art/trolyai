import { useState, useRef, useEffect } from "react";

const TABS = [
  { id: "chat", label: "Trợ Lý", icon: "✦" },
  { id: "tasks", label: "Việc Làm", icon: "◈" },
  { id: "office", label: "Văn Phòng", icon: "◉" },
  { id: "entertain", label: "Giải Trí", icon: "◎" },
  { id: "connect", label: "Kết Nối", icon: "⬡" },
];

const OFFICE_TEMPLATES = [
  { id: "email", label: "Soạn Email", prompt: "Soạn email chuyên nghiệp về: " },
  { id: "report", label: "Báo Cáo", prompt: "Viết báo cáo công việc về: " },
  { id: "summary", label: "Tóm Tắt", prompt: "Tóm tắt nội dung sau: " },
  { id: "plan", label: "Kế Hoạch", prompt: "Lập kế hoạch chi tiết cho: " },
];

const QUICK_PROMPTS = ["Gợi ý bữa trưa tiết kiệm","Công thức Excel VLOOKUP","Tiết kiệm lương 25 triệu","Email xin nghỉ phép"];
const ENT_GENRES_MOVIE = ["Hành động","Tâm lý","Hài","Kinh dị","Tình cảm","Hoạt hình"];
const ENT_GENRES_MUSIC = ["V-Pop","K-Pop","EDM","Ballad","Rap Việt","Lo-fi"];
const ENT_MOODS = ["Thư giãn","Hứng khởi","Buồn","Tập trung","Vui vẻ"];
const NEWS_CATS = ["Công nghệ","Thể thao","Giải trí","Kinh tế","Xã hội","Thế giới"];

const AI_PLATFORMS = [
  {
    id: "claude", name: "Claude", company: "Anthropic",
    color: "#ffd86e", icon: "✦",
    endpoint: "https://api.anthropic.com/v1/messages",
    models: ["claude-opus-4-5", "claude-sonnet-4-5", "claude-haiku-4-5"],
    defaultModel: "claude-sonnet-4-5",
    docs: "https://docs.anthropic.com",
    desc: "Mặc định trong app này",
    headerKey: "x-api-key",
    bodyBuilder: (model, messages, system) => ({
      model, max_tokens: 1000,
      system: system || "Bạn là trợ lý AI hữu ích. Trả lời tiếng Việt.",
      messages,
    }),
    parseResponse: (d) => d.content?.[0]?.text || "Lỗi phản hồi.",
  },
  {
    id: "openai", name: "ChatGPT", company: "OpenAI",
    color: "#10a37f", icon: "⬡",
    endpoint: "https://api.openai.com/v1/chat/completions",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
    defaultModel: "gpt-4o-mini",
    docs: "https://platform.openai.com/api-keys",
    desc: "GPT-4o, GPT-4o mini...",
    headerKey: "Authorization",
    headerPrefix: "Bearer ",
    bodyBuilder: (model, messages, system) => ({
      model, max_tokens: 1000,
      messages: [
        { role: "system", content: system || "Bạn là trợ lý AI hữu ích. Trả lời tiếng Việt." },
        ...messages,
      ],
    }),
    parseResponse: (d) => d.choices?.[0]?.message?.content || "Lỗi phản hồi.",
  },
  {
    id: "gemini", name: "Gemini", company: "Google",
    color: "#4285f4", icon: "◈",
    endpoint: "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
    models: ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"],
    defaultModel: "gemini-2.5-flash",
    docs: "https://aistudio.google.com/app/apikey",
    desc: "Gemini 2.5 Flash, 2.0 Flash...",
    headerKey: "X-Goog-Api-Key",
    bodyBuilder: (model, messages, system) => ({
      system_instruction: { parts: [{ text: system || "Bạn là trợ lý AI hữu ích. Trả lời tiếng Việt." }] },
      contents: messages.map(m => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
    }),
    parseResponse: (d) => d.candidates?.[0]?.content?.parts?.[0]?.text || "Lỗi phản hồi.",
    urlBuilder: (endpoint, model, apiKey) => endpoint.replace("{model}", model),
  },
  {
    id: "mistral", name: "Mistral", company: "Mistral AI",
    color: "#ff6b35", icon: "◉",
    endpoint: "https://api.mistral.ai/v1/chat/completions",
    models: ["mistral-large-latest", "mistral-small-latest", "open-mistral-7b"],
    defaultModel: "mistral-small-latest",
    docs: "https://console.mistral.ai/api-keys",
    desc: "Mistral Large, Small...",
    headerKey: "Authorization",
    headerPrefix: "Bearer ",
    bodyBuilder: (model, messages, system) => ({
      model, max_tokens: 1000,
      messages: [
        { role: "system", content: system || "Bạn là trợ lý AI hữu ích. Trả lời tiếng Việt." },
        ...messages,
      ],
    }),
    parseResponse: (d) => d.choices?.[0]?.message?.content || "Lỗi phản hồi.",
  },
];

// ── SHARED CALL ───────────────────────────────────────────────────────────────
function callClaude(messages, systemPrompt = "") {
  return fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system: systemPrompt || "Bạn là trợ lý AI cá nhân cho người đi làm công sở tại Việt Nam. Trả lời ngắn gọn, thực tế. Ưu tiên tiếng Việt.", messages }),
  }).then(r => r.json()).then(d => d.content?.[0]?.text || "Có lỗi xảy ra.");
}

function callClaudeSearch(messages, systemPrompt = "") {
  return fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, tools: [{ type: "web_search_20250305", name: "web_search" }], system: systemPrompt || "Bạn là trợ lý giải trí AI cho người Việt. Tìm thông tin mới nhất. Tiếng Việt.", messages }),
  }).then(r => r.json()).then(d => (d.content || []).filter(b => b.type === "text").map(b => b.text).join("\n") || "Không tìm được.");
}

async function callExternalAI(platform, apiKey, model, messages, systemPrompt = "") {
  try {
    const body = platform.bodyBuilder(model, messages, systemPrompt);
    let url = platform.endpoint;
    if (platform.urlBuilder) url = platform.urlBuilder(url, model, apiKey);

    const headers = { "Content-Type": "application/json" };
    if (platform.headerPrefix) headers[platform.headerKey] = platform.headerPrefix + apiKey;
    else headers[platform.headerKey] = apiKey;

    const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) return `❌ Lỗi ${res.status}: ${data.error?.message || JSON.stringify(data)}`;
    return platform.parseResponse(data);
  } catch (e) {
    return `❌ Lỗi kết nối: ${e.message}`;
  }
}

// ── CHAT ─────────────────────────────────────────────────────────────────────
// Lưu API configs vào localStorage để ChatTab dùng được
function getSavedConfigs() {
  try { return JSON.parse(localStorage.getItem("ai_configs") || "{}"); } catch { return {}; }
}
function getActiveAI() {
  const saved = getSavedConfigs();
  // Ưu tiên: Claude env → Mistral → OpenAI → Gemini
  const envKey = typeof import.meta !== "undefined" ? import.meta.env?.VITE_ANTHROPIC_KEY : null;
  if (envKey && envKey.startsWith("sk-ant")) return { type: "claude", key: envKey };
  for (const pid of ["mistral", "openai", "gemini"]) {
    if (saved[pid]?.apiKey && saved[pid]?.connected) {
      return { type: pid, key: saved[pid].apiKey, model: saved[pid].model };
    }
  }
  return null;
}

async function callActiveAI(messages) {
  const active = getActiveAI();
  if (!active) return "⚠️ Chưa kết nối AI nào!\nVào tab ⬡ Kết Nối → nhập API Key → Test kết nối trước nhé.";
  if (active.type === "claude") return callClaude(messages);
  const platform = AI_PLATFORMS.find(p => p.id === active.type);
  return callExternalAI(platform, active.key, active.model || platform.defaultModel, messages);
}

// Convert file to base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Call Claude with vision (image support)
async function callClaudeVision(messages, mediaList) {
  const active = getActiveAI();
  const systemPrompt = "Bạn là trợ lý AI cá nhân cho người đi làm Việt Nam. Trả lời tiếng Việt, ngắn gọn thực tế.";

  // Build last user message with media attachments
  const lastMsg = messages[messages.length - 1];
  const contentParts = [];

  // Add media files
  for (const media of mediaList) {
    if (media.type === "image") {
      contentParts.push({ type: "image", source: { type: "base64", media_type: media.mimeType, data: media.base64 } });
    } else if (media.type === "video") {
      // Video: describe it as text since most APIs don't support video
      contentParts.push({ type: "text", text: `[Video đính kèm: ${media.name} — ${(media.size/1024/1024).toFixed(1)}MB. Hãy tư vấn dựa trên mô tả của tôi]` });
    }
  }
  if (lastMsg?.content) contentParts.push({ type: "text", text: lastMsg.content });

  // Build full message history
  const apiMessages = messages.slice(0, -1).map(m => ({ role: m.role, content: m.content }));
  apiMessages.push({ role: "user", content: contentParts });

  if (!active || active.type === "claude") {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system: systemPrompt, messages: apiMessages }),
    });
    const d = await res.json();
    return d.content?.[0]?.text || "Có lỗi xảy ra.";
  }

  // For other AIs: convert image to OpenAI vision format
  const platform = AI_PLATFORMS.find(p => p.id === active.type);
  const openaiContent = [];
  for (const media of mediaList) {
    if (media.type === "image") openaiContent.push({ type: "image_url", image_url: { url: `data:${media.mimeType};base64,${media.base64}` } });
    else openaiContent.push({ type: "text", text: `[Video: ${media.name}]` });
  }
  if (lastMsg?.content) openaiContent.push({ type: "text", text: lastMsg.content });

  const body = { model: active.model || platform.defaultModel, max_tokens: 1000, messages: [{ role: "system", content: systemPrompt }, ...messages.slice(0, -1).map(m => ({ role: m.role, content: m.content })), { role: "user", content: openaiContent }] };
  return callExternalAI(platform, active.key, active.model || platform.defaultModel, [], systemPrompt).catch(() => callClaude(apiMessages, systemPrompt));
}

function ChatTab() {
  const activeAI = getActiveAI();
  const activePlatform = activeAI ? AI_PLATFORMS.find(p => p.id === activeAI.type) : null;
  const aiName = activePlatform?.name || "AI";
  const aiColor = activePlatform?.color || "#ffd86e";

  const [messages, setMessages] = useState([{
    role: "assistant", content: activeAI ? `Xin chào! Đang dùng ${aiName} — hỏi bất cứ điều gì nhé ✦` : "⚠️ Chưa kết nối AI!\nVào tab ⬡ Kết Nối → nhập API Key → Test kết nối."
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mediaFiles, setMediaFiles] = useState([]); // [{type, name, url, base64, mimeType, size}]
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const processFiles = async (files) => {
    const newMedia = [];
    for (const file of Array.from(files)) {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      if (!isImage && !isVideo) continue;
      const base64 = await fileToBase64(file);
      newMedia.push({ type: isImage ? "image" : "video", name: file.name, url: URL.createObjectURL(file), base64, mimeType: file.type, size: file.size });
    }
    setMediaFiles(prev => [...prev, ...newMedia].slice(0, 4)); // max 4 files
  };

  const removeMedia = (idx) => setMediaFiles(prev => prev.filter((_, i) => i !== idx));

  const handleDrop = (e) => { e.preventDefault(); setIsDragging(false); processFiles(e.dataTransfer.files); };
  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg && mediaFiles.length === 0) return;
    setInput("");

    // Build display message
    const displayContent = msg || (mediaFiles.length > 0 ? `[Đã gửi ${mediaFiles.length} file]` : "");
    const userMsg = { role: "user", content: displayContent, media: mediaFiles };
    const next = [...messages, userMsg];
    setMessages(next);
    setLoading(true);

    const apiMessages = next.slice(1).map(m => ({ role: m.role, content: m.content }));
    let reply;
    if (mediaFiles.length > 0) {
      reply = await callClaudeVision(apiMessages, mediaFiles);
    } else {
      reply = await callActiveAI(apiMessages);
    }
    setMediaFiles([]);
    setMessages([...next, { role: "assistant", content: reply }]);
    setLoading(false);
  };

  const canSend = (input.trim() || mediaFiles.length > 0) && !loading;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}
      onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}>

      {/* Drag overlay */}
      {isDragging && (
        <div style={{ position: "absolute", inset: 0, background: `${aiColor}18`, border: `2px dashed ${aiColor}`, borderRadius: 24, zIndex: 99, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <div style={{ color: aiColor, fontSize: 16, fontWeight: 700 }}>Thả file vào đây 📎</div>
        </div>
      )}

      {/* AI badge + quick prompts */}
      <div style={{ padding: "8px 14px", borderBottom: "1px solid rgba(255,220,100,0.1)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: activeAI ? aiColor : "#ff6b6b", boxShadow: `0 0 5px ${activeAI ? aiColor : "#ff6b6b"}` }} />
          <span style={{ color: activeAI ? aiColor : "#ff6b6b", fontSize: 11, fontWeight: 600 }}>
            {activeAI ? `${aiName} · Hỗ trợ hình ảnh & video` : "Chưa kết nối AI"}
          </span>
        </div>
        <div style={{ display: "flex", gap: 5, overflowX: "auto", paddingBottom: 2 }}>
          {QUICK_PROMPTS.map(q => <button key={q} onClick={() => send(q)} style={{ flexShrink: 0, background: `${aiColor}14`, border: `1px solid ${aiColor}33`, borderRadius: 20, color: aiColor, fontSize: 11, padding: "4px 9px", cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit" }}>{q}</button>)}
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start", gap: 5 }}>
            {/* Media preview in message */}
            {m.media?.length > 0 && (
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", justifyContent: "flex-end", maxWidth: "85%" }}>
                {m.media.map((med, mi) => (
                  <div key={mi} style={{ position: "relative", borderRadius: 10, overflow: "hidden", border: `1px solid ${aiColor}44` }}>
                    {med.type === "image"
                      ? <img src={med.url} alt={med.name} style={{ width: 120, height: 90, objectFit: "cover", display: "block" }} />
                      : <div style={{ width: 120, height: 70, background: "rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
                          <span style={{ fontSize: 22 }}>🎬</span>
                          <span style={{ color: "#888", fontSize: 10, textAlign: "center", padding: "0 4px" }}>{med.name.slice(0, 16)}</span>
                        </div>
                    }
                  </div>
                ))}
              </div>
            )}
            {m.content && (
              <div style={{ maxWidth: "82%", padding: "9px 13px", borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: m.role === "user" ? `linear-gradient(135deg,${aiColor},${aiColor}bb)` : "rgba(255,255,255,0.06)", color: m.role === "user" ? "#1a1410" : "#e8dcc8", fontSize: 13.5, lineHeight: 1.55, border: m.role === "assistant" ? `1px solid ${aiColor}22` : "none", whiteSpace: "pre-wrap" }}>{m.content}</div>
            )}
          </div>
        ))}
        {loading && <div style={{ display: "flex", gap: 5, padding: "8px 12px" }}>{[0,1,2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: aiColor, animation: "bounce 1.2s infinite", animationDelay: `${i*0.2}s` }} />)}</div>}
        <div ref={bottomRef} />
      </div>

      {/* Media preview strip */}
      {mediaFiles.length > 0 && (
        <div style={{ padding: "8px 14px 4px", borderTop: "1px solid rgba(255,220,100,0.08)", display: "flex", gap: 7, overflowX: "auto" }}>
          {mediaFiles.map((med, i) => (
            <div key={i} style={{ position: "relative", flexShrink: 0 }}>
              {med.type === "image"
                ? <img src={med.url} alt="" style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 8, border: `1px solid ${aiColor}44`, display: "block" }} />
                : <div style={{ width: 60, height: 60, borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2 }}>
                    <span style={{ fontSize: 18 }}>🎬</span>
                    <span style={{ color: "#777", fontSize: 9 }}>{(med.size/1024/1024).toFixed(1)}MB</span>
                  </div>
              }
              <button onClick={() => removeMedia(i)} style={{ position: "absolute", top: -5, right: -5, width: 18, height: 18, borderRadius: "50%", background: "#ff6b6b", border: "none", color: "#fff", fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>✕</button>
            </div>
          ))}
          <div style={{ color: "#555", fontSize: 10, alignSelf: "center", flexShrink: 0 }}>{mediaFiles.length}/4</div>
        </div>
      )}

      {/* Input bar */}
      <div style={{ padding: "8px 14px 10px", borderTop: mediaFiles.length > 0 ? "none" : "1px solid rgba(255,220,100,0.1)", display: "flex", alignItems: "flex-end", gap: 8 }}>
        {/* Hidden file input */}
        <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple style={{ display: "none" }} onChange={e => processFiles(e.target.files)} />

        {/* Attach button */}
        <button onClick={() => fileInputRef.current?.click()} style={{ width: 38, height: 38, borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#888", fontSize: 17, cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}
          onMouseEnter={e => { e.target.style.borderColor = aiColor; e.target.style.color = aiColor; }}
          onMouseLeave={e => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.color = "#888"; }}>
          📎
        </button>

        {/* Text input */}
        <textarea value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Nhắn tin, hoặc kéo thả ảnh/video vào đây..." rows={1}
          style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: `1px solid ${isDragging ? aiColor : "rgba(255,220,100,0.2)"}`, borderRadius: 18, color: "#e8dcc8", padding: "10px 14px", fontSize: 13, outline: "none", fontFamily: "inherit", resize: "none", lineHeight: 1.4, maxHeight: 80, overflowY: "auto" }}
        />

        {/* Send button */}
        <button onClick={() => send()} disabled={!canSend} style={{ width: 38, height: 38, borderRadius: "50%", background: canSend ? `linear-gradient(135deg,${aiColor},${aiColor}bb)` : "rgba(255,220,100,0.08)", border: "none", color: canSend ? "#1a1410" : "#555", fontSize: 16, cursor: canSend ? "pointer" : "not-allowed", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>↑</button>
      </div>
    </div>
  );
}

// ── TASKS ─────────────────────────────────────────────────────────────────────
function TasksTab() {
  const [tasks, setTasks] = useState([{ id: 1, text: "Gửi báo cáo tuần", done: false, priority: "high" }, { id: 2, text: "Họp team sáng thứ 2", done: false, priority: "mid" }, { id: 3, text: "Nộp đơn xin nghỉ phép", done: true, priority: "low" }]);
  const [input, setInput] = useState(""); const [aiSuggesting, setAiSuggesting] = useState(false); const [aiTip, setAiTip] = useState("");
  const addTask = () => { if (!input.trim()) return; setTasks([...tasks, { id: Date.now(), text: input.trim(), done: false, priority: "mid" }]); setInput(""); };
  const toggle = id => setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const remove = id => setTasks(tasks.filter(t => t.id !== id));
  const getAiTip = async () => { setAiSuggesting(true); const pending = tasks.filter(t => !t.done).map(t => t.text).join(", "); const tip = await callClaude([{ role: "user", content: `Việc cần làm: ${pending || "chưa có gì"}. Gợi ý sắp xếp ưu tiên và 1-2 mẹo năng suất. 3-4 dòng.` }]); setAiTip(tip); setAiSuggesting(false); };
  const pc = { high: "#ff6b6b", mid: "#ffd86e", low: "#69db7c" }; const pl = { high: "Gấp", mid: "Thường", low: "Nhẹ" };
  const done = tasks.filter(t => t.done).length; const pct = tasks.length ? Math.round(done / tasks.length * 100) : 0;
  return (
    <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 11, height: "100%", overflowY: "auto" }}>
      <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "11px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}><span style={{ color: "#e8dcc8", fontSize: 13 }}>Tiến độ hôm nay</span><span style={{ color: "#ffd86e", fontWeight: 700, fontSize: 13 }}>{done}/{tasks.length}</span></div>
        <div style={{ height: 5, background: "rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" }}><div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#ffd86e,#69db7c)", borderRadius: 3, transition: "width 0.4s" }} /></div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addTask()} placeholder="Thêm việc cần làm..." style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,220,100,0.2)", borderRadius: 10, color: "#e8dcc8", padding: "9px 13px", fontSize: 13, outline: "none", fontFamily: "inherit" }} />
        <button onClick={addTask} style={{ background: "linear-gradient(135deg,#ffd86e,#ffb347)", border: "none", borderRadius: 10, color: "#1a1410", fontWeight: 700, padding: "0 14px", cursor: "pointer", fontSize: 18 }}>+</button>
      </div>
      <button onClick={getAiTip} disabled={aiSuggesting} style={{ background: "rgba(105,219,124,0.1)", border: "1px solid rgba(105,219,124,0.3)", borderRadius: 10, color: "#69db7c", padding: "9px 14px", fontSize: 12.5, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>{aiSuggesting ? "Đang phân tích..." : "✦ AI gợi ý sắp xếp công việc"}</button>
      {aiTip && <div style={{ background: "rgba(105,219,124,0.06)", border: "1px solid rgba(105,219,124,0.2)", borderRadius: 10, padding: "11px 13px", color: "#b8f5c8", fontSize: 12.5, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{aiTip}</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {tasks.map(t => (
          <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 9, background: t.done ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.05)", border: `1px solid ${t.done ? "rgba(255,255,255,0.05)" : "rgba(255,220,100,0.1)"}`, borderRadius: 10, padding: "9px 11px", opacity: t.done ? 0.5 : 1 }}>
            <div onClick={() => toggle(t.id)} style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, cursor: "pointer", background: t.done ? "#69db7c" : "transparent", border: `2px solid ${t.done ? "#69db7c" : "rgba(255,220,100,0.3)"}`, display: "flex", alignItems: "center", justifyContent: "center", color: "#1a1410", fontSize: 11, fontWeight: 700 }}>{t.done && "✓"}</div>
            <span style={{ flex: 1, color: "#e8dcc8", fontSize: 13, textDecoration: t.done ? "line-through" : "none" }}>{t.text}</span>
            <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 8, background: `${pc[t.priority]}22`, color: pc[t.priority] }}>{pl[t.priority]}</span>
            <button onClick={() => remove(t.id)} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 14, padding: 0 }}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── OFFICE ─────────────────────────────────────────────────────────────────────
function OfficeTab() {
  const [selected, setSelected] = useState(null); const [topic, setTopic] = useState(""); const [result, setResult] = useState(""); const [loading, setLoading] = useState(false); const [copied, setCopied] = useState(false);
  const generate = async () => { if (!topic.trim() || !selected) return; setLoading(true); setResult(""); const tpl = OFFICE_TEMPLATES.find(t => t.id === selected); const reply = await callClaude([{ role: "user", content: tpl.prompt + topic }], "Bạn là chuyên gia văn phòng người Việt. Tạo nội dung chuyên nghiệp, phù hợp văn hóa công sở Việt Nam."); setResult(reply); setLoading(false); };
  const copy = () => { navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 13, height: "100%", overflowY: "auto" }}>
      <div><div style={{ color: "#665f52", fontSize: 10, marginBottom: 7, letterSpacing: 1, textTransform: "uppercase" }}>Chọn loại nội dung</div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>{OFFICE_TEMPLATES.map(t => <button key={t.id} onClick={() => setSelected(t.id)} style={{ background: selected === t.id ? "rgba(255,220,100,0.15)" : "rgba(255,255,255,0.04)", border: `1px solid ${selected === t.id ? "rgba(255,220,100,0.5)" : "rgba(255,255,255,0.08)"}`, borderRadius: 10, color: selected === t.id ? "#ffd86e" : "#b0a898", padding: "10px 12px", fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: selected === t.id ? 600 : 400 }}>{t.label}</button>)}</div></div>
      <div><div style={{ color: "#665f52", fontSize: 10, marginBottom: 7, letterSpacing: 1, textTransform: "uppercase" }}>Chủ đề</div><textarea value={topic} onChange={e => setTopic(e.target.value)} placeholder={selected ? OFFICE_TEMPLATES.find(t => t.id === selected)?.prompt + "..." : "Chọn loại nội dung trước..."} rows={3} style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,220,100,0.2)", borderRadius: 10, color: "#e8dcc8", padding: "10px 13px", fontSize: 13, outline: "none", fontFamily: "inherit", resize: "none", boxSizing: "border-box" }} /></div>
      <button onClick={generate} disabled={!selected || !topic.trim() || loading} style={{ background: selected && topic.trim() ? "linear-gradient(135deg,#ffd86e,#ffb347)" : "rgba(255,220,100,0.1)", border: "none", borderRadius: 10, color: selected && topic.trim() ? "#1a1410" : "#555", padding: "12px", fontSize: 14, fontWeight: 700, cursor: selected && topic.trim() ? "pointer" : "not-allowed", fontFamily: "inherit" }}>{loading ? "Đang tạo..." : "✦ Tạo nội dung AI"}</button>
      {result && <div style={{ position: "relative" }}><div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,220,100,0.15)", borderRadius: 10, padding: "13px", color: "#e8dcc8", fontSize: 13, lineHeight: 1.65, whiteSpace: "pre-wrap", maxHeight: 260, overflowY: "auto" }}>{result}</div><button onClick={copy} style={{ position: "absolute", top: 9, right: 9, background: copied ? "#69db7c22" : "rgba(255,220,100,0.1)", border: `1px solid ${copied ? "#69db7c66" : "rgba(255,220,100,0.2)"}`, borderRadius: 6, color: copied ? "#69db7c" : "#ffd86e", padding: "4px 9px", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>{copied ? "✓ Đã chép" : "Sao chép"}</button></div>}
    </div>
  );
}

// ── ENTERTAINMENT ─────────────────────────────────────────────────────────────
function EntertainTab() {
  const [subTab, setSubTab] = useState("news"); const [loading, setLoading] = useState(false); const [result, setResult] = useState("");
  const [newsCategory, setNewsCategory] = useState("Công nghệ"); const [movieGenres, setMovieGenres] = useState([]); const [movieMood, setMovieMood] = useState(""); const [musicGenres, setMusicGenres] = useState([]); const [musicMood, setMusicMood] = useState("");
  const [searchHistory, setSearchHistory] = useState(["hành động","lo-fi","công nghệ AI"]); const [historyInput, setHistoryInput] = useState("");
  const addHistory = () => { if (!historyInput.trim()) return; setSearchHistory(prev => [historyInput.trim(), ...prev].slice(0, 5)); setHistoryInput(""); };
  const toggleArr = (arr, setArr, val) => setArr(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);
  const fetchContent = async () => {
    setLoading(true); setResult(""); const hist = searchHistory.join(", "); let prompt = "", sys = "";
    if (subTab === "news") { prompt = `Tìm 4-5 tin tức MỚI NHẤT hôm nay về: ${newsCategory}. Sở thích: ${hist}. Mỗi tin: 📌 Tiêu đề — tóm tắt 1-2 câu.`; sys = "Biên tập viên tin tức Việt Nam. Tin mới nhất trong ngày."; }
    else if (subTab === "movie") { const g = movieGenres.length ? movieGenres.join(", ") : "mọi thể loại"; prompt = `Gợi ý 4-5 phim hay đang hot. Thể loại: ${g}. Tâm trạng: ${movieMood || "bất kỳ"}. Sở thích: ${hist}. Mỗi phim: 🎬 Tên (năm) — mô tả ngắn.`; sys = "Chuyên gia phim ảnh. Phim đang hot trên Netflix/iQIYI."; }
    else { const g = musicGenres.length ? musicGenres.join(", ") : "mọi thể loại"; prompt = `Gợi ý 5-6 bài hát trending. Thể loại: ${g}. Cảm xúc: ${musicMood || "bất kỳ"}. Sở thích: ${hist}. Mỗi bài: 🎵 Tên — Ca sĩ.`; sys = "DJ và chuyên gia âm nhạc Việt Nam."; }
    const reply = await callClaudeSearch([{ role: "user", content: prompt }], sys); setResult(reply); setLoading(false);
  };
  const Chip = ({ label, active, onClick, color = "#ff9999" }) => <button onClick={onClick} style={{ flexShrink: 0, background: active ? `${color}25` : "rgba(255,255,255,0.04)", border: `1px solid ${active ? `${color}55` : "rgba(255,255,255,0.08)"}`, borderRadius: 20, color: active ? color : "#777", padding: "5px 11px", fontSize: 11.5, cursor: "pointer", fontFamily: "inherit" }}>{label}</button>;
  const SUBTABS = [{ id: "news", label: "📰 Tin" }, { id: "movie", label: "🎬 Phim" }, { id: "music", label: "🎵 Nhạc" }];
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ display: "flex", borderBottom: "1px solid rgba(255,150,150,0.1)", padding: "0 14px", flexShrink: 0 }}>
        {SUBTABS.map(s => <button key={s.id} onClick={() => { setSubTab(s.id); setResult(""); }} style={{ flex: 1, padding: "8px 2px 9px", background: "none", border: "none", borderBottom: `2px solid ${subTab === s.id ? "#ff9999" : "transparent"}`, color: subTab === s.id ? "#ff9999" : "#665f52", fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: subTab === s.id ? 700 : 400 }}>{s.label}</button>)}
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ background: "rgba(255,107,107,0.05)", border: "1px solid rgba(255,107,107,0.15)", borderRadius: 11, padding: "10px 12px" }}>
          <div style={{ color: "#ff9999", fontSize: 10, letterSpacing: 1, textTransform: "uppercase", marginBottom: 7 }}>◎ Sở thích của bạn</div>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 8 }}>{searchHistory.map((h, i) => <span key={i} style={{ background: "rgba(255,107,107,0.12)", border: "1px solid rgba(255,107,107,0.22)", borderRadius: 12, color: "#ffb3b3", fontSize: 11, padding: "3px 9px" }}>#{h}</span>)}</div>
          <div style={{ display: "flex", gap: 7 }}><input value={historyInput} onChange={e => setHistoryInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addHistory()} placeholder="Thêm sở thích..." style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,107,107,0.2)", borderRadius: 8, color: "#e8dcc8", padding: "6px 10px", fontSize: 12, outline: "none", fontFamily: "inherit" }} /><button onClick={addHistory} style={{ background: "rgba(255,107,107,0.15)", border: "1px solid rgba(255,107,107,0.3)", borderRadius: 8, color: "#ff9999", padding: "0 10px", cursor: "pointer", fontSize: 15 }}>+</button></div>
        </div>
        {subTab === "news" && <div><div style={{ color: "#665f52", fontSize: 10, marginBottom: 7, letterSpacing: 1, textTransform: "uppercase" }}>Chủ đề</div><div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>{NEWS_CATS.map(c => <Chip key={c} label={c} active={newsCategory === c} onClick={() => setNewsCategory(c)} />)}</div></div>}
        {subTab === "movie" && <><div><div style={{ color: "#665f52", fontSize: 10, marginBottom: 7, letterSpacing: 1, textTransform: "uppercase" }}>Thể loại</div><div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>{ENT_GENRES_MOVIE.map(g => <Chip key={g} label={g} active={movieGenres.includes(g)} onClick={() => toggleArr(movieGenres, setMovieGenres, g)} color="#c792ea" />)}</div></div><div><div style={{ color: "#665f52", fontSize: 10, marginBottom: 7, letterSpacing: 1, textTransform: "uppercase" }}>Tâm trạng</div><div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>{ENT_MOODS.map(m => <Chip key={m} label={m} active={movieMood === m} onClick={() => setMovieMood(movieMood === m ? "" : m)} color="#c792ea" />)}</div></div></>}
        {subTab === "music" && <><div><div style={{ color: "#665f52", fontSize: 10, marginBottom: 7, letterSpacing: 1, textTransform: "uppercase" }}>Thể loại nhạc</div><div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>{ENT_GENRES_MUSIC.map(g => <Chip key={g} label={g} active={musicGenres.includes(g)} onClick={() => toggleArr(musicGenres, setMusicGenres, g)} color="#82aaff" />)}</div></div><div><div style={{ color: "#665f52", fontSize: 10, marginBottom: 7, letterSpacing: 1, textTransform: "uppercase" }}>Đang cảm thấy</div><div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>{ENT_MOODS.map(m => <Chip key={m} label={m} active={musicMood === m} onClick={() => setMusicMood(musicMood === m ? "" : m)} color="#82aaff" />)}</div></div></>}
        <button onClick={fetchContent} disabled={loading} style={{ background: loading ? "rgba(255,107,107,0.08)" : "linear-gradient(135deg,#ff6b6b,#ee5a24)", border: "none", borderRadius: 11, color: loading ? "#555" : "#fff", padding: "12px", fontSize: 13.5, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
          {loading ? "Đang tìm kiếm..." : subTab === "news" ? "◎ Cập nhật tin mới" : subTab === "movie" ? "🎬 Gợi ý phim" : "🎵 Gợi ý nhạc"}
        </button>
        {loading && <div style={{ display: "flex", justifyContent: "center", gap: 6, padding: 8 }}>{[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff9999", animation: "bounce 1.2s infinite", animationDelay: `${i*0.2}s` }} />)}</div>}
        {result && !loading && <div style={{ background: "rgba(255,107,107,0.04)", border: "1px solid rgba(255,107,107,0.15)", borderRadius: 12, padding: 14, color: "#e8dcc8", fontSize: 13, lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{result}</div>}
      </div>
    </div>
  );
}

// ── CONNECT TAB ───────────────────────────────────────────────────────────────
function ConnectTab() {
  const [configs, setConfigs] = useState(() => {
    const saved = getSavedConfigs();
    const initial = {};
    AI_PLATFORMS.forEach(p => {
      initial[p.id] = saved[p.id] || { apiKey: "", model: p.defaultModel, connected: false };
    });
    initial["claude"].connected = true;
    initial["claude"].apiKey = "managed";
    return initial;
  });
  const [selected, setSelected] = useState(null);
  const [testMsg, setTestMsg] = useState("");
  const [testResult, setTestResult] = useState("");
  const [testing, setTesting] = useState(false);
  const [showKey, setShowKey] = useState({});
  const [activeChat, setActiveChat] = useState(null);
  const [chatInput, setChatInput] = useState("");
  const [chatMsgs, setChatMsgs] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

  const updateConfig = (id, field, val) => setConfigs(prev => ({ ...prev, [id]: { ...prev[id], [field]: val } }));

  const testConnection = async (platform) => {
    if (platform.id === "claude") { setTestResult("✅ Claude luôn hoạt động — đã được tích hợp sẵn!"); return; }
    const cfg = configs[platform.id];
    if (!cfg.apiKey.trim()) { setTestResult("⚠️ Vui lòng nhập API Key trước!"); return; }
    setTesting(true); setTestResult("");
    const reply = await callExternalAI(platform, cfg.apiKey, cfg.model, [{ role: "user", content: "Xin chào! Trả lời 1 câu ngắn tiếng Việt." }]);
    const ok = !reply.startsWith("❌");
    setTestResult(ok ? `✅ Kết nối thành công!\n${reply}` : reply);
    if (ok) {
      updateConfig(platform.id, "connected", true);
      // Lưu vào localStorage để ChatTab dùng được
      const saved = getSavedConfigs();
      saved[platform.id] = { apiKey: cfg.apiKey, model: cfg.model, connected: true };
      localStorage.setItem("ai_configs", JSON.stringify(saved));
    }
    setTesting(false);
  };

  const sendChat = async () => {
    if (!chatInput.trim() || !activeChat) return;
    const platform = AI_PLATFORMS.find(p => p.id === activeChat);
    const cfg = configs[activeChat];
    const newMsgs = [...chatMsgs, { role: "user", content: chatInput }];
    setChatMsgs(newMsgs); setChatInput(""); setChatLoading(true);
    let reply;
    if (activeChat === "claude") reply = await callClaude(newMsgs.map(m => ({ role: m.role, content: m.content })));
    else reply = await callExternalAI(platform, cfg.apiKey, cfg.model, newMsgs.map(m => ({ role: m.role, content: m.content })));
    setChatMsgs([...newMsgs, { role: "assistant", content: reply }]); setChatLoading(false);
  };

  const bottomRef = useRef(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMsgs]);

  if (activeChat) {
    const platform = AI_PLATFORMS.find(p => p.id === activeChat);
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <div style={{ padding: "10px 14px", borderBottom: `1px solid ${platform.color}33`, display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <button onClick={() => { setActiveChat(null); setChatMsgs([]); }} style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: 18, padding: 0 }}>←</button>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: `${platform.color}22`, border: `1px solid ${platform.color}44`, display: "flex", alignItems: "center", justifyContent: "center", color: platform.color, fontSize: 14 }}>{platform.icon}</div>
          <div>
            <div style={{ color: platform.color, fontSize: 13, fontWeight: 700 }}>{platform.name}</div>
            <div style={{ color: "#665f52", fontSize: 10 }}>{configs[activeChat].model}</div>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
          {chatMsgs.length === 0 && <div style={{ color: "#555", fontSize: 13, textAlign: "center", marginTop: 20 }}>Bắt đầu trò chuyện với {platform.name}...</div>}
          {chatMsgs.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{ maxWidth: "82%", padding: "10px 14px", borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: m.role === "user" ? `linear-gradient(135deg,${platform.color},${platform.color}aa)` : "rgba(255,255,255,0.06)", color: m.role === "user" ? "#1a1410" : "#e8dcc8", fontSize: 13, lineHeight: 1.55, border: m.role === "assistant" ? `1px solid ${platform.color}22` : "none", whiteSpace: "pre-wrap" }}>{m.content}</div>
            </div>
          ))}
          {chatLoading && <div style={{ display: "flex", gap: 5, padding: "8px 12px" }}>{[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: platform.color, animation: "bounce 1.2s infinite", animationDelay: `${i*0.2}s` }} />)}</div>}
          <div ref={bottomRef} />
        </div>
        <div style={{ padding: "10px 14px", borderTop: `1px solid ${platform.color}22`, display: "flex", gap: 8 }}>
          <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendChat()} placeholder={`Nhắn tin với ${platform.name}...`} style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: `1px solid ${platform.color}33`, borderRadius: 24, color: "#e8dcc8", padding: "10px 16px", fontSize: 13, outline: "none", fontFamily: "inherit" }} />
          <button onClick={sendChat} disabled={chatLoading || !chatInput.trim()} style={{ width: 40, height: 40, borderRadius: "50%", background: chatInput.trim() ? `linear-gradient(135deg,${platform.color},${platform.color}aa)` : "rgba(255,255,255,0.06)", border: "none", color: "#1a1410", fontSize: 16, cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>↑</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12, height: "100%", overflowY: "auto" }}>
      <div style={{ color: "#665f52", fontSize: 10, letterSpacing: 1, textTransform: "uppercase" }}>Nền tảng AI</div>

      {AI_PLATFORMS.map(platform => {
        const cfg = configs[platform.id];
        const isOpen = selected === platform.id;
        const isClaude = platform.id === "claude";
        return (
          <div key={platform.id} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${cfg.connected ? platform.color + "44" : "rgba(255,255,255,0.08)"}`, borderRadius: 14, overflow: "hidden", transition: "all 0.2s" }}>
            {/* Platform header */}
            <div onClick={() => setSelected(isOpen ? null : platform.id)} style={{ display: "flex", alignItems: "center", gap: 11, padding: "12px 14px", cursor: "pointer" }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${platform.color}18`, border: `1px solid ${platform.color}33`, display: "flex", alignItems: "center", justifyContent: "center", color: platform.color, fontSize: 16, flexShrink: 0 }}>{platform.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ color: "#e8dcc8", fontSize: 14, fontWeight: 600 }}>{platform.name}</span>
                  <span style={{ fontSize: 9, color: "#665f52" }}>{platform.company}</span>
                </div>
                <div style={{ color: "#665f52", fontSize: 11, marginTop: 1 }}>{platform.desc}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {cfg.connected && <div style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 6, height: 6, borderRadius: "50%", background: "#69db7c", boxShadow: "0 0 5px #69db7c" }} /><span style={{ color: "#69db7c", fontSize: 10 }}>Kết nối</span></div>}
                <span style={{ color: "#555", fontSize: 14, transform: isOpen ? "rotate(180deg)" : "none", transition: "0.2s" }}>▾</span>
              </div>
            </div>

            {/* Expanded config */}
            {isOpen && (
              <div style={{ padding: "0 14px 14px", display: "flex", flexDirection: "column", gap: 10, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                {isClaude ? (
                  <div style={{ background: `${platform.color}11`, border: `1px solid ${platform.color}33`, borderRadius: 10, padding: "10px 12px", marginTop: 10 }}>
                    <div style={{ color: platform.color, fontSize: 12, fontWeight: 600, marginBottom: 4 }}>✦ Claude được tích hợp sẵn</div>
                    <div style={{ color: "#888", fontSize: 11.5, lineHeight: 1.6 }}>Không cần API Key. Claude Sonnet đang chạy mặc định trong toàn bộ app này.</div>
                  </div>
                ) : (
                  <>
                    <div style={{ marginTop: 10 }}>
                      <div style={{ color: "#665f52", fontSize: 10, marginBottom: 6, letterSpacing: 1, textTransform: "uppercase" }}>API Key</div>
                      <div style={{ position: "relative" }}>
                        <input type={showKey[platform.id] ? "text" : "password"} value={cfg.apiKey} onChange={e => updateConfig(platform.id, "apiKey", e.target.value)} placeholder={`Nhập ${platform.name} API Key...`}
                          style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: `1px solid ${platform.color}33`, borderRadius: 9, color: "#e8dcc8", padding: "9px 40px 9px 12px", fontSize: 12, outline: "none", fontFamily: "monospace", boxSizing: "border-box" }} />
                        <button onClick={() => setShowKey(prev => ({ ...prev, [platform.id]: !prev[platform.id] }))} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 14 }}>{showKey[platform.id] ? "🙈" : "👁"}</button>
                      </div>
                      <div style={{ marginTop: 5, display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ color: "#555", fontSize: 11 }}>Lấy key tại:</span>
                        <span style={{ color: platform.color, fontSize: 11 }}>{platform.docs}</span>
                      </div>
                    </div>

                    <div>
                      <div style={{ color: "#665f52", fontSize: 10, marginBottom: 6, letterSpacing: 1, textTransform: "uppercase" }}>Model</div>
                      <select value={cfg.model} onChange={e => updateConfig(platform.id, "model", e.target.value)} style={{ width: "100%", background: "#1a160f", border: `1px solid ${platform.color}33`, borderRadius: 9, color: "#e8dcc8", padding: "9px 12px", fontSize: 12, outline: "none", fontFamily: "inherit" }}>
                        {platform.models.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                  </>
                )}

                <div style={{ display: "flex", gap: 8 }}>
                  {!isClaude && (
                    <button onClick={() => testConnection(platform)} disabled={testing} style={{ flex: 1, background: testing ? "rgba(255,255,255,0.05)" : `${platform.color}22`, border: `1px solid ${platform.color}44`, borderRadius: 9, color: platform.color, padding: "9px", fontSize: 12.5, fontWeight: 600, cursor: testing ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
                      {testing ? "Đang test..." : "⚡ Test kết nối"}
                    </button>
                  )}
                  {cfg.connected && (
                    <button onClick={() => { setActiveChat(platform.id); setChatMsgs([]); }} style={{ flex: 1, background: `linear-gradient(135deg,${platform.color},${platform.color}bb)`, border: "none", borderRadius: 9, color: "#1a1410", padding: "9px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                      💬 Chat ngay
                    </button>
                  )}
                </div>

                {testResult && selected === platform.id && (
                  <div style={{ background: testResult.startsWith("✅") ? "rgba(105,219,124,0.08)" : "rgba(255,107,107,0.08)", border: `1px solid ${testResult.startsWith("✅") ? "rgba(105,219,124,0.25)" : "rgba(255,107,107,0.25)"}`, borderRadius: 9, padding: "10px 12px", color: testResult.startsWith("✅") ? "#b8f5c8" : "#ffb3b3", fontSize: 12, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{testResult}</div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Coming soon */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)", borderRadius: 14, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", color: "#444", fontSize: 16 }}>+</div>
        <div><div style={{ color: "#444", fontSize: 13 }}>Sắp có thêm</div><div style={{ color: "#333", fontSize: 11, marginTop: 2 }}>Grok, DeepSeek, Llama...</div></div>
      </div>
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("chat");
  return (
    <div style={{ minHeight: "100vh", background: "#0f0d0a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Georgia','Times New Roman',serif", padding: 16 }}>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 3px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: rgba(255,220,100,0.15); border-radius: 2px; }
        input::placeholder, textarea::placeholder { color: #44403c; }
        select option { background: #1a160f; }
        @keyframes bounce { 0%,80%,100% { transform:translateY(0);opacity:0.4; } 40% { transform:translateY(-6px);opacity:1; } }
      `}</style>
      <div style={{ width: "100%", maxWidth: 420, background: "linear-gradient(160deg,#1a160f 0%,#120f08 100%)", borderRadius: 24, border: "1px solid rgba(255,220,100,0.15)", boxShadow: "0 32px 80px rgba(0,0,0,0.6),inset 0 1px 0 rgba(255,220,100,0.08)", overflow: "hidden", height: 650, display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div style={{ padding: "14px 18px 11px", borderBottom: "1px solid rgba(255,220,100,0.1)", background: "linear-gradient(180deg,rgba(255,220,100,0.05) 0%,transparent 100%)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg,#ffd86e,#ffb347)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#1a1410", fontWeight: 900 }}>✦</div>
            <div><div style={{ color: "#ffd86e", fontSize: 14, fontWeight: 700 }}>Trợ Lý AI</div><div style={{ color: "#665f52", fontSize: 10 }}>Dành cho người đi làm</div></div>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#69db7c", boxShadow: "0 0 6px #69db7c" }} />
              <span style={{ color: "#69db7c", fontSize: 11 }}>Online</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", padding: "6px 10px 0", borderBottom: "1px solid rgba(255,220,100,0.08)", flexShrink: 0 }}>
          {TABS.map(t => {
            const isActive = tab === t.id;
            const color = t.id === "entertain" ? "#ff9999" : t.id === "connect" ? "#82aaff" : "#ffd86e";
            return (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: "5px 1px 8px", background: "none", border: "none", borderBottom: `2px solid ${isActive ? color : "transparent"}`, color: isActive ? color : "#555", fontSize: 10, cursor: "pointer", fontFamily: "inherit", fontWeight: isActive ? 700 : 400, transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 2 }}>
                <span style={{ fontSize: 10 }}>{t.icon}</span>{t.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {tab === "chat" && <ChatTab />}
          {tab === "tasks" && <TasksTab />}
          {tab === "office" && <OfficeTab />}
          {tab === "entertain" && <EntertainTab />}
          {tab === "connect" && <ConnectTab />}
        </div>
      </div>
    </div>
  );
}

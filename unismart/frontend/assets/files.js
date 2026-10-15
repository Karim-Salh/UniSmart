/* UniSmart — ملفات الطالب الخاصة (MYF)
   يقرأ الملفات داخل المتصفح فقط (لا تُرفع إلى أي خادم ولا خدمة خارجية) ثم يحوّلها إلى مقاطع نصية
   يبحث فيها المرشد ويجيب منها. الأنواع المدعومة:
   PDF (مع OCR للصفحات الممسوحة) · Word docx · PowerPoint pptx · Excel xlsx · CSV/TSV · نص/Markdown/JSON/HTML/XML/RTF/SQL/أكواد
   · صور PNG/JPG/WEBP/BMP/GIF (OCR عربي + إنجليزي).
   يعتمد على دوال app.js (chunkText, tableChunks, parseCsv, docxParts, xlsxRows, sqlChunks, unzip) وتُستدعى وقت التشغيل فقط. */
window.MYF = (function () {
  const BASE = (document.currentScript && document.currentScript.src ? document.currentScript.src : location.href).replace(/[^/]*$/, "");
  const MAX_BYTES = 30 * 1024 * 1024, MAX_PDF_PAGES = 400, MAX_OCR_PAGES = 25;
  const TEXT = new Set("txt md markdown log text rst tex srt vtt ini cfg conf yml yaml toml py js mjs ts tsx jsx java c h cpp hpp cs go rs php rb kt swift sh bat ps1 r m scala lua css".split(" "));
  const IMG = new Set("png jpg jpeg webp bmp gif".split(" "));
  const ACCEPT = ".pdf,.docx,.pptx,.xlsx,.csv,.tsv,.txt,.md,.json,.html,.htm,.xml,.rtf,.sql,.png,.jpg,.jpeg,.webp,.bmp,.gif," + [...TEXT].map(x => "." + x).join(",");
  const ext = n => (n.split(".").pop() || "").toLowerCase();
  const fmtSize = b => b < 1024 ? b + " B" : b < 1048576 ? Math.round(b / 1024) + " KB" : (b / 1048576).toFixed(1) + " MB";

  // ---------- أدوات عامة ----------
  function decodeText(buf) {
    const u = new Uint8Array(buf); let s = new TextDecoder("utf-8").decode(u);
    if (s.charCodeAt(0) === 0xFEFF) s = s.slice(1);
    const bad = (s.match(/\uFFFD/g) || []).length;
    if (bad > 3 && bad / Math.max(s.length, 1) > 0.002) { try { s = new TextDecoder("windows-1256").decode(u) } catch (_) {} }   // ملفات عربية قديمة
    return s;
  }
  const loadScript = src => new Promise((ok, no) => { const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = () => no(new Error("تعذّر تحميل مكوّن القراءة (" + src.split("/").pop() + "). شغّل الموقع عبر خادم http/https.")); document.head.appendChild(s) });
  const withPages = (chunks, n, label) => chunks.map(c => ({ ...c, pg: n, pl: label }));
  const textToChunks = (txt, name, pg, pl) => { const ch = chunkText(txt, name); return pg ? withPages(ch, pg, pl) : ch };

  function flattenJson(v, path, out) {
    if (out.length > 6000) return;
    if (Array.isArray(v)) v.forEach((x, i) => flattenJson(x, path + "[" + (i + 1) + "]", out));
    else if (v && typeof v === "object") Object.keys(v).forEach(k => flattenJson(v[k], path ? path + "." + k : k, out));
    else if (v !== null && v !== "") out.push((path ? path + ": " : "") + String(v));
  }
  const rtfText = s => s.replace(/\\'([0-9a-f]{2})/gi, (_, h) => String.fromCharCode(parseInt(h, 16))).replace(/\\u(-?\d+)\??/g, (_, n) => String.fromCharCode(+n < 0 ? +n + 65536 : +n))
    .replace(/\\par[d]?/g, "\n").replace(/\{\\\*[^{}]*\}/g, "").replace(/\\[a-z]+-?\d* ?/gi, "").replace(/[{}]/g, "");
  function htmlText(s) {
    s = s.replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, " ").replace(/<\/(p|div|li|h[1-6]|tr|section|article|br)>|<br\s*\/?>/gi, "\n");
    const d = new DOMParser().parseFromString(s, "text/html"); return (d.body ? d.body.textContent : s).replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n")
  }

  // ---------- PDF ----------
  async function pdfjs() {
    // نسخة كلاسيكية (غير ESM) لتعمل حتى لو فُتح الموقع من ملف محلي file://
    if (!window.pdfjsLib) await loadScript(BASE + "vendor/pdfjs/pdf.min.js");
    if (!window.pdfjsLib) throw new Error("تعذّر تحميل قارئ PDF");
    pdfjsLib.GlobalWorkerOptions.workerSrc = BASE + "vendor/pdfjs/pdf.worker.min.js"; return pdfjsLib;
  }
  function pageText(tc) {
    let out = "", lastY = null;
    for (const it of tc.items) {
      if (!("str" in it)) continue; const y = it.transform ? it.transform[5] : null;
      if (lastY !== null && y !== null && Math.abs(y - lastY) > 3 && out && !out.endsWith("\n")) out += "\n";
      out += it.str; if (it.hasEOL) out += "\n"; else if (it.str && !/\s$/.test(it.str)) out += " ";
      if (y !== null) lastY = y;
    }
    return out.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  }
  async function parsePdf(buf, name, prog) {
    const lib = await pdfjs(); let doc;
    try { doc = await lib.getDocument({ data: new Uint8Array(buf) }).promise } catch (e) { throw new Error(e && e.name === "PasswordException" ? "الملف محمي بكلمة مرور" : "ملف PDF تالف أو غير مدعوم") }
    const n = Math.min(doc.numPages, MAX_PDF_PAGES), out = []; let ocrUsed = 0, empty = 0;
    for (let p = 1; p <= n; p++) {
      prog("قراءة صفحة " + p + " من " + n + "…");
      const page = await doc.getPage(p); let txt = pageText(await page.getTextContent());
      if (txt.replace(/\s/g, "").length < 25) {                               // صفحة ممسوحة ضوئيًا: نحاول OCR
        if (ocrUsed < MAX_OCR_PAGES) {
          try {
            const vp = page.getViewport({ scale: 2 }), cv = document.createElement("canvas"); cv.width = vp.width; cv.height = vp.height;
            await page.render({ canvasContext: cv.getContext("2d"), viewport: vp }).promise; ocrUsed++;
            txt = await ocr(cv, "OCR لصفحة " + p + "…", prog);
          } catch (e) { if (/تعذّر/.test(e.message)) throw e }
        }
      }
      if (txt.trim()) out.push(...textToChunks(txt, name, p, "صفحة")); else empty++;
    }
    return { chunks: out, pages: doc.numPages, note: (doc.numPages > n ? "قرأت أول " + n + " صفحة فقط. " : "") + (ocrUsed ? "طُبّق OCR على " + ocrUsed + " صفحة ممسوحة. " : "") + (empty ? empty + " صفحة بلا نص مقروء." : "") };
  }

  // ---------- OCR (Tesseract محلي: عربي + إنجليزي) ----------
  let ocrW = null;
  async function ocrWorker(prog) {
    if (ocrW) return ocrW;
    prog("تجهيز قارئ الصور (مرة واحدة، قد يستغرق لحظات)…");
    if (!window.Tesseract) await loadScript(BASE + "vendor/ocr/tesseract.min.js");
    ocrW = await Tesseract.createWorker(["ara", "eng"], 1, { workerPath: BASE + "vendor/ocr/worker.min.js", corePath: BASE + "vendor/ocr/tesseract-core.wasm.js", langPath: BASE + "vendor/ocr", gzip: true, workerBlobURL: false, cacheMethod: "none" });
    return ocrW;
  }
  async function ocr(src, msg, prog) {
    const w = await ocrWorker(prog); prog(msg || "قراءة النص من الصورة…");
    const r = await w.recognize(src); return (r && r.data && r.data.text || "").trim();
  }
  async function imageToCanvas(file) {
    const bmp = await createImageBitmap(file), k = Math.min(1, 2400 / Math.max(bmp.width, bmp.height)), up = Math.max(1, 1100 / Math.min(bmp.width, bmp.height));
    const s = k < 1 ? k : Math.min(up, 2), cv = document.createElement("canvas"); cv.width = Math.round(bmp.width * s); cv.height = Math.round(bmp.height * s);
    const cx = cv.getContext("2d"); cx.fillStyle = "#fff"; cx.fillRect(0, 0, cv.width, cv.height); cx.drawImage(bmp, 0, 0, cv.width, cv.height); return cv;
  }

  // ---------- PowerPoint ----------
  async function parsePptx(buf, name) {
    const z = await unzip(buf, /^ppt\/(slides\/slide|notesSlides\/notesSlide)\d+\.xml$/), num = k => +(/(\d+)\.xml$/.exec(k) || [0, 0])[1];
    const tx = x => [...x.replace(/<\/a:p>/g, "<a:t>\n</a:t>").matchAll(/<a:t[^>]*>([^<]*)<\/a:t>/g)].map(m => unx(m[1])).join("").replace(/\n{2,}/g, "\n").trim();
    const slides = Object.keys(z).filter(k => /slides\/slide/.test(k)).sort((a, b) => num(a) - num(b)), notes = {}; Object.keys(z).filter(k => /notesSlide/.test(k)).forEach(k => notes[num(k)] = tx(z[k]));
    if (!slides.length) throw new Error("لا توجد شرائح في الملف");
    const out = []; slides.forEach(k => { const n = num(k), t = tx(z[k]) + (notes[n] ? "\n" + notes[n] : ""); if (t) out.push(...textToChunks(t, name, n, "شريحة")) });
    return { chunks: out, pages: slides.length };
  }

  // ---------- المدخل الرئيسي ----------
  async function parse(file, prog) {
    prog = prog || (() => {}); const name = file.name, e = ext(name);
    if (file.size > MAX_BYTES) throw new Error("الملف أكبر من " + fmtSize(MAX_BYTES));
    if (!file.size) throw new Error("الملف فارغ");
    let r;
    if (e === "pdf") r = await parsePdf(await file.arrayBuffer(), name, prog);
    else if (e === "docx") { const ps = await docxParts(await file.arrayBuffer()); r = { chunks: [...chunkText(ps.filter(q => q.t === "p").map(q => q.text).join("\n"), name), ...ps.filter(q => q.t === "tbl").flatMap((q, i) => tableChunks(q.rows, name, "جدول " + (i + 1)))] } }
    else if (e === "pptx") r = await parsePptx(await file.arrayBuffer(), name);
    else if (e === "xlsx") { const sh = await xlsxRows(await file.arrayBuffer()); r = { chunks: sh.flatMap(s => tableChunks(s.rows, name, s.name)), pages: sh.length, unit: "ورقة" } }
    else if (e === "csv" || e === "tsv") r = { chunks: tableChunks(parseCsv(decodeText(await file.arrayBuffer())), name, "csv") };
    else if (e === "sql") r = { chunks: sqlChunks(decodeText(await file.arrayBuffer()), name) };
    else if (e === "json") { let v; try { v = JSON.parse(decodeText(await file.arrayBuffer())) } catch (_) { throw new Error("ملف JSON غير صالح") } const l = []; flattenJson(v, "", l); r = { chunks: chunkText(l.join("\n"), name) } }
    else if (e === "html" || e === "htm") r = { chunks: chunkText(htmlText(decodeText(await file.arrayBuffer())), name) };
    else if (e === "xml") r = { chunks: chunkText(htmlText(decodeText(await file.arrayBuffer())), name) };
    else if (e === "rtf") r = { chunks: chunkText(rtfText(decodeText(await file.arrayBuffer())), name) };
    else if (TEXT.has(e)) r = { chunks: chunkText(decodeText(await file.arrayBuffer()), name) };
    else if (IMG.has(e)) { const t = await ocr(await imageToCanvas(file), "قراءة النص من الصورة…", prog); r = { chunks: t.replace(/\s/g, "").length >= 8 ? chunkText(t, name) : [], image: true } }
    else if (e === "doc" || e === "xls" || e === "ppt") throw new Error("صيغة Office القديمة غير مدعومة؛ احفظه بصيغة " + e + "x ثم ارفعه");
    else throw new Error("نوع الملف (." + e + ") غير مدعوم");
    if (!r.chunks.length) throw new Error(r.image ? "لم أستطع قراءة نص واضح من الصورة (جرّب صورة أوضح وأعلى جودة)" : "لم أجد نصًا قابلًا للقراءة داخل الملف");
    r.chunks = r.chunks.filter((c, i, a) => a.findIndex(y => y.text === c.text && y.n === c.n && y.pg === c.pg) === i);
    return { name, type: e, size: file.size, chunks: r.chunks, pages: r.pages || null, unit: r.unit || (e === "pptx" ? "شريحة" : "صفحة"), note: r.note || "" };
  }

  // ---------- التخزين المحلي (IndexedDB، لكل طالب على حدة) ----------
  const DB = "unismart_myfiles";
  const idb = () => new Promise((ok, no) => { try { const r = indexedDB.open(DB, 1); r.onupgradeneeded = () => r.result.createObjectStore("kv"); r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error) } catch (e) { no(e) } });
  async function kv(mode, fn) { const d = await idb(); return new Promise((ok, no) => { const tx = d.transaction("kv", mode), st = tx.objectStore("kv"), rq = fn(st); tx.oncomplete = () => ok(rq && rq.result); tx.onerror = () => no(tx.error) }) }
  const key = uid => "docs:" + uid;
  async function load(uid) { try { return (await kv("readonly", s => s.get(key(uid)))) || [] } catch (_) { return [] } }
  async function save(uid, docs) { try { await kv("readwrite", s => s.put(docs, key(uid))); return true } catch (_) { return false } }

  return { ACCEPT, parse, load, save, fmtSize, IMG, ext };
})();

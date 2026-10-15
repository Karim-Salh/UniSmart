/* UniSmart API bridge — طبقة الاتصال المركزية.
   - إن كان الخادم متاحًا: الوضع الحي (UNI.on = true): المصادقة والبيانات والمرشد والحضور بالوجه من الـ API.
   - وإلا: يعمل النظام كما كان بالبيانات التجريبية داخل المتصفح (لا شيء يتعطل).
   - عنوان الخادم: window.UNISMART_API (افتراضيًا نفس الأصل؛ nginx يوجّه /api إلى الـ backend).
   - لا يوجد أي اتصال بخدمة خارجية: كل الطلبات إلى خادم الجامعة نفسه. */
(function () {
  const BASE = (window.UNISMART_API || "").replace(/\/$/, "");
  const ss = {
    get: k => { try { return sessionStorage.getItem(k) } catch (_) { return null } },
    set: (k, v) => { try { sessionStorage.setItem(k, v) } catch (_) {} },
    del: k => { try { sessionStorage.removeItem(k) } catch (_) {} }
  };
  const MSG = {
    network: "تعذّر الاتصال بالخادم. تحقق من الإنترنت وحاول مرة أخرى.",
    401: "انتهت جلستك. سجّل الدخول مرة أخرى.",
    403: "ليست لديك صلاحية لهذا الإجراء.",
    429: "عدد المحاولات كبير. انتظر قليلًا ثم أعد المحاولة.",
    5: "حدث خطأ في الخادم. حاول لاحقًا."
  };
  const UNI = {
    on: false,
    token: () => ss.get("us_tok"),
    async ping() {                     // هل الخادم متاح؟ (نتيجة تُخزَّن للجلسة لتجنب طلبات متكررة)
      const c = ss.get("us_live"); if (c !== null) return UNI.on = c === "1";
      try {
        const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 1500);
        const r = await fetch(BASE + "/api/health", { signal: ctl.signal, cache: "no-store" }); clearTimeout(t);
        UNI.on = r.ok && (r.headers.get("content-type") || "").includes("json");
      } catch (_) { UNI.on = false }
      ss.set("us_live", UNI.on ? "1" : "0"); return UNI.on;
    },
    async call(method, path, body, opts = {}) {
      const h = {}; const tk = UNI.token(); if (tk) h.Authorization = "Bearer " + tk;
      let payload;
      if (body instanceof FormData || body instanceof URLSearchParams) payload = body;
      else if (body !== undefined) { h["Content-Type"] = "application/json"; payload = JSON.stringify(body) }
      try {
        const r = await fetch(BASE + path, { method, headers: h, body: payload, cache: "no-store" });
        let data = null; try { data = await r.json() } catch (_) {}
        if (r.status === 401 && tk && !opts.quiet) { UNI.logout(true); }
        const detail = data && typeof data.detail === "string" ? data.detail : null;
        return { ok: r.ok, status: r.status, data, msg: r.ok ? "" : (detail || MSG[r.status] || (r.status >= 500 ? MSG[5] : "تعذّر تنفيذ الطلب.")) };
      } catch (_) { return { ok: false, status: 0, data: null, msg: MSG.network } }
    },
    async login(username, password) {
      const r = await UNI.call("POST", "/api/auth/login", new URLSearchParams({ username, password }), { quiet: true });
      if (r.ok) { ss.set("us_tok", r.data.access_token); UNI.invalidate() }
      else if (r.status === 401 && !r.data) r.msg = "بيانات الدخول غير صحيحة.";
      return r;
    },
    logout(expired) {
      ss.del("us_tok"); UNI.invalidate();
      try { sessionStorage.removeItem("unismart_state") } catch (_) {}
      if (expired && !/login\.html$/.test(location.pathname)) { ss.set("us_exp", "1"); location.replace("login.html") }
    },
    invalidate() { ss.del("us_snap") },
    snapshot() { try { const s = JSON.parse(ss.get("us_snap") || "null"); return s && Date.now() - s.t < 45000 ? s.d : null } catch (_) { return null } },
    saveSnapshot(d) { ss.set("us_snap", JSON.stringify({ t: Date.now(), d })) },
    // جلب كل ما تحتاجه الواجهة مرة واحدة (متوازيًا) مع ذاكرة مؤقتة 45 ثانية لتقليل الطلبات
    async fetchAll(role) {
      const hit = UNI.snapshot(); if (hit) return hit;
      const g = p => UNI.call("GET", p).then(r => r.ok ? r.data : null);
      let d;
      if (role === "student") {
        const [courses, grades, schedule, assignments, dash, attlog, notifs, settings] = await Promise.all([
          g("/api/courses"), g("/api/students/me/grades"), g("/api/students/me/schedule"), g("/api/students/me/assignments"),
          g("/api/students/me/dashboard"), g("/api/students/me/attendance/log"), g("/api/notifications"), g("/api/settings/public")]);
        d = { role, courses, grades, schedule, assignments, dash, attlog, notifs, settings };
      } else if (role === "admin") {
        const [audit, notifs, students] = await Promise.all([g("/api/admin/audit-logs"), g("/api/notifications"), g("/api/admin/students")]);
        d = { role, audit, notifs, students };
      } else d = { role, notifs: await g("/api/notifications") };
      if (Object.values(d).some(v => v)) UNI.saveSnapshot(d);
      return d;
    },
    chat: async (msg, lang) => {
      const r = await UNI.call("POST", "/api/ai/v2/chat", { message: msg, lang: lang || null });
      if (!r.ok) throw new Error(r.msg);
      return r.data;
    },
    // التحقق بالوجه: القرار النهائي على الخادم (يقارن البصمة المخزّنة مشفّرةً مع بصمة الجلسة)
    async faceVerify(courseId, descriptor, blink, turn) {
      const c = await UNI.call("GET", "/api/attendance/face/challenge"); if (!c.ok) return c;
      return UNI.call("POST", "/api/attendance/face/verify", { course_id: courseId, descriptor, nonce: c.data.nonce, blink, turn });
    },
    async uploadPhoto(dataUrl, descriptor, by, studentLogin) {
      const blob = await (await fetch(dataUrl)).blob(), f = new FormData();
      f.append("file", blob, "photo." + (blob.type === "image/png" ? "png" : "jpg")); f.append("descriptor", descriptor ? JSON.stringify(Array.from(descriptor)) : "");
      if (by !== "admin") return UNI.call("POST", "/api/students/me/photo", f);
      const list = await UNI.call("GET", "/api/admin/students"), s = list.ok && list.data.find(x => x.login === studentLogin);
      return s ? UNI.call("PUT", "/api/admin/students/" + s.id + "/photo", f) : { ok: false, msg: "الطالب غير موجود." };
    },
    async myPhoto() {                  // صورة الطالب المخزّنة على الخادم (لجهاز جديد)
      try {
        const r = await fetch(BASE + "/api/students/me/photo", { headers: { Authorization: "Bearer " + UNI.token() }, cache: "no-store" });
        if (!r.ok) return null; const b = await r.blob();
        return await new Promise(res => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(b) });
      } catch (_) { return null }
    }
  };
  window.UNI = UNI;
  UNI.ready = (async () => { if (UNI.token()) await UNI.ping(); else { const c = ss.get("us_live"); UNI.on = c === "1"; } })();
})();

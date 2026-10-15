"""قاعدة المعرفة التعليمية الداخلية للمرشد (محلية، بدون API خارجي).
محتوى تعليمي عام فقط (شرح + أسئلة تدريب)؛ لا علاقة له بأسئلة الاختبارات الرسمية ولا ببيانات أي طالب.
الكلمات المفتاحية مكتوبة بصيغة مطبَّعة (بدون تشكيل، ا بدل أ/إ/آ، ي بدل ى) لتطابق assistant._norm.
أضِف موضوعًا جديدًا بإضافة مدخل في TOPICS وربطه بالمادة في COURSE_TOPICS."""
def Q(q, options, answer, why, hint): return {"q": q, "options": options, "answer": answer, "why": why, "hint": hint}
TOPICS = {
 "sql": {"ar": "أساسيات SQL", "en": "SQL basics", "kw": ["sql", "select", "where", "استعلام"],
   "explain_ar": "SQL لغة للتعامل مع قواعد البيانات العلائقية. SELECT لاسترجاع الأعمدة، FROM لتحديد الجدول، WHERE لتصفية الصفوف قبل التجميع، ORDER BY للترتيب. الترتيب المنطقي للتنفيذ: FROM ثم WHERE ثم GROUP BY ثم HAVING ثم SELECT ثم ORDER BY.",
   "explain_en": "SQL talks to relational databases. SELECT picks columns, FROM names the table, WHERE filters rows before grouping, ORDER BY sorts. Logical order: FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY.",
   "practice": [
    Q("أي أمر يسترجع بيانات من جدول؟", ["INSERT", "SELECT", "DELETE", "ALTER"], 1, "SELECT هو أمر الاسترجاع؛ INSERT للإضافة وDELETE للحذف وALTER لتعديل بنية الجدول.", "فكّر في «اختر» الأعمدة."),
    Q("أي عبارة تصفّي الصفوف قبل التجميع؟", ["HAVING", "WHERE", "ORDER BY", "LIMIT"], 1, "WHERE تعمل على الصفوف قبل GROUP BY، أما HAVING فتصفّي المجموعات بعد التجميع.", "تأتي قبل GROUP BY في ترتيب التنفيذ."),
    Q("ماذا يعيد SELECT COUNT(*) FROM students؟", ["أسماء الطلاب", "عدد الصفوف", "أكبر قيمة", "لا شيء"], 1, "COUNT(*) يحسب عدد الصفوف في النتيجة.", "الدالة تحسب ولا تعرض الأسماء.")]},
 "join": {"ar": "الربط JOIN", "en": "JOIN", "kw": ["join", "جوين", "ربط الجداول", "ربط جدولين"],
   "explain_ar": "JOIN يربط جدولين بشرط مشترك غالبًا مفتاح أجنبي. INNER JOIN يعيد الصفوف المتطابقة فقط. LEFT JOIN يعيد كل صفوف الجدول الأيسر مع NULL حيث لا يوجد تطابق. FULL JOIN يعيد الجانبين. ابدأ دائمًا بتحديد المفتاح الذي يربط الجدولين.",
   "explain_en": "JOIN combines two tables on a shared condition, usually a foreign key. INNER JOIN keeps matching rows only; LEFT JOIN keeps all left rows with NULL where nothing matches; FULL JOIN keeps both sides.",
   "practice": [
    Q("أي JOIN يعيد الصفوف المتطابقة في الجدولين فقط؟", ["LEFT JOIN", "INNER JOIN", "CROSS JOIN", "SELF JOIN"], 1, "INNER JOIN يستبعد غير المتطابق من الجانبين.", "كلمة «داخلي» تعني التقاطع."),
    Q("في LEFT JOIN، ماذا يظهر لصف من اليسار بلا مقابل في اليمين؟", ["يُحذف", "يظهر مع NULL", "خطأ", "يتكرر"], 1, "LEFT JOIN يحتفظ بكل صفوف اليسار ويضع NULL للأعمدة اليمنى.", "الجدول الأيسر لا يُفقد منه شيء."),
    Q("ما الذي يُستخدم عادةً كشرط ربط بين جدولين؟", ["أي عمود نصي", "مفتاح أجنبي يطابق مفتاحًا أساسيًا", "ORDER BY", "رقم الصف"], 1, "الربط السليم يكون بين مفتاح أجنبي والمفتاح الأساسي الذي يشير إليه.", "العلاقة بين الجداول تُبنى على المفاتيح.")]},
 "groupby": {"ar": "GROUP BY وHAVING", "en": "GROUP BY and HAVING", "kw": ["group by", "having", "تجميع", "groupby"],
   "explain_ar": "GROUP BY يجمع الصفوف المتشابهة في مجموعات لتطبيق دوال مثل COUNT وSUM وAVG على كل مجموعة. HAVING تصفّي المجموعات بعد التجميع (مثل HAVING COUNT(*) > 5) بينما WHERE تصفّي الصفوف قبله. كل عمود في SELECT غير مجمَّع بدالة يجب أن يكون في GROUP BY.",
   "explain_en": "GROUP BY collects rows into groups for COUNT/SUM/AVG. HAVING filters groups after aggregation; WHERE filters rows before. Any non-aggregated SELECT column must appear in GROUP BY.",
   "practice": [
    Q("أي عبارة تصفّي نتائج دالة تجميع مثل COUNT(*) > 5؟", ["WHERE", "HAVING", "ORDER BY", "DISTINCT"], 1, "HAVING تعمل على نتائج التجميع؛ WHERE لا تستطيع استخدام دوال التجميع.", "تأتي بعد GROUP BY."),
    Q("ما نتيجة SELECT dept, COUNT(*) FROM s GROUP BY dept؟", ["عدد كل الطلاب فقط", "عدد الطلاب في كل قسم", "أسماء الأقسام فقط", "خطأ دائمًا"], 1, "يُنتج صفًا لكل قسم مع عدد طلابه.", "صف واحد لكل قيمة مميزة في dept.")]},
 "normalization": {"ar": "التطبيع Normalization", "en": "Normalization", "kw": ["normalization", "normalisation", "تطبيع", "تطبيعه"],
   "explain_ar": "التطبيع تنظيم الجداول لتقليل التكرار ومنع شذوذ التعديل والحذف والإضافة. 1NF: قيم ذرية بلا مجموعات متكررة. 2NF: 1NF مع اعتماد كل عمود غير مفتاحي على كامل المفتاح. 3NF: 2NF مع عدم وجود اعتماد انتقالي بين أعمدة غير مفتاحية.",
   "explain_en": "Normalization organises tables to cut redundancy and avoid update/delete/insert anomalies. 1NF: atomic values. 2NF: 1NF plus full dependence on the whole key. 3NF: 2NF plus no transitive dependency.",
   "practice": [
    Q("الهدف الأساسي من التطبيع؟", ["زيادة سرعة الشبكة", "تقليل التكرار وشذوذ البيانات", "تشفير البيانات", "زيادة عدد الجداول دائمًا"], 1, "التطبيع يقلل التكرار ويحمي من شذوذ التعديل.", "يتعلق بالتكرار."),
    Q("جدول به عمود يحوي قيمًا متعددة في الخلية الواحدة يخالف أي صيغة؟", ["1NF", "2NF", "3NF", "BCNF فقط"], 0, "1NF يشترط قيمًا ذرية في كل خلية.", "الصيغة الأولى تخص القيم الذرية."),
    Q("الاعتماد الانتقالي بين أعمدة غير مفتاحية يُزال في؟", ["1NF", "2NF", "3NF", "لا يُزال"], 2, "3NF يزيل الاعتماد الانتقالي.", "الصيغة الثالثة.")]},
 "transactions": {"ar": "المعاملات وACID", "en": "Transactions and ACID", "kw": ["transaction", "acid", "معاملات", "commit", "rollback"],
   "explain_ar": "المعاملة مجموعة عمليات تُنفَّذ كوحدة واحدة. ACID: Atomicity كلها أو لا شيء، Consistency تبقى القيود صحيحة، Isolation لا تتداخل المعاملات المتزامنة، Durability ما يُثبَّت بـ COMMIT لا يضيع. ROLLBACK يلغي التغييرات قبل التثبيت.",
   "explain_en": "A transaction runs as one unit. ACID: Atomicity (all or nothing), Consistency, Isolation, Durability. ROLLBACK undoes changes before COMMIT.",
   "practice": [
    Q("أي خاصية تعني «كلها أو لا شيء»؟", ["Atomicity", "Durability", "Isolation", "Consistency"], 0, "Atomicity تضمن تنفيذ المعاملة كاملة أو إلغاءها كاملة.", "الذرّة لا تتجزأ."),
    Q("أي أمر يلغي تغييرات معاملة لم تُثبَّت؟", ["COMMIT", "ROLLBACK", "SAVE", "DROP"], 1, "ROLLBACK يعيد الحالة لما قبل المعاملة.", "عكس التثبيت.")]},
 "linked": {"ar": "القوائم المترابطة", "en": "Linked lists", "kw": ["linked list", "قائمه مترابطه", "القوائم المترابطه", "linkedlist"],
   "explain_ar": "القائمة المترابطة سلسلة عقد، كل عقدة تحمل قيمة ومؤشرًا للتالية. الإضافة أو الحذف في بداية القائمة O(1) إذا امتلكت المؤشر، لكن الوصول لعنصر برقمه O(n) لأنه يتطلب المرور من الرأس.",
   "explain_en": "A linked list is a chain of nodes holding a value and a pointer to the next. Insert/delete at the head is O(1); access by index is O(n).",
   "practice": [
    Q("تعقيد الوصول للعنصر رقم k في قائمة مترابطة؟", ["O(1)", "O(n)", "O(log n)", "O(n²)"], 1, "يجب المرور على العقد من الرأس حتى الوصول للعنصر.", "لا يوجد وصول مباشر بالفهرس."),
    Q("ماذا تحمل العقدة في القائمة المترابطة المفردة؟", ["قيمة فقط", "قيمة ومؤشرًا للتالية", "مؤشرين دائمًا", "فهرسًا"], 1, "القيمة ومؤشر للعقدة التالية.", "كيف ترتبط العقد؟")]},
 "stacks": {"ar": "المكدس والطابور", "en": "Stacks and queues", "kw": ["stack", "queue", "مكدس", "طابور", "stacks"],
   "explain_ar": "المكدس LIFO: آخر ما دخل أول ما يخرج (push/pop)، ويُستخدم في التراجع وتقييم التعابير. الطابور FIFO: أول ما دخل أول ما يخرج (enqueue/dequeue)، ويُستخدم في الجدولة والبحث بالعرض BFS.",
   "explain_en": "Stack is LIFO (push/pop), used for undo and expression evaluation. Queue is FIFO (enqueue/dequeue), used for scheduling and BFS.",
   "practice": [
    Q("أي بنية تتبع LIFO؟", ["Queue", "Stack", "Array فقط", "Heap"], 1, "المكدس: آخر داخل أول خارج.", "طبق فوق طبق."),
    Q("أي بنية تُستخدم في BFS؟", ["Stack", "Queue", "Tree", "Hash"], 1, "BFS يستخدم طابورًا.", "الأقرب أولًا = أول داخل أول خارج.")]},
 "trees": {"ar": "الأشجار الثنائية", "en": "Binary trees", "kw": ["tree", "bst", "شجره", "اشجار", "الاشجار", "binary tree"],
   "explain_ar": "الشجرة الثنائية لكل عقدة فيها ابنان كحد أقصى. في شجرة البحث الثنائية BST تكون قيم الشمال أصغر والجذر ثم اليمين أكبر، فالبحث متوسطه O(log n) إن كانت متوازنة، وO(n) إن كانت منحرفة. الترتيب in-order يعطي القيم مرتبة.",
   "explain_en": "A binary tree has at most two children per node. In a BST left < root < right, so search is O(log n) if balanced, O(n) if skewed. In-order traversal yields sorted values.",
   "practice": [
    Q("أي مرور في BST يعطي القيم مرتبة تصاعديًا؟", ["Pre-order", "In-order", "Post-order", "Level-order"], 1, "In-order: شمال ثم الجذر ثم يمين.", "الجذر في المنتصف."),
    Q("أسوأ تعقيد للبحث في BST؟", ["O(1)", "O(log n)", "O(n)", "O(n log n)"], 2, "إذا انحرفت الشجرة صارت كقائمة.", "ماذا لو أُدخلت القيم مرتبة؟")]},
 "hashing": {"ar": "جداول التجزئة", "en": "Hash tables", "kw": ["hash", "hashing", "تجزئه", "جدول تجزئه", "جداول التجزئه"],
   "explain_ar": "جدول التجزئة يحوّل المفتاح لفهرس عبر دالة تجزئة فيعطي بحثًا وإضافة بمتوسط O(1). التصادم عندما يتحول مفتاحان لنفس الفهرس ويُعالج بالسلاسل أو بالعنونة المفتوحة.",
   "explain_en": "A hash table maps keys to indices via a hash function giving O(1) average lookup/insert. Collisions are handled by chaining or open addressing.",
   "practice": [
    Q("المتوسط الزمني للبحث في جدول تجزئة جيد؟", ["O(1)", "O(n)", "O(log n)", "O(n²)"], 0, "دالة التجزئة تعطي الفهرس مباشرة.", "لا يوجد مرور على العناصر."),
    Q("ماذا نسمي تحول مفتاحين لنفس الفهرس؟", ["تصادم", "فيضان", "دمج", "ترتيب"], 0, "تصادم (collision).", "يحتاجان معالجة خاصة.")]},
 "complexity": {"ar": "تعقيد الخوارزميات", "en": "Algorithm complexity", "kw": ["big o", "bigo", "تعقيد", "complexity", "o(n)"],
   "explain_ar": "Big-O يصف نمو الزمن أو الذاكرة مع زيادة حجم المدخلات n متجاهلًا الثوابت. أمثلة: O(1) ثابت، O(log n) بحث ثنائي، O(n) مرور واحد، O(n log n) ترتيب فعّال، O(n²) حلقتان متداخلتان.",
   "explain_en": "Big-O describes how time/memory grows with input size n, ignoring constants: O(1), O(log n) binary search, O(n) single pass, O(n log n) efficient sort, O(n²) nested loops.",
   "practice": [
    Q("تعقيد حلقتين متداخلتين كل منهما n مرة؟", ["O(n)", "O(n²)", "O(log n)", "O(1)"], 1, "n × n = n².", "اضرب عدد تكرارات الحلقتين."),
    Q("تعقيد البحث الثنائي على مصفوفة مرتبة؟", ["O(n)", "O(log n)", "O(1)", "O(n²)"], 1, "يُنصّف الفضاء كل مرة.", "التنصيف المتكرر.")]},
 "ai_search": {"ar": "البحث في الذكاء الاصطناعي", "en": "Search in AI", "kw": ["a*", "bfs", "dfs", "heuristic", "بحث الذكاء", "الخوارزميه الاستكشافيه", "ai search"],
   "explain_ar": "خوارزميات البحث تستكشف فضاء الحالات للوصول للهدف. BFS يضمن أقصر مسار في الرسم غير الموزون، DFS يستهلك ذاكرة أقل، وA* يجمع تكلفة المسار g مع تقدير الهدف h ويكون مثاليًا إذا كانت h مقبولة (لا تبالغ في التقدير).",
   "explain_en": "Search explores a state space. BFS finds shortest paths in unweighted graphs, DFS uses less memory, A* combines path cost g with heuristic h and is optimal when h is admissible.",
   "practice": [
    Q("أي خوارزمية تضمن أقصر مسار في رسم غير موزون؟", ["DFS", "BFS", "Hill climbing", "Random"], 1, "BFS يستكشف بالطبقات.", "الأقرب طبقة بطبقة."),
    Q("شرط كون A* مثاليًا؟", ["h مبالغ فيها", "h مقبولة (admissible)", "g = 0", "لا شرط"], 1, "الدالة الاستكشافية يجب ألا تبالغ في تقدير تكلفة الهدف.", "لا تُفرِط في التقدير.")]},
 "ml": {"ar": "أساسيات تعلّم الآلة", "en": "Machine learning basics", "kw": ["machine learning", "تعلم الاله", "ml", "overfitting", "supervised"],
   "explain_ar": "التعلّم الخاضع للإشراف يتعلم من أمثلة مُعنونة، وغير الخاضع يكتشف الأنماط بلا عناوين. فرط التخصيص Overfitting أن يحفظ النموذج بيانات التدريب فيفشل على الجديدة، ويُعالج بمزيد من البيانات أو التنظيم أو التحقق المتقاطع.",
   "explain_en": "Supervised learning uses labelled examples; unsupervised finds patterns without labels. Overfitting memorises training data and fails on new data; fix with more data, regularisation or cross-validation.",
   "practice": [
    Q("ماذا يعني Overfitting؟", ["أداء ضعيف على التدريب والاختبار", "أداء ممتاز على التدريب وضعيف على الجديد", "نموذج بسيط جدًا", "بيانات ناقصة"], 1, "النموذج حفظ التدريب ولم يعمّم.", "يعمل جيدًا فقط على ما رآه.")]},
 "agile": {"ar": "المنهجيات الرشيقة Agile", "en": "Agile", "kw": ["agile", "scrum", "sprint", "رشيقه"],
   "explain_ar": "Agile يسلّم البرمجيات على دورات قصيرة مع ملاحظات مستمرة. في Scrum يوجد Sprint (أسبوعان إلى أربعة)، وProduct Backlog، وSprint Backlog، واجتماع يومي قصير، ومراجعة واستعراض في نهاية السبرنت.",
   "explain_en": "Agile delivers software in short cycles with constant feedback. Scrum has sprints (2–4 weeks), a Product Backlog, Sprint Backlog, daily stand-up, review and retrospective.",
   "practice": [
    Q("المدة المعتادة للـ Sprint في Scrum؟", ["يوم", "أسبوعان إلى أربعة", "سنة", "ساعة"], 1, "السبرنت دورة قصيرة محددة الزمن.", "ليست أيامًا ولا شهورًا طويلة."),
    Q("أين تُسجَّل كل متطلبات المنتج مرتبة بالأولوية؟", ["Sprint Backlog", "Product Backlog", "Burndown", "Retro"], 1, "Product Backlog قائمة المنتج الكاملة.", "قائمة المنتج لا السبرنت.")]},
 "osi": {"ar": "نموذج OSI وTCP/IP", "en": "OSI and TCP/IP", "kw": ["osi", "tcp", "udp", "tcp/ip", "طبقات الشبكه"],
   "explain_ar": "OSI سبع طبقات: الفيزيائية، الربط، الشبكة، النقل، الجلسة، العرض، التطبيق. TCP موثوق يضمن الوصول والترتيب بإنشاء اتصال، وUDP أسرع بلا ضمان ويناسب البث والألعاب.",
   "explain_en": "OSI has seven layers: Physical, Data Link, Network, Transport, Session, Presentation, Application. TCP is reliable and ordered; UDP is faster with no guarantees.",
   "practice": [
    Q("أي بروتوكول يضمن وصول البيانات بالترتيب؟", ["UDP", "TCP", "ICMP", "ARP"], 1, "TCP يؤسس اتصالًا ويؤكد الاستلام.", "الموثوقية."),
    Q("في أي طبقة يعمل IP؟", ["النقل", "الشبكة", "التطبيق", "الفيزيائية"], 1, "IP في طبقة الشبكة.", "التوجيه بين الشبكات.")]},
 "os": {"ar": "العمليات والجمود Deadlock", "en": "Processes and deadlock", "kw": ["deadlock", "process", "thread", "جمود", "عمليات"],
   "explain_ar": "العملية برنامج قيد التنفيذ بمساحة ذاكرة خاصة، والخيط وحدة تنفيذ داخلها تشارك الذاكرة. الجمود deadlock يحدث عند اجتماع أربعة شروط: استبعاد متبادل، احتجاز وانتظار، عدم الاستباق، وانتظار دائري.",
   "explain_en": "A process is a running program with its own memory; threads share that memory. Deadlock needs four conditions: mutual exclusion, hold-and-wait, no preemption, circular wait.",
   "practice": [
    Q("أيّ مما يلي ليس شرطًا للجمود؟", ["استبعاد متبادل", "انتظار دائري", "الاستباق", "احتجاز وانتظار"], 2, "الجمود يتطلب عدم الاستباق، لا الاستباق.", "الشرط هو «عدم» شيء.")]},
 "web": {"ar": "أساسيات HTTP والويب", "en": "HTTP and web basics", "kw": ["http", "rest", "api", "get", "post"],
   "explain_ar": "HTTP بروتوكول طلب واستجابة. GET لقراءة الموارد وآمن عادةً، POST لإنشاء مورد، PUT/PATCH للتعديل، DELETE للحذف. رمز 200 نجاح، 404 غير موجود، 401 غير مصرّح، 500 خطأ خادم.",
   "explain_en": "HTTP is request/response. GET reads, POST creates, PUT/PATCH updates, DELETE removes. 200 OK, 404 not found, 401 unauthorized, 500 server error.",
   "practice": [
    Q("أي طريقة تُستخدم عادةً لإنشاء مورد جديد؟", ["GET", "POST", "HEAD", "TRACE"], 1, "POST لإنشاء مورد.", "ليست للقراءة."),
    Q("ماذا يعني رمز 404؟", ["نجاح", "غير موجود", "خطأ خادم", "غير مصرّح"], 1, "المورد المطلوب غير موجود.", "ابحث عن «Not Found».")]},
}
COURSE_TOPICS = {
 "DB301": ["sql", "join", "groupby", "normalization", "transactions"],
 "CS201": ["linked", "stacks", "trees", "hashing", "complexity"],
 "CS101": ["complexity"],
 "AI401": ["ai_search", "ml"], "ML402": ["ml"],
 "SE302": ["agile"], "NET301": ["osi"], "OS302": ["os"], "WEB301": ["web"], "ALG301": ["complexity", "trees"],
}

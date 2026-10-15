/* UniSmart i18n — الوضع التعريفي بالعربية أو الإنجليزية حسب اختيار المستخدم.
   المصدر الأصلي للنصوص عربي؛ في وضع الإنجليزية تُترجَم عناصر الواجهة تلقائيًا بعد كل رسم (قاموس + أنماط للنصوص الديناميكية).
   نص غير موجود في القاموس يبقى بالعربية ولا يتعطل شيء. لإضافة ترجمة: أضف زوجًا في PAIRS أو نمطًا في PATTERNS. */
(function () {
  const KEY = "us_lang";
  let lang = "ar";
  try { lang = localStorage.getItem(KEY) || "ar" } catch (_) {}      // الافتراضي عربي؛ يختار المستخدم الإنجليزية من زر اللغة
  if (lang !== "en") lang = "ar";

  const PAIRS = [
    // --- التنقل والإطار العام ---
    ["لوحة التحكم", "Dashboard"], ["الصفحة الرئيسية", "Home"], ["المواد والتسجيل", "Courses & Registration"], ["الجدول", "Schedule"], ["الجدول الأسبوعي", "Weekly Schedule"],
    ["الدرجات", "Grades"], ["الحضور", "Attendance"], ["الواجبات", "Assignments"], ["الاختبارات", "Quizzes"], ["المرشد الأكاديمي الذكي", "AI Academic Guide"], ["المرشد الأكاديمي", "Academic Guide"],
    ["الإشعارات", "Notifications"], ["الإعدادات", "Settings"], ["صور الطلاب", "Student Photos"], ["نموذج الوجه", "Face Model"], ["قاعدة المعرفة", "Knowledge Base"], ["السجلات والأمان", "Logs & Security"],
    ["طي القائمة", "Collapse menu"], ["فتح القائمة", "Open menu"], ["طي القائمة الجانبية (أيقونات فقط)", "Collapse sidebar (icons only)"], ["القائمة الجانبية", "Sidebar"], ["التنقل الرئيسي", "Main navigation"],
    ["تخطي إلى المحتوى", "Skip to content"], ["بحث", "Search"], ["ابحث عن صفحة أو مادة…", "Search pages or courses…"], ["تبديل المظهر", "Toggle theme"], ["صفحة", "Page"], ["لا نتائج", "No results"],
    ["طالب", "Student"], ["دكتور", "Doctor"], ["إدارة", "Admin"], ["عضو هيئة تدريس", "Faculty member"], ["الإدارة", "Administration"], ["مدير النظام", "System administrator"], ["دكتور · علوم الحاسب", "Faculty · Computer Science"],
    ["إدارة الجامعة", "University Administration"], ["يوسف محمود", "Youssef Mahmoud"], ["يوسف", "Youssef"], ["د. أحمد علي", "Dr. Ahmed Ali"], ["دكتور أحمد", "Dr. Ahmed"], ["أستاذ", "Admin"], ["منى خالد", "Mona Khaled"],
    ["سارة أحمد", "Sara Ahmed"], ["كريم علي", "Karim Ali"], ["نور حسن", "Nour Hassan"], ["ليلى", "Layla"], ["كريم", "Karim"], ["سارة", "Sara"], ["احمد", "Ahmed"],
    ["جامعة UniSmart", "UniSmart University"], ["كلية الحاسبات والذكاء الاصطناعي", "Faculty of Computers & AI"], ["علوم الحاسب", "Computer Science"], ["بكالوريوس علوم الحاسب", "B.Sc. in Computer Science"],
    ["المستوى الأول", "Level 1"], ["المستوى الثاني", "Level 2"], ["المستوى الثالث", "Level 3"], ["المستوى الرابع", "Level 4"], ["الأول", "1st"], ["الثاني", "2nd"], ["الثالث", "3rd"], ["الرابع", "4th"],
    ["الفصل الأول 2026/2027", "Fall 2026/2027"], ["منتظم", "Regular"], ["ممتاز", "Excellent"], ["جيد جدًا", "Very good"], ["جيد", "Good"], ["مقبول", "Pass"], ["إنذار أكاديمي", "Academic warning"],
    // --- الدخول ---
    ["تسجيل الدخول", "Sign in"], ["نوع الحساب", "Account type"], ["الرقم الجامعي", "Student ID"], ["اسم المستخدم", "Username"], ["كلمة المرور", "Password"], ["دخول", "Sign in"], ["جارٍ التحقق…", "Verifying…"],
    ["حسابات تجريبية، اضغط للتعبئة:", "Demo accounts, tap to fill:"], ["متصل بخادم الجامعة", "Connected to the university server"], ["وضع تجريبي: البيانات داخل المتصفح", "Demo mode: data stays in the browser"],
    ["بيانات الدخول غير صحيحة.", "Incorrect login details."], ["بيانات الدخول غير صحيحة لهذا النوع من الحساب.", "Incorrect login details for this account type."], ["انتهت جلستك. سجّل الدخول مرة أخرى.", "Your session expired. Please sign in again."],
    ["البوابة الإلكترونية الرسمية للتسجيل والجداول والدرجات والاختبارات.", "The official portal for registration, schedules, grades and quizzes."],
    ["تسجيل المواد وفق اللوائح الأكاديمية", "Course registration per academic regulations"], ["اختبارات إلكترونية آمنة وشفافة", "Secure and transparent online quizzes"], ["إرشاد أكاديمي فوري على مدار الساعة", "Instant academic guidance around the clock"],
    ["تسجيل الخروج", "Sign out"], ["تعذّر الاتصال بالخادم. تحقق من الإنترنت وحاول مرة أخرى.", "Could not reach the server. Check your connection and try again."],
    ["تعذّر تنفيذ الطلب", "The request could not be completed"], ["تعذّر تنفيذ الطلب.", "The request could not be completed."], ["ليست لديك صلاحية لهذا الإجراء.", "You don't have permission for this action."],
    ["عدد المحاولات كبير. انتظر قليلًا ثم أعد المحاولة.", "Too many attempts. Please wait and try again."], ["حدث خطأ في الخادم. حاول لاحقًا.", "A server error occurred. Please try later."],
    // --- الرئيسية ---
    ["صباح الخير", "Good morning"], ["مساء الخير", "Good evening"], ["طاب يومك", "Good afternoon"], ["تسجيل الحضور بالوجه", "Mark attendance by face"], ["اسأل المرشد الذكي", "Ask the AI guide"],
    ["النظرة الأكاديمية", "Academic overview"], ["المعدل التراكمي", "Cumulative GPA"], ["إجمالي مواد البرنامج", "Program courses"], ["مواد مكتملة", "Completed courses"], ["مواد الفصل الحالي", "Current courses"],
    ["ملفي", "My profile"], ["حذف المادة", "Drop course"], ["د. سارة محمد", "Dr. Sara Mohamed"], ["د. خالد حسن", "Dr. Khaled Hassan"], ["د. منى إبراهيم", "Dr. Mona Ibrahim"], ["تعديل الملف", "Edit profile"], ["امتياز", "Excellent"], ["حضور", "Attendance"], ["اختبار آمن", "Secure quiz"], ["(آمن)", "(secure)"], ["تعديل", "Edit"], ["القسم", "Department"], ["المستوى", "Level"], ["الحالة", "Status"], ["التقدير العام", "Overall standing"], ["الساعات المنجزة", "Credits earned"], ["عبء الفصل", "Semester load"],
    ["القادم", "Upcoming"], ["النشاط الأخير", "Recent activity"], ["توصية المرشد الذكي", "AI guide recommendation"], ["التفاصيل", "Details"], ["محاضرة", "Lecture"], ["اختبار", "Exam"], ["كويز", "Quiz"], ["واجب", "Assignment"],
    ["لا توجد عناصر قادمة", "Nothing upcoming"], ["ستظهر هنا المحاضرات والاختبارات والواجبات", "Lectures, exams and assignments will appear here"], ["لا يوجد نشاط بعد", "No activity yet"], ["ستظهر هنا آخر أنشطتك", "Your latest activity will appear here"],
    ["لا توجد توصيات", "No recommendations"], ["سجّل موادك ليحلّل المرشد أداءك", "Register your courses so the guide can analyse your performance"], ["ضع لي خطة مذاكرة", "Build me a study plan"], ["تدريب سريع", "Quick practice"],
    ["حاضر", "Present"], ["غائب", "Absent"], ["متأخر", "Late"], ["إجمالي", "Total"], ["اليوم", "Today"], ["غدًا", "Tomorrow"], ["الأسبوع", "Week"], ["الشهر", "Month"], ["الآن", "Now"], ["أمس", "Yesterday"],
    ["بعد يومين", "In 2 days"], ["منذ يومين", "2 days ago"], ["منذ 3 أيام", "3 days ago"], ["منذ ساعتين", "2 hours ago"], ["الأسبوع القادم", "Next week"], ["الأسبوع الماضي", "Last week"],
    ["لا محاضرات اليوم", "No lectures today"], ["لا توجد محاضرات اليوم", "No lectures today"], ["لا محاضرات", "No lectures"], ["لا توجد محاضرات", "No lectures"], ["عرض الجدول", "View schedule"],
    ["الأحد", "Sunday"], ["الاثنين", "Monday"], ["الثلاثاء", "Tuesday"], ["الأربعاء", "Wednesday"], ["الخميس", "Thursday"], ["الجمعة", "Friday"], ["السبت", "Saturday"],
    ["أحد", "Sun"], ["اثنين", "Mon"], ["ثلاثاء", "Tue"], ["أربعاء", "Wed"], ["خميس", "Thu"], ["جمعة", "Fri"], ["سبت", "Sat"],
    // --- المواد ---
    ["تسجيل المواد", "Course registration"], ["مواد متاحة", "Available courses"], ["متاحة", "Available"], ["مغلق", "Closed"], ["مفتوح", "Open"], ["إضافة", "Add"], ["حذف", "Drop"], ["تسجيل", "Register"],
    ["تم حذف المادة", "Course dropped"], ["مقدمة في البرمجة", "Introduction to Programming"], ["هياكل البيانات", "Data Structures"], ["المادة مكتملة العدد", "Course is full"], ["باب التسجيل مغلق", "Registration is closed"],
    ["يتحقق النظام من السعة والمتطلبات السابقة وتعارض الجدول، ويوضح سبب أي مادة غير متاحة.", "The system checks capacity, prerequisites and schedule conflicts, and explains why a course is unavailable."],
    ["التحقق من الشروط يتم في طبقة الخادم: السعة، المتطلبات السابقة، التكرار، وتعارض الجدول.", "Checks run on the server: capacity, prerequisites, duplicates and schedule conflicts."],
    ["لم تسجل أي مادة بعد. ابدأ بتسجيل موادك.", "You haven't registered any course yet. Start by registering your courses."], ["سجّل موادك لتظهر في جدولك", "Register your courses to see them in your schedule"],
    ["يتحدّث تلقائيًا فور تسجيل المواد أو حذفها.", "Updates automatically when you register or drop courses."], ["يتحدث تلقائيًا عند تسجيل مادة أو حذفها.", "Updates automatically when you register or drop a course."],
    ["(إلزامية)", "(required)"], ["(اختيارية)", "(elective)"], ["ساعة معتمدة", "credit hours"], ["ساعات مسجلة", "Registered hours"], ["مجموع ساعاتك", "Your total hours"],
    // --- الدرجات/الحضور/الواجبات ---
    ["لا توجد درجات بعد", "No grades yet"], ["ستظهر درجاتك فور رصدها", "Your grades will appear as soon as they are posted"], ["متوسط الدرجات", "Average grade"], ["المواد المنجزة", "Completed courses"], ["GPA من 4.0", "GPA out of 4.0"], ["GPA من 4", "GPA out of 4"],
    ["نسبة حضورك أقل من 80%. حد الحرمان 75%.", "Your attendance is below 80%. The deprivation limit is 75%."], ["لا توجد مواد", "No courses"], ["سجّل موادك لتظهر نسب الحضور", "Register your courses to see attendance rates"],
    ["تسجيل الحضور بالوجه", "Face attendance"], ["تحقق حيوية + مطابقة هوية", "Liveness + identity match"],
    ["يتحقق النظام من وجودك الفعلي (رمش وحركة رأس) ثم يطابق وجهك بصورتك المسجّلة قبل تسجيل الحضور.", "The system checks you are physically present (blink and head turn), then matches your face to your registered photo before recording attendance."],
    ["تم التسليم", "Submitted"], ["تم تسليم الواجب", "Assignment submitted"], ["آخر التسليمات", "Latest submissions"], ["آخر الإعلانات", "Latest announcements"], ["التسليم", "Due"],
    ["رسم ER Diagram", "Draw an ER Diagram"], ["مشروع صفحة ويب", "Web page project"], ["تقرير عن الذكاء الاصطناعي", "Report on artificial intelligence"], ["الاختبارات النصفية", "Midterm exams"], ["الاختبارات النهائية", "Final exams"], ["اختبار نصفي", "Midterm exam"],
    ["اختباراتي القادمة", "My upcoming exams"], ["تنبيهات", "Alerts"],
    // --- الإشعارات ---
    ["تحديد الكل كمقروء", "Mark all as read"], ["تحديد كمقروء", "Mark as read"], ["عرض كل الإشعارات", "View all notifications"], ["غير المقروء", "Unread"], ["الكل", "All"], ["أكاديمي", "Academic"], ["الاختبارات", "Quizzes"], ["النظام", "System"],
    ["لا توجد إشعارات", "No notifications"], ["ستظهر هنا التنبيهات الجديدة", "New alerts will appear here"], ["لا شيء في هذا التصنيف", "Nothing in this category"], ["عاجل", "Urgent"],
    ["تنبيهات الاختبارات", "Exam alerts"], ["تنبيهات الواجبات", "Assignment alerts"], ["تنبيهات الحضور", "Attendance alerts"], ["إشعارات النظام", "System notifications"],
    ["تم رصد درجة الكويز الأول في Database", "Your first Database quiz grade was posted"], ["الاختبار النصفي في Database بعد 4 أيام", "Database midterm in 4 days"], ["تبقّى يومان على تسليم واجب ER Diagram", "2 days left to submit the ER Diagram assignment"],
    ["نسبة غيابك في الذكاء الاصطناعي تقترب من الحد المسموح", "Your absence rate in AI is close to the allowed limit"], ["تم تحديث نموذج التعرف على الوجه", "The face recognition model was updated"], ["فتح باب تسجيل الفصل حتى 15 أكتوبر", "Semester registration is open until October 15"],
    // --- الإعدادات والملف ---
    ["المظهر", "Appearance"], ["اختر شكل النظام المناسب لعينيك.", "Choose the look that suits your eyes."], ["فاتح", "Light"], ["داكن", "Dark"], ["تلقائي", "Auto"], ["اللغة", "Language"], ["العربية", "العربية"],
    ["الملف الشخصي", "Profile"], ["ملفي الشخصي", "My profile"], ["تعديل الملف الشخصي", "Edit profile"], ["جولة تعريفية", "Product tour"], ["الاسم", "Name"], ["البريد الجامعي", "University email"], ["رقم الهاتف", "Phone number"],
    ["حفظ", "Save"], ["إلغاء", "Cancel"], ["إغلاق", "Close"], ["رجوع", "Back"], ["التالي", "Next"], ["السابق", "Previous"], ["تخطي", "Skip"], ["ابدأ", "Start"], ["إرسال", "Send"], ["تم حفظ البيانات", "Data saved"],
    ["رقم الهاتف غير صالح", "Invalid phone number"], ["البريد الإلكتروني غير صالح", "Invalid email address"], ["الصورة الشخصية (مرجع التحقق من الهوية)", "Profile photo (identity reference)"],
    ["صورتي الشخصية", "My photo"], ["صورتك الشخصية", "Your photo"], ["لا توجد صورة", "No photo"], ["لا توجد صورة شخصية مسجّلة", "No profile photo registered"], ["رفع صورة", "Upload photo"], ["استبدال الصورة", "Replace photo"], ["حذف الصورة", "Delete photo"],
    ["إضافة الصورة", "Add photo"], ["حفظ الصورة", "Save photo"], ["معاينة الصورة", "Photo preview"], ["اقتصاص الصورة الشخصية", "Crop profile photo"], ["مسجّلة ومقفلة", "Registered and locked"], ["غير مسجّلة", "Not registered"],
    ["تم حفظ الصورة بنجاح.", "Photo saved."], ["تم حذف الصورة.", "Photo deleted."], ["جارٍ معالجة الصورة…", "Processing photo…"], ["اختر ملف صورة", "Choose an image file"], ["اختر ملف صورة بحجم أقل من 8 ميجابايت", "Choose an image under 8 MB"],
    ["اسحب الصورة لتوسيط وجهك. يجب أن يظهر وجهك وحده وبوضوح.", "Drag the photo to centre your face. Only your face should be visible, clearly."], ["التكبير", "Zoom"], ["الصورة مظلمة؛ استخدم إضاءة أفضل.", "The photo is dark; use better lighting."],
    ["الصورة شديدة الإضاءة.", "The photo is overexposed."], ["الصورة غير حادة؛ ثبّت الكاميرا وأعد التصوير.", "The photo is blurry; hold steady and retake it."], ["الصورة فيها أكثر من وجه. استخدم صورة لوجهك وحده.", "The photo has more than one face. Use a photo of just your face."],
    ["لا يظهر وجه واضح في الصورة. استخدم صورة أوضح لوجهك.", "No clear face found. Use a clearer photo of your face."], ["الوجه صغير أو غير واضح؛ قرّب الكاميرا من وجهك.", "The face is small or unclear; move closer to the camera."],
    ["تعذّر حفظ الصورة", "Could not save the photo"], ["تعذّر حفظ الصورة على الخادم", "Could not save the photo on the server"], ["الخصوصية وبيانات الوجه", "Privacy and face data"],
    ["تُحفظ بصمة رقمية (أرقام) لوجهك للتحقق من الهوية، وتُعالَج الصور داخل جهازك. لا يمكنك تغيير الصورة المسجّلة بنفسك حفاظًا على الأمان؛ يمكنك فقط طلب التغيير من الإدارة.", "A numeric fingerprint of your face is stored for identity checks, and photos are processed on your device. For security you can't change the registered photo yourself; you can only request a change from the administration."],
    ["طلب تغيير صورة الطالب", "Request a student photo change"], ["أُرسل طلبك إلى الإدارة", "Your request was sent to the administration"],
    // --- الكاميرا والوجه ---
    ["كشف الوجه", "Face detected"], ["جودة الصورة والزاوية", "Image quality & angle"], ["الحيوية: رمش العين", "Liveness: blink"], ["الحيوية: حركة الرأس", "Liveness: head movement"], ["مطابقة الهوية", "Identity match"], ["درجة الثقة", "Confidence"],
    ["الكاميرا غير متاحة", "Camera unavailable"], ["التعرف على الوجه غير متاح", "Face recognition unavailable"], ["جارٍ تشغيل الكاميرا…", "Starting the camera…"], ["جارٍ مطابقة الهوية…", "Matching identity…"], ["جارٍ كشف الوجه…", "Detecting face…"],
    ["تم التحقق من الهوية", "Identity verified"], ["فشل التحقق", "Verification failed"], ["لم يُرصد وجه — ضع وجهك داخل الإطار", "No face detected — place your face inside the frame"], ["أكثر من وجه أمام الكاميرا — لا يمكن المتابعة", "More than one face — cannot continue"],
    ["ثقة منخفضة — أعد المحاولة بإضاءة أفضل", "Low confidence — retry with better lighting"], ["الإضاءة ضعيفة — اتجه نحو مصدر ضوء", "Low light — face a light source"], ["الصورة غير واضحة — ثبّت الكاميرا", "Image is blurry — hold the camera steady"], ["اقترب قليلًا من الكاميرا", "Move a little closer to the camera"],
    ["اجعل رأسك مستقيمًا", "Keep your head straight"], ["ارمش بعينيك مرة، ثم حرّك رأسك قليلًا لأحد الجانبين", "Blink once, then turn your head slightly to one side"], ["انتهت المهلة قبل اكتمال التحقق", "Timed out before verification finished"],
    ["الوجه لا يطابق صورة صاحب الحساب", "The face doesn't match the account owner's photo"], ["تعذّر التحقق من هويتك", "We couldn't verify your identity"], ["لا توجد مواد مسجّلة", "No registered courses"], ["سجّل موادك أولًا لتتمكن من تسجيل الحضور.", "Register your courses first so you can record attendance."],
    ["أضف صورتك أولًا من تعديل الملف الشخصي ليتمكن النظام من مطابقتك.", "Add your photo first from Edit profile so the system can match you."], ["تعذّر استخراج بصمة الوجه من صورتك المسجّلة؛ تواصل مع الإدارة.", "Couldn't extract a face print from your registered photo; contact the administration."],
    ["تم تسجيل حضورك في", "Your attendance was recorded in"], ["(متأخر)", "(late)"], ["المادة", "Course"], ["إعادة اختبار الكاميرا", "Re-test camera"], ["الدقة تتأثر بالإضاءة وزاوية الوجه وجودة الكاميرا.", "Accuracy depends on lighting, face angle and camera quality."],
    ["تسجيل حضور بالوجه في", "Face attendance in"], ["معاينة الكاميرا", "Camera preview"], ["الكاميرا تعمل.", "The camera is working."], ["الكاميرا تعمل بنجاح.", "The camera works."], ["الكاميرا", "Camera"],
    // --- الاختبارات الآمنة ---
    ["الاختبارات الآمنة", "Secure quizzes"], ["ابدأ الاختبار", "Start quiz"], ["أوافق وأبدأ الاختبار", "I agree, start the quiz"], ["قواعد الاختبار الآمن", "Secure quiz rules"], ["يمكنك بدء الاختبار الآن", "You can start the quiz now"],
    ["تم تسليم الاختبار", "Quiz submitted"], ["تم التسليم تلقائيًا", "Auto-submitted"], ["العودة إلى الاختبار", "Back to the quiz"], ["لا يمكن مغادرة الاختبار قبل تسليمه", "You can't leave the quiz before submitting it"],
    ["تحذير: تم تسجيل مخالفة. المخالفة التالية ستسلّم الاختبار تلقائيًا.", "Warning: a violation was recorded. The next one will auto-submit the quiz."], ["النسخ واللصق غير مسموح أثناء الاختبار", "Copy and paste are not allowed during the quiz"],
    ["تم الخروج من وضع ملء الشاشة", "Full-screen mode was exited"], ["لا يمكن تنفيذ هذا الإجراء أثناء الاختبار", "This action isn't available during the quiz"], ["المخالفات المسموحة", "Allowed violations"], ["المخالفات:", "Violations:"], ["أحداث الأمان", "Security events"],
    ["أمان الاختبارات", "Quiz security"], ["إلزام ملء الشاشة", "Require full screen"], ["منع النسخ واللصق", "Block copy & paste"], ["اكتشاف الخروج من التبويب", "Detect tab switching"], ["الكاميرا إلزامية (بموافقة الطالب)", "Camera required (with student consent)"],
    // --- المرشد (واجهة) ---
    ["اطرح سؤالًا", "Ask a question"], ["خدمات المرشد", "Guide services"], ["ملف الطالب", "Student profile"], ["مسح المحادثة", "Clear chat"], ["مسح تلقائي عند المغادرة", "Auto-clear on leave"], ["متصل · يفهم اللهجات والإنجليزية", "Online · understands dialects and English"],
    ["اكتب سؤالك بالعربية أو بلهجتك أو بالإنجليزية…", "Type your question in Arabic, your dialect or English…"], ["ملخص وضعي الأكاديمي", "Summary of my academic status"], ["ابني لي جدولا للفصل", "Build me a semester schedule"], ["ابنِ لي جدولًا للفصل", "Build me a semester schedule"],
    ["ما مدى تقدمي نحو التخرج؟", "How far am I from graduating?"], ["خطة مذاكرة لاختباري القادم", "Study plan for my next exam"], ["المواد التي أحتاج لتحسينها", "Courses I need to improve"], ["المواد التي أحتاج تحسينها", "Courses that need work"], ["نسبة حضوري", "My attendance rate"], ["ما نسبة حضوري؟", "What's my attendance rate?"],
    ["اختبرني (تدريب)", "Quiz me (practice)"], ["اختباراتي القادمة", "My upcoming exams"], ["ما اختباراتي القادمة؟", "What are my upcoming exams?"], ["قواعد الاختبار الآمن", "Secure quiz rules"], ["ما قواعد الاختبار الآمن؟", "What are the secure quiz rules?"], ["اختبرني في SQL", "Quiz me on SQL"],
    ["نعم، أكّد", "Yes, confirm"], ["لا، إلغاء", "No, cancel"], ["المصدر:", "Source:"], ["بياناتك الأكاديمية", "Your academic data"], ["قاعدة المعرفة التعليمية", "Learning knowledge base"], ["سياسة النزاهة الأكاديمية", "Academic integrity policy"],
    ["المرشد غير متاح الآن. حاول بعد قليل.", "The guide is unavailable right now. Please try again shortly."], ["حدث خطأ أثناء تنفيذ العملية. حاول مرة أخرى.", "Something went wrong. Please try again."], ["مرحبًا بك", "Welcome"],
    ["اكتب سؤالك بالعربية أو بلهجتك أو بالإنجليزية. جرّب سؤالًا الآن:", "Ask in Arabic, your dialect or English. Try a question now:"], ["أنا المرشد الأكاديمي، وسأعرّفك بأهم أقسام البوابة.", "I'm the academic guide, and I'll show you the main parts of the portal."],
    ["تعرض معدلك التراكمي وساعاتك المسجلة ومحاضراتك وآخر الإعلانات.", "Shows your GPA, registered hours, lectures and latest announcements."], ["الجدول الأسبوعي|", "Weekly schedule|"],
    // --- الإدارة والدكتور ---
    ["لوحة إدارة الجامعة", "University admin panel"], ["لوحة الإدارة – UniSmart", "Admin Panel – UniSmart"], ["التحكم في التسجيل", "Registration control"], ["باب التسجيل مفتوح", "Registration is open"], ["يطبّق فورًا على كل الطلاب", "Applies immediately to all students"],
    ["السجلات والأمان", "Logs & security"], ["سجل العمليات والأمان", "Operations & security log"], ["سجل العمليات (Audit Log)", "Audit Log"], ["لا عمليات بعد", "No operations yet"], ["الحالة الأمنية: نشطة", "Security status: active"], ["تُسجَّل هنا العمليات الحساسة وأحداث الأمان للمراجعة.", "Sensitive operations and security events are logged here for review."],
    ["موادك وطلابك", "Your courses and students"], ["لوحة الدكتور: موادك وطلابك وكويزاتك.", "Faculty panel: your courses, students and quizzes."], ["طلاب مسجلون", "Enrolled students"], ["كويزات نشطة", "Active quizzes"], ["كويز نشط", "Active quiz"], ["الأحداث إشارات للمراجعة وليست دليلًا تلقائيًا على الغش.", "Events are review signals, not automatic proof of cheating."],
    ["قاعدة معرفة المرشد", "Guide knowledge base"], ["إضافة نص", "Add text"], ["رفع ملفات", "Upload files"], ["اسحب الملفات هنا", "Drag files here"], ["المصادر المفهرسة", "Indexed sources"], ["المقاطع المفهرسة", "Indexed chunks"], ["لا توجد مصادر بعد.", "No sources yet."], ["حفظ القاموس", "Save glossary"],
    ["تم حفظ القاموس.", "Glossary saved."], ["التدريب", "Training"], ["نموذج التعرف على الوجه", "Face recognition model"], ["بطاقة النموذج", "Model card"], ["حدود النموذج", "Model limits"], ["الهويات المسجّلة", "Registered identities"], ["الهويات المدرَّبة", "Trained identities"], ["غير مدرَّب", "Not trained"],
    ["تدريب النموذج على الصور المسجّلة", "Train the model on registered photos"], ["جارٍ التدريب…", "Training…"], ["تم تدريب نموذج الوجه بنجاح", "Face model trained successfully"], ["عتبة المطابقة", "Match threshold"], ["بصمة الوجه", "Face print"], ["أضافها", "Added by"], ["التاريخ", "Date"], ["حالة الصورة", "Photo status"],
    ["عن اختبار الكاميرا", "About camera test"], ["اختبار الكاميرا والتعرف على الوجه", "Camera & face recognition test"], ["تشغيل الكاميرا واختبارها", "Start and test camera"],
    // --- عام ---
    ["مرحبًا،", "Welcome,"], ["ساعة", "hr"], ["دقائق", "minutes"], ["أيام", "days"], ["عناصر", "items"], ["من", "of"], ["بعد", "In"], ["لديك", "You have"], ["نص", "Text"], ["تم", "Done"], ["غير ظاهر", "Not visible"], ["خطأ غير معروف", "Unknown error"],
    ["الأسئلة", "Questions"], ["سؤال", "Question"], ["أسئلة وأجوبة", "Q&A"], ["البرنامج", "Program"], ["الطالب", "Student"], ["الدرجة:", "Grade:"], ["الإصدار", "Version"], ["السجلات", "Logs"], ["السجل", "Log"],
    ["مكتبة", "Library"], ["مكتبه", "Library"], ["الكافتيريا", "Cafeteria"], ["كافتيريا", "Cafeteria"], ["العيادة الطبية", "Medical clinic"], ["عيادة", "Clinic"], ["الدعم الفني", "IT support"], ["دعم فني", "IT support"], ["شؤون الطلاب", "Student affairs"], ["معمل الحاسب", "Computer lab"], ["الكاميرا نشطة", "Camera active"],
  ];
  const D = new Map(PAIRS.map(([a, e]) => [a.replace(/\|$/, ""), e]));

  const PATTERNS = [
    [/^(\d+) عناصر$/, "$1 items"], [/^(\d+) عنصر$/, "$1 item"], [/^بعد (\d+) أيام$/, "In $1 days"], [/^بعد (\d+) يوم$/, "In $1 day"], [/^(\d+) غير مقروء$/, "$1 unread"], [/^الإشعارات \((\d+) غير مقروء\)$/, "Notifications ($1 unread)"],
    [/^حاضر (\d+)$/, "Present $1"], [/^غائب (\d+)$/, "Absent $1"], [/^متأخر (\d+)$/, "Late $1"], [/^(\d+) ساعة$/, "$1 hrs"], [/^(\d+) ساعات$/, "$1 credit hrs"], [/^يتطلب (.+)$/, (m, x) => "Requires " + x], [/^(\d+) ساعات معتمدة$/, "$1 credit hours"], [/^(\d+) دقائق$/, "$1 min"], [/^(\d+) دقيقة$/, "$1 min"],
    [/^التقدم الأكاديمي: (\d+) من (\d+) ساعة معتمدة$/, "Academic progress: $1 of $2 credit hours"], [/^الرقم الجامعي (\d+)$/, "Student ID $1"], [/^GPA (.+)$/, "GPA $1"], [/^الفصل الدراسي الأول \(خريف (\d+)\)$/, "Fall semester ($1)"],
    [/^الفصل الدراسي الثاني \(ربيع (\d+)\)$/, "Spring semester ($1)"], [/^الفصل الصيفي \((\d+)\)$/, "Summer semester ($1)"], [/^لديك (\d+) محاضرات اليوم، وأقرب اختبار (.+)\.$/, (m, n, x) => `You have ${n} lectures today, and your nearest exam is ${tr(x)}.`], [/^لا توجد محاضرات اليوم، وأقرب اختبار (.+)\.$/, (m, x) => `No lectures today, and your nearest exam is ${tr(x)}.`],
    [/^(الأحد|الاثنين|الثلاثاء|الأربعاء|الخميس|الجمعة|السبت) (\d{1,2}:\d{2})$/, (m, d, t) => (D.get(d) || d) + " " + t], [/^منذ (\d+) أيام$/, "$1 days ago"], [/^منذ (\d+) ساعات$/, "$1 hours ago"], [/^(\d+) من (\d+)$/, "$1 of $2"],
    [/^(\d+) \/ (\d+)$/, "$1 / $2"], [/^المعدل (.+)$/, "GPA $1"], [/^الدرجة: (.+)$/, "Grade: $1"], [/^مرحبًا،? (.+)$/, "Welcome, $1"], [/^(.+) – UniSmart$/, (m, t) => (D.get(t) || t) + " – UniSmart"],
    [/^تم تسجيل حضورك في (.+?)( \(متأخر\))?$/, (m, c, l) => "Your attendance was recorded in " + c + (l ? " (late)" : "")], [/^تم تسليم الواجب: (.+)$/, "Assignment submitted: $1"], [/^مبروك! سجّلت (.+)$/, "Congratulations! You registered $1"],
    [/^(\d+) طلاب سلّموا الواجب الأخير$/, "$1 students submitted the latest assignment"], [/^(\d+)% (.+)$/, (m, p, r) => p + "% " + (D.get(r) || r)],
  ];
  const AR = /[\u0600-\u06ff]/;
  function one(t) { const r = D.get(t); if (r !== undefined) return r; for (const [re, to] of PATTERNS) if (re.test(t)) return t.replace(re, to); }
  function tr(s) {
    if (lang !== "en" || !s || !AR.test(s)) return s;
    const t = s.replace(/\s+/g, " ").trim(); if (!t) return s;
    let r = one(t);
    if (r === undefined && /[·—–،:]/.test(t)) {                    // نص مركّب: نترجم أجزاءه المعروفة (قاموس أو نمط)
      const parts = t.split(/(\s[·—–]\s|،\s?|:\s)/); let hit = false;
      const out = parts.map(p => { const x = one(p.trim()); if (x !== undefined) { hit = true; return x } return p });
      if (hit) r = out.join("").replace(/،\s?/g, ", ");
    }
    if (r === undefined) return s;
    return s.replace(t, r);
  }
  const SKIP = new Set(["SCRIPT", "STYLE", "TEXTAREA", "INPUT", "CODE", "PRE"]);
  function walk(root) {
    if (lang !== "en" || !root) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode(n) { const p = n.parentElement; return p && !SKIP.has(p.tagName) && !p.closest("#msgs .m,[data-notr]") && AR.test(n.nodeValue) ? 1 : 2 } });
    const L = []; while (w.nextNode()) L.push(w.currentNode);
    L.forEach(n => { const v = tr(n.nodeValue); if (v !== n.nodeValue) n.nodeValue = v });
    (root.querySelectorAll ? root.querySelectorAll("[aria-label],[placeholder],[title],[alt]") : []).forEach(el => ["aria-label", "placeholder", "title", "alt"].forEach(a => { const x = el.getAttribute(a); if (x && AR.test(x)) { const v = tr(x); if (v !== x) el.setAttribute(a, v) } }));
  }
  let pend = false;
  function schedule() { if (pend || lang !== "en") return; pend = true; requestAnimationFrame(() => { pend = false; walk(document.body); document.title = tr(document.title) }) }
  function applyDir() { const h = document.documentElement; h.lang = lang; h.dir = lang === "en" ? "ltr" : "rtl" }
  applyDir();

  const I18N = {
    get lang() { return lang }, tr, walk,
    t: (ar, en) => lang === "en" ? en : ar,
    set(l) {
      if (l !== "ar" && l !== "en" || l === lang) return;
      if (document.body && document.body.classList.contains("examing")) { if (window.toast) toast(lang === "en" ? "You can't change language during a quiz" : "لا يمكن تغيير اللغة أثناء الاختبار"); return }
      try { localStorage.setItem(KEY, l); sessionStorage.removeItem("us_chatlang") } catch (_) {}
      location.reload();                                          // الحالة محفوظة في sessionStorage؛ إعادة التحميل تضمن إعادة رسم كل شيء بلغة واحدة
    }
  };
  window.I18N = I18N;
  document.addEventListener("click", e => { const b = e.target.closest && e.target.closest("[data-lang]"); if (b) { e.preventDefault(); I18N.set(b.dataset.lang) } });
  if (lang === "en") {
    const start = () => { walk(document.body); document.title = tr(document.title); new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true, characterData: true }) };
    document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", start) : start();
  }
})();

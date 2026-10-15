// ---------- بيانات تجريبية (في النسخة الكاملة تأتي من الـ backend) ----------
const courses=[
 {id:"DB301",name:"Database",ar:"داتابيز",doc:"Dr. Ahmed Ali",cr:3,cap:40,enr:38,pre:["CS201"],slot:"الأحد 10:00",room:"A-101"},
 {id:"AI401",name:"Artificial Intelligence",ar:"ذكاء اصطناعي",doc:"Dr. Sara Mohamed",cr:3,cap:35,enr:20,pre:["CS201"],slot:"الاثنين 12:00",room:"B-204"},
 {id:"WEB301",name:"Web Development",ar:"ويب",doc:"Dr. Omar Hassan",cr:3,cap:30,enr:30,pre:[],slot:"الأحد 10:00",room:"Lab-2"},
 {id:"SE302",name:"Software Engineering",ar:"هندسة البرمجيات",doc:"Dr. Sara Mohamed",cr:3,cap:40,enr:22,pre:[],slot:"الثلاثاء 09:00",room:"A-305"},
 {id:"NET301",name:"Computer Networks",ar:"شبكات",doc:"Dr. Omar Hassan",cr:3,cap:40,enr:15,pre:["CS301"],slot:"الأربعاء 11:00",room:"B-110"},
 {id:"OS302",name:"Operating Systems",ar:"نظم التشغيل",doc:"Dr. Karim Adel",cr:3,cap:45,enr:30,pre:["CS201"],slot:"الأربعاء 10:00",room:"B-102"},
 {id:"ALG301",name:"Algorithms",ar:"خوارزميات",doc:"Dr. Laila Mostafa",cr:3,cap:45,enr:33,pre:["CS201"],slot:"الخميس 09:00",room:"A-202"},
 {id:"HCI304",name:"Human-Computer Interaction",ar:"تفاعل الإنسان والحاسب",doc:"Dr. Laila Mostafa",cr:2,cap:40,enr:18,pre:[],slot:"الاثنين 09:00",room:"B-301"},
 {id:"MOB303",name:"Mobile Development",ar:"تطوير تطبيقات الموبايل",doc:"Dr. Omar Hassan",cr:3,cap:30,enr:12,pre:["WEB301"],slot:"الثلاثاء 12:00",room:"Lab-3"},
 {id:"ML402",name:"Machine Learning",ar:"تعلم الآلة",doc:"Dr. Sara Mohamed",cr:3,cap:35,enr:25,pre:["AI401"],slot:"الأربعاء 12:00",room:"B-205"},
 {id:"SEC403",name:"Cyber Security",ar:"أمن المعلومات",doc:"Dr. Karim Adel",cr:3,cap:35,enr:20,pre:["NET301"],slot:"الخميس 11:00",room:"Lab-1"},
 {id:"DM404",name:"Data Mining",ar:"التنقيب في البيانات",doc:"Dr. Ahmed Ali",cr:3,cap:35,enr:16,pre:["DB301"],slot:"الاثنين 14:00",room:"A-304"}];
const me={done:["CS101","CS201"],reg:["DB301","AI401","SE302"],gpa:3.35,grades:[["CS101","A-"],["CS201","B+"]]};
const audit=[];
const quiz={title:"كويز قواعد البيانات (آمن)",mins:5,maxV:1,qs:[
 {q:"أي أمر SQL يُستخدم لاسترجاع البيانات من جدول؟",o:["INSERT","SELECT","DELETE","ALTER"],a:1},
 {q:"المفتاح الأساسي (Primary Key) يمكن أن يتكرر في الجدول.",o:["صح","خطأ"],a:1},
 {q:"أي مما يلي يربط جدولين ببعضهما؟",o:["JOIN","DROP","TRUNCATE","INDEX"],a:0},
 {q:"الـ Normalization تهدف إلى تقليل التكرار في البيانات.",o:["صح","خطأ"],a:0}]};
let Q=null,user=null,tab="chat",chat=[{r:"b",t:"أهلًا! أنا مساعد UniSmart. اكتب لي بأي لغة: عربي، مصري، أو English، وأنا أرد من بيانات النظام الفعلية وبصلاحياتك فقط."}],pending=null,busy=false,turn=0,pendTurn=-1;
const $=s=>document.querySelector(s);
const PAGE=document.body.dataset.page||"",SK="unismart_state";let resumeTour=-1,lastTab="";
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function toast(t){const e=$("#toast");e.textContent=t;e.style.display="block";clearTimeout(toast.h);toast.h=setTimeout(()=>e.style.display="none",2800)}

// ---------- "Backend": قواعد التسجيل (نفس الدوال يستخدمها الشات والواجهة) ----------
function eligibility(c){if(!regOpen&&!me.reg.includes(c.id))return"باب التسجيل مغلق حاليًا";
 if(me.reg.includes(c.id))return"أنت مسجل في المادة بالفعل";
 if(c.enr>=c.cap)return"المادة مكتملة العدد";
 const miss=c.pre.filter(p=>!me.done.includes(p));
 if(miss.length)return"لازم تنجح في "+miss.join("، ")+" أولًا";
 const x=courses.find(o=>me.reg.includes(o.id)&&o.slot===c.slot);
 if(x)return"في تعارض في الجدول مع "+x.name;
 return null}
function register(id){const R0=register0(id);if(R0.ok)liveMut("POST",id);return R0}
function register0(id){const c=courses.find(x=>x.id===id),e=eligibility(c);if(e)return{ok:false,msg:e};
 c.enr++;me.reg.push(id);audit.unshift(new Date().toLocaleTimeString(LOC)+" COURSE_REGISTERED "+id);return{ok:true,msg:"تم تسجيلك في "+c.name+" بنجاح."}}
function drop(id){drop0(id);liveMut("DELETE",id)}
function drop0(id){const c=courses.find(x=>x.id===id);me.reg=me.reg.filter(x=>x!==id);c.enr--;audit.unshift(new Date().toLocaleTimeString(LOC)+" COURSE_DROPPED "+id)}

// ---------- المساعد الذكي: اختيار أداة ← صلاحيات ← بيانات حقيقية ----------
const byId=i=>courses.find(c=>c.id===i);
let ctx={},AR=true,frHit=false,clrArm=false,autoClear=false;
const CRESTS='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true"><path d="M12 4 22 9 12 14 2 9z" fill="currentColor"/><path d="M6 12v4.2c0 1.5 2.7 3 6 3s6-1.5 6-3V12l-6 3z" fill="currentColor" fill-opacity=".85"/><path d="M21 10.2v5.3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
const AL={DB301:["داتا بيز","داتابيز","قواعد البيانات","قاعدة البيانات","database","dbms","db"],AI401:["ذكاء","الاي اي","artificial","ai"],WEB301:["web","ويب","موقع"],SE302:["هندس","software","se"],NET301:["network","شبك","net"],OS302:["نظم التشغيل","operating system","os"],ALG301:["خوارزم","algorithm"],HCI304:["تفاعل الانسان","hci"],MOB303:["موبايل","mobile"],ML402:["تعلم الاله","machine learning","ml"],SEC403:["امن المعلومات","cyber","security"],DM404:["تنقيب","data mining"]};
const FR={"3ayez":"عايز","3ayz":"عايز","3ayza":"عايزه","asagel":"سجل","sagel":"سجل","sajel":"سجل","asajel":"سجل","matah":"متاح","mawad":"مواد","materia":"مادة","dr":"دكتور","doktor":"دكتور","gadwal":"جدول","jadwal":"جدول","daragat":"درجات","emtehan":"امتحان","imtihan":"امتحان","kwiz":"كويز","ezay":"ازاي","shu":"ايش","wesh":"ايش","chno":"ايش","chnou":"ايش","chkoun":"مين","meen":"مين","fein":"فين","wen":"فين","emta":"امتي","emty":"امتي","shlon":"ازاي","kif":"كيف","ahzef":"احذف","ems7":"احذف","3amalak":"عملك","3amlak":"عملك","sana3ak":"صنعك","barmagak":"برمجك","tawarak":"طورك"},FRX=new Set(["dr","wen"]);
const LEX={
 study:["اذاكر","مذاكر","ذاكر","study","revise","revision","مراجعه","مراجعة"],
 weakq:["احتاج لتحسين","محتاج تحسين","تحسينها","need improvement","need to improve","weakest","اضعف","المواد الضعيفه"],
 attq:["حضوري","غيابي","my attendance","attendance rate"],
 upex:["امتحاناتي","اختباراتي","my exams","upcoming exams","عندي امتحان","عندي اختبار"],
 quizme:["اختبرني","quiz me","اسالني","اسئله تدريب","اسئلة تدريب","practice questions","mock quiz","drill me"],
 explain:["اشرح","explain","وضح"],
 cheat:["حل الكويز","حل الامتحان","حل الاختبار","جاوب الكويز","جاوب الامتحان","solve my exam","solve the quiz","answer the quiz","answer my exam","اجابات الكويز"],
 more:["كمل","كمان","اكتر","اكثر","المزيد","more","continue","go on","elaborate"],
 loc:["مكان","فين","قاعه","قاعة","room","location","hall","اروح"],
 cal:["اخر ميعاد","اخر موعد","التقويم","calendar","اجازه","اجازة","holiday","ميعاد التسجيل","موعد التسجيل","registration deadline","اضافه وحذف","اضافة وحذف","add/drop","امتي الامتحان","موعد الامتحان","exam date","جدول الامتحانات","نصفي","midterm"],
 contact:["ايميل","email","mail","بريد","اتواصل","تواصل","contact"],
 time:["الساعه كام","الساعة كام","الساعه كم","الساعة كم","what time","التاريخ","what day","today's date","النهارده كام","اليوم كام"],
 left:["ناقص","remaining courses","courses left","what am i missing"],
 bye:["مع السلامه","مع السلامة","bye","goodbye","وداعا","الي اللقاء"],
 how:["كيف حالك","عامل ايه","اخبارك","how are you","ازيك","شلونك","كيفك"],
 who:["مين انت","من انت","انت مين","who are you","اسمك","your name"],
 capab:["تقدر تعمل","تقدر تساعد","ماذا تستطيع","ماذا تفعل","what can you","خدماتك","what do you do","ما الذي يمكنك"],
 feel:["خايف","قلقان","قلق","متوتر","تعبان","محبط","زهقان","مش قادر","worried","anxious","stressed","afraid","struggling","overwhelmed","frustrated"],
 why:["=ليه","=ليش","why","لماذا","السبب"],
 status:["ملخص","وضعي","حالتي","موقفي","standing","summary","overview","status","تقرير"],
 progress:["تخرج","graduation","graduate","متبقي","المتبقي","remaining","progress","degree"],
 whatif:["لو حصلت","لو جبت","لو اخدت","if i get","what if","حاسبه","حاسبة","calculator","هيبقي","اتوقع"],
 prereq:["متطلب","متطلبات","prerequisite","prerequisites","prereq","شروط","قبلها"],
 assign:["واجب","واجبات","assignment","assignments","homework","تسليم","deadline"],
 news:["اعلان","اعلانات","announcement","announcements","اخبار","news"],
 office:["مكتب","حجز","احجز","book","appointment","مقابله","مقابلة","ارشاد","office hours","ساعات مكتبيه","ساعات مكتبية","meet"],
 build:["ابني","ابن لي","build","generate","جهز لي","جهزلي","ركب لي"],
 examrules:["قواعد الاختبار","قواعد الامتحان","exam rules","secure","كاميرا","camera","غش","مخالفه","مخالفة","وضع امن"],
 load:["عبء","load","كم ساعه","كم ساعة","max credits","الحد الاقصي","ساعات معتمده","ساعات معتمدة"],
 conflict:["تعارض","conflict","clash"],
 alt:["بديل","بدائل","alternative","alternatives","instead"],
 other:["تاني","غيري","اخر","another","other","زميلي","صديقي","احمد","محمد","ahmed","sara","someone"],
 drop:["احذف","drop","شيل","انسحب","withdraw","=الغي","remove"],
 help:["ازاي","كيف","how","طريقه","طريقة","مساعده","مساعدة","help"],
 mine:["موادي","my courses","مواد مسجله","مواد مسجلة","registered courses","كام مادة","how many courses","عدد موادي"],
 register:["سجل","register","enroll","اضف","add","ضيف","اشترك","join","ادخلني","خدني"],
 plan:["خطه","خطة","plan","رشح","اقترح","recommend","suggest","نصيحه","نصيحة","advise"],
 doctor:["دكتور","دكاتره","دكاترة","doctor","instructor","professor","prof","استاذ","بيدرس","يدرس","teach","مدرس"],
 avail:["مفتوح","متاح","available","open","اقدر","can","مواد"],
 sched:["جدول","schedule","timetable","محاضرات","مواعيد","بكره","النهارده","اليوم","today","tomorrow"],
 gpa:["gpa","معدل","درجات","grades","marks","نتيجه","نتيجة","تقدير"],
 exam:["امتحان","كويز","exam","quiz","test","اختبار"],
 policy:["سياسه","سياسة","حضور","لائحه","لائحة","policy","attendance","rules","غياب"],
 greet:["مرحبا","اهلا","هلا","سلام","hello","hey","هاي","صباح","مساء"],
 thanks:["شكرا","thanks","thank","تسلم","يعطيك","مشكور","جزاك","تمام","اوكي","حلو","ممتاز","great","perfect"]};
const YES=/^(نعم|ايوه|ايوا|اه|اكيد|تمام|ماشي|اوكي|موافق|اكد|يلا|طيب|ok|okay|yes|yeah|yep|sure|confirm|y$)/,NO=/^(لا|الغ|مش|no|nope|cancel|n$)/;
function lev(a,b){const d=[];for(let i=0;i<=a.length;i++)d[i]=[i];for(let j=1;j<=b.length;j++)d[0][j]=j;for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1));return d[a.length][b.length]}
function nz(r){const t=r.toLowerCase().replace(/[\u064B-\u0652\u0640]/g,"").replace(/[أإآ]/g,"ا").replace(/ى/g,"ي").replace(/[؟،؛?!.,]/g," ");return t.replace(/[a-z0-9]+/g,w=>{if(FR[w]){if(!FRX.has(w))frHit=true;return FR[w]}return w})}
const sc=(t,toks,ks)=>ks.reduce((n,k)=>n+((k[0]==="="?toks.includes(k.slice(1)):/[a-z]/.test(k)&&!k.includes(" ")?toks.some(w=>w===k||(k.length>4&&lev(w,k)<=1)):(t.includes(k)||(k.length>=5&&!k.includes(" ")&&toks.some(w=>w.length>=4&&Math.abs(w.length-k.length)<=1&&lev(w,k)<=1))))?1:0),0);
function findCourse(t,toks){const k=Object.keys(AL).find(k=>AL[k].some(w=>/[a-z]/.test(w)?(w.length<=3?toks.includes(w):toks.some(x=>x===w||(w.length>4&&lev(x,w)<=1))):t.includes(w)));return k?byId(k):courses.find(c=>t.includes(c.id.toLowerCase()))}
const T=(a,e)=>AR?a:e;
const lst=a=>a.map((x,i)=>(i+1)+". "+x.name+" – "+x.doc+" ("+x.slot+")").join("\n");
const GL0=`university=الجامعة
faculty=الكلية
department=القسم
course=المادة
semester=الفصل الدراسي
academic year=العام الدراسي
summer semester=الفصل الصيفي
credit hour=ساعة معتمدة
lecture=محاضرة
lab=المعمل
exam=الاختبار
final exam=الاختبار النهائي
midterm exam=الاختبار النصفي
midterm=الاختبار النصفي
quiz=الكويز
assignment=الواجب
project=المشروع
grade=التقدير
grading scale=نظام التقدير
gpa=المعدل التراكمي
cumulative gpa=المعدل التراكمي
passing grade=درجة النجاح
failure=الرسوب
fail=يرسب
pass=ينجح
repeat=يعيد
retake=إعادة
makeup exam=اختبار تعويضي
attendance=الحضور
attendance policy=سياسة الحضور
absence=الغياب
absent=غائب
excuse=عذر
medical excuse=عذر مرضي
barred from=محروم من
prerequisite=متطلب سابق
registration=التسجيل
register=يسجل
enroll=يسجل
enrollment=التسجيل
add and drop=الإضافة والحذف
add and drop period=فترة الإضافة والحذف
drop=يحذف
withdraw=ينسحب
withdrawal=الانسحاب
deadline=الموعد النهائي
tuition=الرسوم الدراسية
tuition fee=الرسوم الدراسية
fee=الرسوم
fine=الغرامة
late payment=التأخر في السداد
payment=السداد
pay=يسدد
paid=يُسدَّد
refund=استرداد
scholarship=منحة دراسية
financial aid=مساعدة مالية
graduation=التخرج
graduate=يتخرج
degree=الدرجة العلمية
requirement=متطلب
academic advisor=المرشد الأكاديمي
advisor=المرشد
appointment=موعد
office hours=الساعات المكتبية
instructor=المحاضر
professor=الأستاذ
doctor=الدكتور
dean=العميد
library=المكتبة
cafeteria=الكافتيريا
clinic=العيادة
student affairs=شؤون الطلاب
policy=السياسة
regulation=اللائحة
bylaws=اللائحة
rule=القاعدة
penalty=العقوبة
cheating=الغش
plagiarism=الانتحال
appeal=التظلم
grievance=التظلم
committee=اللجنة
approval=الموافقة
approved=معتمد
request=الطلب
submit=يقدم
application=الطلب
form=النموذج
document=المستند
id card=بطاقة الجامعة
email=البريد الإلكتروني
phone=الهاتف
office=المكتب
building=المبنى
floor=الدور
room=القاعة
hall=القاعة
open=مفتوح
closed=مغلق
working hours=ساعات العمل
hours=ساعات
per credit hour=لكل ساعة معتمدة
per semester=لكل فصل دراسي
per year=سنويًا
at least=على الأقل
at most=على الأكثر
no more than=ليس أكثر من
more than=أكثر من
less than=أقل من
percent=%
percentage=النسبة
maximum=الحد الأقصى
minimum=الحد الأدنى
credit load=العبء الدراسي
academic probation=الإنذار الأكاديمي
probation=الإنذار
warning=إنذار
honors=مرتبة الشرف
transfer=التحويل
freeze=تأجيل
lectures=محاضرات
each course=كل مادة
sunday=الأحد
monday=الاثنين
tuesday=الثلاثاء
wednesday=الأربعاء
thursday=الخميس
january=يناير
february=فبراير
march=مارس
april=أبريل
june=يونيو
july=يوليو
august=أغسطس
september=سبتمبر
october=أكتوبر
november=نوفمبر
december=ديسمبر
must not=يجب ألا
must=يجب أن
should=ينبغي أن
may=يجوز أن
can=يمكن أن
cannot=لا يمكن
will=سوف
not=لا
no=لا
the=
a=
an=
is=
are=
be=
was=كان
of=
in=في
on=على
at=في
for=لـ
to=إلى
and=و
or=أو
with=مع
without=بدون
by=بواسطة
from=من
per=لكل
each=كل
all=جميع
any=أي
if=إذا
when=عند
after=بعد
before=قبل
during=خلال
within=خلال
than=من
that=الذي
which=الذي
this=هذا
means=تعني
equals=يساوي
exceed=يتجاوز
attend=يحضر
required=مطلوب
require=يتطلب
allowed=مسموح
prohibited=ممنوع
eligible=مؤهل
student=الطالب
students=الطلاب
semester starts=بدء الفصل
starts=يبدأ
charged=تُحتسب
recorded=يُسجَّل
penalty=عقوبة
failure=رسوب
item=البند
amount=المبلغ
notes=ملاحظات
week=أسبوع
whose=الذي
unless=ما لم
end=نهاية
placed=يوضع
falls=ينخفض
below=أقل من
above=أعلى من
reduced=يُخفَّض
grade penalty=عقوبة على التقدير`;
let ENAR={};const ARC=new Map(),ek=w=>{w=w.toLowerCase();for(let i=0;i<3;i++){let x=w;if(x.length<4)break;if(/(s|x|z|ch|sh)es$/.test(x))x=x.slice(0,-2);else if(/ies$/.test(x))x=x.slice(0,-3)+"y";else if(/(ing|ed)$/.test(x)&&x.length>5)x=x.replace(/(ing|ed)$/,"");else if(/[^s]s$/.test(x))x=x.slice(0,-1);if(x===w)break;w=x}return w};
function glBuild(){ENAR={};ARC.clear();for(const line of (GL0+"\n"+(KB.gloss||"")).split("\n")){const i=line.indexOf("=");if(i<1)continue;const en=line.slice(0,i).trim().toLowerCase();if(en)ENAR[en.split(/\s+/).map(ek).join(" ")]=line.slice(i+1).trim()}}
const isEn=x=>(x.match(/[A-Za-z]/g)||[]).length>(x.match(/[\u0600-\u06ff]/g)||[]).length,UNIT={egp:"جنيه",le:"جنيه",usd:"دولار",$:"دولار"};
function trEnAr(text){const tk=text.match(/[A-Za-z]+(?:'[a-z]+)?|\d+(?:[.,]\d+)*|[^\sA-Za-z\d]/g)||[],out=[];let words=0,hit=0;
 for(let i=0;i<tk.length;){let m=null;for(let n=Math.min(4,tk.length-i);n>0&&!m;n--){const seg=tk.slice(i,i+n);if(seg.every(x=>/^[A-Za-z']+$/.test(x))){const k=seg.map(ek).join(" ");if(k in ENAR)m=[n,ENAR[k]]}}
  const w=tk[i];if(m){out.push(m[1]);words+=m[0];hit+=m[0];i+=m[0]}else{if(/^[A-Za-z]/.test(w)){words++;const u=UNIT[w.toLowerCase()];out.push(u||w);if(u)hit++}else out.push(w);i++}}
 return{t:out.filter(x=>x!=="").join(" ").replace(/\s+([.,;:!?)%])/g,"$1").replace(/\(\s+/g,"(").replace(/,/g,"،").replace(/\?/g,"؟").replace(/\s+/g," ").trim().replace(/(^|\s)و\s+/g,"$1و").replace(/لـ\s+ال/g,"لل").replace(/لـ\s+/g,"ل"),cov:words?hit/words:1}}
const arOf=x=>{let r=ARC.get(x);if(r===undefined){r=trEnAr(x).t;ARC.set(x,r)}return r},qtoks=q=>[...ktoks(q),...(isEn(q)?ktoks(trEnAr(q).t):[])],disp=x=>{if(NODISP||!AR||!isEn(x))return x;const r=trEnAr(x);return r.cov>=.5?r.t:x};
const SEED_AR=`س: ما شروط التسجيل في مادة؟
ج: يتحقق النظام من فتح باب التسجيل، وتوافر مقاعد، وإنجاز المتطلبات السابقة، وعدم تعارض موعد المحاضرة مع مواد أخرى.
س: ما نظام التقدير؟
ج: A من 90 إلى 100 (4.0)، وB من 80 إلى 89 (3.0)، وC من 70 إلى 79 (2.0)، وD من 60 إلى 69 (1.0)، وأقل من 60 يعني الرسوب F.
س: كيف يُحسب المعدل التراكمي؟
ج: يُضرب تقدير كل مادة في ساعاتها المعتمدة، ثم يُقسم المجموع على إجمالي الساعات المعتمدة المنجزة.
س: ما الحد الأقصى للغياب؟
ج: يُحرم الطالب من الاختبار النهائي إذا تجاوز غيابه 25% من محاضرات المادة، إلا بعذر مقبول.
س: كيف أقدم تظلمًا على درجة؟
ج: يُقدَّم الطلب إلى شؤون الطلاب خلال 7 أيام من إعلان النتيجة، وتنظره لجنة التظلمات.
س: ما العبء الدراسي المسموح؟
ج: من 12 إلى 18 ساعة معتمدة، ويقل الحد الأقصى لمن معدله أقل من 3.0.
س: متى يمكنني حذف مادة؟
ج: حتى نهاية فترة الإضافة والحذف دون أثر على التقدير، وبعدها يُسجَّل انسحاب (W).
س: ماذا يحدث عند الإنذار الأكاديمي؟
ج: إذا قل المعدل التراكمي عن 2.0 يُنذر الطالب ويُخفَّض عبؤه الدراسي ويُوجَّه إلى الإرشاد الأكاديمي.
س: كيف أحصل على بطاقة الجامعة؟
ج: من شؤون الطلاب بمبنى الإدارة بعد سداد الرسوم وإحضار صورة شخصية.
س: كم عدد الساعات المطلوبة للتخرج؟
ج: 132 ساعة معتمدة بمعدل تراكمي لا يقل عن 2.0.
س: هل توجد منح دراسية؟
ج: نعم، منح تفوق لمن معدله 3.5 فأكثر، ويُقدَّم الطلب إلى شؤون الطلاب مع المستندات المطلوبة.
س: كيف أعيد اختبارًا فاتني؟
ج: بتقديم عذر معتمد إلى شؤون الطلاب، وبعد موافقة اللجنة يُحدَّد اختبار تعويضي.`,
SEED_EN=`Attendance Policy
Students must attend at least 75% of lectures in each course. A student whose absence exceeds 25% is barred from the final exam unless a medical excuse is approved.
Withdrawal
A student may withdraw from a course before the end of the add and drop period without a grade penalty. Withdrawal after that period is recorded as W.
Tuition Payment
Tuition is charged per credit hour and must be paid before the semester starts. Late payment is subject to a fine.
Academic Probation
A student whose cumulative GPA falls below 2.0 is placed on academic probation and the credit load is reduced.`,
SEED_CSV="Item,Amount,Notes\nTuition per credit hour,1500 EGP,Paid before the semester starts\nServices fee,900 EGP,Per year\nGrievance fee,200 EGP,Per course\nLate payment fine,100 EGP,Per week";
function seedKB(){try{if(localStorage.getItem("us_kb_seeded")||KB.docs.length)return;
 [["الدليل الأكاديمي (أسئلة شائعة)","text",chunkText(SEED_AR,"")],["Student Handbook (EN)","text",chunkText(SEED_EN,"")],["Fees Table (EN)","csv",tableChunks(parseCsv(SEED_CSV),"","csv")]].forEach((x,i)=>KB.docs.push({id:"seed"+i,name:x[0],type:x[1],added:new Date().toLocaleDateString(LOC),on:true,chunks:x[2]}));
 kbSave();localStorage.setItem("us_kb_seeded","1")}catch(_){}}
let KB={docs:[]},kbIdx=null,kbMsg="",kbOut="",kbQ="";
function kbLoad(){try{KB=JSON.parse(localStorage.getItem("us_kb")||"null")||{docs:[]}}catch(_){KB={docs:[]}}KB.gloss=KB.gloss||"";glBuild();seedKB()}
function kbSave(){kbIdx=null;try{localStorage.setItem("us_kb",JSON.stringify(KB));return true}catch(_){kbMsg="تعذّر الحفظ: تجاوز حد التخزين في المتصفح (يُخزَّن على الخادم في الإنتاج).";return false}}
function addDoc(name,type,chunks){chunks=chunks.filter((c,i,a)=>a.findIndex(y=>y.text===c.text&&y.n===c.n)===i);const old=KB.docs;KB.docs=old.filter(d=>d.name!==name);KB.docs.push({id:Date.now().toString(36)+Math.random().toString(36).slice(2,5),name,type,added:new Date().toLocaleDateString(LOC),on:true,chunks});if(!kbSave()){KB.docs=old;kbIdx=null;return false}audit.unshift(nowT()+" KNOWLEDGE_ADDED "+name);return true}
const KSTOP=new Set("في من على الي عن ما هي هو هذا هذه ذلك التي الذي ان او مع كل هل ايه اية كام كيف لماذا ليه اللي لو سمحت ممكن يا قولي قل اخبرني عايز اعرف محتاج اريد اود انت انتي حضرتك مين شو ايش ماذا ازاي the of and is a to in for what how please pls can could tell me i want know need my you your do does did there any this that it be have has get an am was were who which are should would will shall might may مطلوب مسموح كم many much".split(" ").map(w=>w.replace(/[أإآ]/g,"ا").replace(/ى/g,"ي")));
const kstem=w=>{if(/[a-z]/.test(w)){const x=w.replace(/(ing|es|s)$/,"");return x.length>3?x:w}let x=w.replace(/^(وال|بال|لل|ال|و)(?=.{3,})/,"").replace(/(ات|ون|ين|ه|ة|ا)$/,"");const y=x.replace(/(كم|ك|ني|نا|ها|هم)$/,"");if(y.length>2)x=y;return x.length>2?x:w};
const SYN={
 c_make:["صنع","برمج","طور","عمل","انشا","انشاء","بني","بناء","صمم","تصميم","تطوير","برمجه","برمجة","خلق","make","made","making","build","built","building","develop","developed","developer","create","created","creator","program","programmed","programmer","design","designed","designer","maker","مطور","مبرمج","صانع","منشي","مصمم"],
 c_found:["اسس","مؤسس","تاسيس","founder","founded","found","establish","established"],
 c_fee:["رسوم","مصاريف","مصروفات","تكلفه","تكلفة","سعر","اسعار","fees","fee","cost","price","tuition","مبلغ"],
 c_absent:["حضور","غياب","تغيب","attendance","absence","absent"],
 c_where:["مكان","فين","عنوان","موقع","اين","where","location","address"],
 c_when:["موعد","ميعاد","امتي","وقت","تاريخ","when","date","deadline","time"],
 c_phone:["رقم","تليفون","موبايل","هاتف","phone","mobile","number","call"],
 c_mail:["ايميل","بريد","email","mail"],
 c_prof:["دكتور","استاذ","مدرس","بروف","prof","professor","instructor","doctor","teacher","lecturer"],
 c_reg:["سجل","اشترك","ضيف","انضم","enroll","register","join","add","registration","تسجيل"],
 c_drop:["احذف","الغي","انسحب","شيل","drop","withdraw","remove","cancel"],
 c_grade:["درجات","درجه","نتيجه","تقدير","معدل","grade","grades","marks","score","gpa","result","results"],
 c_sched:["جدول","محاضرات","محاضره","مواعيد","schedule","timetable","lectures","lecture","classes","class"],
 c_course:["ماده","مواد","مقرر","مقررات","كورس","course","courses","subject","subjects","module"],
 c_exam:["امتحان","اختبار","كويز","exam","exams","test","quiz","midterm","final"],
 c_grad:["تخرج","يتخرج","اتخرج","graduate","graduating","graduation"],
 c_privacy:["خصوصيه","privacy","تخزن","store","share","تشارك","سري","بيانات","data"],
 c_name:["اسم","name","called","تتسمي"],
 c_help:["مساعده","ساعد","help","assist"]},SYNMAP={};
for(const[c,l]of Object.entries(SYN))l.forEach(w=>{const k=kstem(nz(w));if(!SYNMAP[k])SYNMAP[k]=c});
const PRE=/^(بي|هي|بت|هت|ي|ت|ن|ا)(?=.{3,})/,CAN=w=>{for(const x of[w,w.replace(PRE,""),w.replace(/ي$/,""),w.replace(PRE,"").replace(/ي$/,"")])if(SYNMAP[x])return SYNMAP[x];return w};
const ktoks=x=>nz(x).split(/[^a-z\u0600-\u06ff0-9]+/).filter(w=>w&&!KSTOP.has(w)).map(kstem).filter(w=>!KSTOP.has(w)).map(CAN);
const EX={
 creator:["مين صنعك","مين اللي برمجك","مين اللي عملك","مين مطورك","مين مبرمجك","من الذي صممك","مين صاحب المشروع","انت من صنع مين","who made you","who created you","who developed you","who programmed you","who built you","who is your developer","who designed you"],
 name:["ما اسمك","اسمك ايه","بتتسمى ايه","what is your name","what are you called","whats your name"],
 tech:["انت شغال ازاي","انت مبني على ايه","هل انت ذكاء اصطناعي","انت بتستخدم شات جي بي تي","how do you work","what technology do you use","are you chatgpt"],
 human:["هل انت انسان","انت بشر ولا روبوت","انت بني ادم","are you human","am i talking to a real person"],
 learn:["ازاي بتتعلم","بتاخد معلوماتك منين","مين بيعلمك","how do you learn","where do you get your information","who trains you"],
 privacy:["هل بياناتي في امان","هل بتحفظ بياناتي","بتشارك بياناتي مع حد","do you store my data","is my data safe","do you share my data"],
 lang:["بتفهم لهجات ايه","هل تتكلم انجليزي","بتفهم مصري","what languages do you understand","do you speak arabic"],
 capab:["تعرف تعمل ايه","ايه اللي تقدر تساعدني فيه","what can you help me with","what are your features","ايش تقدر تسوي"],
 sched:["عندي محاضرات امتى","ايه مواعيد محاضراتي","جدول المحاضرات","when are my classes","what classes do i have today","show my timetable"],
 gpa:["نتيجتي ايه","جبت كام في الترم","درجاتي كام","how did i do","what are my marks","whats my gpa"],
 avail:["ايه اللي اقدر ادرسه","ايه المتاح قدامي","ايش المواد اللي اقدر اخذها","what can i take this semester","which courses can i enroll in","what subjects are open"],
 status:["احوالي الدراسية ايه","وضعي في الجامعة","how am i doing academically","give me an overview of my situation","اديني فكرة عن موقفي"],
 progress:["فاضل كام على التخرج","اتخرج امتى","how far am i from graduating","when will i graduate","how many credits left to graduate"],
 plan:["اسجل ايه الترم ده","انصحني بمواد","what should i register","which courses do you recommend","help me choose courses"],
 build:["جهزلي جدول","اعمللي جدول","ركبلي جدول","make me a timetable","generate a schedule for me","create my schedule"],
 mine:["انا مسجل في ايه","ايه موادي الحالية","what am i enrolled in","show my registered courses","كام مادة معايا"],
 loc:["القاعة فين","فين اروح المحاضرة","where is my class","which room is the lecture in","مكان المحاضرة ايه"],
 cal:["امتى بيبدا الفصل","اخر ميعاد للتسجيل","when do exams start","registration deadline","ميعاد الامتحانات"],
 assign:["عندي تسليمات ايه","ايه الواجبات المطلوبة","what homework do i have","any assignments due"],
 news:["في اخبار جديدة","ايه الجديد في الجامعة","any news","what is new at the university","latest updates"],
 examrules:["ينفع اغش","ايه قواعد الكويز","can i cheat in the quiz","what happens if i leave the exam page","rules of online exams"],
 load:["اقدر اخد كام ساعة","الحد الاقصى للساعات","how many credits can i take","maximum credit hours"],
 left:["ايه اللي لسه مخلصتوش","ايه اللي فاضل ليا","what courses are remaining","what am i missing"],
 office:["عايز اقابل المرشد","احجزلي ميعاد مع دكتور","i want to meet my advisor","book me a meeting with a professor"]};
const RW={sched:["ما جدولي؟","what is my schedule"],gpa:["ما درجاتي ومعدلي؟","what is my gpa"],avail:["ما المواد المتاحة لي؟","what courses are available"],status:["ملخص وضعي الأكاديمي","my academic summary"],progress:["ما مدى تقدمي نحو التخرج؟","graduation progress"],plan:["اقترح لي خطة","suggest a plan"],build:["ابني لي جدولا للفصل","build my schedule"],mine:["ما موادي؟","my courses"],loc:["فين مكان المحاضرات","where are my lectures"],cal:["ما التقويم الأكاديمي؟","academic calendar"],assign:["ما واجباتي؟","my assignments"],news:["ما آخر الإعلانات؟","latest announcements"],examrules:["ما قواعد الاختبار الآمن؟","secure exam rules"],load:["كم ساعة يمكنني تسجيلها؟","my credit load"],left:["ما المواد الناقصة؟","courses left"],capab:["ما الذي يمكنك فعله؟","what can you do"],office:["أريد حجز موعد إرشاد","book an appointment"]};
const ABOUT={creator:()=>T("صُمّمتُ وبُرمجتُ ضمن مشروع UniSmart الجامعي لأكون مرشدًا أكاديميًا داخل البوابة. ويمكن للإدارة إضافة اسم فريق التطوير إلى قاعدة المعرفة فأجيب به.","I was designed and built as part of the UniSmart university project to act as an academic advisor inside the portal. Administration can add the development team's name to the knowledge base and I will answer with it."),
 name:()=>T("اسمي المرشد الأكاديمي، وأعمل داخل بوابة جامعة UniSmart.","I am the Academic Advisor, working inside the UniSmart university portal."),
 tech:()=>T("أعمل بمحرك لغة طبيعية مدمج داخل النظام: يحلل الكلمات ويطابق المعنى ويسترجع المعرفة، دون أي خدمة ذكاء اصطناعي خارجية.","I run on a natural-language engine built into the system: it analyses words, matches meaning and retrieves knowledge, with no external AI service."),
 human:()=>T("أنا مساعد آلي ولست إنسانًا. وإن احتجت موظفًا بشريًا فيمكنني حجز موعد إرشاد لك.","I am an automated assistant, not a human. If you need a person, I can book you an advising appointment."),
 learn:()=>T("تُدرّبني الإدارة بإضافة نصوص وملفات Word وExcel وSQL من لوحة الإدارة، فأفهرسها وأجيب منها، إلى جانب بيانات النظام الحية.","Administration trains me by adding text and Word, Excel and SQL files from the admin page; I index them and answer from them, alongside live system data."),
 privacy:()=>T("لا أعرض إلا بياناتك أنت، ولا أشارك بياناتك مع أحد، وتُمسح المحادثة عند تسجيل الخروج.","I only show your own data, I never share it, and the conversation is cleared when you sign out."),
 lang:()=>T("أفهم الفصحى واللهجات المصرية والخليجية والشامية والمغاربية، والإنجليزية، والفرانكو.","I understand Modern Standard Arabic, Egyptian, Gulf, Levantine and Maghrebi dialects, English and Franco-Arabic.")};
const SYL={DB301:[{t:"أساسيات SQL",k:["sql","select","استعلام"],h:3},{t:"الربط بين الجداول (JOIN)",k:["join","joins"],h:3},{t:"التطبيع (Normalization)",k:["normalization","تطبيع"],h:2},{t:"المعاملات (Transactions)",k:["transaction","transactions","معاملات"],h:2},{t:"الفهارس (Indexing)",k:["index","indexing","indexes","فهارس","فهرس","اندكس","الاندكس","انديكس"],h:1},{t:"نمذجة الكيانات (ER)",k:["erd","er diagram","نمذجه","كيانات"],h:2},{t:"المفاتيح (Primary / Foreign Key)",k:["primary key","foreign key","pk","fk","مفتاح اساسي","مفتاح اجنبي","مفتاح رئيسي","المفتاح الاساسي","المفتاح الاجنبي","مفاتيح"],h:2}],
 AI401:[{t:"البحث وحل المشكلات",k:["search","بحث"],h:3},{t:"تمثيل المعرفة",k:["knowledge","معرفه"],h:2},{t:"مقدمة في التعلم الآلي",k:["machine","ml"],h:3},{t:"الشبكات العصبية",k:["neural","عصبيه"],h:2}],
 SE302:[{t:"دورة حياة البرمجيات",k:["sdlc","دوره"],h:2},{t:"UML ونمذجة النظم",k:["uml"],h:3},{t:"الاختبار وضمان الجودة",k:["testing","جوده"],h:2},{t:"منهجيات Agile",k:["agile","scrum"],h:2}]};
const QB={"أساسيات SQL":[{q:"أي جملة تُستخدم لاسترجاع صفوف من جدول؟",o:["INSERT","SELECT","UPDATE","DROP"],a:1,e:"SELECT هي جملة الاستعلام الأساسية للقراءة.",h:"فكّر في القراءة لا الكتابة."},{q:"أي جزء يصفّي الصفوف قبل التجميع؟",o:["GROUP BY","ORDER BY","WHERE","LIMIT"],a:2,e:"WHERE تصفّي الصفوف قبل التجميع.",h:"الشرط يأتي بعد FROM."},{q:"ماذا تُرجع SELECT COUNT(*) FROM students؟",o:["أسماء الطلاب","عدد الصفوف","أعلى قيمة","جدولًا جديدًا"],a:1,e:"COUNT(*) تعدّ الصفوف.",h:"الدالة تجمع ولا تعرض التفاصيل."}],
 "الربط بين الجداول (JOIN)":[{q:"أي ربط يُرجع الصفوف المتطابقة فقط من الجدولين؟",o:["LEFT JOIN","INNER JOIN","FULL JOIN","CROSS JOIN"],a:1,e:"INNER JOIN يُرجع المتطابق فقط.",h:"اسم الربط يوحي بالتقاطع."},{q:"أي ربط يُبقي كل صفوف الجدول الأيسر؟",o:["INNER JOIN","RIGHT JOIN","LEFT JOIN","SELF JOIN"],a:2,e:"LEFT JOIN يحتفظ بكل صفوف الجدول الأيسر.",h:"اتجاه الكلمة يحدد الجدول المحفوظ."}],
 "التطبيع (Normalization)":[{q:"الهدف الأساسي من التطبيع هو:",o:["زيادة التكرار","تقليل التكرار وشذوذ التعديل","تسريع كل الاستعلامات","حذف المفاتيح"],a:1,e:"التطبيع يقلل التكرار ويحمي من شذوذ التعديل.",h:"يتعلق بتنظيم الجداول."},{q:"الصيغة الأولى (1NF) تشترط:",o:["قيمًا ذرية في كل خلية","لا مفتاح أساسي","جدولًا واحدًا","فهرسًا لكل عمود"],a:0,e:"1NF تمنع القيم المتعددة داخل الخلية.",h:"فكّر في خلية واحدة = قيمة واحدة."}],
 "المعاملات (Transactions)":[{q:"ماذا تعني الذرية (Atomicity) في ACID؟",o:["تُنفَّذ المعاملة كلها أو لا تُنفَّذ","تعمل بسرعة","تُخزَّن مرتين","تُشفَّر"],a:0,e:"الذرية: الكل أو لا شيء.",h:"الكلمة من «الذرة» غير القابلة للتجزئة."}],
 "UML ونمذجة النظم":[{q:"أي مخطط يوضح تفاعل المستخدم مع النظام؟",o:["Class Diagram","Use Case Diagram","Gantt Chart","ER Diagram"],a:1,e:"Use Case يوضح الفاعلين وحالات الاستخدام.",h:"يبدأ بالمستخدم."}],
 "البحث وحل المشكلات":[{q:"أي خوارزمية بحث تضمن أقصر مسار في رسم غير موزون؟",o:["DFS","BFS","Hill Climbing","Random"],a:1,e:"BFS يستكشف طبقة بطبقة فيجد أقصر مسار.",h:"يبحث بالعرض أولًا."}]};
const EXPL={"الفهارس (Indexing)":"الفهرس (Index) بنية إضافية تسرّع البحث في عمود معيّن بدل قراءة الجدول كله، مثل فهرس الكتاب. يُسرّع SELECT وWHERE وJOIN، لكنه يبطّئ الإضافة والتعديل قليلًا ويستهلك مساحة، فلا تُنشئه إلا على الأعمدة التي تبحث بها كثيرًا.","نمذجة الكيانات (ER)":"نموذج ER يصف البيانات بثلاثة عناصر: الكيانات (جداول مثل Student)، والخصائص (أعمدة مثل الاسم)، والعلاقات بينها (واحد لواحد، واحد لمتعدد، متعدد لمتعدد). تُرسم قبل إنشاء الجداول ثم تُحوَّل إليها.","المفاتيح (Primary / Foreign Key)":"المفتاح الأساسي (Primary Key) يعرّف كل صف بشكل فريد ولا يتكرر ولا يكون فارغًا. المفتاح الأجنبي (Foreign Key) عمود في جدول يشير إلى المفتاح الأساسي في جدول آخر، ويضمن ألّا تُسجَّل علاقة بسجل غير موجود. الفرق: الأول يحدّد الصف، والثاني يربط بين جدولين.","أساسيات SQL":"SQL لغة للاستعلام عن البيانات وإدارتها: SELECT للقراءة، INSERT للإضافة، UPDATE للتعديل، DELETE للحذف، وتُصفّى الصفوف بـ WHERE.","الربط بين الجداول (JOIN)":"JOIN يجمع صفوفًا من جدولين أو أكثر عبر عمود مشترك. INNER JOIN يُرجع المتطابق فقط، وLEFT JOIN يُرجع كل صفوف الجدول الأيسر مع المتطابق من الأيمن.","التطبيع (Normalization)":"التطبيع تنظيم الجداول لتقليل التكرار: الأولى تمنع القيم المتعددة في الخلية، الثانية تزيل الاعتماد الجزئي على المفتاح، الثالثة تزيل الاعتماد المتعدي.","المعاملات (Transactions)":"المعاملة مجموعة عمليات تُنفَّذ كوحدة واحدة بخصائص ACID: الذرية والاتساق والعزل والدوام."};
function studyPlan(cc,off,widx){const sy=SYL[cc.id]||[],wk=new Set([...widx.map(i=>sy[i].t),...((PERF[cc.id]||{}).weak||[])]),days=Math.max(1,Math.min(off,7)),tp=sy.map(x=>({...x,w:wk.has(x.t)?x.h*2:x.h,weak:wk.has(x.t)})).sort((a,b)=>b.w-a.w),plan=Array.from({length:days},(_,i)=>({d:addDays(i),items:[],min:30})),work=days>1?days-1:1;
 tp.forEach(x=>{const d=plan.slice(0,work).sort((a,b)=>a.min-b.min)[0];d.items.push(x);d.min+=x.w*25});if(days>1){plan[days-1].items.push({t:"اختبار تجريبي ومراجعة أضعف نقاطك",weak:true});plan[days-1].min=90}
 plan.skipped=[];for(const d of plan){while(d.min>240){const i=d.items.map((x,k)=>[x,k]).filter(([x])=>!x.weak&&x.w).sort((a,b)=>a[0].w-b[0].w)[0];if(!i)break;d.items.splice(i[1],1);d.min-=i[0].w*25;plan.skipped.push(i[0].t)}}return plan}
const O2=(x,...a)=>({src:1,t:x,s:a}),H2=(x,h,...a)=>({src:1,t:x,h,s:a});
function practiceStep(raw,t){const P=ctx.pr,q=P.qs[P.i];
 if(/(وقف|انهاء|stop|quit|خلاص)/.test(t)){ctx.pr=null;return O2(T("تم إنهاء التدريب. نتيجتك "+P.score+" من "+P.i+".","Practice ended. Score "+P.score+" of "+P.i+"."),T("اختبرني مرة أخرى","Quiz me again"))}
 if(/(تلميح|hint)/.test(t))return O2(T("تلميح: "+q.h,"Hint: "+q.h),...q.o.map((o,i)=>"ABCD"[i]+") "+o));
 const AL4={"أ":0,"ا":0,"ب":1,"ج":2,"د":3},rt=raw.trim().toLowerCase(),m=rt.match(/^([abcd])[).:]|^([abcd1-4])$|^([1-4])[).:]/),ma=rt.match(/^([أابجد])[).:]?$/);if(!m&&!ma)return null;let k;if(ma)k=AL4[ma[1]];else{const g=m[1]||m[2]||m[3];k="abcd".includes(g)?"abcd".indexOf(g):+g-1}if(k<0||k>=q.o.length)return null;
 const ok=k===q.a;if(ok)P.score++;else P.wrong.push(P.topic);const fb=(ok?"إجابة صحيحة. ":"إجابة غير صحيحة، الصحيح: "+"ABCD"[q.a]+") "+q.o[q.a]+". ")+q.e;P.i++;
 if(P.i>=P.qs.length){ctx.pr=null;return H2(fb+"\n\nانتهى التدريب: نتيجتك "+P.score+" من "+P.qs.length+(P.wrong.length?". أنصحك بمراجعة: "+P.topic+".":". أداء ممتاز."),"",T("اختبرني مرة أخرى","Quiz me again"),T("اشرح لي "+P.topic,"Explain "+P.topic))}
 const n=P.qs[P.i];return O2(fb+"\n\nالسؤال "+(P.i+1)+" من "+P.qs.length+": "+n.q,...n.o.map((o,i)=>"ABCD"[i]+") "+o),T("تلميح","Hint"))}
let NLPM=null,nlpDepth=0;const INFO=new Set(["plan","status","progress","avail","left","load","capab","cal","news","examrules"]);
function nlpModel(){if(NLPM)return NLPM;const docs=[],df={};for(const[it,l]of Object.entries(EX))for(const u of l){const tk=ktoks(u);docs.push({it,tk});new Set(tk).forEach(w=>df[w]=(df[w]||0)+1)}
 const N=docs.length,idf=w=>Math.log(1+N/(df[w]||.5));docs.forEach(d=>{d.v={};d.tk.forEach(w=>d.v[w]=(d.v[w]||0)+idf(w));d.n=Math.sqrt(Object.values(d.v).reduce((a,x)=>a+x*x,0))||1});return NLPM={docs,df,idf,vocab:Object.keys(df)}}
function nlpClassify(t){const m=nlpModel(),tk=ktoks(t).map(w=>m.df[w]?w:(w.length>=5?(m.vocab.find(v=>Math.abs(v.length-w.length)<=1&&lev(v,w)<=1)||w):w));if(!tk.length)return{it:null,sim:0};
 const q={};tk.forEach(w=>{if(m.df[w])q[w]=(q[w]||0)+m.idf(w)});const qn=Math.sqrt(Object.values(q).reduce((a,x)=>a+x*x,0));if(!qn)return{it:null,sim:0};
 const sc={};for(const d of m.docs){let dot=0;for(const w in q)if(d.v[w])dot+=q[w]*d.v[w];const s=dot/(qn*d.n);if(s>(sc[d.it]||0))sc[d.it]=s}
 const r=Object.entries(sc).sort((a,b)=>b[1]-a[1]),kn=tk.filter(w=>m.df[w]).length/tk.length;return{it:r[0]?r[0][0]:null,sim:r[0]?r[0][1]*kn:0,second:r[1]?r[1][1]*kn:0}}
function chunkText(text,src){const out=[];text=text.replace(/(?:^|\n)\s*(?:س|Q)\s*[:：]\s*(.+)\n\s*(?:ج|A)\s*[:：]\s*([\s\S]*?)(?=\n\s*(?:س|Q)\s*[:：]|$)/g,(_,q,a)=>{out.push({t:"qa",text:q.trim(),ans:a.trim()});return"\n"});
 const L=text.split(/\n+/).map(x=>x.trim()).filter(Boolean),isH=(l,n)=>l.length<=60&&!/[.!؟?،,:;]$/.test(l)&&!/^[\d•\-*(]/.test(l)&&l.split(/\s+/).length<=8&&n&&n.length>l.length;
 let title="",cur="";const flush=()=>{if(cur.trim())out.push({t:"text",text:cur.trim(),title});cur=""};
 for(let i=0;i<L.length;i++){const p=L[i];if(isH(p,L[i+1])){flush();title=p;continue}
  if(p.length>700){flush();let b="";for(const x of p.split(/(?<=[.!؟?])\s+/)){if(b.length+x.length>600&&b){out.push({t:"text",text:b.trim(),title});b=""}b+=" "+x}if(b.trim())out.push({t:"text",text:b.trim(),title})}else{if(cur.length+p.length>600)flush();cur+=(cur?"\n":"")+p}}
 flush();return out.slice(0,3000)}
function tableChunks(rows,src,table){if(rows.length<2)return chunkText(rows.map(r=>r.join(" ")).join("\n"),src);const hd=rows[0].map((h,i)=>String(h).trim()||"عمود "+(i+1)),out=[];
 for(let i=1;i<rows.length&&out.length<5000;i++){const r=hd.map((_,j)=>String(rows[i][j]??"").trim()),text=hd.map((h,j)=>r[j]?h+": "+r[j]:"").filter(Boolean).join(" | ");if(text)out.push({t:"row",table,cols:hd,vals:r,text,n:i+1})}return out}
function parseCsv(t){const f=t.split("\n")[0]||"",dl=[",",";","\t"].map(d=>[d,f.split(d).length]).sort((a,b)=>b[1]-a[1])[0][0],rows=[];let r=[],c="",q=false;
 for(let i=0;i<t.length;i++){const ch=t[i];if(q){if(ch==='"'){if(t[i+1]==='"'){c+='"';i++}else q=false}else c+=ch}else if(ch==='"')q=true;else if(ch===dl){r.push(c);c=""}else if(ch==="\n"){r.push(c);rows.push(r);r=[];c=""}else if(ch!=="\r")c+=ch}
 if(c||r.length){r.push(c);rows.push(r)}return rows.filter(x=>x.some(y=>y.trim()))}
const unx=x=>x.replace(/&#x([0-9a-fA-F]+);/g,(_,h)=>String.fromCodePoint(parseInt(h,16))).replace(/&#(\d+);/g,(_,d)=>String.fromCodePoint(+d)).replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,"&");
async function inflate(b){const st=new Blob([b]).stream().pipeThrough(new DecompressionStream("deflate-raw"));return new TextDecoder().decode(await new Response(st).arrayBuffer())}
async function unzip(buf,re){const u=new Uint8Array(buf),dv=new DataView(buf);let e=u.length-22;while(e>=0&&dv.getUint32(e,true)!==0x06054b50)e--;if(e<0)throw new Error("ملف غير صالح");
 const n=dv.getUint16(e+10,true);let p=dv.getUint32(e+16,true);const out={};
 for(let i=0;i<n;i++){const m=dv.getUint16(p+10,true),cs=dv.getUint32(p+20,true),nl=dv.getUint16(p+28,true),xl=dv.getUint16(p+30,true),cl=dv.getUint16(p+32,true),off=dv.getUint32(p+42,true),name=new TextDecoder().decode(u.subarray(p+46,p+46+nl));p+=46+nl+xl+cl;
  if(!(re||/^(word\/document\.xml|xl\/sharedStrings\.xml|xl\/workbook\.xml|xl\/worksheets\/[^/]+\.xml)$/).test(name))continue;
  const st=off+30+dv.getUint16(off+26,true)+dv.getUint16(off+28,true),raw=u.subarray(st,st+cs);out[name]=m===0?new TextDecoder().decode(raw):await inflate(raw)}return out}
async function docxText(buf){const x=(await unzip(buf))["word/document.xml"];if(!x)throw new Error("لا يوجد نص في الملف");
 return[...x.replace(/<w:tab\/>/g,"<w:t> </w:t>").replace(/<\/w:p>/g,"<w:t>\n</w:t>").matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map(m=>unx(m[1])).join("")}
async function docxParts(buf){const x=(await unzip(buf))["word/document.xml"];if(!x)throw new Error("لا يوجد نص في الملف");const out=[],txt=q=>[...q.replace(/<w:tab\/>/g,"<w:t> </w:t>").matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map(m=>unx(m[1])).join("");
 const paras=seg=>seg.split("</w:p>").map(txt).filter(p=>p.trim()).forEach(p=>out.push({t:"p",text:p}));let last=0;
 for(const m of x.matchAll(/<w:tbl>[\s\S]*?<\/w:tbl>/g)){paras(x.slice(last,m.index));out.push({t:"tbl",rows:[...m[0].matchAll(/<w:tr[ >][\s\S]*?<\/w:tr>/g)].map(r=>[...r[0].matchAll(/<w:tc>[\s\S]*?<\/w:tc>/g)].map(c=>c[0].split("</w:p>").map(txt).filter(Boolean).join(" ")))});last=m.index+m[0].length}
 paras(x.slice(last));return out}
const colIdx=c=>[...c].reduce((a,ch)=>a*26+ch.charCodeAt(0)-64,0)-1;
async function xlsxRows(buf){const z=await unzip(buf),ss=[...(z["xl/sharedStrings.xml"]||"").matchAll(/<si>([\s\S]*?)<\/si>/g)].map(m=>unx([...m[1].matchAll(/<t[^>]*>([^<]*)<\/t>/g)].map(t=>t[1]).join(""))),
 names=[...(z["xl/workbook.xml"]||"").matchAll(/<sheet [^>]*name="([^"]*)"/g)].map(m=>unx(m[1])),keys=Object.keys(z).filter(k=>/worksheets\/sheet\d+\.xml$/.test(k)).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
 return keys.map((k,i)=>{const rows=[];for(const rm of z[k].matchAll(/<row[ >][^>]*>?([\s\S]*?)<\/row>/g)){const r=[];for(const cm of rm[1].matchAll(/<c ([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)){const a=cm[1],ref=/r="([A-Z]+)\d+"/.exec(a),col=ref?colIdx(ref[1]):r.length,ty=/t="(\w+)"/.exec(a),v=cm[2]&&/<v>([\s\S]*?)<\/v>/.exec(cm[2]),is=cm[2]&&/<is>[\s\S]*?<t[^>]*>([^<]*)<\/t>/.exec(cm[2]);let val=v?v[1]:is?is[1]:"";val=ty&&ty[1]==="s"?(ss[+val]??""):unx(val);r[col]=val}rows.push(Array.from(r,x=>x??""))}return{name:names[i]||"Sheet"+(i+1),rows}})}
let sqlSkipped=0;
function sqlSplit(x,sep){const o=[];let c="",d=0,q=null;for(let i=0;i<x.length;i++){const ch=x[i];if(q){c+=ch;if(ch===q){if(x[i+1]===q){c+=x[++i]}else q=null}}else if(ch==="'"||ch==='"'||ch==="`"){q=ch;c+=ch}else if(ch==="("){d++;c+=ch}else if(ch===")"){d--;c+=ch}else if(ch===sep&&d===0){o.push(c);c=""}else c+=ch}if(c.trim())o.push(c);return o}
const unq=x=>x.trim().replace(/^[`"'\[]|[`"'\]]$/g,"").replace(/''/g,"'");
function sqlChunks(text,src){sqlSkipped=0;const schema={},tabs={};
 for(const st of sqlSplit(text.replace(/--[^\n]*/g,"").replace(/\/\*[\s\S]*?\*\//g,""),";").map(x=>x.trim()).filter(Boolean)){
  let m=/^create\s+table\s+(?:if\s+not\s+exists\s+)?([^\s(]+)\s*\(([\s\S]*)\)[^)]*$/i.exec(st);
  if(m){schema[unq(m[1]).toLowerCase()]=sqlSplit(m[2],",").map(p=>p.trim()).filter(p=>!/^(primary|foreign|unique|key|constraint|check|index)\b/i.test(p)).map(p=>unq(p.split(/\s+/)[0]));continue}
  m=/^insert\s+(?:ignore\s+)?into\s+([^\s(]+)\s*(?:\(([^)]*)\))?\s*values\s*([\s\S]*)$/i.exec(st);
  if(m){const tn=unq(m[1]).toLowerCase(),cols=m[2]?m[2].split(",").map(unq):(schema[tn]||[]);const rows=tabs[tn]=tabs[tn]||[[...cols]];
   for(const tp of sqlSplit(m[3],",")){const t=tp.trim().replace(/^\(|\)$/g,"");rows.push(sqlSplit(t,",").map(v=>/^null$/i.test(v.trim())?"":unq(v)))}continue}
  sqlSkipped++}
 return Object.entries(tabs).flatMap(([tn,rows])=>tableChunks(rows,src,tn))}
async function ingestFile(f){const n=f.name,ext=n.split(".").pop().toLowerCase();kbMsg="جارٍ قراءة "+n+"…";let ch=[];
 try{if(ext==="docx"){const ps=await docxParts(await f.arrayBuffer());ch=[...chunkText(ps.filter(q=>q.t==="p").map(q=>q.text).join("\n"),n),...ps.filter(q=>q.t==="tbl").flatMap((q,i)=>tableChunks(q.rows,n,"جدول "+(i+1)))]}
  else if(ext==="xlsx")ch=(await xlsxRows(await f.arrayBuffer())).flatMap(sh=>tableChunks(sh.rows,n,sh.name));
  else if(ext==="csv")ch=tableChunks(parseCsv(await f.text()),n,"csv");
  else if(ext==="sql")ch=sqlChunks(await f.text(),n);
  else if(ext==="txt"||ext==="md")ch=chunkText(await f.text(),n);
  else throw new Error("نوع غير مدعوم (احفظ ملفات doc/xls القديمة بصيغة docx/xlsx)");
  if(!ch.length)throw new Error("لم أجد محتوى قابلًا للفهرسة");
  const ok=addDoc(n,ext,ch);if(ok)kbMsg="تمت فهرسة «"+n+"»: "+ch.length+" مقطعًا"+(ext==="sql"&&sqlSkipped?" (تم تجاهل "+sqlSkipped+" أمرًا لا يُنفَّذ)":"")+"."}
 catch(e){kbMsg="تعذّرت قراءة "+n+": "+e.message}}
function kbIndex(){if(kbIdx)return kbIdx;const items=[];KB.docs.filter(d=>d.on).forEach(d=>d.chunks.forEach(c=>items.push({c,d,tk:[...ktoks((c.title||"")+" "+c.text),...(isEn(c.text)?ktoks(arOf(c.text)):[])]})));const df={};let tl=0;
 items.forEach(it=>{tl+=it.tk.length;it.tf={};it.tk.forEach(w=>it.tf[w]=(it.tf[w]||0)+1);Object.keys(it.tf).forEach(w=>df[w]=(df[w]||0)+1)});return kbIdx={items,df,N:items.length,avg:tl/Math.max(items.length,1),vocab:Object.keys(df)}}
function kbSearch(q){const ix=kbIndex();if(!ix.N)return{res:[],kn:0};
 const qt=[...new Set(qtoks(q))].map(w=>ix.df[w]?w:(w.length>=5?(ix.vocab.find(v=>Math.abs(v.length-w.length)<=1&&lev(v,w)<=1)||w):w)),known=qt.filter(w=>ix.df[w]);if(!known.length)return{res:[],kn:0};
 const idf=w=>Math.log(1+(ix.N-ix.df[w]+.5)/(ix.df[w]+.5)),den=known.reduce((a,w)=>a+idf(w),0);
 const res=ix.items.map(it=>{let s=0,m=0,cv=0;for(const w of known){const f=it.tf[w]||0;if(f){m++;cv+=idf(w);s+=idf(w)*f*2.2/(f+1.2*(.25+.75*it.tk.length/ix.avg))}}return{it,s,cov:cv/den,m}}).filter(x=>x.m).sort((a,b)=>b.s-a.s).slice(0,5);return{res,kn:known.length}}
function kbAnswer(q,min,need){const{res,kn}=kbSearch(q),b=res[0];if(!b||b.cov<min||(kn>=3&&b.m<2)||(need&&!b.it.tk.includes(need)))return null;
 const c=b.it.c,d=b.it.d,src=d.name+(c.table&&c.table!=="csv"&&c.table!==d.name?" — "+c.table:"")+(c.n?" — "+T("صف ","row ")+c.n:"")+(c.pg?" — "+(c.pl==="شريحة"?T("شريحة ","slide "):T("صفحة ","page "))+c.pg:""),qs=new Set(qtoks(q));ctx.more=null;
 if(c.t==="qa")return{src:1,t:disp(c.ans),h:"",s:[],from:src,qa:b.m/b.it.tk.length>=.6&&b.cov>=.7};
 if(c.t==="row"){const pk=c.cols.filter(h=>qtoks(h).some(w=>qs.has(w))),rows=res.filter(x=>x.it.c.t==="row"&&x.it.d===d&&x.it.c.table===c.table&&x.s>=b.s*.85).slice(0,3);
  const card=cc=>kv(cc.cols.map((h,j)=>[h,cc.vals[j]]).filter(x=>x[1]&&(!pk.length||pk.includes(x[0])||x[0]===cc.cols[0])).map(x=>[esc(disp(x[0])),esc(disp(x[1]))]));
  return{src:1,t:T("إليك التفاصيل:","Here are the details:"),h:rows.map(r=>card(r.it.c)).join(""),s:[],from:src}}
 const num=/(كام|كم|how many|how much|نسب|percent|مبلغ|%)/i.test(q),ss=c.text.split(/(?<=[.!؟?])\s+|\n+/).map(x=>x.trim()).filter(Boolean).map((x,i)=>({x,i,s:[...ktoks(x),...(isEn(x)?ktoks(arOf(x)):[])].filter(w=>qs.has(w)).length+(num&&/\d/.test(x)?.5:0)})),
 bs=ss.filter(x=>x.s).sort((a,b)=>b.s-a.s||a.i-b.i)[0],pick=bs?[bs.i,...(bs.x.length<60&&ss[bs.i+1]?[bs.i+1,...(ss[bs.i+2]&&ss[bs.i+1].x.length<60?[bs.i+2]:[])]:[])]:[0,1],rest=ss.filter(x=>x.i>Math.max(...pick));
 if(rest.length)ctx.more={rest:rest.map(x=>disp(x.x))};
 return{src:1,t:ss.filter(x=>pick.includes(x.i)).map(x=>disp(x.x)).join(" "),h:"",s:rest.length?[T("كمّل","Continue")]:[],from:src}}
function greeting(){if(I18N.lang==="en")return user.role==="student"?[{r:"b",t:(new Date().getHours()<12?"Good morning":new Date().getHours()<18?"Good afternoon":"Good evening")+", "+user.first+". I'm your academic advisor.\nAsk me about your courses, grades or deadlines. Tell me which exam is coming and I'll build you a study plan. You can also attach your own files (PDF, Word, slides, spreadsheets, images) and I'll answer from what's inside them.",sugg:["Make me a study plan","Quiz me","Summary of my academic status"]}]:[{r:"b",t:"Welcome "+user.first+". Tell me what you need and I will do it: add a course, open more seats, build a quiz from the questions you paste, or give you enrollment numbers.",sugg:["What can you do?","List all courses","Which courses are full?"]}];
 return user.role==="student"?[{r:"b",t:(new Date().getHours()<12?"صباح الخير":new Date().getHours()<18?"طاب يومك":"مساء الخير")+" يا "+user.first+"، أنا مرشدك الأكاديمي.\nاسألني عن موادك أو درجاتك أو مواعيدك، وقولّي عندك امتحان في إيه وأعملك خطة مذاكرة. وتقدر ترفع ملفاتك (PDF أو Word أو شرائح أو جداول أو صور) وأجاوبك من اللي جواها.",sugg:["اعمللي خطة مذاكرة","اختبرني","ملخص وضعي الأكاديمي"]}]:[{r:"b",t:"أهلاً "+user.first+"، أنا مساعدك في إدارة المواد والاختبارات.\nقولّي اللي عايزه بلهجتك وأنا أنفّذه: زوّد مادة، افتح مقاعد زيادة، اعمل اختبار بأسئلتك (الصقها هنا)"+(user.role==="doctor"?" أو من ملزمة ترفعها بزر الإرفاق":"")+"، أو اسألني عن أعداد الطلاب."+(user.role==="admin"?"\nوتقدر كمان تفتح التسجيل أو تبعت إشعار لكل الطلاب.":""),sugg:["ايه اللي تقدر تعمله؟","اعرض كل المواد","المواد الممتلئة"]}]}
function clearChat(silent){chat=greeting();pending=null;ctx={};if(!silent)render()}
// ---------- طبقة توجيه أدق للأسئلة الشائعة (قبل المحرك المعجمي القديم) ----------
// ---------- ملفات الطالب: رفع ← قراءة محلية ← إجابة من محتواها (لا تغادر المتصفح) ----------
var NODISP=false;
let MY={docs:[],idx:null,msg:"",busy:false};
const MYSEL=()=>MY.docs.filter(d=>d.on),ar0=()=>I18N.lang!=="en";
const FILEW=/(ملف|ملفات|ملزمه|ملزمة|المحاضره|المحاضرة|الشرائح|شرائح|المستند|الورقه|الورقة|الصوره|الصورة|المذكره|المذكرة|الكتاب|file|files|document|notes|slides|pdf|lecture|handout|upload|attachment)/i;
async function myLoad(){if(typeof MYF==="undefined"||!user||!["student","doctor"].includes(user.role)){MY.docs=[];MY.idx=null;return}
 const had=MY.docs.length;MY.docs=await MYF.load(user.id);MY.idx=null;if(user&&tab==="chat"&&PAGE&&(MY.docs.length||had))render()}
const mySave=()=>typeof MYF!=="undefined"&&user?MYF.save(user.id,MY.docs):Promise.resolve(false);
function myStat(m){MY.msg=m;const e=$("#fstat");if(e){e.textContent=m;e.hidden=!m}}
async function myAdd(files){
 files=[...files||[]];if(!files.length||MY.busy)return;
 if(typeof MYF==="undefined"){toast(ar0()?"ميزة الملفات غير متاحة":"File feature unavailable");return}
 MY.busy=true;render();
 for(const f of files){
  myStat((ar0()?"جارٍ قراءة «":"Reading “")+f.name+(ar0()?"»…":"”…"));
  try{const r=await MYF.parse(f,myStat);MY.docs=MY.docs.filter(d=>d.name!==r.name);
   MY.docs.push({id:Date.now().toString(36)+Math.random().toString(36).slice(2,5),name:r.name,type:r.type,size:r.size,pages:r.pages,unit:r.unit,added:new Date().toLocaleDateString(LOC),on:true,chunks:r.chunks});MY.idx=null;
   const saved=await mySave(),info=(r.pages?r.pages+" "+r.unit+" · ":"")+r.chunks.length+(ar0()?" مقطعًا":" passages");
   chat.push({r:"b",t:ar0()?"تمت قراءة «"+r.name+"» ("+info+"). اسألني عن أي حاجة فيه وأجاوبك من محتواه، أو اطلب مني تلخيصه أو أسئلة تدريب منه."+(r.note?"\n"+r.note:"")+(saved?"":"\n(لم يُحفظ على الجهاز، وسيبقى متاحًا حتى إغلاق الصفحة.)"):"I've read “"+r.name+"” ("+info+"). Ask me anything about it and I'll answer from its content, or ask me to summarize it or quiz you from it."+(saved?"":"\n(Couldn't save on this device; it stays available until you close the page.)"),sugg:ar0()?["لخّص الملف","اختبرني من الملف"]:["Summarize the file","Quiz me from the file"],tm:nowTm()})}
  catch(e){chat.push({r:"b",t:(ar0()?"تعذّرت قراءة «"+f.name+"»: ":"Couldn't read “"+f.name+"”: ")+(e&&e.message||""),sugg:[],tm:nowTm()})}}
 MY.busy=false;MY.msg="";render();const m=$("#msgs");if(m)m.scrollTop=1e9}
function myRemove(id){MY.docs=MY.docs.filter(d=>d.id!==id);MY.idx=null;mySave();render()}
function myToggle(id){const d=MY.docs.find(x=>x.id===id);if(d){d.on=!d.on;MY.idx=null;mySave();render()}}
function myKb(q,min){const sD=KB.docs,sI=kbIdx;KB.docs=MY.docs;kbIdx=MY.idx;NODISP=true;try{const r=kbAnswer(q,min);MY.idx=kbIdx;return r}finally{NODISP=false;KB.docs=sD;kbIdx=sI}}
const myPick=raw=>{const l=raw.toLowerCase(),a=MYSEL();const rich=a.filter(d=>d.chunks.filter(c=>c.t==="text"||c.t==="qa").length>=2);const size=d=>d.chunks.reduce((s,c)=>s+(c.t==="text"||c.t==="qa"?c.text.length:0),0);return a.find(d=>l.includes(d.name.toLowerCase().replace(/\.[^.]+$/,"")))||[...rich].sort((x,y)=>size(y)-size(x))[0]||a[a.length-1]};
function myList(){const a=MY.docs;return{src:1,nopre:1,t:T("الملفات التي رفعتها:","Files you uploaded:"),h:`<ul class="al">${a.map(d=>`<li><b>${esc(d.name)}</b> — ${d.chunks.length} ${T("مقطعًا","passages")}${d.pages?" · "+d.pages+" "+T(d.unit||"صفحة",d.unit==="شريحة"?"slides":d.unit==="ورقة"?"sheets":"pages"):""}${d.on?"":" · "+T("متوقف","off")}</li>`).join("")}</ul>`,s:[T("لخّص الملف","Summarize the file"),T("اختبرني من الملف","Quiz me from the file")]}}
function mySummary(raw){
 const d=myPick(raw),tx=d.chunks.filter(c=>c.t==="text"||c.t==="qa");
 if(!tx.length){const rows=d.chunks.filter(c=>c.t==="row"),cols=rows[0]?rows[0].cols:[];return{src:1,nopre:1,t:T("«"+d.name+"» جدول فيه "+rows.length+" صفًا. الأعمدة: "+cols.join("، ")+".","“"+d.name+"” is a table with "+rows.length+" rows. Columns: "+cols.join(", ")+"."),s:[T("اسألني عن أي صف أو قيمة","Ask me about any row or value")]}}
 const sents=[];tx.forEach((c,ci)=>(c.t==="qa"?c.text+". "+c.ans:c.text).split(/(?<=[.!؟?])\s+|\n+/).map(x=>x.trim()).filter(x=>x.length>=28&&x.length<=300).forEach((x,k)=>sents.push({x,ci,k,tk:ktoks(x)})));
 if(!sents.length)return{src:1,nopre:1,t:T("الملف قصير جدًا للتلخيص. اسألني عن محتواه مباشرة.","The file is too short to summarize. Ask me about its content directly."),s:[]};
 const tf={};sents.forEach(s=>s.tk.forEach(w=>tf[w]=(tf[w]||0)+1));
 sents.forEach(s=>{const u=[...new Set(s.tk)];s.s=u.reduce((a,w)=>a+Math.min(tf[w],8),0)/Math.pow(Math.max(u.length,4),.7)+(s.k===0?1.2:0)});
 const n=Math.min(7,sents.length),pick=[];for(let b=0;b<n;b++){const sl=sents.slice(Math.floor(b*sents.length/n),Math.floor((b+1)*sents.length/n)||undefined);if(sl.length)pick.push(sl.reduce((a,x)=>x.s>a.s?x:a))}
 const heads=[...new Set(tx.map(c=>c.title).filter(Boolean))].slice(0,10);
 return{src:1,nopre:1,t:T("ملخص «"+d.name+"»"+(d.pages?" ("+d.pages+" "+(d.unit||"صفحة")+")":"")+":","Summary of “"+d.name+"”"+(d.pages?" ("+d.pages+" "+(d.unit==="شريحة"?"slides":"pages")+")":"")+":"),
  h:(heads.length>2?`<div class="mut" style="margin-top:6px">${T("المحاور:","Topics:")}</div><ul class="al">${heads.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`:"")+`<div class="mut" style="margin-top:6px">${T("أهم النقاط:","Key points:")}</div><ul class="al">${pick.map(x=>`<li>${esc(x.x)}</li>`).join("")}</ul><span class="src">${T("ملخص استخراجي من نص الملف نفسه دون إضافة معلومات","Extractive summary taken from the file's own text; nothing added")}</span>`,
  s:[T("اختبرني من الملف","Quiz me from the file")]}}
const rxe=x=>x.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),wordRx=(w,f)=>new RegExp("(?<![\u0600-\u06FFA-Za-z0-9_-])"+rxe(w)+"(?![\u0600-\u06FFA-Za-z0-9_-])",f);
function myQuiz(raw){
 const d=myPick(raw),r=genCloze(d,5);
 if(r.err)return{src:1,nopre:1,t:r.err+T(" أو اسألني عنه مباشرة."," Or ask me about it directly."),s:[T("لخّص الملف","Summarize the file")]};
 const qs=r.qs;ctx.pr={qs,i:0,score:0,topic:d.name,wrong:[]};
 return{src:1,nopre:1,t:T("تدريب من «"+d.name+"» ("+qs.length+" أسئلة، أكمل الفراغ). الأسئلة مبنية على جمل الملف نفسه.\n\nالسؤال 1: ","Practice from “"+d.name+"” ("+qs.length+" fill-in-the-blank questions built from the file's own sentences).\n\nQuestion 1: ")+qs[0].q,s:[...qs[0].o.map((o,i)=>"ABCD"[i]+") "+o),T("تلميح","Hint")]}}
function fileBrain(raw){
 const docs=MYSEL();if(!docs.length||ctx.pr)return null;
 const t=nz(raw);if(user.role!=="student"&&/(اعمل|اعملي|انشئ|سوي|ابني|create|make|build|generate|زود|ضيف|اضف|add|خلي|فعل|اقفل|احذف|افتح)/.test(t))return null;AR=chatLang==="en"?false:chatLang==="ar"?true:/[\u0600-\u06FF]/.test(raw);
 const FW=FILEW.test(raw);
 if(/(ملفاتي|الملفات (اللي|الي|التي) (رفعت|ارفعت)|ايه الملفات|اي الملفات|my files|uploaded files|which files|what files)/i.test(t))return myList();
 if(/(لخص|تلخيص|ملخص|اختصر|خلاصه|summari[sz]e|summary|sum up|tldr)/i.test(t)&&FW&&!/(وضعي|status|academic|اكاديمي)/.test(t))return mySummary(raw);
 if(/(اختبرني|اسالني|اعمل لي اسئله|اعملي اسئله|اسئله من|quiz me|test me|ask me|make (me )?a quiz|questions (from|on|about))/i.test(t)&&FW)return myQuiz(raw);
 const personal=/(درجات|درجتي|معدل|gpa|حضور|غياب|attendance|سجلني|اسجل|احذف|جدول|schedule|register|drop|رصيد|تخرج|graduat|ميعاد|موعد|appointment|اذاكر|ذاكر|مذاكر|خطه|plan|study|prepare|امتحان|اختبر|exam|قادم|upcoming|ضعيف|weak|تحسين|improve|مواد متاح|available)/i.test(t);
 if(personal&&!FW)return null;
 const k=myKb(t,FW?.22:.55);
 if(k){const lab=k.from||"";return{src:1,nopre:1,t:k.t,h:(k.h||"")+`<span class="src">${T("المصدر: ملفك «","Source: your file “")+esc(lab)+T("»","”")}</span>`,s:[...(k.s||[]),T("لخّص الملف","Summarize the file")].slice(0,3)}}
 if(FW)return{src:1,nopre:1,t:T("بحثت في ملفاتك ("+docs.map(d=>"«"+d.name+"»").join("، ")+") ولم أجد إجابة واضحة لهذا السؤال. جرّب صياغة أخرى بكلمات قريبة من نص الملف، أو اطلب تلخيصه.","I searched your files ("+docs.map(d=>"“"+d.name+"”").join(", ")+") and couldn't find a clear answer. Try rephrasing with words close to the file's text, or ask for a summary."),s:[T("لخّص الملف","Summarize the file"),T("ملفاتي","My files")]};
 return null}

// ---------- مساعد الدكتور والإدارة: أوامر تنفيذية بالعربية/اللهجة/الإنجليزية ----------
const DOC_ME="Dr. Ahmed Ali",DAYS5=["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس"];
let SP=null;                                   // عملية بانتظار التأكيد
const adig=s=>String(s).replace(/[٠-٩]/g,d=>"٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/[۰-۹]/g,d=>"۰۱۲۳۴۵۶۷۸۹".indexOf(d));
const NW={واحد:1,واحده:1,اتنين:2,اثنين:2,تلات:3,ثلاث:3,تلاته:3,ثلاثه:3,اربع:4,اربعه:4,خمس:5,خمسه:5,ست:6,سته:6,سبع:7,سبعه:7,تمن:8,ثمان:8,تمانيه:8,ثمانيه:8,تسع:9,تسعه:9,عشر:10,عشره:10,عشرين:20,تلاتين:30,ثلاثين:30,اربعين:40,خمسين:50,ستين:60,مية:100,ميه:100,مئه:100};
function numIn(t){t=adig(t);const m=t.match(/\d+/);if(m)return +m[0];for(const w of t.split(/\s+/))if(NW[w]!==undefined)return NW[w];return null}
const sOwn=c=>user.role==="admin"||c.doc===DOC_ME;
function sCourse(raw,t){const l=raw.toLowerCase();let best=null;
 for(const c of courses){const hit=l.includes(c.name.toLowerCase())||(c.ar&&raw.includes(c.ar))||new RegExp("(^|[^a-z0-9])"+c.id.toLowerCase()+"([^a-z0-9]|$)").test(l);if(hit&&(!best||c.name.length>best.name.length))best=c}
 return best||findCourse(t,t.split(/[^a-z\u0600-\u06ff0-9]+/).filter(Boolean))}
function sAlias(c){const w=new Set([nz(c.name),...(c.ar?[nz(c.ar)]:[]),...c.name.toLowerCase().split(/[^a-z0-9]+/).filter(x=>x.length>=5)]);AL[c.id]=[...w].filter(Boolean)}
function staffSave(){lsSet("us_staff",{xc:courses.filter(c=>c.x),cap:Object.fromEntries(courses.map(c=>[c.id,c.cap])),quiz:{title:quiz.title,mins:quiz.mins,qs:quiz.qs},rm:lsGet("us_staff",{}).rm||[]})}
function staffLoad(){if(UNI&&UNI.on)return;const d=lsGet("us_staff",null);if(!d)return;
 (d.rm||[]).forEach(i=>{const k=courses.findIndex(c=>c.id===i&&c.x);if(k>=0)courses.splice(k,1)});
 (d.xc||[]).forEach(c=>{if(!byId(c.id)){courses.push(c);sAlias(c)}});
 Object.entries(d.cap||{}).forEach(([i,n])=>{const c=byId(i);if(c&&n>=c.enr)c.cap=n});
 if(d.quiz&&Array.isArray(d.quiz.qs)&&d.quiz.qs.length){quiz.title=d.quiz.title;quiz.mins=d.quiz.mins;quiz.qs=d.quiz.qs}}
const sAud=x=>audit.unshift(new Date().toLocaleTimeString(LOC)+" "+x);
const mnt=n=>n===1?"دقيقة":n===2?"دقيقتان":n<=10?n+" دقائق":mnt(n);
const nqs=n=>n===1?"سؤال واحد":n===2?"سؤالان":n<=10?n+" أسئلة":n+" سؤالًا";
const SO=(t,...s)=>({src:1,nopre:1,t,s});

// ----- قراءة أسئلة اختبار من نص ملصوق -----
const LET={A:0,B:1,C:2,D:3,E:4,"أ":0,"ا":0,"ب":1,"ج":2,"د":3,"ه":4};
function parseQs(raw){
 const lines=adig(raw).split(/\r?\n/).map(x=>x.trim()).filter(Boolean),out=[],bad=[];let cur=null;
 const fin=()=>{if(!cur)return;
  if(!cur.o.length&&cur.ans!=null){const v=nz(String(cur.ans));if(/^(صح|صحيح|true|t|yes)/.test(v)){cur.o=["صح","خطأ"];cur.a=0}else if(/^(خطا|غلط|خطأ|false|f|no)/.test(v)){cur.o=["صح","خطأ"];cur.a=1}}
  else if(cur.o.length&&cur.a==null&&cur.ans!=null){const s=String(cur.ans).trim(),m=s.match(/^\(?([A-Ea-eأابجده])\)?(?:[\s.):\-]|$)/);
   if(m){const k=LET[m[1].toUpperCase()]??LET[m[1]];if(k<cur.o.length)cur.a=k}
   else{const j=cur.o.findIndex(o=>nz(o)===nz(s));if(j>=0)cur.a=j}}
  if(cur.q&&cur.o.length>=2&&cur.a!=null&&cur.a<cur.o.length)out.push({q:cur.q,o:cur.o,a:cur.a});else if(cur.q&&(cur.o.length||cur.ans!=null))bad.push(cur.q.slice(0,50));
  cur=null};
 const QSTART=/^(?:(?:س|سؤال|Q|Question)\s*)?(\d+)\s*[.):\-–]\s*(.+)$/i,QSTART2=/^(?:س|سؤال|Q|Question)\s*[:：\-]\s*(.+)$/i,
  OPT=/^\(?([A-Ea-eأابجده])\)?\s*[.):\-–]\s*(.+)$/,BUL=/^[-•*▪]\s+(.+)$/,ANS=/^(?:الاجابه|الإجابة|الاجابة|الجواب|الصح|الاجابه الصحيحه|الإجابة الصحيحة|الحل|answer|ans|correct(?: answer)?)\s*[:：\-=]?\s*(.+)$/i;
 for(const L of lines){let m;
  if((m=L.match(ANS))){if(cur)cur.ans=m[1].trim();continue}
  if((m=L.match(QSTART))||(m=L.match(QSTART2))){fin();cur={q:(m[2]||m[1]).trim(),o:[],a:null,ans:null};continue}
  if(cur&&(m=L.match(OPT))){let tx=m[2].trim(),ok=/(^\*|\*$|✓|✔|✅|\(صح\)|\(correct\))/.test(tx);tx=tx.replace(/(^\*+|\*+$|✓|✔|✅|\(صح\)|\(correct\))/g,"").trim();cur.o.push(tx);if(ok)cur.a=cur.o.length-1;continue}
  if(cur&&cur.q&&(m=L.match(BUL))){let tx=m[1].trim(),ok=/(\*$|✓|✔|✅)/.test(tx);tx=tx.replace(/(\*+$|✓|✔|✅)/g,"").trim();cur.o.push(tx);if(ok)cur.a=cur.o.length-1;continue}
  if(/[؟?]$/.test(L)&&!(cur&&cur.q&&!cur.o.length&&cur.ans==null&&false)){const cmd=/(اعمل|اعملي|انشئ|سوي|ابني|create|make|build)\b.*(اختبار|امتحان|كويز|quiz|exam|test)/i.test(nz(L));if(!cmd){fin();cur={q:L,o:[],a:null,ans:null};continue}}
  if(cur&&cur.q&&!cur.o.length&&cur.ans==null&&!/(اعمل|انشئ|create|make)/i.test(nz(L))&&L.length>2&&!cur.q.endsWith("؟")&&!cur.q.endsWith("?"))cur.q+=" "+L}
 fin();return{qs:out,bad}}

// ----- أوامر الحقول -----
function fld(raw,res){for(const r of res){const m=raw.match(r);if(m)return(m[1]||"").trim()}return null}
function addCourse(raw,t){
 if(UNI&&UNI.on)return SO("إضافة المواد تعمل في الوضع التجريبي فقط؛ في وضع الخادم استخدم لوحة الإدارة.");
 const stop="(?=\\s+(?:و?(?:كودها|كود|الكود|code|دكتور|الدكتور|دكتورها|د\\.|Dr\\.?|بسعة|سعتها|سعة|capacity|عدد|ساعات|ساعه|ميعاد|معاد|موعد|يوم|في\\s+قاعة|قاعة|room|slot|credits?|seats?|على|يوم))|[,،\\n]|$)";
 let name=fld(raw,[new RegExp("(?:اسمها|اسمه|باسم|بإسم|بأسم|named|called|name)\\s*[:：]?\\s*[\"«“'‘]?([^\\n\"»”'’]+?)[\"»”'’]?"+stop,"i")]);
 if(!name)return SO("اكتبلي اسم المادة بعد كلمة «اسمها». مثال:\nزوّد مادة اسمها Cloud Computing كودها CS450 بسعة 40 طالب ودكتورها د. سارة يوم الثلاثاء 11:00",
  "زوّد مادة اسمها Cloud Computing بسعة 40 طالب");
 name=name.replace(/^(?:ال)?مادة\s+/,"").trim();
 if(courses.some(c=>c.name.toLowerCase()===name.toLowerCase()))return SO("المادة «"+name+"» موجودة بالفعل. تقدر تزوّد سعتها بدل ما نكررها.","زوّد سعة "+name+" 10");
 const lat=/[A-Za-z]/.test(name);let id=(fld(raw,[/\b([A-Za-z]{2,5}\s?-?\d{3})\b/])||"").replace(/[\s-]/g,"").toUpperCase();
 if(!id){const ini=lat?name.split(/\s+/).map(w=>w[0]).join("").toUpperCase().slice(0,4):"NEW";let k=401;id=ini+k;while(byId(id)){k++;id=ini+k}}
 if(byId(id))return SO("الكود "+id+" مستخدم لمادة أخرى. اختر كودًا مختلفًا.");
 const cap=numIn(fld(raw,[/(?:سعة|سعتها|بسعة|capacity|seats?)\s*[:：]?\s*([\d٠-٩]+)/i,/([\d٠-٩]+)\s*(?:طالب|مقعد|مقاعد|seats?|students?)/i])||"")||30;
 const cr=numIn(fld(raw,[/([\d٠-٩])\s*(?:ساعات|ساعة|ساعه|credits?|cr)\b/i])||"")||3;
 let doc=fld(raw,[/(?:دكتور(?:ها)?|الدكتور|د\.|Dr\.?)\s*([^\n,،]+?)(?=\s+(?:و?(?:بسعة|سعة|ساعات|ميعاد|موعد|يوم|في|قاعة|كودها|كود|capacity|room))|[,،\n]|$)/i]);
 doc=user.role==="doctor"?DOC_ME:(doc?(/^dr/i.test(doc)?doc:"Dr. "+doc.replace(/^د\.?\s*/,"")):"Dr. TBA");
 const day=DAYS5.find(d=>nz(raw).includes(nz(d))),tm=adig(raw).match(/(?:الساعة|الساعه|at|@|يوم\s+\S+)\s*(\d{1,2})(?::(\d{2}))?/)||adig(raw).match(/\b(\d{1,2}):(\d{2})\b/),
  slot=(day||"الخميس")+" "+(tm?String(tm[1]).padStart(2,"0")+":"+(tm[2]||"00"):"12:00"),room=fld(raw,[/(?:قاعة|room)\s*[:：]?\s*([A-Za-z0-9\u0600-\u06FF\- ]{1,12}?)(?=\s|$|[,،])/i])||"TBA";
 const c={id,name,ar:lat?name:name,doc,cr,cap,enr:0,pre:[],slot,room,x:1};courses.push(c);sAlias(c);staffSave();sAud("COURSE_ADDED "+id+" by "+user.id);
 return{src:1,nopre:1,t:"تمت إضافة المادة وهي متاحة للتسجيل الآن:",h:`<ul class="al"><li><b>${esc(name)}</b> (${id})</li><li>الدكتور: ${esc(doc)}</li><li>الميعاد: ${slot} · القاعة: ${esc(room)}</li><li>${cr} ساعات · السعة ${cap} مقعدًا</li></ul>`,s:["زوّد سعة "+name+" 10","اعرض كل المواد"]}}
function seats(raw,t,c){
 if(UNI&&UNI.on)return SO("تعديل السعة يعمل في الوضع التجريبي فقط؛ في وضع الخادم استخدم لوحة الإدارة.");
 if(!sOwn(c))return SO("«"+c.name+"» ليست من موادك، وتعديل سعتها من الإدارة.");
 const n=numIn(t);let nc;
 if(/(اقفل|اغلق|قفل|close|stop)/.test(t)&&!n){nc=c.enr}
 else if(/(خلي|خلى|اجعل|اضبط|set|make)/.test(t)&&/(سعه|capacity|مقاعد|seats)/.test(t)&&n!=null){nc=n}
 else if(n!=null)nc=c.cap+n;
 else return SO("كام مقعد تحب أزوّد في «"+c.name+"»؟ مثال: زوّد 10 طلاب في "+c.name,"زوّد 10 طلاب في "+c.name);
 if(nc<c.enr)return SO("لا يمكن تقليل السعة إلى "+nc+" لأن المسجلين الآن "+c.enr+" طالبًا.");
 if(nc>500)return SO("الرقم كبير جدًا. أقصى سعة أقبلها 500 مقعد.");
 const old=c.cap;c.cap=nc;staffSave();sAud("CAPACITY_CHANGED "+c.id+" "+old+"→"+nc);
 return SO("تم تعديل سعة «"+c.name+"» من "+old+" إلى "+nc+" مقعدًا. المسجلون "+c.enr+" والمتاح "+(nc-c.enr)+"."+(nc>c.enr&&old===c.enr?" المادة أصبحت مفتوحة للتسجيل مرة أخرى.":""),"اعرض كل المواد","كام طالب في "+c.name+"؟")}
function courseList(){return courses.map(c=>`<li><b>${esc(c.name)}</b> (${c.id}) — ${c.enr}/${c.cap}${c.enr>=c.cap?" · ممتلئة":""} · ${esc(c.doc)} · ${c.slot}</li>`).join("")}
function quizPreview(p){const L=p.qs.slice(0,8).map((q,i)=>`<li>${esc(q.q)} <span class="mut">(الصحيح: ${esc(q.o[q.a])})</span></li>`).join("");
 return{src:1,nopre:1,t:"جهّزت «"+p.title+"»: "+nqs(p.qs.length)+"، المدة "+mnt(p.mins)+(p.append?" (إضافة للكويز الحالي)":"")+(p.bad&&p.bad.length?"\nتجاهلت "+p.bad.length+" سؤالًا لعدم وضوح الإجابة: "+p.bad.join(" | "):"")+(p.note?"\n"+p.note:"")+"\nهل أنشره للطلاب الآن؟",h:`<ul class="al">${L}</ul>${p.qs.length>8?`<div class="mut">… و${p.qs.length-8} أسئلة أخرى</div>`:""}`,s:["أيوه انشره","لا"]}}
function makeQuiz(raw,t){
 const ap=/(ضيف|اضف|زود|add|append)/.test(t)&&/(للكويز|للاختبار|للامتحان|الحالي|to the (quiz|exam)|current)/.test(t);
 let {qs,bad}=parseQs(raw),note="";const n=numIn(fld(raw,[/([\d٠-٩]+)\s*(?:سؤال|اسئلة|أسئلة|questions?)/i])||"")||5;
 if(!qs.length&&/(من الملف|من ملف|من الشرائح|من الملزمة|from the (file|slides|document)|from (this|my) file)/i.test(raw+" "+t)&&typeof MYSEL==="function"&&MYSEL().length){
  const d=myPick(raw),r=genCloze(d,n);if(r.err)return SO(r.err);qs=r.qs.map(q=>({q:q.q,o:q.o,a:q.a}));note="الأسئلة مولّدة تلقائيًا من «"+d.name+"» (أكمل الفراغ). راجعها قبل النشر."}
 if(!qs.length)return SO("ما قدرتش ألاقي أسئلة واضحة في رسالتك. ابعتها بالشكل ده (كل سؤال وبعده اختياراته وإجابته):\n\n1. أي أمر SQL يسترجع البيانات؟\nأ) INSERT\nب) SELECT\nج) DELETE\nد) ALTER\nالإجابة: ب\n\n2. المفتاح الأساسي يمكن أن يتكرر.\nالإجابة: خطأ\n\nوتقدر تكتب «اعمل اختبار من الملف» بعد ما ترفع ملزمة أو شرائح.","اعمل اختبار من الملف");
 const c=sCourse(raw,t),mins=numIn(fld(raw,[/([\d٠-٩]+)\s*(?:دقيقه|دقيقة|دقايق|دقائق|minutes?|mins?)/i])||"")||quiz.mins||10;
 let title=fld(raw,[/(?:اسمه|باسم|عنوانه|عنوان|named|titled)\s*[:：]?\s*[\"«“']?([^\n\"»”']+?)[\"»”']?(?=\s+(?:ومدته|مدته|مدة|بمدة|و?(?:بالأسئلة|بالاسئلة))|[,،\n]|$)/i])||("كويز "+(c?c.name:"جديد"));
 SP={kind:"quiz",title,mins:Math.max(1,Math.min(180,mins)),qs,bad,append:ap,note};return quizPreview(SP)}
function commitQuiz(p){if(p.append)quiz.qs=[...quiz.qs,...p.qs];else{quiz.title=p.title;quiz.mins=p.mins;quiz.qs=p.qs}
 staffSave();sAud("QUIZ_PUBLISHED \""+quiz.title+"\" ("+quiz.qs.length+" q) by "+user.id);
 return SO("تم نشر «"+quiz.title+"» ("+nqs(quiz.qs.length)+"، "+quiz.mins+" دقيقة). هيظهر للطلاب في صفحة الاختبارات فورًا.","اعرض أسئلة الكويز","خلي المخالفات المسموحة 2")}
const SECK={tab:/(الخروج|التبويب|tab)/,fs:/(ملء الشاشه|الشاشه الكامله|fullscreen|full screen)/,copy:/(النسخ|اللصق|copy|paste)/,cam:/(الكاميرا|camera|webcam)/,proc:/(الوجه|رصد|face|proctor)/},SECN={tab:"اكتشاف الخروج من التبويب",fs:"إلزام ملء الشاشة",copy:"منع النسخ واللصق",cam:"الكاميرا الإلزامية",proc:"رصد الوجه"};

function staffBrain(raw,t){t=t.replace(/ة/g,"ه");
 const A=user.role==="admin",toks=t.split(/[^a-z\u0600-\u06ff0-9]+/).filter(Boolean);
 // تأكيد عملية معلّقة
 if(SP){const p=SP;if(YES.test(t)||/(انشر|نفذ|نفّذ|publish|do it)/.test(t)){SP=null;
   if(p.kind==="quiz")return commitQuiz(p);if(p.kind==="del"){const k=courses.findIndex(c=>c.id===p.id);if(k>=0){const c=courses[k];courses.splice(k,1);const d=lsGet("us_staff",{});if(c.x)d.rm=[...(d.rm||[]),c.id];staffSave();const e=lsGet("us_staff",{});e.rm=[...new Set([...(e.rm||[]),...(c.x?[c.id]:[])])];lsSet("us_staff",e);sAud("COURSE_DELETED "+c.id);return SO("تم حذف «"+c.name+"».","اعرض كل المواد")}}
   if(p.kind==="notif"){pushNotif("student",p.text,"admin","high");sAud("ANNOUNCEMENT_SENT");return SO("تم إرسال الإشعار لجميع الطلاب. هيظهر عندهم في صفحة الإشعارات.")}}
  if(NO.test(t)){SP=null;return SO("تمام، تم الإلغاء.")}
  if(p.kind!=="quiz"||!/(اعمل|انشئ|سؤال|\d+\s*[.)])/.test(t))SP=null}
 const add=/(زود|زوّد|ضيف|اضف|اضافه|افتح|اعمل|اعملي|انشئ|سوي|سجل|add|create|new|open|increase|raise|more)/.test(t);
 // 1) مادة جديدة
 if(/(مادة|ماده|course)/.test(t)&&add&&/(اسمها|اسمه|باسم|بإسم|named|called|name\b|جديده|جديدة|new course)/.test(raw+" "+t)&&!/(اختبار|امتحان|كويز|quiz|exam)/.test(t))return addCourse(raw,t);
 // 2) اختبار / أسئلة
 if((/(اعمل|اعملي|انشئ|سوي|ابني|ولد|create|make|build|generate|ضيف|اضف|add)/.test(t)&&/(اختبار|امتحان|كويز|quiz|exam|test|اسئله|questions)/.test(t))||parseQs(raw).qs.length>=2&&/(اختبار|امتحان|كويز|quiz|exam|اسئله)/.test(t))return makeQuiz(raw,t);
 // 3) إعدادات الاختبار
 if(/(كويز|اختبار|امتحان|quiz|exam|سؤال|question)/.test(t)||/(الكاميرا|ملء الشاشه|النسخ|رصد الوجه|المخالفات|violations)/.test(t)){
  if(/(اعرض|وريني|show|list|اسئله|questions)/.test(t)&&/(اسئله|questions|الكويز|الاختبار)/.test(t)&&!/(نتايج|نتائج|results)/.test(t))return{src:1,nopre:1,t:"«"+quiz.title+"» — "+nqs(quiz.qs.length)+"، "+quiz.mins+" دقيقة، المخالفات المسموحة "+quiz.maxV+":",h:`<ol class="al">${quiz.qs.map(q=>`<li>${esc(q.q)} <span class="mut">(الصحيح: ${esc(q.o[q.a])})</span></li>`).join("")}</ol>`,s:["احذف السؤال 1","خلي مدة الكويز 15 دقيقة"]};
  let m;if((m=t.match(/(?:احذف|شيل|امسح|delete|remove)\s*(?:ال)?(?:سؤال|question)\s*(?:رقم\s*)?(\d+)/))){const k=+m[1]-1;if(k<0||k>=quiz.qs.length)return SO("مفيش سؤال رقم "+m[1]+". الكويز فيه "+nqs(quiz.qs.length)+".");if(quiz.qs.length<=1)return SO("لازم يفضل في الكويز سؤال واحد على الأقل.");const q=quiz.qs.splice(k,1)[0];staffSave();sAud("QUIZ_QUESTION_DELETED");return SO("تم حذف السؤال: "+q.q,"اعرض أسئلة الكويز")}
  if(/(مده|مدة|دقيقه|دقايق|minutes|duration)/.test(t)&&numIn(t)!=null&&/(خلي|خلى|اجعل|غير|عدل|set|change|make)/.test(t)){const n=Math.max(1,Math.min(180,numIn(t)));quiz.mins=n;staffSave();sAud("QUIZ_DURATION "+n);return SO("تم ضبط مدة «"+quiz.title+"» على "+n+" دقيقة.")}
  if(/(مخالفات|المخالفات|violations)/.test(t)&&numIn(t)!=null){const n=Math.max(0,Math.min(3,numIn(t)));quiz.maxV=n;sAud("QUIZ_MAX_VIOLATIONS "+n);save();return SO("تم ضبط المخالفات المسموحة على "+n+(numIn(t)>3?" (الحد الأقصى 3).":"."))}
  for(const k of Object.keys(SECK))if(SECK[k].test(t)&&/(فعل|شغل|اقفل|ايقاف|وقف|اطفي|الغ|الغي|عطل|enable|disable|turn|on\b|off\b|اوقف)/.test(t)){const on=!/(اقفل|ايقاف|وقف|اطفي|الغ|الغي|عطل|disable|off\b|اوقف|بدون|من غير)/.test(t);secCfg[k]=on;sAud("SECURITY_"+k.toUpperCase()+(on?"_ON":"_OFF"));save();return SO("تم "+(on?"تفعيل":"إيقاف")+" «"+SECN[k]+"».","اعرض أسئلة الكويز")}}
 // 4) باب التسجيل (إدارة)
 if(/(تسجيل)/.test(t)&&/(افتح|فتح|اقفل|اغلق|قفل|open|close)/.test(t)&&!/(مادة|ماده)/.test(t)){if(!A)return SO("التحكم في باب التسجيل من صلاحيات الإدارة.");const on=/(افتح|فتح|open)/.test(t);regOpen=on;if(UNI&&UNI.on)UNI.call("POST","/api/admin/registration/"+(on?"open":"close"));sAud("REGISTRATION_"+(on?"OPENED":"CLOSED"));save();return SO("تم "+(on?"فتح":"إغلاق")+" باب التسجيل ويسري على كل الطلاب فورًا.")}
 // 5) إشعار للطلاب
 if(/(ابعت|ارسل|اعمل|وجه|send|post|publish)/.test(t)&&/(اشعار|اعلان|رساله|notification|announce)/.test(t)){
  if(!A)return SO("إرسال الإعلانات العامة من صلاحيات الإدارة.");const body=fld(raw,[/(?::|：)\s*([\s\S]{4,300})$/,/(?:بنص|نصه|يقول|saying|that says)\s*([\s\S]{4,300})$/i]);
  if(!body)return SO("اكتب نص الإشعار بعد النقطتين. مثال:\nابعت إشعار للطلاب: تم تأجيل الاختبار النصفي أسبوعًا");SP={kind:"notif",text:body.trim()};return{src:1,nopre:1,t:"هرسل للطلاب الإشعار ده:\n«"+body.trim()+"»\nأتأكد قبل الإرسال؟",s:["أيوه ابعته","لا"]}}
 // 6) حذف مادة
 if(/(احذف|امسح|شيل|delete|remove)/.test(t)&&/(مادة|ماده|course)/.test(t)){if(!A)return SO("حذف المواد من صلاحيات الإدارة.");const c=sCourse(raw,t);if(!c)return SO("أي مادة تقصد؟ اكتب اسمها أو كودها.");
  if(!c.x)return SO("«"+c.name+"» من مواد الخطة الأساسية ولا يمكن حذفها من هنا. الحذف متاح للمواد التي أضفتها بنفسك.");SP={kind:"del",id:c.id};return{src:1,nopre:1,t:"هتحذف «"+c.name+"» ("+c.enr+" طالب مسجل). متأكد؟",s:["أيوه احذفها","لا"]}}
 // 7) المقاعد
 const c0=sCourse(raw,t);
 if(c0&&(/(مقعد|مقاعد|سعه|capacity|seats?|طلاب زياده|طالب زياده|more students|extra)/.test(t)||(add&&numIn(t)!=null&&/(طالب|طلاب|students?)/.test(t))||/(اقفل|اغلق|close)/.test(t)&&/(مادة|ماده|course|التسجيل|registration)/.test(t))&&!/(كام|كم|how many|عدد المسجلين)/.test(t))return seats(raw,t,c0);
 // 8) استعلامات
 if(c0&&/(كام طالب|كم طالب|عدد الطلاب|عدد المسجلين|how many|enrol|enroll|registered)/.test(t))return SO(c0.name+": "+c0.enr+" طالب مسجل من "+c0.cap+" (المتاح "+(c0.cap-c0.enr)+").",...(sOwn(c0)?["زوّد 10 طلاب في "+c0.name]:[]));
 if(/(الممتل|ممتلئه|مليانه|full|اكتر مادة|اكثر مادة|most (crowded|popular|enrolled)|زحمه|زحمة)/.test(t)){const s=[...courses].sort((a,b)=>b.enr/b.cap-a.enr/a.cap),f=s.filter(c=>c.enr>=c.cap);return{src:1,nopre:1,t:f.length?"المواد الممتلئة: "+f.map(c=>c.name).join("، ")+".":"مفيش مواد ممتلئة حاليًا.",h:`<ul class="al">${s.slice(0,4).map(c=>`<li><b>${esc(c.name)}</b>: ${c.enr}/${c.cap} (${Math.round(c.enr/c.cap*100)}%)</li>`).join("")}</ul>`,s:f.length?["زوّد 10 طلاب في "+f[0].name]:[]}}
 if(/(كل المواد|المواد كلها|اعرض المواد|all courses|list courses|show courses|موادي|my courses)/.test(t)||(/(اعرض|وريني|show|list)/.test(t)&&/(مواد|courses)/.test(t))){const L=/(موادي|my courses)/.test(t)?courses.filter(c=>c.doc===DOC_ME):courses;return{src:1,nopre:1,t:"المواد ("+L.length+"):",h:`<ul class="al">${L.map(c=>`<li><b>${esc(c.name)}</b> (${c.id}) — ${c.enr}/${c.cap}${c.enr>=c.cap?" · ممتلئة":""} · ${esc(c.doc)} · ${c.slot}</li>`).join("")}</ul>`,s:["المواد الممتلئة","زوّد مادة اسمها Cloud Computing"]}}
 if(/(سجل|audit|اخر العمليات|العمليات الاخيره|log)/.test(t)&&/(اعرض|وريني|show|اخر|سجل|audit)/.test(t)){if(!A)return SO("سجل العمليات من صلاحيات الإدارة.");return{src:1,nopre:1,t:"آخر العمليات:",h:`<ul class="al">${audit.slice(0,8).map(x=>`<li>${esc(x)}</li>`).join("")||"<li>لا عمليات بعد</li>"}</ul>`,s:[]}}
 if(/(مساعده|help|تقدر تعمل|ايه اللي تقدر|ماذا تستطيع|what can you do|اوامر|commands)/.test(t))return staffHelp();
 return null}
function staffHelp(){const A=user.role==="admin";return{src:1,nopre:1,t:"أقدر أنفّذ لك أوامر مباشرة، اكتبها بلهجتك:",h:`<ul class="al"><li><b>مواد:</b> «زوّد مادة اسمها Cloud Computing كودها CS450 بسعة 40 ودكتورها د. سارة يوم الثلاثاء 11:00»</li><li><b>مقاعد:</b> «افتح 10 طلاب زيادة في Database» · «خلي سعة الويب 50» · «اقفل مادة Algorithms»</li><li><b>اختبارات:</b> الصق أسئلتك مع «اعمل اختبار بالأسئلة دي مدته 15 دقيقة»، أو ارفع ملزمة واكتب «اعمل اختبار من الملف 8 أسئلة»</li><li><b>ضبط الاختبار:</b> «خلي مدة الكويز 20 دقيقة» · «المخالفات المسموحة 2» · «فعّل الكاميرا» · «احذف السؤال 3»</li><li><b>أرقام:</b> «كام طالب في Database» · «المواد الممتلئة» · «اعرض كل المواد»</li>${A?"<li><b>إدارة:</b> «افتح باب التسجيل» · «ابعت إشعار للطلاب: …» · «احذف مادة X» · «اعرض آخر العمليات»</li>":""}</ul>`,s:["اعرض كل المواد","المواد الممتلئة"]}}
// توليد أسئلة «أكمل الفراغ» من جمل ملف مرفوع
function genCloze(d,n){
 const tx=d.chunks.filter(c=>c.t==="text"||c.t==="qa"),sents=[];
 tx.forEach((c,ci)=>(c.t==="qa"?c.text+". "+c.ans:c.text).split(/(?<=[.!؟?])\s+|\n+/).map(x=>x.trim()).filter(x=>x.length>=45&&x.length<=240).forEach(x=>sents.push({x,ci})));
 const wr=/[A-Za-z][A-Za-z0-9_\-]{3,}|[\u0600-\u06FF]{4,}/g,tf={};
 sents.forEach(s=>{s.ws=[...new Set(s.x.match(wr)||[])];s.ws.forEach(w=>{const k=w.toLowerCase();tf[k]=(tf[k]||0)+1})});
 const cand=Object.keys(tf).filter(k=>tf[k]>=2&&k.length<=22&&!KSTOP.has(nz(k))).sort((a,b)=>tf[b]-tf[a]).slice(0,60),cs=new Set(cand);
 if(cand.length<4||sents.length<3)return{err:"المحتوى النصي في «"+d.name+"» لا يكفي لتوليد أسئلة موثوقة. جرّب ملفًا أطول."};
 const lat=w=>/^[a-z]/i.test(w),sh=a=>a.map(x=>[Math.random(),x]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]),qs=[],seen=new Set();
 for(const s of sh(sents)){if(qs.length>=n)break;if(seen.has(s.x))continue;
  const key=s.ws.find(w=>cs.has(w.toLowerCase())&&(s.x.match(wordRx(w,"gi"))||[]).length===1);if(!key)continue;
  const pool=sh(cand.filter(k=>k!==key.toLowerCase()&&lat(k)===lat(key)&&Math.abs(k.length-key.length)<=6));if(pool.length<3)continue;
  const opts=sh([key,...pool.slice(0,3).map(w=>s.ws.find(x=>x.toLowerCase()===w)||w)]);
  seen.add(s.x);qs.push({q:s.x.replace(wordRx(key,"i"),"_____"),o:opts,a:opts.indexOf(key),e:T("الجملة الأصلية في الملف: ","Original sentence in the file: ")+s.x,h:T("الكلمة تبدأ بحرف «"+key[0]+"» وعدد حروفها "+key.length,"It starts with “"+key[0]+"” and has "+key.length+" letters")})}
 return qs.length<2?{err:"لم أستطع بناء أسئلة جيدة من «"+d.name+"»."}:{qs}}

let FRD=0;
function frontRoute(raw,t,toks,c){
 const O=(x,...s)=>({src:1,t:x,s}),SMx=T("ملخص وضعي","My summary");
 const study=/(اذاكر|ذاكر|مذاكر|استعد|اجهز|تحضير|prepare|revise|revision|study)/.test(t)||/خطه (مذاكر|للامتحان)/.test(t);
 const planW=/(خطه|plan)/.test(t);
 // (1) معدلي/GPA: قيمة المعدل لا شرحه
 if(/(^|\s)(gpa|معدلي|معدلك|معدلى)(\s|$)/.test(t)&&/(what|كام|كم|ايه|my|معدلي|show|اعرض|قولي)/.test(t)&&!/(how|كيف|طريق|calculate|يتحسب|ازاي|اتحسب|يحسب)/.test(t)&&!study)
  return O(T("معدلك التراكمي GPA: ","Your GPA: ")+me.gpa+"\n"+me.grades.map(g=>"• "+g[0]+": "+g[1]).join("\n"),T("المواد التي أحتاج تحسينها","Which courses need work?"),SMx);
 // (2) المواد المتاحة للتسجيل
 if(/(مواد|ماده|courses?|subjects?)/.test(t)&&/(متاح[هة]?|مفتوح[هة]?|available|open|اقدر اسجل|can i (register|take|enroll))/.test(t)&&!/(سجلني|register me)/.test(t)){const av=courses.filter(x=>!eligibility(x));
  return O(av.length?T("المواد المتاحة لك للتسجيل ("+av.length+"):\n","Courses available for you ("+av.length+"):\n")+av.map(x=>"• "+x.name+" — "+x.slot+" ("+x.cr+" "+T("ساعات","credits")+")").join("\n"):T("لا توجد مواد متاحة للتسجيل حاليًا.","No courses are currently available."),...av.slice(0,2).map(x=>T("سجلني في "+x.name,"Register me in "+x.name)),T("اقترح لي خطة","Suggest a plan"))}
 // (3) المواد التي تحتاج تحسينًا (بدون طلب خطة مذاكرة)
 if(!study&&!planW&&/(مواد|ماده|courses?|subjects?|اضعف|weakest)/.test(t)&&/(تحسين|محتاج[هة]?|تحتاج|ضعيف[هة]?|اضعف|weak|improv|need(s)? (work|help|improvement)|struggl)/.test(t)&&!/(سجل|register)/.test(t))return frontWeak();
 // (4) ما القادم: امتحانات + واجبات معلّقة
 if((/(عندي|عليا|علي|لدي|do i have|what('| i)?s)/.test(t)&&/(قادم|القادم|الجاي|جاي|upcoming|coming|due|deadline|تسليم|مواعيد)/.test(t))||/(امتي|امتا|متي|when)\s.*(امتحان|اختبار|كويز|exam|test|quiz|midterm|final|نصفي|نهائي)/.test(t)||/(مواعيد|ميعاد|جدول)\s*(ال)?(امتحان|اختبار)/.test(t)||/(upcoming|next)\s+(exam|test|quiz|deadline|assignment)/.test(t)||/(الامتحانات|الاختبارات) (القادم|الجاي)/.test(t))return frontUpcoming(c);
 // (5) تحضير/مذاكرة لامتحان: دائمًا خطة مذاكرة (قبل أن تلتقطه سياسات الامتحان)
 if(study&&!FRD&&!/(سجل|register|drop|احذف)/.test(t)&&!/(اشرح|explain|what is|ما هو)/.test(t)&&(c||/(exam|test|امتحان|اختبار)/.test(t))){const cc=c||ctx.course||byId(me.reg[0]);if(cc&&me.reg.includes(cc.id)){FRD=1;try{return brain((AR?"اعمل لي خطة مذاكرة ":"Make me a study plan for ")+cc.name,AR)}finally{FRD=0}}}
 // (6) شرح موضوع أو مقارنة بين مفهومين
 if(/(الفرق|difference|vs|مقارنه|يعني ايه|معني|meaning|what is|what are|اشرح|explain|وضح|ما هو|ما هي|ايه هو|ايه هي|define)/.test(t)){for(const tp of Object.keys(EXPL)){const e=Object.values(SYL).flat().find(x=>x.t===tp);if(e&&e.k.some(k=>t.includes(k)))return{src:1,t:tp+":\n"+EXPL[tp],s:[T("اختبرني في "+tp,"Quiz me on "+tp),T("خطة مذاكرة","Study plan")]}}}
 // (7) تعارض الجدول
 if(/(تعارض|conflict|clash|overlap)/.test(t)&&/(جدول|محاضرات|schedule|classes|timetable)/.test(t)){const rg=me.reg.map(byId),cf=[];rg.forEach((x,i)=>rg.slice(i+1).forEach(y=>{if(x.slot===y.slot)cf.push([x,y])}));
  return O(cf.length?T("يوجد تعارض في جدولك:\n","Your schedule has conflicts:\n")+cf.map(([x,y])=>"• "+x.name+" / "+y.name+" ("+x.slot+")").join("\n"):T("لا يوجد أي تعارض في جدولك الحالي ("+rg.length+" مواد).","No conflicts in your current schedule ("+rg.length+" courses)."),T("ما جدولي؟","My schedule?"))}
 // (8) طلب تسجيل مادة غير معروفة
 if(/(اسجل|سجلني|register|enroll|sign me up)/.test(t)&&!c&&!study){const av=courses.filter(x=>!eligibility(x));
  return O(T("لم أتعرف على اسم المادة. هذه المواد المتاحة لك الآن:\n","I couldn't match that course name. These are available to you now:\n")+av.map(x=>"• "+x.name).join("\n"),...av.slice(0,3).map(x=>T("سجلني في "+x.name,"Register me in "+x.name)))}
 return null}
function frontWeak(){const avg=perfAvg(),L=me.reg.filter(i=>PERF[i]).map(i=>({c:byId(i),p:PERF[i]})).sort((a,b)=>a.p.score-b.p.score).filter(x=>x.p.score<avg||x.p.weak.length);
 if(!L.length)return{src:1,t:T("لا توجد مادة أقل بوضوح من مستواك العام. استمر على نفس الوتيرة.","No course is clearly below your general level. Keep it up."),s:[]};
 return{src:1,t:T("المواد التي تحتاج تحسينًا (من درجاتك الفعلية):","Courses that need improvement (from your actual scores):"),h:`<ul class="al">${L.map(x=>`<li><b>${x.c.name}</b>: ${x.p.score}%${x.p.weak.length?" — "+T("نقاط الضعف: ","weak points: ")+x.p.weak.join("، "):""}</li>`).join("")}</ul>`,s:[T("خطة مذاكرة "+L[0].c.name,"Study plan for "+L[0].c.name),T("اختبرني في "+L[0].c.name,"Quiz me on "+L[0].c.name)]}}
function frontUpcoming(c){const ex=EXAMS.filter(e=>me.reg.includes(e.c)&&(!c||e.c===c.id)).sort((a,b)=>a.off-b.off),hs=hw.filter(h=>!h.done&&me.reg.includes(h.c)&&(!c||h.c===c.id));
 if(!ex.length&&!hs.length)return{src:1,t:T("لا توجد اختبارات أو تسليمات قادمة مسجّلة لك.","You have no upcoming exams or deadlines recorded."),s:[]};
 const li=[...ex.map(e=>`<li><b>${T("اختبار","Exam")}: ${byId(e.c).name}</b> — ${e.kind}، ${addDays(e.off).toLocaleDateString(LOC,{weekday:"long",day:"numeric",month:"long"})} ${T("الساعة","at")} ${e.time} (${rel(e.off)})</li>`),...hs.map(h=>`<li><b>${T("واجب","Assignment")}: ${h.t}</b> — ${byId(h.c).name} (${h.due})</li>`)];
 return{src:1,t:T("القادم عليك:","Coming up for you:"),h:`<ul class="al">${li.join("")}</ul>`,s:ex.length?[T("خطة مذاكرة "+byId(ex[0].c).name,"Study plan for "+byId(ex[0].c).name),T("ماذا أذاكر اليوم؟","What should I study today?")]:[]}}

function brain(raw,lang){frHit=false;const t=nz(raw),toks=t.split(/[^a-z\u0600-\u06ff0-9]+/).filter(Boolean);AR=lang!==undefined?lang:(/[\u0600-\u06FF]/.test(raw)||frHit);
 const O=(x,...s)=>({src:1,t:x,s}),H=(x,h,...s)=>({src:1,t:x,h,s});
 if(user.role!=="student"){const r=staffBrain(raw,t);if(r)return r;const k=kbAnswer(t,.5);if(k)return k}
 if(user.role!=="student")return O(T("إجمالي التسجيلات الحالية: ","Current enrollments: ")+courses.reduce((a,x)=>a+x.enr,0)+T(" في "," across ")+courses.length+T(" مواد. أحداث الأمان المسجلة: "," courses. Security events: ")+secEvents.length+".",T("كم عدد الطلاب؟","How many students?"),"ايه اللي تقدر تعمله؟");
 if(pending){const p=pending;if(YES.test(t)){pending=null;return O(p.fn(),T("ما جدولي؟","My schedule?"),T("اقترح لي خطة","Suggest a plan"))}if(NO.test(t)){pending=null;return{t:T("تم إلغاء العملية.","The operation was cancelled."),s:[T("ما المواد المتاحة؟","Available courses?")]}}pending=null}
 let c=findCourse(t,toks);const named=!!c;if(c)ctx.course=c;else if(toks.some(w=>["it","its","her","that","بتاعها","بتاعتها","دكتورها","عنها","منها"].includes(w)))c=ctx.course;
 const S={};for(const k in LEX)S[k]=sc(t,toks,LEX[k]);
 {const fr=frontRoute(raw,t,toks,c);if(fr)return fr}
 const av=courses.filter(x=>!eligibility(x));
 if(S.other&&S.gpa)return{t:T("لا يمكنني عرض درجات طالب آخر؛ يقتصر الوصول على بياناتك الشخصية.","I cannot show another student's grades; access is limited to your own records."),s:[T("ما درجاتي؟","My grades?")]};
 if(/(حل|جاوب|احل|solve|answer)\s*(لي|my|the|me)?\s*(ال)?(كويز|امتحان|اختبار|quiz|exam|test)/.test(t))S.cheat=1;
 if(ctx.pr){const r=practiceStep(raw,t);if(r)return r}
 if(S.cheat)return O(T("لا أستطيع حل اختبار رسمي أو الإجابة عنه؛ هذا يخالف قواعد النزاهة الأكاديمية. يمكنني مساعدتك في التحضير: شرح المفاهيم، وأسئلة تدريبية، وتلميحات.","I can't solve or answer an official exam; that breaks academic-integrity rules. I can help you prepare with concept explanations, practice questions and hints."),T("اختبرني في SQL","Quiz me on SQL"),T("اشرح لي JOIN","Explain JOIN"));
 {const act=/(اسجل|سجلني|ضيف|احذف|شيل|انسحب|register me|enroll me|drop|withdraw)/.test(t)&&c;const k=KB.docs.some(d=>d.on)&&!act?kbAnswer(t,.7):null;if(k&&k.qa)return k}
 if(S.more&&ctx.more&&ctx.more.rest.length&&toks.length<=4){const x=ctx.more.rest.splice(0,2).join(" ");return{src:1,t:x,s:ctx.more.rest.length?[T("كمّل","Continue")]:[]}}
 if(!S.more)ctx.more=null;
 {const nl=nlpClassify(t),anyLex=Object.keys(S).some(k=>S[k]>0);
  if(nl.it&&ABOUT[nl.it]&&nl.sim>=.6&&!c){const k=nl.it==="creator"&&KB.docs.some(d=>d.on)?kbAnswer(t+" نظام مشروع فريق",.6,"c_make"):null;if(k)return k;return O(ABOUT[nl.it]())}
  if(nl.it&&RW[nl.it]&&!c&&!nlpDepth&&((!anyLex&&nl.sim>=.55)||(INFO.has(nl.it)&&nl.sim>=.9&&nl.second<nl.sim*.85&&!(S.help&&nl.it==="plan")))){nlpDepth=1;try{return brain(RW[nl.it][AR?0:1],AR)}finally{nlpDepth=0}}}
 {const live=S.register||S.drop||S.build||S.office||S.status||S.progress||S.sched||S.gpa||S.mine||S.load||S.whatif||S.assign||S.news||S.left||S.how||S.who||S.capab||S.feel||S.bye||S.study||S.weakq||S.attq||S.upex||S.quizme||S.explain||S.cheat;if(!live){const k=kbAnswer(t,.6);if(k)return k}}
 const pct=Math.round(PROG.earned/PROG.total*100),rem=PROG.total-PROG.earned,cr=regCr(),mx=maxLoad(me.gpa),SM=T("ملخص وضعي","My summary");
 const nm=user.first;
 if(S.bye)return{t:T("في أمان الله يا "+nm+". أنا هنا متى احتجت إلى الإرشاد.","Goodbye, "+nm+". I am here whenever you need guidance."),s:[]};
 if(S.how)return O(T("بخير والحمد لله، شكرًا لسؤالك. وأنت يا "+nm+"، كيف تسير دراستك هذا الفصل؟","I am well, thank you. And how is your term going, "+nm+"?"),SM,T("أشعر بالقلق من هذا الفصل","I feel worried about this term"));
 if(S.who)return O(T("أنا المرشد الأكاديمي في بوابة جامعة UniSmart. أعمل بالكامل داخل النظام دون أي خدمة خارجية، وأجيب من بياناتك الفعلية وفي حدود صلاحياتك فقط.","I am the academic advisor of the UniSmart portal. I run entirely inside the system with no external service, and answer from your own records within your permissions."),T("ما الذي يمكنك فعله؟","What can you do?"));
 if(S.capab)return H(T("يمكنني مساعدتك في:","I can help you with:"),`<ul class="al">${(AR?["مراجعة وضعك الأكاديمي وتنبيهاته","التقدم نحو التخرج","اقتراح جدول متوازن وتسجيله بتأكيدك","حساب المعدل المتوقع","متطلبات المواد وبدائلها","حجز موعد إرشاد","الواجبات والإعلانات وضوابط الاختبار الآمن"]:["Reviewing your academic standing and alerts","Graduation progress","Proposing a balanced schedule and registering it on your confirmation","Projected GPA","Course prerequisites and alternatives","Booking an advising appointment","Assignments, announcements and secure-exam rules"]).map(x=>`<li>${x}</li>`).join("")}</ul>`,SM,T("ابني لي جدولا للفصل","Build my schedule"));
 if(S.feel){const tip=me.gpa<2.5?T("لاحظت أن معدلك "+me.gpa+"، لذا أنصح بعبء أخف وبموعد مع المرشد.","I noticed your GPA is "+me.gpa+", so I suggest a lighter load and a meeting with your advisor."):cr>mx?T("عبء فصلك أعلى من المسموح، ويمكننا تخفيفه.","Your load exceeds your limit; we can lighten it."):T("وضعك الأكاديمي مستقر، ويمكننا ترتيب الأمور خطوة خطوة.","Your standing is stable; we can organise things step by step.");
  return O(T("أتفهّم شعورك يا "+nm+"، وهو أمر شائع خلال الدراسة. "+tip+" بماذا تفضّل أن نبدأ؟","I understand how you feel, "+nm+"; it is common during studies. "+tip+" Where would you like to start?"),SM,T("ابني لي جدولا للفصل","Build my schedule"),T("أريد حجز موعد إرشاد","I want to book an advising appointment"))}
 if(S.why&&ctx.block){const b=ctx.block,alts=av.filter(x=>x.id!==b.c.id).slice(0,2);return H(T("السبب: "+b.r+".","Reason: "+b.r+"."),alts.length?`<div class="mut" style="margin-top:6px">${T("بدائل متاحة لك:","Available alternatives:")}</div><ul class="al">${alts.map(x=>`<li>${x.name} — ${x.slot}</li>`).join("")}</ul>`:"",...alts.map(x=>T("سجلني في "+x.name,"Register me in "+x.name)))}
 if(!S.build&&/(صباح|morning|مسائي|afternoon|evening)/.test(t)&&/(افضل|احب|prefer|محاضرات|classes|lectures|مواعيد|timing)/.test(t)){ctx.pref=/(مسائي|afternoon|evening)/.test(t)?"pm":"am";return O(T("تم تسجيل تفضيلك للمواعيد "+(ctx.pref==="am"?"الصباحية":"المسائية")+"، وسأراعيه عند اقتراح الجداول.","Noted. I will prefer "+(ctx.pref==="am"?"morning":"afternoon")+" classes when proposing schedules."),T("ابني لي جدولا للفصل","Build my schedule"))}
 if(S.study||(S.exam&&/(ضعيف|ضعف|weak|struggl)/.test(t))){const cc=c||ctx.course||byId(me.reg[0]);
  if(!cc||!me.reg.includes(cc.id))return O(T("لم أجد هذه المادة ضمن موادك المسجّلة. اذكر مادة مسجّلة لأضع لك خطة مذاكرة.","I couldn't find that course among your registered ones. Name a registered course and I'll build a study plan."),...me.reg.map(i=>T("خطة مذاكرة "+byId(i).name,"Study plan for "+byId(i).name)));
  const ex=EXAMS.find(e=>e.c===cc.id);let off=ex?ex.off:7;const wd=DAYS.findIndex(d=>t.includes(d.replace(/[أإآ]/g,"ا")));if(wd>=0){off=daysLeft(nextDate(wd));if(off===0)off=7}
  const sy=SYL[cc.id]||[],widx=sy.map((x,i)=>x.k.some(k=>t.includes(k))?i:-1).filter(i=>i>=0),pl=studyPlan(cc,off,widx),pf=PERF[cc.id],avg=perfAvg();ctx.course=cc;const ft=sy[widx[0]]?sy[widx[0]].t:(sy[0]?sy[0].t:cc.name);
  const why=pf&&pf.score<avg-3?T("أنت تحتاج لتحسين "+cc.name+" لأن درجتك فيها ("+pf.score+"%) أقل من متوسطك ("+Math.round(avg)+"%). ","You need to improve "+cc.name+" because your score ("+pf.score+"%) is below your average ("+Math.round(avg)+"%). "):"";
  return H(why+T("هذه خطة مذاكرة "+cc.name+" حتى الاختبار ("+rel(off)+"):","Here is a study plan for "+cc.name+" until the exam ("+rel(off)+"):"),`<div class="plan">${pl.map(d=>`<div class="pd"><b>${d.d.toLocaleDateString(LOC,{weekday:"long",day:"numeric",month:"long"})} — ${Math.round(d.min/6)/10} ساعة</b>${d.items.map(x=>`${x.weak?badge("نقطة ضعف","warn"):badge("مراجعة")} ${esc(x.t)}`).join("<br>")}<small class="mut">+ حل 5 أسئلة تدريبية في المرشد</small></div>`).join("")}</div>${pl.skipped.length?`<div class="mut" style="margin-top:8px">الوقت المتبقي لا يتسع لمراجعة: ${pl.skipped.map(esc).join("، ")} — اكتفِ بنظرة سريعة عليها بعد التركيز على نقاط الضعف.</div>`:""}`,T("اختبرني في "+ft,"Quiz me on "+ft),T("اشرح لي "+ft,"Explain "+ft))}
 if(S.weakq){const avg=perfAvg(),L=me.reg.filter(i=>PERF[i]).map(i=>({c:byId(i),p:PERF[i]})).sort((a,b)=>a.p.score-b.p.score).filter(x=>x.p.score<avg||x.p.weak.length);
  if(!L.length)return O(T("أداؤك متوازن في جميع المواد حاليًا. استمر على نفس الوتيرة.","Your performance is balanced across courses. Keep it up."));
  return H(T("المواد التي تحتاج لتحسينها (متوسطك "+Math.round(avg)+"%):","Courses that need improvement (your average "+Math.round(avg)+"%):"),`<ul class="al">${L.map(x=>`<li><b>${x.c.name}</b>: ${x.p.score}%${x.p.weak.length?" — نقاط الضعف: "+x.p.weak.join("، "):""}</li>`).join("")}</ul>`,...L.slice(0,2).map(x=>T("خطة مذاكرة "+x.c.name,"Study plan for "+x.c.name)))}
 if(S.attq){const at=attAll();return H(T("نسبة حضورك الإجمالية "+Math.round(at.pct*100)+"% ("+at.p+" حاضر، "+at.a+" غائب، "+at.l+" متأخر).","Your overall attendance is "+Math.round(at.pct*100)+"% ("+at.p+" present, "+at.a+" absent, "+at.l+" late)."),`<ul class="al">${me.reg.map(i=>{const x=attOf(i),pc=Math.round((x.p+x.l)/(x.p+x.a+x.l)*100);return`<li>${byId(i).name}: ${pc}%${pc<80?" — انتبه، حد الحرمان 75%":""}</li>`}).join("")}</ul>`,T("ما سياسة الحضور؟","Attendance policy?"))}
 if(S.upex){const L=EXAMS.filter(e=>me.reg.includes(e.c)).sort((a,b)=>a.off-b.off);return L.length?H(T("اختباراتك القادمة:","Your upcoming exams:"),`<ul class="al">${L.map(e=>`<li><b>${byId(e.c).name}</b> — ${e.kind}، ${addDays(e.off).toLocaleDateString(LOC,{weekday:"long",day:"numeric",month:"long"})} الساعة ${e.time} (${rel(e.off)})</li>`).join("")}</ul>`,T("خطة مذاكرة "+byId(L[0].c).name,"Study plan for "+byId(L[0].c).name)):O(T("لا توجد اختبارات قادمة مسجّلة.","No upcoming exams recorded."))}
 if(S.quizme){const cc=c||ctx.course;let topic=null;for(const tp of Object.keys(QB)){const e=Object.values(SYL).flat().find(x=>x.t===tp);if(e&&e.k.some(k=>t.includes(k))){topic=tp;break}}
  if(!topic)topic=((cc&&PERF[cc.id]?PERF[cc.id].weak:Object.values(PERF).flatMap(p=>p.weak)).find(w=>QB[w]))||Object.keys(QB)[0];
  const qs=[...QB[topic]].sort(()=>Math.random()-.5).slice(0,3);ctx.pr={qs,i:0,score:0,topic,wrong:[]};
  return O(T("تدريب على «"+topic+"» ("+qs.length+" أسئلة). هذه أسئلة تعليمية للتحضير وليست اختبارًا رسميًا.\n\nالسؤال 1: "+qs[0].q,"Practice on “"+topic+"” ("+qs.length+" questions). These are learning questions, not an official exam.\n\nQuestion 1: "+qs[0].q),...qs[0].o.map((o,i)=>"ABCD"[i]+") "+o),T("تلميح","Hint"))}
 if(S.explain){let topic=null;for(const tp of Object.keys(EXPL)){const e=Object.values(SYL).flat().find(x=>x.t===tp);if(e&&e.k.some(k=>t.includes(k))){topic=tp;break}}
  if(topic)return O(topic+": "+EXPL[topic],T("اختبرني في "+topic,"Quiz me on "+topic))}
 if(S.gpa&&c&&PERF[c.id]&&me.reg.includes(c.id)){const p=PERF[c.id];return H(T("أداؤك في "+c.name+":","Your performance in "+c.name+":"),kv([["الدرجة الحالية",p.score+"%"],["الكويزات",p.quiz.join(" · ")+" / 10"],["الواجبات",p.asg+"%"],["نقاط الضعف",p.weak.join("، ")||"لا توجد"]]),T("خطة مذاكرة "+c.name,"Study plan for "+c.name))}
 if(S.status){const w=[];if(me.gpa<2)w.push(T("المعدل دون 2.0: وضع إنذار أكاديمي والحد الأقصى للعبء 12 ساعة.","GPA below 2.0: academic warning, maximum load 12 credits."));if(cr<12)w.push(T("عبء الفصل ("+cr+") أقل من الحد الأدنى المعتاد (12).","Current load ("+cr+") is below the usual minimum (12)."));if(!regOpen)w.push(T("باب التسجيل مغلق حاليًا.","Registration is currently closed."));if(!w.length)w.push(T("وضعك الأكاديمي مستقر.","Your academic standing is stable."));
  return H(T("ملخص وضعك الأكاديمي:","Your academic summary:"),kv([[T("المعدل التراكمي","GPA"),me.gpa],[T("التقدير العام","Standing"),standing(me.gpa)],[T("الساعات المنجزة","Credits earned"),PROG.earned+" / "+PROG.total],[T("عبء الفصل","Term load"),cr+" / "+mx],[T("حالة التسجيل","Registration"),regOpen?T("مفتوح","Open"):T("مغلق","Closed")]])+bar(pct)+`<ul class="al">${w.map(x=>`<li>${x}</li>`).join("")}</ul>`,T("ابني لي جدولا للفصل","Build my schedule"),T("ما مدى تقدمي نحو التخرج؟","Graduation progress"))}
 if(S.progress)return H(T("تقدمك نحو التخرج:","Your graduation progress:"),kv([[T("البرنامج","Program"),PROG.name],[T("الساعات المنجزة","Credits earned"),PROG.earned+" / "+PROG.total+" ("+pct+"%)"],[T("المتبقي","Remaining"),rem],[T("الفصول المتوقعة","Estimated terms"),Math.ceil(rem/15)]])+bar(pct),T("حاسبة المعدل","GPA calculator"),SM);
 if(S.whatif){const mm=raw.toLowerCase().match(/(?:get|got|grade|جبت|حصلت|اخدت|تقدير)\s*(?:على\s*|an?\s+)?(a\+|a-|a|b\+|b-|b|c\+|c|d|f)(?![a-z])/),k=c?c.cr:Math.max(cr,3),L=mm?[mm[1].toUpperCase().replace("A+","A")]:["A","B+","B","C"],f=g=>((me.gpa*PROG.earned+GP[g]*k)/(PROG.earned+k)).toFixed(2);
  return H(T("المعدل المتوقع (الأساس: GPA "+me.gpa+" على "+PROG.earned+" ساعة"+(c?"، مادة "+c.name:"، "+k+" ساعات")+"):","Projected GPA (base "+me.gpa+" over "+PROG.earned+" credits"+(c?", "+c.name:"")+"):"),kv(L.map(g=>[T("عند الحصول على ","If you earn ")+g,f(g)])),T("ما مدى تقدمي نحو التخرج؟","Graduation progress"))}
 if(S.prereq){if(!c)return O(T("اذكر اسم المادة لأبيّن متطلباتها السابقة.","Name a course and I will explain its prerequisites."),...courses.slice(0,3).map(x=>T("ما متطلبات "+x.name+"؟","Prerequisites of "+x.name+"?")));
  return H(T("المتطلبات السابقة لمادة "+c.name+":","Prerequisites for "+c.name+":"),c.pre.length?`<ul class="al">${c.pre.map(p=>`<li>${p} ${CODES[p]?"("+CODES[p]+") ":""}— ${me.done.includes(p)?T("منجزة","completed"):T("غير منجزة","not completed")}</li>`).join("")}</ul>`:`<div class="mut">${T("لا توجد متطلبات سابقة.","No prerequisites.")}</div>`,eligibility(c)&&!me.reg.includes(c.id)?T("ما البدائل المتاحة لي؟","Available alternatives?"):T("سجلني في "+c.name,"Register me in "+c.name))}
 if(S.conflict||S.alt){const e=c&&eligibility(c),alts=av.filter(x=>!c||x.id!==c.id).slice(0,3);
  return H(c&&e?T("تعذّر تسجيل "+c.name+": "+e+".","Cannot register "+c.name+": "+e+"."):T("البدائل المتاحة لك:","Alternatives available to you:"),alts.length?`<ul class="al">${alts.map(x=>`<li>${x.name} — ${x.slot}</li>`).join("")}</ul>`:"",...alts.map(x=>T("سجلني في "+x.name,"Register me in "+x.name)))}
 if(S.office){const o=OFFICE.find(x=>x.k.some(k=>t.includes(k.replace(/ى/g,"ي"))))||(c&&OFFICE.find(x=>x.d===c.doc)),sl=o&&o.slots.find(x=>t.includes(x.replace(/[أإآ]/g,"ا")));
  if(o&&sl){const at=o.d+" – "+sl;pending={fn:()=>{appts.push(at);audit.unshift(new Date().toLocaleTimeString(LOC)+" ADVISING_BOOKED");return T("تم حجز موعد الإرشاد: "+at+" ("+o.room+").","Appointment booked: "+at+" ("+o.room+").")}};return O(T("هل تؤكد حجز موعد مع "+o.d+" يوم "+sl+"؟","Confirm booking with "+o.d+" on "+sl+"?"))}
  const os=o?[o]:OFFICE;return H(T("الساعات المكتبية المتاحة للإرشاد:","Available office hours:"),os.map(x=>`<div class="ofc"><b>${x.d}</b> <span class="mut">${x.room} — ${x.slots.join("، ")}</span></div>`).join("")+(appts.length?`<div class="mut" style="margin-top:6px">${T("مواعيدك المحجوزة: ","Your bookings: ")+appts.join("، ")}</div>`:""),...os.flatMap(x=>x.slots.map(sl=>T("احجز مع ","Book with ")+x.d+" "+sl)).slice(0,4))}
 if(S.build){const tgt=Math.min(15,mx),ch=[],used=me.reg.map(i=>byId(i).slot);const pref=/(صباح|morning)/.test(t)?"am":/(مسائي|afternoon|evening)/.test(t)?"pm":ctx.pref,pool=[...av].sort((a,b)=>pref==="am"?hr(a)-hr(b):pref==="pm"?hr(b)-hr(a):0);let tot=cr;for(const x of pool){if(tot>=tgt)break;if(!used.includes(x.slot)){ch.push(x);used.push(x.slot);tot+=x.cr}}
  if(!ch.length)return O(T("لا توجد مواد يمكن إضافتها حاليًا دون تعارض أو مخالفة للشروط.","No courses can be added right now without conflicts or unmet requirements."),SM);
  pending={fn:()=>{ch.forEach(x=>register(x.id));return T("تم تسجيلك في: "+ch.map(x=>x.name).join("، ")+". المجموع "+tot+" ساعة.","Registered: "+ch.map(x=>x.name).join(", ")+". Total "+tot+" credits.")}};
  return H(T("اقترحت لك جدولًا متوازنًا (الحد الأقصى المسموح لك "+mx+" ساعة):","Proposed balanced schedule (your maximum is "+mx+" credits):"),`<ul class="al">${ch.map(x=>`<li>${x.name} — ${x.doc} — ${x.slot}</li>`).join("")}</ul>`+kv([[T("العبء بعد التسجيل","Load after registration"),tot+" "+T("ساعة","cr")]])+`<div class="mut">${T("هل تؤكد تسجيل هذه المواد؟","Do you confirm registering these courses?")}</div>`)}
 if(S.assign)return H(T("الواجبات:","Assignments:"),hw.map(h=>`<div class="ofc"><b>${h.t}</b> <span class="mut">${byId(h.c).name} — ${h.due} — ${h.done?T("مُسلَّم","submitted"):T("قيد التسليم","pending")}</span></div>`).join(""),SM);
 if(S.news)return H(T("آخر الإعلانات:","Latest announcements:"),news.map(n=>`<div class="ofc"><b>${n[0]}</b> <span class="mut">${n[1]}</span></div>`).join(""),SM);
 if(S.examrules)return H(T("ضوابط الاختبارات الآمنة:","Secure exam rules:"),`<ul class="al"><li>${T("رصد الخروج من صفحة الاختبار: ","Tab-leave detection: ")+(secCfg.tab?T("مفعّل","on"):T("غير مفعّل","off"))}</li><li>${T("ملء الشاشة: ","Fullscreen: ")+(secCfg.fs?T("مفعّل","on"):T("غير مفعّل","off"))}</li><li>${T("منع النسخ واللصق: ","Copy/paste block: ")+(secCfg.copy?T("مفعّل","on"):T("غير مفعّل","off"))}</li><li>${T("المخالفات المسموحة: "+quiz.maxV+"؛ بعدها يُسلَّم الاختبار تلقائيًا.","Allowed violations: "+quiz.maxV+"; after that the exam is auto-submitted.")}</li><li>${T("الكاميرا اختيارية وبموافقتك ولا تعمل سرًّا.","Camera is optional, consent-based and never silent.")}</li><li>${T("الأحداث المسجلة إشارات للمراجعة وليست دليلًا تلقائيًا.","Logged events are review signals, not automatic proof.")}</li></ul>`,T("ما الاختبار المتاح؟","Which exam is available?"))
 if(S.load)return H(T("العبء الدراسي المسموح لك:","Your permitted course load:"),kv([[T("الحد الأقصى","Maximum"),mx+" "+T("ساعة","cr")],[T("المعتاد","Usual range"),"12 – 18"],[T("المسجل حاليًا","Registered now"),cr+" "+T("ساعة","cr")]]),T("ابني لي جدولا للفصل","Build my schedule"))
 const ALLW=/(^|\s)(كل|كلهم|كلها|جميع|all|everything)(\s|$)/.test(t),NW={"مادتين":2,"مادتان":2,"اتنين":2,"اثنين":2,"two":2,"تلات":3,"ثلاث":3,"ثلاثه":3,"three":3,"اربع":4,"اربعه":4,"four":4,"خمس":5,"خمسه":5,"five":5,"واحده":1,"واحدة":1,"one":1},dg=t.replace(/[٠-٩]/g,x=>"٠١٢٣٤٥٦٧٨٩".indexOf(x)).match(/(?:^|\s)(\d{1,2})(?=\s|$)/),N=dg?+dg[1]:(toks.map(w=>NW[w]).find(Boolean)||0);
 if(S.left)return H(T("المواد التي لم تسجّلها بعد:","Courses you have not registered yet:"),`<ul class="al">${courses.filter(x=>!me.reg.includes(x.id)).map(x=>`<li>${x.name} — ${eligibility(x)||T("متاحة للتسجيل","available")}</li>`).join("")}</ul>`,T("ابني لي جدولا للفصل","Build my schedule"));
 if(S.drop&&!c&&ALLW){if(!me.reg.length)return O(T("لا توجد مواد مسجلة لحذفها.","You have no registered courses to drop."));const all=[...me.reg];pending={fn:()=>{all.forEach(i=>drop(i));return T("تم حذف جميع موادك ("+all.length+").","All your courses ("+all.length+") have been dropped.")}};return O(T("هل تؤكد حذف جميع موادك المسجلة ("+all.map(i=>byId(i).name).join("، ")+")؟","Do you confirm dropping all registered courses ("+all.map(i=>byId(i).name).join(", ")+")?"))}
 if(S.register&&!c&&(ALLW||N)){const tgt=ALLW?99:N,pf=/(صباح|morning)/.test(t)?"am":/(مسائي|afternoon|evening)/.test(t)?"pm":ctx.pref,pool=[...av].sort((a,b)=>pf==="am"?hr(a)-hr(b):pf==="pm"?hr(b)-hr(a):0),ch=[],sk=[],used=me.reg.map(i=>byId(i).slot);let tot=cr;
  for(const x of pool){if(ch.length>=tgt)break;if(used.includes(x.slot)){sk.push([x.name,T("تعارض في الموعد","schedule conflict")]);continue}if(tot+x.cr>mx){sk.push([x.name,T("يتجاوز الحد الأقصى للعبء ("+mx+")","exceeds your load limit ("+mx+")")]);continue}ch.push(x);used.push(x.slot);tot+=x.cr}
  if(ALLW)courses.filter(x=>eligibility(x)&&!me.reg.includes(x.id)).forEach(x=>sk.push([x.name,eligibility(x)]));
  if(!ch.length)return O(T("لا أستطيع تسجيل مواد إضافية الآن: ","I can't register more courses right now: ")+(sk.slice(0,3).map(x=>x[0]+" ("+x[1]+")").join("، ")||T("لا توجد مواد متاحة.","no courses are available.")),SM);
  pending={fn:()=>{ch.forEach(x=>register(x.id));return T("تم تسجيلك في: "+ch.map(x=>x.name).join("، ")+". العبء الحالي "+tot+" ساعة"+(tot<12?" (أقل من الحد الأدنى المعتاد 12).":"."),"Registered: "+ch.map(x=>x.name).join(", ")+". Current load "+tot+" credits"+(tot<12?" (below the usual 12 minimum).":"."))}};
  return H(T((!ALLW&&ch.length<N?"المتاح بدون تعارض "+ch.length+" فقط من "+N+". ":"")+"سأسجّلك في:","I will register you in:"),`<ul class="al">${ch.map(x=>`<li>${x.name} — ${x.doc} — ${x.slot}</li>`).join("")}</ul>`+(sk.length?`<div class="mut" style="margin-top:6px">${T("تعذّر تسجيل: ","Not possible: ")+sk.map(x=>x[0]+" ("+x[1]+")").join("، ")}</div>`:"")+`<div class="mut" style="margin-top:6px">${T("هل تؤكد التسجيل؟","Do you confirm?")}</div>`)}
 const plc=CAMPUS.find(x=>x.k.some(k=>t.includes(k))),WHERE=S.loc||(toks.includes("where")&&toks.some(w=>["lecture","lectures","class","classes","room","building","course"].includes(w)));
 if(plc)return H(T(plc.n+":",plc.n+":"),kv([[T("المكان","Location"),plc.w],[T("المواعيد","Hours"),plc.h]]),T("ما جدولي؟","My schedule?"));
 if(WHERE&&S.exam)return O(T("الاختبارات الإلكترونية تُؤدّى عبر البوابة من تبويب «الكويز الآمن»، أما اختبارات القاعات فتُعلَن قاعتها قبل الموعد.","Online exams are taken in the portal under “Secure Quiz”; hall exams have their room announced before the date."),T("ما قواعد الاختبار الآمن؟","Secure exam rules?"));
 if(WHERE){const list=c?[c]:(/(دي|ده|هذه|هذا|this|that)/.test(t)&&ctx.course&&!/(المحاضرات|lectures|classes)/.test(t)?[ctx.course]:me.reg.map(byId));
  if(!list.length)return O(T("لم تسجّل أي مادة بعد، فلا توجد محاضرات لك. اذكر اسم مادة لأخبرك بمكانها.","You have no registered courses yet. Name a course and I will tell you where it meets."),...courses.slice(0,3).map(x=>T("فين قاعة "+x.name,"Where is "+x.name+" held?")));
  return H(T("أماكن المحاضرات:","Lecture locations:"),`<ul class="al">${list.map(x=>`<li><b>${x.name}</b> — ${T("قاعة","Room")} ${x.room} (${bld(x.room)}) — ${x.slot}</li>`).join("")}</ul>`,T("ما جدولي؟","My schedule?"))}
 if(S.cal)return H(T("التقويم الأكاديمي:","Academic calendar:"),kv(ACAL.map(x=>[T(x[0],x[1]),x[2]])),T("ما واجباتي؟","My assignments?"));
 if(S.contact){const o=OFFICE.find(x=>x.k.some(k=>t.includes(k.replace(/ى/g,"ي"))))||(c&&OFFICE.find(x=>x.d===c.doc))||null;
  if(!o)return O(T("اذكر اسم الدكتور أو المادة لأعطيك وسيلة التواصل.","Name the instructor or course and I will give you the contact details."),...OFFICE.map(x=>x.d));
  return H(o.d,kv([[T("البريد","Email"),o.d.replace(/^Dr\.\s*/,"").toLowerCase().replace(" ",".")+"@unismart.edu"],[T("المكتب","Office"),o.room],[T("الساعات المكتبية","Office hours"),o.slots.join("، ")]]),T("أريد حجز موعد إرشاد","Book an appointment"))}
 if(S.time&&!S.sched){const d=new Date();return O(T("اليوم ","Today is ")+d.toLocaleDateString(AR?LOC:"en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric"})+T("، والساعة "," — ")+d.toLocaleTimeString(AR?LOC:"en-GB",{hour:"2-digit",minute:"2-digit"})+".",T("ما التقويم الأكاديمي؟","Academic calendar?"))}
 if(S.drop){if(!c||!me.reg.includes(c.id))return O(T("لا أجد هذه المادة ضمن موادك المسجلة. أي مادة تريد حذفها؟","I can't find that course among your registered courses. Which one do you want to drop?"),...me.reg.map(i=>byId(i).name));
  pending={fn:()=>{drop(c.id);return T("تم حذف مادة "+c.name+".",c.name+" has been dropped.")}};return O(T("هل تؤكد حذف مادة "+c.name+"؟","Do you confirm dropping "+c.name+"?"))}
 if(S.mine&&!named&&!/(متاح|available|open|مفتوح)/.test(t)){return O(me.reg.length?T("موادك الحالية:\n","Your current courses:\n")+me.reg.map(i=>"• "+byId(i).name).join("\n"):T("لم تسجّل أي مادة بعد.","You have not registered for any course yet."),T("اقترح لي خطة","Suggest a plan"))}
 if(S.help&&!c)return O(T("للتسجيل: اكتب اسم المادة مع كلمة تسجيل، مثل «سجلني في Database»، وسأتحقق من الشروط وأطلب تأكيدك. ويمكنك أيضًا استخدام صفحة «تسجيل المواد».","To register, write the course name with a verb such as “register me in Database”. I will check the requirements and ask for your confirmation. You can also use the Course Registration page."),T("ما المواد المتاحة؟","Available courses?"));
 if(S.register&&(c||!S.avail)){if(!c)return O(T("أي مادة تود التسجيل فيها؟","Which course would you like to register for?"),...av.slice(0,3).map(x=>x.name));
  const e=eligibility(c);if(e)ctx.block={c,r:e};if(e)return O(T("لا يمكن تسجيلك في "+c.name+": "+e+".","You cannot register for "+c.name+": "+e+"."),T("ما المواد المتاحة؟","Available courses?"));
  pending={fn:()=>register(c.id).msg};return O(T("مادة "+c.name+" متاحة لك ولا يوجد تعارض في الجدول ("+c.slot+"). هل تؤكد التسجيل؟","“"+c.name+"” is available and has no schedule conflict ("+c.slot+"). Do you confirm the registration?"))}
 if(S.plan){const cr=me.reg.reduce((a,i)=>a+byId(i).cr,0);return O(T("ساعاتك المسجلة "+cr+" (المعتاد من 12 إلى 18).\n"+(av.length?"أرشّح لك:\n"+lst(av.slice(0,3))+"\nهل تودّ تسجيل إحداها؟":"لا توجد مواد متاحة حاليًا لعدم استيفاء الشروط."),"Registered credits: "+cr+" (usual range 12–18).\n"+(av.length?"I suggest:\n"+lst(av.slice(0,3))+"\nWould you like to register for one?":"No courses are currently available because requirements are not met.")),...av.slice(0,2).map(x=>T("سجلني في "+x.name,"Register me in "+x.name)))}
 if(S.doctor){if(c)return O(T("مادة "+c.name+" يدرّسها "+c.doc+" ("+c.slot+"، قاعة "+c.room+").","“"+c.name+"” is taught by "+c.doc+" ("+c.slot+", room "+c.room+")."),T("سجلني في "+c.name,"Register me in "+c.name));return O(T("المواد وأعضاء هيئة التدريس:\n","Courses and instructors:\n")+lst(courses),T("ما المواد المتاحة؟","Available courses?"))}
 if(S.avail||S.register)return O(av.length?T("المواد المتاحة لك للتسجيل ("+av.length+"):\n","Courses available for you ("+av.length+"):\n")+lst(av):T("لا توجد مواد متاحة للتسجيل حاليًا.","No courses are currently available."),T("اقترح لي خطة","Suggest a plan"));
 if(S.sched)return O(me.reg.length?T("جدولك:\n","Your schedule:\n")+me.reg.map(i=>{const x=byId(i);return"• "+x.name+": "+x.slot+" – "+x.room}).join("\n"):T("جدولك فارغ لأنك لم تسجّل مواد بعد.","Your schedule is empty because you have not registered for courses."),T("اقترح لي خطة","Suggest a plan"));
 if(S.gpa)return O(T("معدلك التراكمي GPA: ","Your GPA: ")+me.gpa+"\n"+me.grades.map(g=>"• "+g[0]+": "+g[1]).join("\n"),T("ما جدولي؟","My schedule?"));
 if(S.exam)return O(T("المتاح لك الآن: «"+quiz.title+"» ومدته "+quiz.mins+" دقائق، من تبويب «الكويز الآمن».","Available now: “"+quiz.title+"” ("+quiz.mins+" minutes), under the Secure Quiz tab."),T("ما جدولي؟","My schedule?"));
 if(S.policy){const k=kbAnswer(t,.4);if(k)return k}
 if(S.policy)return{t:T("لا أملك معلومات مؤكدة عن هذا الأمر حاليًا. يُرجى الرجوع إلى اللائحة الأكاديمية أو شؤون الطلاب.","I do not have confirmed information on this. Please refer to the academic regulations or Student Affairs."),s:[]};
 if(S.thanks)return{t:T("على الرحب والسعة. هل أستطيع مساعدتك في شيء آخر؟","You're welcome. Is there anything else I can help with?"),s:[T("اقترح لي خطة","Suggest a plan")]};
 if(S.greet&&!c)return{t:T("أهلًا بك. كيف يمكنني مساعدتك؟","Hello. How can I help you?"),s:[T("ما المواد المتاحة لي؟","Available courses?"),T("ما جدولي؟","My schedule?")]};
 if(c){const e=eligibility(c);return O(T(c.name+": يدرّسها "+c.doc+"، "+c.slot+" بقاعة "+c.room+"، "+c.cr+" ساعات. "+(me.reg.includes(c.id)?"أنت مسجل فيها.":e?"غير متاحة لك: "+e+".":"متاحة للتسجيل."),c.name+": taught by "+c.doc+", "+c.slot+", room "+c.room+", "+c.cr+" credits. "+(me.reg.includes(c.id)?"You are registered.":e?"Not available: "+e+".":"Available for registration.")),...(me.reg.includes(c.id)||e?[]:[T("سجلني في "+c.name,"Register me in "+c.name)]))}
 {const k=kbAnswer(t,.34);if(k)return k}
 return{t:T("عذرًا يا "+nm+"، لم أفهم قصدك تمامًا. هل يمكنك صياغته بطريقة أخرى؟ يمكنني مثلًا مراجعة وضعك، أو اقتراح جدول، أو شرح متطلبات مادة.","Sorry "+nm+", I did not quite get that. Could you rephrase? I can review your standing, propose a schedule or explain a course's prerequisites."),s:[SM,T("ما الذي يمكنك فعله؟","What can you do?"),T("ابني لي جدولا للفصل","Build my schedule")]}}
let chatLang=(()=>{try{return sessionStorage.getItem("us_chatlang")}catch(_){return null}})();
const CL_EN=/بالانجليز|بالإنجليز|انجليزي|إنجليزي|انجلش|in english|speak english|english please|answer in english/i,CL_AR=/بالعربي|in arabic|speak arabic/i;
const setChatLang=l=>{chatLang=l;try{l?sessionStorage.setItem("us_chatlang",l):sessionStorage.removeItem("us_chatlang")}catch(_){}};
const LOC=I18N.lang==="en"?"en-GB":"ar-EG";
const SRC_L={student_data:"بياناتك الأكاديمية",knowledge_base:"قاعدة المعرفة التعليمية",policy:"سياسة النزاهة الأكاديمية"};
function send(txt){txt=txt.trim();if(!txt||busy)return;if(CL_EN.test(txt))setChatLang("en");else if(CL_AR.test(txt))setChatLang("ar");chat.push({r:"u",t:txt,fresh:true,tm:nowTm()});turn++;
  const m={r:"b",t:"",live:true};chat.push(m);busy=true;render();
  const done=o=>{
   if(o.src&&!o.nopre&&Math.random()<.5&&!/^(تم|لا |Registered|Appointment|The operation|Cannot|You cannot|I )/.test(o.t)){const L=AR?["حسنًا، ","بكل سرور. ","بالطبع. "]:["Certainly. ","Of course. ","Sure. "];o.t=L[Math.floor(Math.random()*L.length)]+o.t}
   const w=o.t.split(/(\s+)/),st=Math.max(1,Math.ceil(w.length/40));let i=0;
   (function f(){i+=st;m.t=w.slice(0,i).join("");const e=$("#msgs .live");if(e){e.textContent=m.t;$("#msgs").scrollTop=1e9}
    if(i<w.length){setTimeout(f,30);return}
    m.t=o.t;m.h=o.h;m.tm=nowTm();m.tools=o.src?[1]:[];m.sugg=o.live?o.s:pending?(AR?["نعم، أكّد","لا، إلغاء"]:["Yes, confirm","No, cancel"]):o.s;m.live=false;busy=false;render()})()};
  const local=()=>{let o;
   if((CL_EN.test(txt)||CL_AR.test(txt))&&txt.length<32)return CL_EN.test(txt)?{t:"Sure, I'll answer in English from now on. Ask me anything about your courses, grades or schedule.",s:["Summary of my academic status","Which courses need work?"]}:{t:"حاضر، سأتحدث معك بالعربية من الآن.",s:["ملخص وضعي الأكاديمي"]};
   try{o=brain(txt,chatLang==="en"?false:chatLang==="ar"?true:undefined)}catch(e){o={t:"حدث خطأ أثناء تنفيذ العملية. حاول مرة أخرى.",s:[]}}return o};
  if(user.role==="student"||user.role==="doctor"){let fb=null;try{fb=fileBrain(txt)}catch(e){fb=null}if(fb){setTimeout(()=>done(fb),320);return}}
  if(UNI.on&&user.role==="student"&&!ctx.pr){            // الوضع الحي: المرشد يعمل على الخادم ببيانات الطالب الفعلية (بدون أي API خارجي)
   UNI.chat(txt,chatLang).then(r=>{if(r.lang)AR=r.lang!=="en";const src=(r.sources||[]).map(x=>SRC_L[x]).filter(Boolean);
     if(/^(تم التسجيل|تم حذف|Registered|Dropped)/.test(r.reply)){UNI.invalidate();liveRefresh()}
     done({t:r.reply,s:r.suggestions||[],live:true,h:src.length?`<span class="src">المصدر: ${src.join(" + ")}</span>`:""})})
    .catch(e=>done({t:(e&&e.message)||"المرشد غير متاح الآن. حاول بعد قليل.",s:[],live:true}))}
  else setTimeout(()=>done(local()),380+Math.min(420,txt.length*7))}

// ---------- الواجهات ----------
function viewChat(){const stu=user.role==="student",pct=Math.round(PROG.earned/PROG.total*100);
 const rows=chat.map(m=>`<div class="mr ${m.r}${m.fresh?" fresh":""}">${m.r==="b"?`<span class="av">${CRESTS}</span>`:""}<div class="m ${m.r}${m.live?" live":""}">${m.live&&!m.t?'<span class="typing"><i></i><i></i><i></i></span>':esc(m.t)+(m.h||"")+(m.tm?`<span class="tm">${m.tm}</span>`:"")}</div></div>${m.sugg&&m===chat[chat.length-1]&&!m.live?`<div class="sg">${m.sugg.map(x=>`<button class="chip" data-s="${esc(x)}">${esc(x)}</button>`).join("")}</div>`:""}`).join("");
 const FIC='<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></svg>',fstrip=(stu||user.role==="doctor")?`<div class="fstrip" id="fstrip"${MY.docs.length||MY.msg?"":" hidden"}>${MY.docs.map(d=>`<span class="fchip${d.on?"":" off"}"><button class="ftg" data-myf="tg:${d.id}" title="${d.on?"إيقاف استخدام الملف":"تفعيل الملف"}" aria-label="تفعيل أو إيقاف الملف" aria-pressed="${d.on}">${FIC}</button><span class="fn" title="${esc(d.name)}">${esc(d.name)}</span><small>${MYF.fmtSize(d.size)}</small><button class="frm" data-myf="rm:${d.id}" aria-label="حذف الملف" title="حذف الملف">×</button></span>`).join("")}<span class="fstat" id="fstat"${MY.msg?"":" hidden"}>${esc(MY.msg)}</span></div>`:"",attach=(stu||user.role==="doctor")&&typeof MYF!=="undefined"?`<button class="attach" data-myf="pick" aria-label="إرفاق ملف" title="إرفاق ملف (PDF، Word، شرائح، جداول، صور…)"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m21.4 11.6-9.2 9.2a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5"/></svg></button><input type="file" id="fup" multiple hidden accept="${MYF.ACCEPT}">`:"";
 const side=stu?`<aside class="cside"><div class="card"><h3>ملف الطالب</h3>${kv([["المعدل التراكمي",me.gpa],["التقدير العام",standing(me.gpa)],["الساعات المنجزة",PROG.earned+" / "+PROG.total],["عبء الفصل",regCr()+" ساعة"]])}${bar(pct)}${appts.length?`<div class="mut" style="margin-top:8px">موعد إرشاد: ${esc(appts[appts.length-1])}</div>`:""}</div>${typeof MYF!=="undefined"?`<div class="card"><h3>ملفاتي</h3><p class="mut" style="margin:0 0 10px">ارفع ملزمة أو شرائح أو جدولًا أو صورة، وأجاوبك من محتواها أو ألخّصها أو أختبرك منها.</p><button class="btn o" data-myf="pick" style="width:100%">إرفاق ملف</button><div class="mut" style="margin-top:8px;font-size:12.5px">PDF · Word · PowerPoint · Excel · CSV · نص · صور</div></div>`:""}<div class="card"><h3>خدمات المرشد</h3><div class="caps">${CAPS.map(c=>`<button class="cp" data-s="${esc(c[1])}">${c[0]}</button>`).join("")}</div></div></aside>`:"";
 return `<div class="advwrap"><div class="card chat"><div class="chead"><span class="av big">${CRESTS}</span><div style="margin-inline-end:auto"><b>المرشد الأكاديمي</b><div class="mut"><i class="dot"></i>متصل · يفهم اللهجات ويجاوب من ملفاتك</div></div><div class="cc"><span>مسح تلقائي عند المغادرة</span><button class="sw" data-ac aria-pressed="${autoClear}" aria-label="مسح تلقائي"></button><button class="btn o sm" id="clr">${clrArm?"تأكيد المسح":"مسح المحادثة"}</button></div></div>
 <div class="msgs" id="msgs" aria-live="polite">${rows}</div>${fstrip}
 <div class="composer">${attach}<textarea id="inp" rows="1" placeholder="${stu?"اكتب سؤالك بالعربية أو بلهجتك أو بالإنجليزية…":"اكتب أمرًا أو سؤالًا… مثال: زوّد مادة اسمها Cloud Computing"}" aria-label="رسالتك" autocomplete="off"></textarea><button class="send" id="go" aria-label="إرسال"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/></svg></button></div></div>${side}</div>`}
function viewCourses(){
 return `<h2>تسجيل المواد</h2><p class="mut">التحقق من الشروط يتم في طبقة الخادم: السعة، المتطلبات السابقة، التكرار، وتعارض الجدول.</p>`+
 courses.map(c=>{const e=eligibility(c),mine=me.reg.includes(c.id);
 return `<div class="card crs"><div><h3>${c.name} <span class="mut">${c.id}</span></h3>
 <div class="mut">${c.doc} · ${c.slot} · ${c.room} · ${c.cr} ساعات · ${c.enr}/${c.cap}${c.pre.length?" · يتطلب "+c.pre.join("، "):""}</div><div class="cap"><i style="width:${c.enr/c.cap*100}%"></i></div>
 ${!mine&&e?`<div class="bad" style="font-size:14px">${e}</div>`:""}</div>
 ${mine?`<button class="btn o" data-d="${c.id}">حذف المادة</button>`:`<button class="btn" data-r="${c.id}" ${e?"disabled":""}>تسجيل</button>`}</div>`}).join("")+
 `<div class="card"><h3>سجل العمليات (Audit Log)</h3>${audit.length?`<ul class="log">${audit.map(a=>`<li>${a}</li>`).join("")}</ul>`:`<div class="mut">لا توجد عمليات بعد.</div>`}</div>`}
function viewQuiz(){
 if(!Q||Q.state==="idle"){const need=secCfg.cam,ok=!!camStream;
  return `<div class="card"><h2>${quiz.title}</h2><p class="mut">${quiz.qs.length} أسئلة · ${quiz.mins} دقائق</p>
  <p>هذا اختبار في وضع آمن. أثناء الاختبار لا يمكنك التنقل إلى أي صفحة أخرى في النظام. يُفعَّل ملء الشاشة، ويُسجَّل الخروج منه أو من صفحة الاختبار ومحاولات النسخ واللصق والنقر الأيمن. المسموح ${quiz.maxV} مخالفة كتحذير، وبعدها يُسلَّم الاختبار تلقائيًا. الأحداث إشارات للمراجعة وليست دليلًا تلقائيًا على المخالفة.</p>
  <div class="camcard"><h3>الكاميرا ${need?"(إلزامية)":"(اختيارية)"}</h3><p class="mut">تُستخدم لمعاينة وجودك أثناء الاختبار فقط. لا يُسجَّل ولا يُخزَّن أي فيديو، ولا تعمل إلا بموافقتك.</p>
  <video id="camv" class="camv" autoplay muted playsinline ${ok?"":"hidden"}></video><div class="mut" id="camst">${esc(camMsg)}</div><details class="pv"><summary>تشخيص الكاميرا</summary><ul class="log">${camDiag().map(x=>`<li><b>${x[0]}:</b> ${esc(x[1])}</li>`).join("")}</ul></details>
  <button class="btn o" id="camtest" style="margin-top:8px">${ok?"إعادة اختبار الكاميرا":"تشغيل الكاميرا واختبارها"}</button>${procBlock()}</div>
  <button class="btn" id="start" ${need&&(!ok||(procSt==="ready"&&secCfg.proc&&(!getRef()||!examVerified)))?"disabled":""}>أوافق وأبدأ الاختبار</button>${need&&!ok?'<div class="bad" style="margin-top:6px">يجب تشغيل الكاميرا قبل البدء.</div>':""}</div>`}
 if(Q.state==="done")return `<div class="card"><h2>${Q.auto?"تم التسليم تلقائيًا":"تم تسليم الاختبار"}</h2>
 ${Q.term?`<p class="bad"><b>أُغلق الاختبار تلقائيًا:</b> ${Q.term}. أُحيلت الحالة للمراجعة من عضو هيئة التدريس.</p>`:""}<p>الدرجة: <b>${Q.score} / ${quiz.qs.length}</b> · المخالفات: ${Q.vio}</p>
 <h3>سجل الأحداث</h3><ul class="log">${Q.log.map(l=>`<li>${l}</li>`).join("")}</ul><button class="btn o" id="again" style="margin-top:12px">رجوع</button></div>`;
 const q=quiz.qs[Q.i];
 return `<div class="bar"><span>سؤال ${Q.i+1} / ${quiz.qs.length}</span><span id="tm">--:--</span></div>
 <div class="card" style="user-select:none"><h3>${q.q}</h3>${q.o.map((o,k)=>`<button class="opt" data-a="${k}" aria-pressed="${Q.ans[Q.i]===k}">${o}</button>`).join("")}
 <div class="row" style="justify-content:space-between"><button class="btn o" id="prev" ${Q.i?"":"disabled"}>السابق</button>
 ${Q.i<quiz.qs.length-1?`<button class="btn" id="next">التالي</button>`:`<button class="btn" id="fin">تسليم</button>`}</div></div>
 <div class="bar"><span>الحالة الأمنية: نشطة${Q.camOn?" · "+(Q.camLost?'الكاميرا مفقودة <button class="btn o sm" id="camre">إعادة التشغيل</button>':"الكاميرا نشطة"):""}${Q.fsOk?"":" · ملء الشاشة غير متاح"}${Q.proc?" · رصد الوجه: "+(Q.absentSince?"غير ظاهر":"نشط"):""}</span><span class="${Q.vio?"warn":""}">المخالفات: ${Q.vio} / ${quiz.maxV}</span></div>
 ${Q.camOn&&camStream?'<video id="camv" class="camtile" autoplay muted playsinline></video>':""}`}
const CAMPUS=[{k:["شؤون الطلاب","student affairs"],n:"شؤون الطلاب",w:"مبنى الإدارة، الدور الأول، قاعة 12",h:"الأحد–الخميس، 9 ص – 3 م"},{k:["مكتبه","مكتبة","library"],n:"المكتبة المركزية",w:"المبنى C، الدور الأرضي",h:"الأحد–الخميس، 8 ص – 8 م"},{k:["كافتيريا","cafeteria","مطعم"],n:"الكافتيريا",w:"ساحة الجامعة بجوار المبنى A",h:"8 ص – 6 م"},{k:["عياده","عيادة","clinic"],n:"العيادة الطبية",w:"المبنى B، الدور الأرضي",h:"9 ص – 4 م"},{k:["دعم فني","it support","واي فاي","wifi"],n:"الدعم الفني",w:"المبنى C، الدور الأول، مكتب 105",h:"9 ص – 4 م"},{k:["مواقف","parking"],n:"مواقف السيارات",w:"البوابة الرئيسية، يمين المدخل",h:"على مدار اليوم"}];
const ACAL=[["آخر موعد للتسجيل","Registration deadline","15 أكتوبر"],["الإضافة والحذف","Add/drop period","حتى 22 أكتوبر"],["الاختبارات النصفية","Midterm exams","من 12 نوفمبر"],["الاختبارات النهائية","Final exams","من 5 يناير"]];
const bld=r=>{const m=/^([A-Za-z]+)-(\d)/.exec(r);return/^lab/i.test(r)?"معمل الحاسب "+r.split("-")[1]:m?"مبنى "+m[1]+"، الدور "+["الأرضي","الأول","الثاني","الثالث","الرابع"][+m[2]]:"—"};
const PROG={name:"بكالوريوس علوم الحاسب",total:132,earned:45};
const OFFICE=[{d:"Dr. Ahmed Ali",k:["ahmed","احمد"],slots:["الأحد 12:00","الثلاثاء 11:00"],room:"مكتب 214"},{d:"Dr. Sara Mohamed",k:["sara","سارة","ساره"],slots:["الاثنين 14:00","الأربعاء 10:00"],room:"مكتب 305"},{d:"Dr. Karim Adel",k:["karim","كريم"],slots:["الأحد 14:00","الأربعاء 13:00"],room:"مكتب 120"},{d:"Dr. Laila Mostafa",k:["laila","ليلى"],slots:["الاثنين 11:00","الخميس 13:00"],room:"مكتب 118"},{d:"Dr. Omar Hassan",k:["omar","عمر"],slots:["الثلاثاء 14:00"],room:"مكتب 210"}];
let appts=[];
const GP={"A":4,"A-":3.7,"B+":3.3,"B":3,"B-":2.7,"C+":2.3,"C":2,"D":1,"F":0},CODES={CS101:"Intro to Programming",CS201:"Data Structures",CS301:"Operating Systems"};
const standing=g=>g>=3.5?"ممتاز":g>=3?"جيد جدًا":g>=2.5?"جيد":g>=2?"مقبول":"إنذار أكاديمي",maxLoad=g=>g>=3?18:g>=2?15:12;
const regCr=()=>me.reg.reduce((a,i)=>a+byId(i).cr,0),nowTm=()=>new Date().toLocaleTimeString(LOC,{hour:"2-digit",minute:"2-digit"});
const hr=x=>+x.slot.split(" ")[1].split(":")[0];
const kv=a=>`<div class="kv">${a.map(x=>`<span>${x[0]}</span><b>${x[1]}</b>`).join("")}</div>`,bar=p=>`<div class="cap" style="max-width:100%"><i style="width:${p}%"></i></div>`;
const CAPS=[["خطة مذاكرة لاختباري القادم","عندي امتحان Database وأنا ضعيف في SQL، أذاكر إزاي؟"],["المواد التي أحتاج لتحسينها","ما المواد التي أحتاج لتحسينها؟"],["نسبة حضوري","ما نسبة حضوري؟"],["اختبرني (تدريب)","اختبرني في SQL"],["اختباراتي القادمة","ما اختباراتي القادمة؟"],["ملخص وضعي الأكاديمي","ملخص وضعي الأكاديمي"],["ابنِ لي جدولًا للفصل","ابني لي جدولا للفصل"],["قواعد الاختبار الآمن","ما قواعد الاختبار الآمن؟"]];
const accounts={student:{id:"20240001",pw:"1234",name:"يوسف محمود",first:"يوسف",title:"طالب"},doctor:{id:"dr.ahmed",pw:"1234",name:"د. أحمد علي",first:"دكتور أحمد",title:"دكتور · علوم الحاسب"},admin:{id:"admin",pw:"1234",name:"إدارة الجامعة",first:"أستاذ",title:"مدير النظام"}};
let loginRole="student",regOpen=true;
const roleTabs={student:["home","courses","schedule","grades","attend","assign","quiz","chat","notif","settings"],doctor:["dhome","dquiz","chat","notif","settings"],admin:["ahome","astu","avis","kb","aaudit","chat","notif","settings"]};
const secCfg={tab:true,fs:true,copy:true,cam:false,proc:true};
const secEvents=[["سارة أحمد","TAB_HIDDEN","10:12"],["كريم علي","COPY_ATTEMPT","10:15"],["نور حسن","FULLSCREEN_EXIT","10:21"],["كريم علي","AUTO_SUBMITTED","10:26"]];
const roster=[["سارة أحمد","سلّمت Database ER"],["كريم علي","سلّم الكويز تلقائيًا"],["نور حسن","سلّمت الكويز"]];
const hw=[{t:"رسم ER Diagram",c:"DB301",due:"بعد يومين",done:false},{t:"مشروع صفحة ويب",c:"WEB301",due:"الخميس",done:false},{t:"تقرير عن الذكاء الاصطناعي",c:"AI401",due:"الأسبوع القادم",done:true}];
const statH=x=>`<div class="stat"><span class="mut">${x[0]}</span><b>${x[1]}</b></div>`;
const evRow=e=>`<div class="nw"><b>${e[0]} · ${e[1]}</b><span class="mut">${e[2]}</span></div>`;
function viewAssign(){return `<h2>الواجبات</h2>`+hw.map((h,i)=>`<div class="card crs"><div><h3>${h.t}</h3><div class="mut">${byId(h.c).name} · التسليم: ${h.due}</div></div>${h.done?'<span class="tag ok">تم التسليم</span>':`<button class="btn" data-hw="${i}">تسليم</button>`}</div>`).join("")}
function viewDHome(){const m=courses.filter(c=>c.doc==="Dr. Ahmed Ali");
 return `<section class="hero"><div><h2>مرحبًا ${user.name}</h2><p>لوحة الدكتور: موادك وطلابك وكويزاتك.</p></div></section>
 <div class="stats">${[["موادي",m.length,"📘"],["طلاب مسجلون",m.reduce((a,c)=>a+c.enr,0),"👥"],["كويزات نشطة",1,"📝"],["متوسط الدرجات","78%","📊"]].map(statH).join("")}</div>
 <div class="card"><h3>موادي</h3>${m.map(c=>`<div class="nw"><b>${c.name} · ${c.slot}</b><div class="cap" style="max-width:100%"><i style="width:${c.enr/c.cap*100}%"></i></div><span class="mut">${c.enr} من ${c.cap} طالب</span></div>`).join("")}</div>
 <div class="card"><h3>آخر التسليمات</h3>${roster.map(r=>`<div class="nw"><b>${r[0]}</b><span class="mut">${r[1]}</span></div>`).join("")}</div>`}
function viewDQuiz(){const row=(k,l)=>`<div class="tog"><span>${l}</span><button class="sw" data-cfg="${k}" aria-pressed="${secCfg[k]}" aria-label="${l}"></button></div>`;
 return `<h2>الكويزات والأمان</h2><div class="two"><div class="card"><h3>${quiz.title}</h3>${row("tab","اكتشاف الخروج من التبويب")}${row("fs","إلزام ملء الشاشة")}${row("copy","منع النسخ واللصق")}${row("cam","الكاميرا إلزامية (بموافقة الطالب)")}${row("proc","رصد الوجه: إغلاق الاختبار عند غياب الوجه 3 دقائق أو عدم تطابق الهوية")}<div class="tog"><span>المخالفات المسموحة</span><span><button class="btn o sm" data-mx="-1">−</button> <b>${quiz.maxV}</b> <button class="btn o sm" data-mx="1">+</button></span></div></div>
 <div class="card"><h3>أحداث الأمان</h3>${secEvents.map(evRow).join("")}<p class="mut">الأحداث إشارات للمراجعة وليست دليلًا تلقائيًا على الغش.</p></div></div>`}
function viewAHome(){return `<section class="hero"><div><h2>لوحة إدارة الجامعة</h2><p>إدارة المواد والتسجيل والأمان من مكان واحد.</p></div></section>
 <div class="stats">${[["المواد",courses.length,"📚"],["إجمالي التسجيلات",courses.reduce((a,c)=>a+c.enr,0),"👥"],["أحداث أمان",secEvents.length,"🛡️"],["التسجيل",regOpen?"مفتوح":"مغلق","🗓️"]].map(statH).join("")}</div>
 <div class="card"><div class="tog"><span><b>باب التسجيل مفتوح</b><br><span class="mut">يطبّق فورًا على كل الطلاب</span></span><button class="sw" id="regtog" aria-pressed="${regOpen}" aria-label="باب التسجيل"></button></div></div>
 <div class="card"><h3>سعة المواد</h3>${courses.map(c=>`<div class="tog"><span><b>${c.name}</b> <span class="mut">${c.enr}/${c.cap}</span></span><span><button class="btn o sm" data-cap="${c.id}:-5">−5</button> <button class="btn o sm" data-cap="${c.id}:5">+5</button></span></div>`).join("")}</div>`}
function viewAAudit(){return `<h2>سجل العمليات والأمان</h2><div class="two"><div class="card"><h3>Audit Log</h3><ul class="log">${audit.map(a=>`<li>${a}</li>`).join("")||"<li>لا عمليات بعد</li>"}</ul></div><div class="card"><h3>أحداث الأمان</h3>${secEvents.map(evRow).join("")}</div></div>`}
const news=[["فتح باب تسجيل الفصل الدراسي حتى 15 أكتوبر","اليوم"],["كويز قواعد البيانات متاح الآن في الوضع الآمن","أمس"],["تعديل قاعة مادة Web Development إلى Lab-2","منذ 3 أيام"]];
const days=["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس"];
function viewHomeOld(){const cr=me.reg.reduce((a,i)=>a+byId(i).cr,0),av=courses.filter(c=>!eligibility(c)).length;
 return `<section class="hero" id="hero"><div><h2>مرحبًا، ${user.name}</h2><p>بوابة الطالب: تابع موادك وجدولك واختباراتك من مكان واحد.</p><div class="row"><button class="btn gold" data-t="courses">تسجيل المواد</button><button class="btn ghost" data-t="chat">المرشد الأكاديمي</button></div></div></section>
 <div class="stats">${[["المعدل GPA",me.gpa,"📈"],["ساعات مسجلة",cr,"📚"],["مواد متاحة",av,"✅"],["كويز نشط",1,"📝"]].map(x=>`<div class="stat"><span class="mut">${x[0]}</span><b>${x[1]}</b></div>`).join("")}</div>
 <div class="two"><div class="card"><h3>محاضراتي</h3>${me.reg.length?me.reg.map(i=>{const c=byId(i);return`<div class="nw"><b>${c.name}</b><span class="mut">${c.slot} · ${c.room}</span></div>`}).join(""):'<p class="mut">لم تسجل أي مادة بعد. ابدأ بتسجيل موادك.</p>'}</div>
 <div class="card"><h3>آخر الإعلانات</h3>${news.map(n=>`<div class="nw"><b>${n[0]}</b><span class="mut">${n[1]}</span></div>`).join("")}</div></div>`}
function viewScheduleOld(){return `<h2>الجدول الأسبوعي</h2><p class="mut">يتحدث تلقائيًا عند تسجيل مادة أو حذفها.</p>`+days.map(d=>{const cs=me.reg.map(byId).filter(c=>c.slot.startsWith(d));return`<div class="day"><b>${d}</b>${cs.length?cs.map(c=>`<div class="cls"><b>${c.slot.split(" ")[1]} · ${c.name}</b><span class="mut">${c.room} · ${c.doc}</span></div>`).join(""):'<span class="mut">لا محاضرات</span>'}</div>`}).join("")}
function viewGradesOld(){const n={CS101:"مقدمة في البرمجة",CS201:"هياكل البيانات"};return `<h2>الدرجات</h2><div class="card gp"><div class="ring" style="--p:${me.gpa/4}"><b>${me.gpa}</b><span class="mut">GPA من 4.0</span></div><table>${me.grades.map(g=>`<tr><td>${g[0]}</td><td>${n[g[0]]}</td><td><span class="tag ok">${g[1]}</span></td></tr>`).join("")}</table></div>`}
function viewKB(){const tot=KB.docs.reduce((a,d)=>a+d.chunks.length,0),rows=KB.docs.reduce((a,d)=>a+d.chunks.filter(c=>c.t==="row").length,0),qa=KB.docs.reduce((a,d)=>a+d.chunks.filter(c=>c.t==="qa").length,0),
 lg=d=>{const x=d.chunks.slice(0,20).map(c=>c.text).join(" "),a=(x.match(/[\u0600-\u06ff]/g)||[]).length,e=(x.match(/[A-Za-z]/g)||[]).length;return a>e*1.5?"عربي":e>a*1.5?"إنجليزي":"مختلط"};
 return `<h2>قاعدة معرفة المرشد</h2><p class="mut">أضف نصًا أو ارفع ملف Word أو Excel أو CSV أو SQL، فيفهرسه المرشد فورًا ويجيب منه بالعربية حتى لو كان المحتوى إنجليزيًا. تُقرأ البيانات فقط ولا يُنفَّذ أي أمر SQL.</p>
 <div class="stats">${[["المصادر",KB.docs.length],["المقاطع المفهرسة",tot],["السجلات الجدولية",rows],["أسئلة وأجوبة",qa]].map(statH).join("")}</div>
 <div class="two"><div class="card"><h3>إضافة نص</h3><input type="text" id="kbtitle" placeholder="عنوان المصدر (مثال: سياسة الحضور)"><textarea id="kbtext" rows="6" placeholder="اكتب أو الصق المعلومات هنا. وللأسئلة والأجوبة اكتب: س: السؤال ثم سطر جديد ج: الجواب"></textarea><button class="btn" id="kbadd">إضافة وتدريب</button></div>
 <div class="card"><h3>رفع ملفات</h3><div id="kbdrop" class="drop"><b>اسحب الملفات هنا</b><div class="mut">Word · Excel · CSV · SQL · نص</div><br><input type="file" id="kbfile" multiple accept=".txt,.md,.csv,.docx,.xlsx,.sql"></div><div class="mut" id="kbmsg" style="margin-top:8px">${esc(kbMsg)}</div></div></div>
 <div class="card"><h3>المصادر المفهرسة</h3>${KB.docs.length?KB.docs.map(d=>`<div class="srcrow"><div class="tog"><span><b>${esc(d.name)}</b> <span class="mut">${lg(d)} · ${d.chunks.length} مقطعًا · ${d.added}</span></span><span><button class="sw" data-kbt="${d.id}" aria-pressed="${d.on}" aria-label="تفعيل المصدر"></button> <button class="btn o sm" data-kbd="${d.id}">حذف</button></span></div><details class="pv"><summary>معاينة كيف قرأ المرشد الملف</summary><ul class="log">${d.chunks.slice(0,5).map(c=>`<li>${esc(((c.title?c.title+" — ":"")+(c.t==="qa"?c.text+" ← "+c.ans:c.text)).slice(0,170))}</li>`).join("")}</ul></details></div>`).join(""):'<p class="mut">لا توجد مصادر بعد.</p>'}</div>
 <div class="card"><h3>قاموس المصطلحات (إنجليزي = عربي)</h3><p class="mut">يُستخدم لعرض محتوى الملفات الإنجليزية بالعربية وللبحث بين اللغتين. أضف سطرًا لكل مصطلح، مثل: <b>scholarship = منحة دراسية</b></p><textarea id="glos" rows="4">${esc(KB.gloss||"")}</textarea><button class="btn o" id="kbgl">حفظ القاموس</button></div>
 <div class="card"><h3>اختبار الإجابة</h3><div class="row"><input type="text" id="kbq" value="${esc(kbQ)}" placeholder="اكتب سؤالًا لاختبار ما تعلّمه المرشد"><button class="btn o" id="kbtest">اختبار</button></div>${kbOut}</div>`}
const tabs={home:["",viewHome],chat:["",viewChat],courses:["",viewCourses],schedule:["",viewSchedule],grades:["",viewGrades],attend:["",viewAttend],assign:["",viewAssign],quiz:["",viewQuiz],notif:["",viewNotif],settings:["",viewSettings],dhome:["",viewDHome],dquiz:["",viewDQuiz],ahome:["",viewAHome],astu:["",viewAStu],avis:["",viewAVis],kb:["",viewKB],aaudit:["",viewAAudit]};
/* ======== UniSmart design-system v2: shell, components, pages ======== */
const IC={dash:'<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',book:'<path d="M4 19V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19a2 2 0 0 1 2-2h13"/>',cal:'<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 10h18"/>',award:'<circle cx="12" cy="9" r="6"/><path d="M8.5 14 7 22l5-3 5 3-1.5-8"/>',check:'<circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3-7 7-7s7 3 7 7"/><path d="m16 11 2 2 4-4"/>',file:'<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',shield:'<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',spark:'<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 17l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/>',bell:'<path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10 21a2 2 0 0 0 4 0"/>',gear:'<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',users:'<circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3-7 7-7s7 3 7 7M17 4a4 4 0 0 1 0 8M22 21c0-3-2-5-4-6"/>',scan:'<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3"/><circle cx="12" cy="11" r="3"/><path d="M7 17c1-2 2.5-3 5-3s4 1 5 3"/>',db:'<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',log:'<path d="M4 6h16M4 12h16M4 18h10"/>',menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',search:'<circle cx="11" cy="11" r="7"/><path d="m21 21-4-4"/>',sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',moon:'<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',logout:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',edit:'<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',camera:'<path d="M3 8a2 2 0 0 1 2-2h2l2-2h6l2 2h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="12" cy="13" r="4"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',x:'<path d="M18 6 6 18M6 6l12 12"/>',help:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7M12 17h0"/>',alert:'<path d="M12 3 2 20h20z"/><path d="M12 10v5M12 18h0"/>',inbox:'<path d="M3 13h5l1 3h6l1-3h5"/><path d="M5 5h14l2 8v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6z"/>',trend:'<path d="M3 17 9 11l4 4 8-8M15 7h6v6"/>',collapse:'<path d="M15 6l-6 6 6 6"/>',lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'};
const ic=(n,z=20)=>`<svg class="ic" viewBox="0 0 24 24" width="${z}" height="${z}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n]||""}</svg>`;
const NAV={home:["لوحة التحكم","dash"],courses:["المواد والتسجيل","book"],schedule:["الجدول","cal"],grades:["الدرجات","award"],attend:["الحضور","check"],assign:["الواجبات","file"],quiz:["الاختبارات","shield"],chat:["المرشد الأكاديمي الذكي","spark"],notif:["الإشعارات","bell"],settings:["الإعدادات","gear"],dhome:["لوحة التحكم","dash"],dquiz:["الاختبارات","shield"],ahome:["لوحة التحكم","dash"],astu:["صور الطلاب","users"],avis:["نموذج الوجه","scan"],kb:["قاعدة المعرفة","db"],aaudit:["السجلات والأمان","log"]};
const ROLEL={student:"طالب",doctor:"عضو هيئة تدريس",admin:"الإدارة"},CATL={academic:"أكاديمي",exam:"اختبارات",assign:"واجبات",attend:"الحضور",system:"النظام",admin:"الإدارة"};
const lsGet=(k,d)=>{try{const v=localStorage.getItem(k);return v===null?d:JSON.parse(v)}catch(_){return d}},lsSet=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch(_){return false}};
let theme=lsGet("us_theme","system"),sideCol=lsGet("us_sc",false),sideOpen=false,pop=null,modal=null,schV="week",nf="all",srch="",skelUntil=0;
const dark=()=>document.documentElement.dataset.theme==="dark";
function setTheme(t){theme=t;lsSet("us_theme",t);document.documentElement.dataset.theme=t==="system"?(matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light"):t}
setTheme(theme);
const STU={dept:"علوم الحاسب",level:"المستوى الثالث",sem:"الفصل الأول 2026/2027",status:"منتظم"};
const addDays=o=>{const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()+o);return d},sameDay=(a,b)=>a.toDateString()===b.toDateString(),nextDate=di=>{const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()+((di-d.getDay()+7)%7));return d},daysLeft=d=>Math.round((d-addDays(0))/864e5);
const DAYS=["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس"],dayIdx=c=>DAYS.indexOf(c.slot.split(" ")[0]),tmOf=c=>c.slot.split(" ")[1],rel=o=>o<=0?"اليوم":o===1?"غدًا":"بعد "+o+" أيام";
const EXAMS=[{c:"DB301",kind:"اختبار نصفي",off:4,time:"10:00"},{c:"AI401",kind:"اختبار نصفي",off:9,time:"12:00"},{c:"SE302",kind:"اختبار نصفي",off:14,time:"09:00"}],HWD=[2,3,8];
const ATB={DB301:{p:12,a:1,l:1},AI401:{p:10,a:2,l:0},SE302:{p:13,a:0,l:1}};let ATTLOG=lsGet("us_att",[]);
const attOf=id=>{const x={...(ATB[id]||{p:9,a:1,l:0})};ATTLOG.filter(e=>e.c===id).forEach(e=>{if(e.s==="late")x.l++;else x.p++});return x};
const attAll=()=>{const t={p:0,a:0,l:0};me.reg.forEach(i=>{const x=attOf(i);t.p+=x.p;t.a+=x.a;t.l+=x.l});return{...t,pct:(t.p+t.l)/Math.max(1,t.p+t.a+t.l)}};
const PERF={DB301:{score:68,quiz:[6,5,7],asg:78,weak:["أساسيات SQL","التطبيع (Normalization)"]},AI401:{score:84,quiz:[9,8,9],asg:90,weak:[]},SE302:{score:76,quiz:[7,8,7],asg:82,weak:["UML ونمذجة النظم"]}};
const perfAvg=()=>{const k=me.reg.filter(i=>PERF[i]);return k.length?k.reduce((a,i)=>a+PERF[i].score,0)/k.length:0};
const NF={student:[{id:"s1",cat:"academic",t:"تم رصد درجة الكويز الأول في Database",time:"منذ ساعتين",prio:"normal"},{id:"s2",cat:"exam",t:"الاختبار النصفي في Database بعد 4 أيام",time:"اليوم",prio:"high"},{id:"s3",cat:"assign",t:"تبقّى يومان على تسليم واجب ER Diagram",time:"اليوم",prio:"high"},{id:"s4",cat:"attend",t:"نسبة غيابك في الذكاء الاصطناعي تقترب من الحد المسموح",time:"أمس",prio:"normal"},{id:"s5",cat:"system",t:"تم تحديث نموذج التعرف على الوجه",time:"منذ 3 أيام",prio:"low"},{id:"s6",cat:"admin",t:"فتح باب تسجيل الفصل حتى 15 أكتوبر",time:"منذ 3 أيام",prio:"normal"}],doctor:[{id:"d1",cat:"exam",t:"حان موعد مراجعة أحداث أمان كويز Database",time:"اليوم",prio:"high"},{id:"d2",cat:"academic",t:"3 طلاب سلّموا الواجب الأخير",time:"أمس",prio:"normal"}],admin:[{id:"a1",cat:"system",t:"تم تدريب نموذج الوجه بنجاح",time:"اليوم",prio:"normal"},{id:"a2",cat:"admin",t:"طلب جديد: تغيير صورة طالب (سيظهر هنا)",time:"أمس",prio:"low"}]};
const nRead=()=>new Set(lsGet("us_nread",[])),nAll=()=>[...lsGet("us_nx",[]).filter(n=>n.role===user.role),...(UNI.on?[]:NF[user.role])],unread=()=>{const r=nRead();return nAll().filter(n=>!r.has(n.id)).length};
const markRead=id=>{const r=nRead();r.add(id);lsSet("us_nread",[...r]);if(UNI.on&&/^sv\d+$/.test(id)){UNI.call("POST","/api/notifications/"+id.slice(2)+"/read");UNI.invalidate()}},markAllRead=()=>{lsSet("us_nread",nAll().map(n=>n.id));if(UNI.on){UNI.call("POST","/api/notifications/read-all");UNI.invalidate()}};
function pushNotif(role,t,cat="system",prio="normal"){const x=lsGet("us_nx",[]);x.unshift({role,id:"x"+Date.now(),cat,t,time:"الآن",prio});lsSet("us_nx",x.slice(0,30))}
const getProf=()=>lsGet("us_prof_"+user.id,{});
const initials=n=>n.replace(/^(د\.|Dr\.)\s*/,"").split(/\s+/).slice(0,2).map(w=>w[0]).join("");
const avatar=(z=36,c="")=>{const ph=user.role==="student"?getPhoto():null;return`<span class="avt2 ${c}" style="--z:${z}px">${ph?`<img src="${ph.img}" alt="">`:`<i>${esc(initials(user.name))}</i>`}<b class="act"></b></span>`};
const badge=(t,k="")=>`<span class="bdg ${k}">${t}</span>`,empty=(i,t,m)=>`<div class="empty">${ic(i,32)}<b>${t}</b><span>${m}</span></div>`;
const errBox=(t,m)=>`<div class="errbox" role="alert">${ic("alert",22)}<div><b>${t}</b><div class="mut">${m}</div></div></div>`;
const skeleton=()=>`<div class="dg">${[8,4,4,8].map(n=>`<div class="card sk s${n}"><i></i><i></i><i></i></div>`).join("")}</div>`;
const ring=(p,l,z=96)=>`<div class="rg" style="--p:${Math.min(1,p)};--s:${z}px"><b>${Math.round(p*100)}%</b><span>${l}</span></div>`;
function drawChrome(){if(!user)return;const un=unread(),L=roleTabs[user.role]||[];$(".shell").classList.toggle("col",sideCol);$(".shell").classList.toggle("open",sideOpen);
 $("#side").innerHTML=`<div class="brandrow logo"><span class="mk">${CRESTS}</span><span class="bn">UniSmart<small>University Digital Platform</small></span></div><nav id="nav" aria-label="التنقل الرئيسي">${L.map(k=>`<button class="ni${k===tab?" on":""}" data-t="${k}" aria-current="${k===tab?"page":"false"}" title="${NAV[k][0]}">${ic(NAV[k][1])}<span>${NAV[k][0]}</span>${k==="notif"&&un?`<i class="nb">${un}</i>`:""}</button>`).join("")}</nav><button class="ni sidefoot" data-a="collapse" aria-label="طي القائمة">${ic("collapse")}<span>طي القائمة</span></button>`;
 $("#top").innerHTML=`<button class="ibtn menu" data-a="menu" aria-label="فتح القائمة">${ic("menu")}</button><div class="search" role="search">${ic("search",18)}<label class="sr" for="gs">بحث</label><input id="gs" type="search" placeholder="ابحث عن صفحة أو مادة…" autocomplete="off" value="${esc(srch)}"><div id="sres"></div></div><span class="sp"></span><button class="ibtn lng" data-lang="${I18N.lang==='ar'?'en':'ar'}" aria-label="${I18N.lang==='ar'?'English':'العربية'}" title="${I18N.lang==='ar'?'English':'العربية'}" data-notr>${I18N.lang==='ar'?'EN':'ع'}</button><button class="ibtn" data-a="theme" aria-label="تبديل المظهر">${ic(dark()?"sun":"moon")}</button><button class="ibtn" data-a="pop:notif" aria-label="الإشعارات (${un} غير مقروء)" aria-haspopup="true">${ic("bell")}${un?`<i class="nb">${un}</i>`:""}</button><button id="avbtn" class="uchip" data-a="pop:profile" aria-haspopup="true" aria-label="الملف الشخصي">${avatar(34)}<span class="un"><b>${esc(user.name)}</b><small>${ROLEL[user.role]}</small></span></button>`;
 $("#pop").innerHTML=popHTML();$("#modal").innerHTML=modalHTML();if(modal)initModal()}
function popHTML(){if(!pop)return"";
 if(pop==="notif"){const r=nRead(),L=nAll().slice(0,5);return`<div class="pop" role="dialog" aria-label="الإشعارات"><div class="ph"><b>الإشعارات</b><button class="lnk" data-a="readall">تحديد الكل كمقروء</button></div>${L.length?L.map(n=>`<button class="ni2${r.has(n.id)?"":" un"}" data-a="read" data-id="${n.id}"><i class="nd"></i><span><b>${esc(n.t)}</b><small>${CATL[n.cat]} · ${n.time}</small></span></button>`).join(""):empty("inbox","لا توجد إشعارات","ستظهر هنا التنبيهات الجديدة")}<button class="lnk full" data-t="notif">عرض كل الإشعارات</button></div>`}
 return`<div class="pop" role="menu" aria-label="الملف الشخصي"><div class="ph row2">${avatar(46)}<span><b>${esc(user.name)}</b><small>${user.role==="student"?"الرقم الجامعي "+user.id:esc(user.title)}</small></span></div>${user.role==="student"?kv([["القسم",STU.dept],["المستوى",STU.level],["المعدل",me.gpa]]):""}<button class="pi" data-a="modal" data-m="edit">${ic("edit",16)}<span>تعديل الملف الشخصي</span></button><button class="pi" data-t="settings">${ic("gear",16)}<span>الإعدادات</span></button><button class="pi" id="tour">${ic("help",16)}<span>جولة تعريفية</span></button><button class="pi dn" id="logout">${ic("logout",16)}<span>تسجيل الخروج</span></button></div>`}
function modalHTML(){if(!modal)return"";const m=MODALS[modal.k]();return`<div class="ov"><div class="modal" role="dialog" aria-modal="true" aria-label="${m.t}"><div class="mh"><h3>${m.t}</h3><button class="ibtn" data-a="mclose" aria-label="إغلاق">${ic("x")}</button></div><div class="mb">${m.b}</div></div></div>`}
function closeModal(){let ver=false;if(modal&&modal.k==="face"){ver=!!(FV&&FV.state==="verified");const keep=FV&&FV.mode==="exam";FV=null;clearTimeout(fvT);if(!(Q&&Q.state==="run")&&!keep)stopCam()}modal=null;CR=null;drawChrome();if(ver)render()}
const camKeep=()=>tab==="quiz"&&secCfg.cam;
function render(){document.body.classList.toggle("anon",!user);
 if(!user){if(PAGE&&PAGE!=="login"){location.replace("login.html");return}$("#app").innerHTML=viewLogin();return}
 if(PAGE==="login"){location.replace(roleTabs[user.role][0]+".html");return}
 if(PAGE)tab=PAGE;if(!roleTabs[user.role].includes(tab))tab=roleTabs[user.role][0];
 drawChrome();$("#app").innerHTML=tabs[tab][1]();chat.forEach(x=>x.fresh=false);
 $("#guide").classList.toggle("onchat",tab==="chat");document.body.classList.toggle("examing",!!(Q&&Q.state==="run"));
 {const v=$("#camv");if(v&&camStream&&v.srcObject!==camStream)v.srcObject=camStream}
 {const ap=$("#app");if(lastTab!==tab){ap.classList.remove("pg");void ap.offsetWidth;ap.classList.add("pg");lastTab=tab}}save();
 if(tab==="chat"&&PAGE){const q=sessionStorage.getItem("us_ask");if(q){sessionStorage.removeItem("us_ask");setTimeout(()=>send(q),350)}}
 const m=$("#msgs");if(m)m.scrollTop=m.scrollHeight;if(tab==="quiz"&&Q&&Q.state==="run")tick()}
function ask(q){if(PAGE){sessionStorage.setItem("us_ask",q);save();location.href="chat.html"}else{tab="chat";render();send(q)}}
/* ---- pages ---- */
function upcoming(){const L=[];me.reg.forEach(i=>{const c=byId(i);L.push({k:"lec",t:c.name,s:c.room+" · "+tmOf(c),d:nextDate(Math.max(0,dayIdx(c)))})});EXAMS.filter(e=>me.reg.includes(e.c)).forEach(e=>L.push({k:"exam",t:byId(e.c).name+" — "+e.kind,s:e.time,d:addDays(e.off)}));hw.forEach((h,i)=>{if(!h.done)L.push({k:"asg",t:h.t,s:byId(h.c).name,d:addDays(HWD[i])})});L.push({k:"quiz",t:quiz.title,s:quiz.mins+" دقائق",d:addDays(1)});return L.sort((a,b)=>a.d-b.d)}
const KL={lec:["محاضرة","info","cal"],exam:["اختبار","bad","shield"],asg:["واجب","warn","file"],quiz:["كويز","ac","check"]};
function activity(){const L=[];ATTLOG.slice(-3).reverse().forEach(e=>L.push({i:"check",t:"تسجيل حضور بالوجه في "+byId(e.c).name+(e.s==="late"?" (متأخر)":""),w:"الآن"}));Object.entries(PERF).filter(([k])=>me.reg.includes(k)).forEach(([k,p])=>L.push({i:"award",t:"درجة آخر كويز في "+byId(k).name+": "+p.quiz[p.quiz.length-1]+"/10",w:"منذ يومين"}));hw.filter(h=>h.done).forEach(h=>L.push({i:"file",t:"تم تسليم الواجب: "+h.t,w:"الأسبوع الماضي"}));nAll().slice(0,2).forEach(n=>L.push({i:"bell",t:n.t,w:n.time}));audit.slice(0,2).forEach(a=>L.push({i:"log",t:"نشاط النظام: "+a.replace(/^\S+\s+/,""),w:"مؤخرًا"}));return L}
function viewHome(){if(Date.now()<skelUntil)return skeleton();const g=new Date().getHours()<12?"صباح الخير":"مساء الخير",at=attAll(),up=upcoming().slice(0,6),act=activity().slice(0,6),done=Math.round(PROG.earned/3),pf=perfAvg(),lo=me.reg.filter(i=>PERF[i]).sort((a,b)=>PERF[a].score-PERF[b].score)[0],tl=me.reg.filter(i=>dayIdx(byId(i))===new Date().getDay()).length;
 return`<section class="welcome" id="hero"><div class="idc">${avatar(96,"lg")}<div class="idi"><small>${g}</small><h2>${esc(user.first)}</h2><p>${tl?"لديك "+tl+" محاضرات اليوم":"لا توجد محاضرات اليوم"}، وأقرب اختبار ${rel(Math.min(...EXAMS.map(e=>e.off)))}.</p><div class="chips2">${badge("الرقم الجامعي "+user.id)}${badge(STU.dept)}${badge(STU.level)}${badge("GPA "+me.gpa)}${badge(STU.sem)}</div></div><div class="idact"><button class="btn" data-a="fv:attendance">${ic("scan",16)} تسجيل الحضور بالوجه</button><button class="btn o" data-t="chat">${ic("spark",16)} اسأل المرشد الذكي</button><button class="btn o" data-a="modal" data-m="edit">${ic("edit",16)} تعديل الملف</button></div></div></section>
 <div class="dg"><div class="card s8"><div class="ch"><h3>النظرة الأكاديمية</h3>${badge(STU.status,"ok")}</div><div class="mini"><div><b>${me.gpa}</b><span>المعدل التراكمي</span></div><div><b>${PROG.n||44}</b><span>إجمالي مواد البرنامج</span></div><div><b>${done}</b><span>مواد مكتملة</span></div><div><b>${me.reg.length}</b><span>مواد الفصل الحالي</span></div></div><div class="pbar" role="progressbar" aria-valuenow="${Math.round(PROG.earned/PROG.total*100)}" aria-valuemin="0" aria-valuemax="100"><i style="width:${PROG.earned/PROG.total*100}%"></i></div><small class="mut">التقدم الأكاديمي: ${PROG.earned} من ${PROG.total} ساعة معتمدة</small></div>
 <div class="card s4"><div class="ch"><h3>الحضور</h3><button class="lnk" data-t="attend">التفاصيل</button></div><div class="attrow">${ring(at.pct,"حضور")}<div class="attn"><span><i style="background:#22c55e"></i>حاضر ${at.p}</span><span><i style="background:#ef4444"></i>غائب ${at.a}</span><span><i style="background:#f59e0b"></i>متأخر ${at.l}</span></div></div></div>
 <div class="card s8"><div class="ch"><h3>القادم</h3>${badge(up.length+" عناصر","ac")}</div>${up.length?`<div class="ul2">${up.map(x=>`<div class="it"><span class="ib">${ic(KL[x.k][2],18)}</span><span class="tx"><b>${esc(x.t)}</b><small>${esc(x.s)}</small></span>${badge(KL[x.k][0],KL[x.k][1])}<small class="mut">${rel(daysLeft(x.d))}</small></div>`).join("")}</div>`:empty("check","لا توجد عناصر قادمة","ستظهر هنا المحاضرات والاختبارات والواجبات")}</div>
 <div class="card s4 insight"><div class="ch"><h3>توصية المرشد الذكي</h3>${ic("spark",18)}</div>${lo?`<p>أنت تحتاج لتحسين <b>${byId(lo).name}</b>: درجتك ${PERF[lo].score}% ${PERF[lo].score<pf?"أقل من متوسطك ("+Math.round(pf)+"%)":"جيدة"}${PERF[lo].weak.length?"، ونقاط الضعف: "+PERF[lo].weak.join("، "):""}.</p><div class="row"><button class="btn" data-a="ask" data-q="عندي امتحان ${byId(lo).name} وأنا ضعيف، أذاكر إزاي؟">ضع لي خطة مذاكرة</button><button class="btn o" data-a="ask" data-q="اختبرني في ${PERF[lo].weak[0]||byId(lo).name}">تدريب سريع</button></div>`:empty("spark","لا توجد توصيات","سجّل موادك ليحلّل المرشد أداءك")}</div>
 <div class="card s12"><div class="ch"><h3>النشاط الأخير</h3></div>${act.length?`<div class="ul2">${act.map(x=>`<div class="it"><span class="ib">${ic(x.i,18)}</span><span class="tx"><b>${esc(x.t)}</b></span><small class="mut">${x.w}</small></div>`).join("")}</div>`:empty("inbox","لا يوجد نشاط بعد","ستظهر هنا آخر أنشطتك")}</div>
</div>`}
function lstat(c){const n=new Date(),w=dayIdx(c);if(w!==n.getDay())return["قادمة","info"];const[h,m]=tmOf(c).split(":").map(Number),st=h*60+m,nw=n.getHours()*60+n.getMinutes();return nw<st?["قادمة","info"]:nw<st+90?["جارية","ok"]:["انتهت",""]}
const lec=c=>{const s=lstat(c);return`<div class="lec"><span class="lt">${tmOf(c)}</span><span class="lb"><b>${esc(c.name)}</b><small>${esc(c.doc)} · القاعة ${c.room}</small></span>${s[1]?badge(s[0],s[1]):badge(s[0])}</div>`};
function viewSchedule(){const L=me.reg.map(byId).sort((a,b)=>dayIdx(a)-dayIdx(b)||tmOf(a).localeCompare(tmOf(b))),td=new Date().getDay();
 const tg=`<div class="seg" role="group" aria-label="عرض الجدول">${[["today","اليوم"],["week","الأسبوع"],["month","الشهر"]].map(x=>`<button data-a="sv" data-v="${x[0]}" aria-pressed="${schV===x[0]}">${x[1]}</button>`).join("")}</div>`;let b;
 if(!L.length)b=empty("cal","لا توجد محاضرات","سجّل موادك لتظهر في جدولك");
 else if(schV==="today"){const t=L.filter(c=>dayIdx(c)===td);b=t.length?t.map(lec).join(""):empty("cal","لا محاضرات اليوم","استمتع بيومك أو راجع واجباتك القادمة")}
 else if(schV==="week")b=`<div class="wk">${DAYS.map((d,i)=>`<div class="card day${i===td?" now":""}"><b>${d}</b>${L.filter(c=>dayIdx(c)===i).map(lec).join("")||'<span class="mut">لا محاضرات</span>'}</div>`).join("")}</div>`;
 else{const n=new Date(),y=n.getFullYear(),m=n.getMonth(),off=new Date(y,m,1).getDay(),last=new Date(y,m+1,0).getDate(),cells=[...Array(off).fill(0),...Array.from({length:last},(_,i)=>i+1)];
  b=`<div class="cal"><div class="calh">${n.toLocaleDateString(LOC,{month:"long",year:"numeric"})}</div><div class="calg">${["أحد","اثنين","ثلاثاء","أربعاء","خميس","جمعة","سبت"].map(x=>`<b>${x}</b>`).join("")}${cells.map(d=>{if(!d)return"<i></i>";const dt=new Date(y,m,d),w=dt.getDay(),ls=w<=4?L.filter(c=>dayIdx(c)===w).length:0,ex=EXAMS.filter(e=>me.reg.includes(e.c)&&sameDay(addDays(e.off),dt));return`<div class="cd${d===n.getDate()?" today":""}${w>4?" wk":""}"><span>${d}</span>${ls?`<em>${ls} محاضرات</em>`:""}${ex.map(e=>`<u>اختبار ${byId(e.c).name.split(" ")[0]}</u>`).join("")}</div>`}).join("")}</div></div>`}
 return`<div class="ch"><div><h2>الجدول</h2><p class="mut">${new Date().toLocaleDateString(LOC,{weekday:"long",day:"numeric",month:"long"})}</p></div>${tg}</div><div class="day-wrap">${b}</div>`}
function viewGrades(){const rows=me.reg.filter(i=>PERF[i]);return`<h2>الدرجات</h2><div class="dg"><div class="card s5"><div class="gp">${ring(me.gpa/4,"GPA من 4",120)}<div><b>المعدل التراكمي ${me.gpa}</b><div class="mut">${STU.status}</div></div></div></div><div class="card s7"><h3>المواد المنجزة</h3><table>${me.grades.map(g=>`<tr><td>${g[0]}</td><td>${{CS101:"مقدمة في البرمجة",CS201:"هياكل البيانات"}[g[0]]||""}</td><td>${badge(g[1],"ok")}</td></tr>`).join("")}</table></div></div>
 <div class="card"><div class="ch"><h3>الأداء في مواد الفصل الحالي</h3></div>${rows.length?rows.map(i=>{const p=PERF[i];return`<div class="it"><span class="tx"><b>${byId(i).name}</b><small>كويزات ${p.quiz.join(" · ")} / 10 — واجبات ${p.asg}%</small><div class="pbar"><i style="width:${p.score}%"></i></div></span>${badge(p.score+"%",p.score<perfAvg()-3?"warn":"ok")}</div>`}).join(""):empty("award","لا توجد درجات بعد","ستظهر درجاتك فور رصدها")}</div>`}
function viewAttend(){const at=attAll(),td=new Date().getDay(),tl=me.reg.map(byId).filter(c=>dayIdx(c)===td);
 return`<h2>الحضور</h2><div class="dg"><div class="card s4"><div class="attrow">${ring(at.pct,"إجمالي",110)}<div class="attn"><span><i style="background:#22c55e"></i>حاضر ${at.p}</span><span><i style="background:#ef4444"></i>غائب ${at.a}</span><span><i style="background:#f59e0b"></i>متأخر ${at.l}</span></div></div>${at.pct<.8?`<p class="bad" style="margin-top:12px">نسبة حضورك أقل من 80%. حد الحرمان 75%.</p>`:""}</div>
 <div class="card s8"><div class="ch"><h3>تسجيل الحضور بالوجه</h3>${badge("تحقق حيوية + مطابقة هوية","ac")}</div><p class="mut">يتحقق النظام من وجودك الفعلي (رمش وحركة رأس) ثم يطابق وجهك بصورتك المسجّلة قبل تسجيل الحضور.</p>${tl.length?tl.map(c=>`<div class="lec"><span class="lt">${tmOf(c)}</span><span class="lb"><b>${c.name}</b><small>القاعة ${c.room}</small></span><button class="btn sm" data-a="fv:attendance" data-c="${c.id}">تسجيل الحضور</button></div>`).join(""):`<button class="btn" data-a="fv:attendance">تسجيل الحضور لمادة</button>`}</div></div>
 <div class="card"><h3>تفاصيل المواد</h3>${me.reg.length?`<table>${me.reg.map(i=>{const x=attOf(i),t=x.p+x.a+x.l,pc=(x.p+x.l)/t;return`<tr><td><b>${byId(i).name}</b></td><td>${x.p} حاضر</td><td>${x.a} غائب</td><td>${x.l} متأخر</td><td style="min-width:120px"><div class="pbar"><i style="width:${pc*100}%"></i></div></td><td>${badge(Math.round(pc*100)+"%",pc<.8?"warn":"ok")}</td></tr>`}).join("")}</table>`:empty("check","لا توجد مواد","سجّل موادك لتظهر نسب الحضور")}</div>`}
function viewNotif(){const r=nRead(),all=nAll(),L=all.filter(n=>nf==="all"||(nf==="unread"?!r.has(n.id):n.cat===nf));
 return`<div class="ch"><div><h2>الإشعارات</h2><p class="mut">${unread()} غير مقروء</p></div><button class="btn o" data-a="readall">تحديد الكل كمقروء</button></div><div class="fil">${[["all","الكل"],["unread","غير المقروء"],...Object.entries(CATL)].map(x=>`<button class="chip${nf===x[0]?" on":""}" data-a="nf" data-v="${x[0]}" aria-pressed="${nf===x[0]}">${x[1]}</button>`).join("")}</div>
 <div class="card" style="padding:0">${L.length?L.map(n=>`<div class="nf${r.has(n.id)?"":" un"}"><span class="ib it" style="padding:0">${ic(n.cat==="exam"?"shield":n.cat==="assign"?"file":n.cat==="attend"?"check":n.cat==="academic"?"award":"bell",18)}</span><span class="tx"><b>${esc(n.t)}</b><div><small>${CATL[n.cat]} · ${n.time}</small> ${n.prio==="high"?badge("عاجل","bad"):""}</div></span>${r.has(n.id)?"":`<button class="btn o sm" data-a="read" data-id="${n.id}">تحديد كمقروء</button>`}</div>`).join(""):empty("inbox","لا توجد إشعارات","لا شيء في هذا التصنيف")}</div>`}
function viewSettings(){const pr=lsGet("us_prefs",{exam:true,assign:true,attend:true,system:false});
 return`<h2>الإعدادات</h2><div class="dg"><div class="card s6"><h3>المظهر</h3><p class="mut">اختر شكل النظام المناسب لعينيك.</p><div class="seg" role="group" aria-label="المظهر">${[["light","فاتح"],["dark","داكن"],["system","تلقائي"]].map(x=>`<button data-a="themeset" data-v="${x[0]}" aria-pressed="${theme===x[0]}">${x[1]}</button>`).join("")}</div><h3 style="margin-top:18px">اللغة</h3><div class="seg" role="group" aria-label="اللغة" data-notr>${[["ar","العربية"],["en","English"]].map(x=>`<button data-lang="${x[0]}" aria-pressed="${I18N.lang===x[0]}">${x[1]}</button>`).join("")}</div><div class="tog"><span>طي القائمة الجانبية (أيقونات فقط)</span><button class="sw" data-a="collapse" aria-pressed="${sideCol}" aria-label="طي القائمة"></button></div></div>
 <div class="card s6"><h3>التنبيهات</h3>${[["exam","تنبيهات الاختبارات"],["assign","تنبيهات الواجبات"],["attend","تنبيهات الحضور"],["system","إشعارات النظام"]].map(x=>`<div class="tog"><span>${x[1]}</span><button class="sw" data-a="pref" data-v="${x[0]}" aria-pressed="${!!pr[x[0]]}" aria-label="${x[1]}"></button></div>`).join("")}</div>
 <div class="card s12"><h3>الخصوصية وبيانات الوجه</h3><p class="mut">تُحفظ بصمة رقمية (أرقام) لوجهك للتحقق من الهوية، وتُعالَج الصور داخل جهازك. لا يمكنك تغيير الصورة المسجّلة بنفسك حفاظًا على الأمان؛ يمكنك فقط طلب التغيير من الإدارة.</p>${user.role==="student"?`<button class="btn o" data-a="reqphoto">${ic("lock",16)} طلب تغيير الصورة من الإدارة</button>`:""}</div></div>`}
document.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;const d=b.dataset;
 if(Q&&Q.state==="run"&&(d.t||["logout","tour","gbot","gact","gnext","gprev","gskip"].includes(b.id))){toast("لا يمكن مغادرة الاختبار قبل تسليمه");return}
 if(d.a){const a=d.a;if(Q&&Q.state==="run"){toast("لا يمكن تنفيذ هذا الإجراء أثناء الاختبار");return}
  if(a==="collapse"){sideCol=!sideCol;lsSet("us_sc",sideCol);drawChrome();if(tab==="settings")render()}
  else if(a==="menu"){sideOpen=!sideOpen;drawChrome()}
  else if(a==="theme"){setTheme(dark()?"light":"dark");drawChrome()}
  else if(a==="themeset"){setTheme(d.v);render()}
  else if(a.startsWith("pop:")){const k=a.slice(4);pop=pop===k?null:k;drawChrome()}
  else if(a==="readall"){markAllRead();render()}
  else if(a==="read"){markRead(d.id);render()}
  else if(a==="nf"){nf=d.v;render()}
  else if(a==="sv"){schV=d.v;render()}
  else if(a==="pref"){const p=lsGet("us_prefs",{exam:true,assign:true,attend:true,system:false});p[d.v]=!p[d.v];lsSet("us_prefs",p);render()}
  else if(a==="ask"){pop=null;ask(d.q)}
  else if(a==="modal"){pop=null;modal={k:d.m};drawChrome()}
  else if(a==="mclose"){closeModal()}
  else if(a.startsWith("fv:")){pop=null;fvOpen(a.slice(3),d.c)}
  else if(a==="pfsave"){pfSave()}
  else if(a==="reqphoto"){pushNotif("admin","طلب تغيير صورة الطالب "+user.name+" ("+user.id+")","admin","high");audit.unshift(nowT()+" PHOTO_CHANGE_REQUESTED "+user.id);toast("أُرسل طلبك إلى الإدارة");pop=null;modal=null;render()}
  else if(a==="cropok"){cropSave()}
  return}
 if(b.id==="login")doLogin();
 else if(b.id==="logout"){UNI.logout();MY.docs=[];MY.idx=null;user=null;Q=null;chat=[];pending=null;ctx={};autoClear=false;hideGuide();try{sessionStorage.removeItem(SK)}catch(_){}if(PAGE){location.href="login.html";return}render()}
 else if(b.id==="clr"){if(clrArm){clrArm=false;clearChat()}else{clrArm=true;setTimeout(()=>{clrArm=false;if(user&&tab==="chat")render()},3000);render()}}
 else if(d.ac!==undefined){autoClear=!autoClear;render()}
 else if(b.id==="gnext")gnext();
 else if(b.id==="gprev")gprev();
 else if(b.id==="tour")startGuide();
 else if(b.id==="gskip")dock();
 else if(b.id==="gact")steps[G.i].act[1]();
 else if(b.id==="gbot"){if(G.active)return;if(PAGE){if(PAGE!=="chat"){save();location.href="chat.html";return}}else if(tab!=="chat"){tab="chat";render()}setTimeout(()=>{const i=$("#inp");i&&i.focus()},60)}
 else if(b.id==="kbadd"){const n=($("#kbtitle").value||"").trim()||"نص "+new Date().toLocaleTimeString(LOC),tx=$("#kbtext").value.trim();if(tx.length<20){kbMsg="النص قصير جدًا؛ أضف معلومات كافية.";render();return}const ch=chunkText(tx,n);if(addDoc(n,"text",ch))kbMsg="تمت فهرسة «"+n+"»: "+ch.length+" مقطعًا.";render()}
 else if(b.id==="phrm"&&user.role==="admin"){localStorage.removeItem("us_photo_"+accounts.student.id);audit.unshift(nowT()+" PROFILE_PHOTO_REMOVED_BY_ADMIN "+accounts.student.id);phMsg="تم حذف الصورة.";render()}
 else if(b.id==="vmtrain"){vmMsg="جارٍ التدريب…";render();vmTrain([accounts.student.id]).then(r=>{vmMsg=r.err?r.err:"اكتمل التدريب: الإصدار "+r.version+" — "+r.identities+" هوية، عتبة "+r.thr.toFixed(2);render()})}
 else if(b.id==="kbgl"){KB.gloss=$("#glos").value;glBuild();kbSave();kbMsg="تم حفظ القاموس.";render()}
 else if(d.kbt){const x=KB.docs.find(y=>y.id===d.kbt);if(x){x.on=!x.on;kbSave()}render()}
 else if(d.kbd){KB.docs=KB.docs.filter(y=>y.id!==d.kbd);kbSave();render()}
 else if(b.id==="kbtest"){kbQ=$("#kbq").value.trim();AR=/[\u0600-\u06FF]/.test(kbQ);const{res}=kbSearch(kbQ),a=kbAnswer(kbQ,.0001);
  const nl=nlpClassify(kbQ);kbOut=`<div class="mut" style="margin-top:10px">تحليل اللغة — الرموز: ${esc(ktoks(kbQ).join("، ")||"—")} · النية: ${nl.it||"—"} (${Math.round(nl.sim*100)}%)</div>`+(a?`<div class="m b" style="margin-top:10px;max-width:100%">${esc(a.t)}${a.h}<span class="tm">المصدر: ${esc(a.from||"")}</span></div>`:'<div class="mut" style="margin-top:10px">لا توجد إجابة مؤكدة في القاعدة.</div>')+(res.length?`<ul class="log">${res.map(x=>`<li>${esc(x.it.d.name)} — ${Math.round(x.cov*100)}%: ${esc(x.it.c.text.slice(0,90))}</li>`).join("")}</ul>`:"");render()}
 else if(d.lr){loginRole=d.lr;render()}
 else if(d.fill){const a=accounts[d.fill];loginRole=d.fill;render();$("#sid").value=a.id;$("#pw").value=a.pw}
 else if(d.cfg){secCfg[d.cfg]=!secCfg[d.cfg];render()}
 else if(d.mx){quiz.maxV=Math.max(0,Math.min(3,quiz.maxV+ +d.mx));render()}
 else if(d.cap){const[i,n]=d.cap.split(":"),c=byId(i);c.cap=Math.max(c.enr,c.cap+ +n);render()}
 else if(b.id==="regtog"){regOpen=!regOpen;if(UNI.on)UNI.call("POST","/api/admin/registration/"+(regOpen?"open":"close"));audit.unshift(new Date().toLocaleTimeString(LOC)+" REGISTRATION_"+(regOpen?"OPENED":"CLOSED"));render()}
 else if(d.hw){const h=hw[d.hw];if(UNI.on&&h.sid){UNI.call("POST","/api/assignments/"+h.sid+"/submit").then(r=>{UNI.invalidate();if(r.ok){h.done=true;toast("تم تسليم الواجب")}else toast(r.msg);render()})}else{h.done=true;toast("تم تسليم الواجب");render()}}
 else if(d.t){if(tab==="chat"&&d.t!=="chat"&&autoClear)clearChat(true);sideOpen=false;pop=null;srch="";if(PAGE){save();location.href=d.t+".html";return}tab=d.t;render()}
 else if(d.s)send(d.s);
 else if(b.id==="go"){const i=$("#inp");send(i.value)}
 else if(d.r){const r=register(d.r);toast(r.msg);if(r.ok){const cr=me.reg.reduce((a,i)=>a+byId(i).cr,0);chat.push({r:"b",t:"مبروك! سجّلت "+byId(d.r).name+". مجموع ساعاتك "+cr+(cr<12?" وده أقل من الحد الأدنى المعتاد (12). تحب أرشّح لك مواد تكمّل بيها؟":" وده عبء مناسب."),sugg:cr<12?["رشّح لي مواد","جدولي إيه؟"]:["جدولي إيه؟","فيه واجبات؟"]})}render()}
 else if(d.d){drop(d.d);toast("تم حذف المادة");render()}
 else if(b.id==="start")startQuiz();
 else if(b.id==="camtest")testCam();
 else if(b.id==="enroll")enrollFace();
 else if(b.id==="endel"){try{localStorage.removeItem("us_face_"+user.id)}catch(_){}enMsg="تم حذف البصمة المحفوظة.";render()}
 else if(b.id==="camre")reCam();
 else if(d.a!==undefined){Q.ans[Q.i]=+d.a;render()}
 else if(b.id==="next"){Q.i++;render()}
 else if(b.id==="prev"){Q.i--;render()}
 else if(b.id==="fin")submit(false);
 else if(b.id==="again"){Q=null;render()}});
document.addEventListener("keydown",e=>{if(e.key==="Enter"){if(e.target.id==="inp"){if(e.shiftKey)return;e.preventDefault();send(e.target.value)}else if(e.target.id==="sid"||e.target.id==="pw")doLogin()}});

// ---------- الكويز الآمن (يحاكي الخادم: المؤقت وعدّاد المخالفات والتسليم مرة واحدة) ----------
let camStream=null,camMsg="لم تُشغَّل الكاميرا بعد.";
const nowT=()=>new Date().toLocaleTimeString(LOC);
function ev(t){if(Q&&Q.state==="run")Q.log.push(nowT()+" "+t)}
function violate(t){if(!Q||Q.state!=="run")return;if((t==="TAB_HIDDEN"&&!secCfg.tab)||(t==="FULLSCREEN_EXIT"&&!secCfg.fs)){ev(t+" (غير مفعّل)");return}ev(t);Q.vio++;
 if(Q.vio>quiz.maxV){submit(true)}else{toast("تحذير: تم تسجيل مخالفة. المخالفة التالية ستسلّم الاختبار تلقائيًا.");render()}}
function stopCam(){if(camStream){camStream.getTracks().forEach(x=>x.stop());camStream=null}}
async function getCam(){if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia)throw new Error("unsupported");stopCam();camStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"user",width:320,height:240},audio:false})}
let procSt="idle",faceReady=false,faceLoading=null,procBusy=false,enMsg="";
const getPhotoOf=id=>{try{return JSON.parse(localStorage.getItem("us_photo_"+id)||"null")}catch(_){return null}},getPhoto=()=>getPhotoOf(user.id),getRef=()=>{const r=getPhoto();return r&&r.desc?new Float32Array(r.desc):null};
let procWhy="";
const b64buf=b=>{const r=atob(b),u=new Uint8Array(r.length);for(let i=0;i<r.length;i++)u[i]=r.charCodeAt(i);return u.buffer};
function addScript(src){return new Promise(res=>{const sc=document.createElement("script");sc.src=src;sc.onload=()=>res(true);sc.onerror=()=>res(false);document.head.appendChild(sc)})}
const FNETS=[["tinyFaceDetector","tiny_face_detector_model"],["faceLandmark68TinyNet","face_landmark_68_tiny_model"],["faceRecognitionNet","face_recognition_model"]];
async function loadFaceApi(){if(faceReady)return true;if(faceLoading)return faceLoading;
 return faceLoading=(async()=>{
  if(!window.faceapi&&!(await addScript("assets/vendor/face-api.js")))await addScript("https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/dist/face-api.js");
  if(!window.faceapi){procWhy="تعذّر تحميل مكتبة الرؤية الحاسوبية (assets/vendor/face-api.js).";return false}
  if(!window.__FM)await addScript("assets/models/models.js");      // نماذج مدمجة كسكربت: تعمل حتى من file://
  if(window.__FM){try{for(const n of FNETS){const m=window.__FM[n[1]];faceapi.nets[n[0]].loadFromWeightMap(faceapi.tf.io.decodeWeights(b64buf(m.bin),m.manifest[0].weights))}faceReady=true;procWhy="";return true}catch(e){procWhy="تعذّر قراءة النماذج: "+e.message}}
  try{await Promise.all(FNETS.map(n=>faceapi.nets[n[0]].loadFromUri("assets/models")));faceReady=true;procWhy="";return true}catch(e){procWhy=(procWhy?procWhy+" ":"")+"ولم تُحمَّل ملفات النماذج من assets/models."}
  return false})().then(ok=>{if(!ok)faceLoading=null;return ok})}
function procInit(){procSt="loading";loadFaceApi().then(ok=>{procSt=ok?"ready":"unavailable";if(ok){startPre();ensureDesc()}render()})}
let examVerified=false;
function procBlock(){if(!secCfg.proc||!camStream)return"";
 if(procSt==="loading")return`<div class="mut" style="margin-top:8px"><span class="spin"></span> جارٍ تحميل نماذج الرؤية الحاسوبية…</div>`;
 if(procSt!=="ready")return errBox("تعذّر تفعيل رصد الوجه",esc(procWhy||"النماذج غير متاحة")+" — لن يعمل رصد الوجود والهوية، لكن يمكنك إجراء الاختبار.");
 const ph=getPhoto();
 if(!ph)return`<div style="margin-top:10px">${errBox("لا توجد صورة شخصية مسجّلة","أضف صورتك من «تعديل الملف الشخصي» قبل بدء الاختبار.")}<button class="btn o" data-a="modal" data-m="edit" style="margin-top:8px">إضافة الصورة</button></div>`;
 return`<div style="margin-top:10px"><div class="mut">رصد الوجه مفعّل: يُغلق الاختبار عند غياب وجهك 3 دقائق أو عدم مطابقته لصورتك المسجّلة.</div><div class="row" style="align-items:center"><img class="avt" src="${ph.img}" alt="صورتك الشخصية">${examVerified?badge("تم التحقق من الهوية","ok"):`<button class="btn" data-a="fv:exam">تحقق من هويتك بالكاميرا</button>`}</div><div class="mut" id="enst"></div></div>`}
let phMsg="";
function imgToData(file){return new Promise((res,rej)=>{const fr=new FileReader();fr.onerror=()=>rej(new Error("تعذّرت قراءة الملف"));fr.onload=()=>{const im=new Image();im.onerror=()=>rej(new Error("الملف ليس صورة صالحة"));im.onload=()=>{const k=Math.min(1,360/Math.max(im.width,im.height)),c=document.createElement("canvas");c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);c.getContext("2d").drawImage(im,0,0,c.width,c.height);res({img:c.toDataURL("image/jpeg",.85),el:c})};im.src=fr.result};fr.readAsDataURL(file)})}
async function descOf(el){if(!await loadFaceApi())return{err:"unavailable"};const ds=await faceapi.detectAllFaces(el,new faceapi.TinyFaceDetectorOptions({inputSize:416,scoreThreshold:.5})).withFaceLandmarks(true).withFaceDescriptors();if(ds.length!==1)return{err:ds.length?"multi":"none"};return{desc:Array.from(ds[0].descriptor),score:ds[0].detection.score,w:ds[0].detection.box.width}}
async function savePhoto(id,file,by){phMsg="جارٍ معالجة الصورة…";render();
 try{if(typeof file.getContext!=="function"&&(!/^image\//.test(file.type)||file.size>8e6))throw new Error("اختر ملف صورة بحجم أقل من 8 ميجابايت");const{img,el}=typeof file.getContext==="function"?{img:file.toDataURL("image/jpeg",.88),el:file}:await imgToData(file),r=await descOf(el);
  if(r.err==="none"){phMsg="لا يظهر وجه واضح في الصورة. استخدم صورة أوضح لوجهك.";return}
  if(r.err==="multi"){phMsg="الصورة فيها أكثر من وجه. استخدم صورة لوجهك وحده.";return}
  const q=qualityOf(el);if(q.bright<50){phMsg="الصورة مظلمة؛ استخدم إضاءة أفضل.";return}if(q.bright>210){phMsg="الصورة شديدة الإضاءة.";return}if(q.sharp<40){phMsg="الصورة غير حادة؛ ثبّت الكاميرا وأعد التصوير.";return}if(r.desc&&(r.score<.7||r.w<70)){phMsg="الوجه صغير أو غير واضح؛ قرّب الكاميرا من وجهك.";return}
  localStorage.setItem("us_photo_"+id,JSON.stringify({img,desc:r.desc||null,by,at:new Date().toISOString()}));if(UNI.on){const up=await UNI.uploadPhoto(img,r.desc,by,id);if(!up.ok){localStorage.removeItem("us_photo_"+id);phMsg=up.msg||"تعذّر حفظ الصورة على الخادم";return}}
  audit.unshift(nowT()+(by==="admin"?" PROFILE_PHOTO_CHANGED_BY_ADMIN ":" PROFILE_PHOTO_SET ")+id);phMsg=r.err==="unavailable"?"تم حفظ الصورة؛ ستُجهَّز بصمتها عند أول اختبار.":"تم حفظ الصورة بنجاح.";if(r.desc)vmTrain([id]).then(t=>{if(!t.err){phMsg+=" وتم تدريب قالب الهوية (الإصدار "+t.version+").";render()}})}
 catch(e){phMsg=e.message||"تعذّر حفظ الصورة"}finally{modal=null;render()}}
function ensureDesc(){const ph=getPhoto();if(!ph||ph.desc||!faceReady)return;const im=new Image();im.onload=async()=>{const r=await descOf(im);if(r.desc){ph.desc=r.desc;localStorage.setItem("us_photo_"+user.id,JSON.stringify(ph));vmTrain([user.id])}else phMsg="تعذّر استخراج بصمة الوجه من الصورة المسجّلة؛ تواصل مع الإدارة لاستبدالها.";render()};im.src=ph.img}
const VMD={name:"UniFace Verifier",backbone:"شبكة ResNet-34 لاستخراج بصمة الوجه (128 قيمة)، مدرَّبة مسبقًا على ملايين الصور",head:"قالب هوية لكل طالب (بصمات متعددة بعد التحسين) وعتبة مطابقة معايَرة",quality:"وجه واحد، ثقة الكشف ≥ 0.7، عرض الوجه ≥ 70 بكسل، إضاءة 50–210، حدّة كافية"};
const dist=(a,b)=>Math.sqrt(a.reduce((t,x,i)=>t+(x-b[i])**2,0)),vmKey=id=>"us_vmt_"+id;
const vmGet=id=>{try{return JSON.parse(localStorage.getItem(vmKey(id))||"null")}catch(_){return null}};
const vmMeta=()=>{try{return JSON.parse(localStorage.getItem("us_vm")||"null")||{version:"—",n:0,identities:0}}catch(_){return{version:"—",n:0,identities:0}}};
function vmDist(d,id){const t=vmGet(id||user.id);if(t)return Math.min(dist(d,t.c),...t.samples.map(x=>dist(d,x)));const r=getRef();return r?dist(d,r):1}
const vmThr=()=>{const t=vmGet(user.id);return t&&t.thr?t.thr:.6};
function qualityOf(c){const w=Math.min(c.width,160),h=Math.round(c.height*w/c.width),t=document.createElement("canvas");t.width=w;t.height=h;const x=t.getContext("2d");x.drawImage(c,0,0,w,h);const d=x.getImageData(0,0,w,h).data,L=[];
 for(let i=0;i<d.length;i+=4)L.push(.299*d[i]+.587*d[i+1]+.114*d[i+2]);let lap=0,n=0;for(let y=1;y<h-1;y++)for(let q=1;q<w-1;q++){const i=y*w+q;const v=4*L[i]-L[i-1]-L[i+1]-L[i-w]-L[i+w];lap+=v*v;n++}return{bright:L.reduce((a,b)=>a+b,0)/L.length,sharp:lap/n}}
const loadImg=src=>new Promise((r,j)=>{const i=new Image();i.onload=()=>r(i);i.onerror=j;i.src=src});
function augs(im){const mk=f=>{const c=document.createElement("canvas");c.width=im.naturalWidth;c.height=im.naturalHeight;const x=c.getContext("2d");f(x,c);return c},rot=a=>(x,c)=>{x.translate(c.width/2,c.height/2);x.rotate(a);x.drawImage(im,-c.width/2,-c.height/2)},flt=f=>x=>{x.filter=f;x.drawImage(im,0,0)};
 return[mk(x=>x.drawImage(im,0,0)),mk((x,c)=>{x.translate(c.width,0);x.scale(-1,1);x.drawImage(im,0,0)}),mk(flt("brightness(1.2)")),mk(flt("brightness(.8)")),mk(flt("contrast(1.2)")),mk(flt("blur(1px)")),mk(rot(.06)),mk(rot(-.06)),mk((x,c)=>x.drawImage(im,c.width*.05,c.height*.05,c.width*.9,c.height*.9,0,0,c.width,c.height))]}
let vmMsg="";
async function vmTrain(ids){if(!await loadFaceApi())return{err:"نماذج الرؤية غير متاحة: "+procWhy};const all={},opt=new faceapi.TinyFaceDetectorOptions({inputSize:320,scoreThreshold:.4});
 for(const id of ids){const ph=getPhotoOf(id);if(!ph)continue;const emb=[];for(const c of augs(await loadImg(ph.img))){const r=await faceapi.detectSingleFace(c,opt).withFaceLandmarks(true).withFaceDescriptor();if(r)emb.push(Array.from(r.descriptor))}
  if(emb.length<3)continue;const cen=emb[0].map((_,j)=>emb.reduce((a,e)=>a+e[j],0)/emb.length),ds=emb.map(e=>dist(e,cen)),m=ds.reduce((a,b)=>a+b,0)/ds.length,sd=Math.sqrt(ds.reduce((a,b)=>a+(b-m)**2,0)/ds.length);all[id]={samples:emb.slice(0,10),c:cen,m,sd,n:emb.length}}
 const k=Object.keys(all);if(!k.length)return{err:"لا توجد صور صالحة للتدريب"};let thr=.55;
 if(k.length>1){let imp=2;for(const a of k)for(const b of k)if(a!==b)imp=Math.min(imp,dist(all[a].c,all[b].c));thr=Math.max(.45,Math.min(.6,(Math.max(...k.map(i=>all[i].m+3*all[i].sd))+imp)/2))}
 k.forEach(id=>localStorage.setItem(vmKey(id),JSON.stringify({...all[id],thr})));const n=(vmMeta().n||0)+1,meta={version:"1."+n+".0",n,at:new Date().toISOString(),identities:k.length,thr};localStorage.setItem("us_vm",JSON.stringify(meta));audit.unshift(nowT()+" VISION_MODEL_TRAINED v"+meta.version);return meta}
function viewAVis(){const m=vmMeta(),a=accounts.student,t=vmGet(a.id),ph=getPhotoOf(a.id);
 return `<h2>نموذج التعرف على الوجه</h2><p class="mut">نموذج رؤية حاسوبية مستقل عن المرشد الأكاديمي، يتحقق من هوية الطالب أثناء الاختبارات. تُعالَج الصور داخل الجهاز ولا تُرسل إلى أي خدمة خارجية.</p>
 <div class="stats">${[["الإصدار",m.version],["الهويات المدرَّبة",m.identities],["عتبة المطابقة",(m.thr||.6).toFixed(2)],["آخر تدريب",m.at?new Date(m.at).toLocaleDateString(LOC):"—"]].map(statH).join("")}</div>
 <div class="card"><h3>بطاقة النموذج</h3>${kv([["الاسم",VMD.name],["البنية",VMD.backbone],["رأس التحقق",VMD.head],["بوابة جودة الصورة",VMD.quality]])}</div>
 <div class="card"><h3>التدريب</h3><p class="mut">يستخرج النموذج بصمات من الصورة الشخصية المسجّلة بعد تحسينها (قلب، إضاءة، تباين، تمويه، تدوير، اقتصاص) ليبني قالبًا أمتن لكل طالب، ثم يعايِر عتبة المطابقة. يُنفَّذ تلقائيًا عند حفظ صورة جديدة، ويمكن إعادته هنا.</p><button class="btn" id="vmtrain">تدريب النموذج على الصور المسجّلة</button><div class="mut" id="vmmsg" style="margin-top:8px">${esc(vmMsg)}</div></div>
 <div class="card"><h3>الهويات المسجّلة</h3><div class="tog"><span class="row" style="align-items:center">${ph?`<img class="avt" src="${ph.img}" alt="">`:""}<span><b>${esc(a.name)}</b> <span class="mut">${a.id}</span></span></span><span class="mut">${t?t.n+" بصمات · متوسط التباين "+t.m.toFixed(2):"غير مدرَّب"}</span></div></div>
 <div class="card"><h3>حدود النموذج</h3><ul class="al"><li>لا يكشف انتحال الوجه بصورة مطبوعة أو معروضة على شاشة؛ لذلك تُحال حالات الإغلاق إلى مراجعة بشرية.</li><li>الدقة تتأثر بالإضاءة وزاوية الوجه وجودة الكاميرا.</li><li>العتبة تُعايَر على بيانات الجامعة؛ كلما زاد عدد الطلاب المسجّلين زادت دقة المعايرة.</li></ul></div>`}
function photoBlock(){const ph=getPhoto();return`<div class="fl">الصورة الشخصية (مرجع التحقق من الهوية)</div>${ph?`<div class="tog" style="border:0"><span class="mut">${ic("lock",16)} الصورة مسجّلة ومقفلة. لا يغيّرها إلا مسؤول الإدارة.</span><button class="btn o sm" data-a="reqphoto">طلب تغيير</button></div>`:`<p class="mut">يمكنك إضافتها <b>مرة واحدة</b>، وبعدها لا يغيّرها إلا مسؤول الإدارة.</p><input type="file" id="phfile" accept="image/*">`}${phMsg?`<div class="mut">${esc(phMsg)}</div>`:""}`}
const MODALS={edit:()=>{const pr=getProf();return{t:"تعديل الملف الشخصي",b:`<div class="prow">${avatar(84,"lg")}<div><b>${esc(user.name)}</b><div class="mut">${user.role==="student"?"الرقم الجامعي "+user.id:esc(user.title)}</div></div></div><label class="fl">رقم الهاتف<input type="text" id="pf_phone" value="${esc(pr.phone||"")}" placeholder="01XXXXXXXXX" inputmode="tel" autocomplete="tel"></label><label class="fl">البريد الجامعي<input type="text" id="pf_mail" value="${esc(pr.mail||"")}" placeholder="name@unismart.edu" autocomplete="email"></label>${user.role==="student"?photoBlock():""}<div class="mf"><button class="btn o" data-a="mclose">إلغاء</button><button class="btn" data-a="pfsave">حفظ</button></div>`}},
 crop:()=>({t:"اقتصاص الصورة الشخصية",b:`<div class="cropwrap"><canvas id="cv" width="280" height="340" aria-label="معاينة الصورة"></canvas><label class="fl" style="width:100%">التكبير<input type="range" id="cz" min="1" max="3" step="0.05" value="1"></label><p class="mut">اسحب الصورة لتوسيط وجهك. يجب أن يظهر وجهك وحده وبوضوح.</p>${phMsg?`<div class="bad">${esc(phMsg)}</div>`:""}<div class="mf"><button class="btn o" data-a="mclose">إلغاء</button><button class="btn" data-a="cropok">حفظ الصورة</button></div></div>`}),
 face:()=>({t:FV&&FV.mode==="exam"?"التحقق من الهوية قبل الاختبار":"تسجيل الحضور بالوجه",b:`<div class="fv" id="fvbox">${fvHTML()}</div>`})};
function pfSave(){const ph=($("#pf_phone")||{}).value||"",ml=($("#pf_mail")||{}).value||"";if(ph&&!/^[0-9+\-\s]{8,15}$/.test(ph)){toast("رقم الهاتف غير صالح");return}if(ml&&!/^\S+@\S+\.\S+$/.test(ml)){toast("البريد الإلكتروني غير صالح");return}lsSet("us_prof_"+user.id,{phone:ph,mail:ml});toast("تم حفظ البيانات");closeModal();render()}
let CR=null;
async function cropOpen(file,by,id){try{if(!/^image\//.test(file.type))throw new Error("اختر ملف صورة");const im=await loadImg(URL.createObjectURL(file));CR={im,z:1,ox:0,oy:0,by,id};phMsg="";modal={k:"crop"};drawChrome()}catch(e){phMsg=e.message||"تعذّر فتح الصورة";toast(phMsg)}}
function cropDraw(cv,W,H,k){const x=cv.getContext("2d"),b=Math.max(W/CR.im.width,H/CR.im.height)*CR.z,w=CR.im.width*b,h=CR.im.height*b,mx=(w-W)/2,my=(h-H)/2,ox=Math.max(-mx,Math.min(mx,CR.ox*k)),oy=Math.max(-my,Math.min(my,CR.oy*k));x.fillStyle="#000";x.fillRect(0,0,W,H);x.drawImage(CR.im,(W-w)/2+ox,(H-h)/2+oy,w,h)}
function cropSave(){if(!CR)return;const o=document.createElement("canvas");o.width=360;o.height=440;cropDraw(o,360,440,360/280);const{by,id}=CR;savePhoto(id,o,by)}
function initModal(){if(modal.k==="crop"&&CR){const cv=$("#cv"),z=$("#cz");if(!cv)return;cropDraw(cv,280,340,1);z.oninput=()=>{CR.z=+z.value;cropDraw(cv,280,340,1)};let dr=null;cv.onpointerdown=e=>{dr=[e.clientX,e.clientY];cv.setPointerCapture(e.pointerId)};cv.onpointermove=e=>{if(!dr)return;CR.ox+=e.clientX-dr[0];CR.oy+=e.clientY-dr[1];dr=[e.clientX,e.clientY];cropDraw(cv,280,340,1)};cv.onpointerup=()=>dr=null}
 if(modal.k==="face"&&FV&&FV.state==="init"){FV.state="starting";fvStart()}}
/* Face verification pipeline: camera → detect → quality → liveness (blink + head turn) → embedding → match → action */
let FV=null,fvT=null;
const FVS={init:["جارٍ التهيئة…",""],starting:["جارٍ تشغيل الكاميرا…",""],detecting:["جارٍ كشف الوجه…",""],noface:["لم يُرصد وجه — ضع وجهك داخل الإطار","warn"],multi:["أكثر من وجه أمام الكاميرا — لا يمكن المتابعة","bad"],small:["اقترب قليلًا من الكاميرا","warn"],angle:["اجعل رأسك مستقيمًا","warn"],dark:["الإضاءة ضعيفة — اتجه نحو مصدر ضوء","warn"],blur:["الصورة غير واضحة — ثبّت الكاميرا","warn"],challenge:["ارمش بعينيك مرة، ثم حرّك رأسك قليلًا لأحد الجانبين",""],processing:["جارٍ مطابقة الهوية…",""],verified:["تم التحقق من الهوية","ok"],low:["ثقة منخفضة — أعد المحاولة بإضاءة أفضل","warn"],failed:["فشل التحقق","bad"]};
const EAR=p=>{const d=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);return(d(p[1],p[5])+d(p[2],p[4]))/(2*d(p[0],p[3]))};
function frameQ(v){const c=document.createElement("canvas");c.width=160;c.height=Math.round(160*(v.videoHeight||480)/(v.videoWidth||640));c.getContext("2d").drawImage(v,0,0,c.width,c.height);return qualityOf(c)}
function fvOpen(mode,cid){if(user.role!=="student")return;const td=new Date().getDay(),def=cid||(me.reg.map(byId).find(c=>dayIdx(c)===td)||byId(me.reg[0])||{}).id;
 FV={mode,cid:def,state:"init",conf:0,seen:false,qual:false,blink:false,turn:false,closed:false,t0:Date.now(),frames:0,last:[],bad:0,why:"",busy:false};
 if(!getPhoto()){FV.state="nophoto"}else if(mode==="attendance"&&!def){FV.state="nocourse"}
 modal={k:"face"};drawChrome()}
async function descFromPhoto(){const ph=getPhoto();if(!ph||ph.desc)return;const r=await descOf(await loadImg(ph.img));if(r.desc){ph.desc=r.desc;lsSet("us_photo_"+user.id,ph)}}
async function fvStart(){if(!await loadFaceApi()){FV.state="unavail";FV.why=procWhy||"النماذج غير متاحة";return fvDraw(true)}
 try{if(!camStream)await getCam()}catch(e){FV.state="cam";FV.why=camErr(e);return fvDraw(true)}
 try{await descFromPhoto()}catch(_){}if(!getRef()){FV.state="failed";FV.why="تعذّر استخراج بصمة الوجه من صورتك المسجّلة؛ تواصل مع الإدارة.";return fvDraw(true)}
 const v=$("#fvv");if(!v)return;v.srcObject=camStream;try{await v.play()}catch(_){}FV.state="detecting";fvDraw();fvLoop()}
function fvLoop(){clearTimeout(fvT);const run=async()=>{if(!FV||modal?.k!=="face"||FV.done)return;await fvStep();if(FV&&!FV.done)fvT=setTimeout(run,120)};run()}
async function fvStep(){const v=$("#fvv");if(!FV||!v||v.readyState<2||FV.busy)return;FV.busy=true;
 try{if(Date.now()-FV.t0>35000){FV.done=true;FV.state="failed";FV.why="انتهت المهلة قبل اكتمال التحقق";return}
  const ds=await faceapi.detectAllFaces(v,new faceapi.TinyFaceDetectorOptions({inputSize:224,scoreThreshold:.5})).withFaceLandmarks(true).withFaceDescriptors();if(!FV)return;
  if(!ds.length){FV.state="noface";FV.seen=false;return}if(ds.length>1){FV.state="multi";return}
  FV.seen=true;const d=ds[0],P=d.landmarks.positions;FV.desc=Array.from(d.descriptor);if(FV.frames%8===0)FV.q=frameQ(v);FV.frames++;
  if(FV.q&&FV.q.bright<45||FV.q&&FV.q.bright>225){FV.state="dark";FV.qual=false;return}if(FV.q&&FV.q.sharp<20){FV.state="blur";FV.qual=false;return}
  if(d.detection.box.width/(v.videoWidth||640)<.16){FV.state="small";FV.qual=false;return}
  const eL={x:(P[36].x+P[39].x)/2,y:(P[36].y+P[39].y)/2},eR={x:(P[42].x+P[45].x)/2,y:(P[42].y+P[45].y)/2},roll=Math.atan2(eR.y-eL.y,eR.x-eL.x)*180/Math.PI,yaw=(P[30].x-(P[0].x+P[16].x)/2)/(P[16].x-P[0].x);
  FV.qual=true;const ear=(EAR(P.slice(36,42))+EAR(P.slice(42,48)))/2;if(ear<.2)FV.closed=true;else if(FV.closed&&ear>.24){FV.blink=true;FV.closed=false}
  if(Math.abs(yaw)>.13)FV.turn=true;else if(Math.abs(roll)>22&&!FV.turn){FV.state="angle";return}
  const dd=vmDist(d.descriptor),thr=vmThr();FV.conf=Math.round(1000/(1+Math.exp(12*(dd-thr))))/10;FV.bad+=dd>thr+.1?1:0;
  if(FV.bad>=14){FV.done=true;FV.state="failed";FV.why="الوجه لا يطابق صورة صاحب الحساب";return}
  if(!(FV.blink&&FV.turn)){FV.state="challenge";return}
  FV.state="processing";FV.last.push(dd);if(FV.last.length>6)FV.last.shift();
  if(FV.last.length>=5){const avg=FV.last.reduce((a,b)=>a+b,0)/FV.last.length;if(avg<=thr&&FV.conf>=70){FV.done=true;FV.state="verified";fvDone()}else if(avg<=thr){FV.done=true;FV.state="low"}else if(avg>thr+.05){FV.done=true;FV.state="failed";FV.why="الوجه لا يطابق صورة صاحب الحساب"}}
 }catch(e){}finally{if(FV){FV.busy=false;fvDraw(FV.done)}}}
function fvDone(){if(FV.mode==="exam"){examVerified=true;audit.unshift(nowT()+" EXAM_IDENTITY_VERIFIED conf="+FV.conf)}else{const c=byId(FV.cid);FV.cname=c.name;if(UNI.on&&c.sid&&FV.desc){FV.state="processing";FV.done=true;fvDraw(true);UNI.faceVerify(c.sid,FV.desc,FV.blink,FV.turn).then(r=>{if(!FV)return;if(r.ok){FV.conf=r.data.confidence;FV.state="verified";attRecord(FV.cid,FV.conf);UNI.invalidate()}else{FV.state="failed";FV.why=r.msg}fvDraw(true)})}else attRecord(FV.cid,FV.conf)}}
function attRecord(cid,conf){const c=byId(cid);let st="present";if(dayIdx(c)===new Date().getDay()){const[h,m]=tmOf(c).split(":").map(Number),n=new Date();if(n.getHours()*60+n.getMinutes()-(h*60+m)>15)st="late"}
 ATTLOG.push({c:cid,ts:Date.now(),s:st,conf});lsSet("us_att",ATTLOG);audit.unshift(nowT()+" ATTENDANCE_FACE "+cid+" conf="+conf);pushNotif(user.role,"تم تسجيل حضورك في "+c.name+(st==="late"?" (متأخر)":""),"attend")}
function fvDyn(){const[sx,k]=FVS[FV.state]||["",""],busy=["init","starting","detecting","processing"].includes(FV.state),retry=["failed","low","multi","noface"].includes(FV.state)&&FV.done;
 if(FV.state==="nophoto")return errBox("لا توجد صورة شخصية مسجّلة","أضف صورتك أولًا من تعديل الملف الشخصي ليتمكن النظام من مطابقتك.")+`<div class="mf"><button class="btn o" data-a="mclose">إغلاق</button><button class="btn" data-a="modal" data-m="edit">إضافة الصورة</button></div>`;
 if(FV.state==="nocourse")return errBox("لا توجد مواد مسجّلة","سجّل موادك أولًا لتتمكن من تسجيل الحضور.")+`<div class="mf"><button class="btn o" data-a="mclose">إغلاق</button></div>`;
 if(FV.state==="unavail"||FV.state==="cam")return errBox(FV.state==="cam"?"الكاميرا غير متاحة":"التعرف على الوجه غير متاح",esc(FV.why))+`<div class="mf"><button class="btn o" data-a="mclose">إغلاق</button></div>`;
 return`${FV.mode==="attendance"?`<label class="fl" style="margin:0">المادة<select id="fvc">${me.reg.map(i=>`<option value="${i}"${i===FV.cid?" selected":""}>${byId(i).name}</option>`).join("")}</select></label>`:""}<div class="fst ${k}" role="status" aria-live="polite">${busy?'<span class="spin"></span>':'<i class="dt"></i>'}<span>${sx}${FV.state==="failed"&&FV.why?": "+esc(FV.why):""}</span></div><div class="cf"><small class="mut">درجة الثقة</small><div class="pbar"><i style="width:${FV.conf}%"></i></div><b>${FV.conf.toFixed(1)}%</b></div><div class="chk">${[["كشف الوجه",FV.seen],["جودة الصورة والزاوية",FV.qual],["الحيوية: رمش العين",FV.blink],["الحيوية: حركة الرأس",FV.turn],["مطابقة الهوية",FV.state==="verified"]].map(x=>`<div class="${x[1]?"ok":""}">${ic(x[1]?"check":"clock",16)}${x[0]}</div>`).join("")}</div>${FV.state==="verified"?`<div class="fst ok"><i class="dt"></i><span><b>${esc(user.name)}</b> — ${FV.mode==="exam"?"يمكنك بدء الاختبار الآن":"تم تسجيل حضورك في "+esc(byId(FV.cid).name)}</span></div>`:""}<div class="mf">${retry?`<button class="btn o" data-a="fv:${FV.mode}" data-c="${FV.cid||""}">إعادة المحاولة</button>`:""}<button class="btn${FV.state==="verified"?"":" o"}" data-a="mclose">${FV.state==="verified"?"تم":"إلغاء"}</button></div>`}
const fvHTML=()=>FV?`<div class="fvwrap"><video id="fvv" autoplay muted playsinline aria-label="معاينة الكاميرا"></video><div class="oval" id="fvo"></div></div><div id="fvdyn">${fvDyn()}</div>`:"";
function fvDraw(full){const d=$("#fvdyn");if(!d||!FV)return;d.innerHTML=fvDyn();const o=$("#fvo");if(o){const k=(FVS[FV.state]||["",""])[1];o.className="oval "+(k==="ok"?"ok":k==="bad"?"bad":"")}}
function viewProfile(){const ph=getPhoto();return `<h2>ملفي الشخصي</h2><div class="card"><div class="prof"><div>${ph?`<img class="avbig" src="${ph.img}" alt="صورتي الشخصية">`:'<div class="avbig ph">لا توجد صورة</div>'}</div><div style="flex:1;min-width:240px"><h3>${esc(user.name)}</h3>${kv([["الرقم الجامعي",user.id],["البرنامج",PROG.name],["المعدل التراكمي",me.gpa]])}</div></div>
 ${ph?`<p class="mut" style="margin-top:14px">الصورة مسجّلة ومقفلة، ولا يمكن تغييرها إلا من الإدارة. تُستخدم للتحقق من هويتك أثناء الاختبارات.</p>`:`<div style="margin-top:14px"><p class="mut">أضف صورة شخصية واضحة لوجهك: وجه واحد، إضاءة جيدة، بدون نظارة شمسية. يمكنك إضافتها <b>مرة واحدة فقط</b>، وبعدها لا يغيّرها إلا مسؤول الإدارة.</p><input type="file" id="phfile" accept="image/*"></div>`}<div class="mut" id="phmsg" style="margin-top:8px">${esc(phMsg)}</div></div>`}
function viewAStu(){const a=accounts.student,ph=getPhotoOf(a.id);return `<h2>صور الطلاب</h2><p class="mut">يرفع الطالب صورته مرة واحدة، وبعدها لا يستطيع تغييرها؛ التغيير والحذف من الإدارة فقط، وكل تغيير يُسجَّل في سجل العمليات. تُستخدم الصورة للتحقق من الهوية في الاختبارات.</p>
 <div class="card"><div class="prof"><div>${ph?`<img class="avbig" src="${ph.img}" alt="">`:'<div class="avbig ph">لا توجد صورة</div>'}</div><div style="flex:1;min-width:240px"><h3>${esc(a.name)}</h3>${kv([["الرقم الجامعي",a.id],["حالة الصورة",ph?"مسجّلة ومقفلة":"غير مسجّلة"],["أضافها",ph?(ph.by==="admin"?"الإدارة":"الطالب"):"—"],["التاريخ",ph?new Date(ph.at).toLocaleDateString(LOC):"—"],["بصمة الوجه",ph?(ph.desc?"جاهزة":"تُجهَّز عند أول اختبار"):"—"]])}
 <div class="row" style="margin-top:12px"><label class="btn o" for="phadmin">${ph?"استبدال الصورة":"رفع صورة"}</label><input type="file" id="phadmin" accept="image/*" hidden>${ph?'<button class="btn o" id="phrm">حذف الصورة</button>':""}</div><div class="mut" id="phmsg" style="margin-top:8px">${esc(phMsg)}</div></div></div></div>`}
const setEn=m=>{enMsg=m;const e=$("#enst");if(e)e.textContent=m};
async function waitVideo(v,ms){const t=Date.now();while(Date.now()-t<ms){if(v&&v.readyState>=2&&v.videoWidth>0)return true;await new Promise(r=>setTimeout(r,120))}return false}
async function enrollFace(){const v=$("#camv");setEn("جارٍ التقاط الصورة المرجعية… انظر إلى الكاميرا مباشرة");
 try{if(!await waitVideo(v,4000)){setEn("لا يصل بث من الكاميرا بعد. انتظر ثانيتين وأعد المحاولة.");return}
  let r=null;for(let i=0;i<4&&!r;i++){r=await faceapi.detectSingleFace(v,new faceapi.TinyFaceDetectorOptions({inputSize:320,scoreThreshold:.4})).withFaceLandmarks(true).withFaceDescriptor();if(!r)await new Promise(x=>setTimeout(x,500))}
  if(!r){setEn("لم يُرصد وجه واضح. اجعل وجهك في منتصف الصورة وبإضاءة جيدة وأعد المحاولة.");return}
  localStorage.setItem("us_face_"+user.id,JSON.stringify(Array.from(r.descriptor)));setEn("تم تسجيل الصورة المرجعية بنجاح.");render()}
 catch(e){setEn("تعذّر تسجيل الصورة المرجعية: "+(e&&e.message?e.message:"خطأ غير معروف"))}}
let preT=null;
async function preTick(){if(tab!=="quiz"||(Q&&Q.state==="run")||!camStream||!faceReady||procBusy){return}const v=$("#camv"),e=$("#camst");if(!v||v.readyState<2)return;procBusy=true;
 try{const ds=await faceapi.detectAllFaces(v,new faceapi.TinyFaceDetectorOptions({inputSize:224,scoreThreshold:.45})).withFaceLandmarks(true).withFaceDescriptors(),ref=getRef();let m="الكاميرا تعمل. ";
  if(!ds.length)m+="لم يُرصد وجه بعد.";else{m+="رُصد "+ds.length+(ds.length>1?" وجوه.":" وجه.");if(ref){const d=Math.min(...ds.map(x=>vmDist(x.descriptor)));m+=d<=vmThr()?" ✓ مطابق لصورتك المرجعية.":" ✗ غير مطابق للصورة المرجعية."}}
  if(e&&!(Q&&Q.state==="run"))e.textContent=m}catch(_){}procBusy=false}
function startPre(){clearInterval(preT);preT=setInterval(preTick,1500)}
function terminate(reason){if(!Q||Q.state!=="run")return;Q.term=reason;submit(true)}
async function procTick(){if(!Q||Q.state!=="run"||!Q.proc||procBusy)return;const now=Date.now(),v=$("#camv");
 if(Q.camLost||!camStream){if(!Q.absentSince){Q.absentSince=now;ev("CAMERA_ABSENT")}if(now-Q.absentSince>=180000)terminate("فقدان الكاميرا لمدة 3 دقائق");return}
 if(!faceReady||!v||v.readyState<2)return;procBusy=true;
 try{const ds=await faceapi.detectAllFaces(v,new faceapi.TinyFaceDetectorOptions({inputSize:224,scoreThreshold:.5})).withFaceLandmarks(true).withFaceDescriptors();
  if(!ds.length){if(!Q.absentSince){Q.absentSince=now;ev("FACE_ABSENT_START");render()}const sec=Math.round((now-Q.absentSince)/1000);
   if(sec>=180)terminate("غياب الوجه عن الكاميرا لمدة 3 دقائق");else if(sec>=30&&sec%15<3)toast("لم يُرصد وجهك منذ "+sec+" ثانية. عُد أمام الكاميرا، فيُغلق الاختبار عند 3 دقائق.")}
  else{if(Q.absentSince){ev("FACE_RETURNED");Q.absentSince=null;render()}
   if(ds.length>1){Q.multi=(Q.multi||0)+1;if(Q.multi%10===1)ev("MULTIPLE_FACES")}
   const ref=getRef();if(ref){const d=Math.min(...ds.map(x=>vmDist(x.descriptor)));
    if(d>vmThr()){Q.mis=(Q.mis||0)+1;ev("IDENTITY_MISMATCH ("+d.toFixed(2)+")");if(Q.mis>=4)terminate("عدم تطابق الوجه مع صاحب الحساب")}else Q.mis=0}}}
 catch(e){}procBusy=false}
const camErr=e=>({NotAllowedError:"تم رفض إذن الكاميرا (أو تمنعها بيئة العرض المضمّنة). اسمح بها من أيقونة القفل في شريط العنوان، أو افتح الصفحة في نافذة مستقلة.",NotFoundError:"لا توجد كاميرا متصلة بهذا الجهاز.",NotReadableError:"الكاميرا مستخدمة من برنامج آخر (Zoom/Teams…) أو لا يمكن قراءتها. أغلق البرنامج الآخر وأعد المحاولة.",OverconstrainedError:"إعدادات الكاميرا غير مدعومة.",SecurityError:"المتصفح يمنع الكاميرا في هذا السياق.",TypeError:"الكاميرا غير مدعومة في هذا السياق.",unsupported:"هذا المتصفح أو السياق لا يدعم الكاميرا."}[e&&(e.name==="Error"?e.message:e.name)]||("تعذّر تشغيل الكاميرا"+(e&&e.name?" ("+e.name+")":"")+"."));
function camDiag(){const emb=(()=>{try{return window.self!==window.top}catch(_){return true}})(),proto=location.protocol;
 return[["السياق",window.isSecureContext||proto==="file:"?"آمن ("+proto+")":"غير آمن ("+proto+") — يلزم https أو localhost"],["الإطار",emb?"الصفحة مضمّنة داخل إطار (قد يمنع الكاميرا)":"مستقلة"],["واجهة الكاميرا",navigator.mediaDevices&&navigator.mediaDevices.getUserMedia?"متاحة":"غير متاحة"],["ملفات النماذج",location.protocol==="file:"?"تحتاج خادمًا (لا تعمل من file://)":"تُحمَّل من assets/models"]]}
async function testCam(){camMsg="جارٍ طلب إذن الكاميرا…";render();
 try{await getCam();camMsg="الكاميرا تعمل بنجاح.";procInit()}
 catch(e){camStream=null;camMsg=camErr(e)}
 render()}
function watchCam(){const t=camStream&&camStream.getVideoTracks()[0];if(t)t.onended=()=>{if(Q&&Q.state==="run"){Q.camLost=true;Q.absentSince=Q.absentSince||Date.now();ev("CAMERA_LOST");toast("فُقد الاتصال بالكاميرا");render()}}}
async function reCam(){try{await getCam();Q.camLost=false;Q.absentSince=null;ev("CAMERA_RECONNECTED");watchCam()}catch(e){ev("CAMERA_PERMISSION_DENIED");toast("تعذّر تشغيل الكاميرا")}render()}
function enterFs(silent){const el=document.documentElement;if(!el.requestFullscreen){if(!silent)ev("FULLSCREEN_UNSUPPORTED");return Promise.resolve(false)}
 return el.requestFullscreen().then(()=>{if(Q)Q.fsOk=true;ev("FULLSCREEN_ENTER");return true}).catch(()=>{if(!silent)ev("FULLSCREEN_DENIED");return false})}
function showLock(kind){const l=$("#lock");l.hidden=false;$("#lockh").textContent=kind==="fs"?"تم الخروج من وضع ملء الشاشة":"تم تحديث الصفحة أثناء الاختبار";$("#lockp").textContent="سُجّلت مخالفة. اضغط في أي مكان للعودة فورًا إلى ملء الشاشة ومتابعة الاختبار. الوقت ما زال يُحتسب."}
function hideLock(){const l=$("#lock");if(l)l.hidden=true}
async function relock(){if(!Q||Q.state!=="run")return;const fs=enterFs(false);if(Q.camOn&&!camStream)await reCam();await fs;if(!Q.fsOk||document.fullscreenElement)hideLock();render()}
function startQuiz(){if(secCfg.cam&&!camStream){toast("يجب تشغيل الكاميرا أولًا");return}
 Q={state:"run",i:0,ans:[],vio:0,log:[],deadline:Date.now()+quiz.mins*60000,auto:false,fsOk:false,camOn:!!camStream,camLost:false,proc:!!camStream&&secCfg.proc&&procSt==="ready"};ev("EXAM_STARTED");if(Q.proc)Q.pt=setInterval(procTick,3000);
 if(Q.camOn){ev("CAMERA_STARTED");watchCam()}
 enterFs(false);try{history.pushState({q:1},"")}catch(_){}
 Q.timer=setInterval(tick,500);render()}
function tick(){if(!Q||Q.state!=="run")return;const s=Math.max(0,Math.ceil((Q.deadline-Date.now())/1000));
 const e=$("#tm");if(e)e.textContent=String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0");
 if(s<=0){ev("TIME_EXPIRED");submit(true)}}
function submit(auto){if(!Q||Q.state!=="run")return; // idempotent
 Q.state="done";Q.auto=auto;clearInterval(Q.timer);clearInterval(Q.pt);if(Q.term){Q.log.push(nowT()+" PROCTOR_TERMINATED: "+Q.term);secEvents.unshift([user.name,"PROCTOR_TERMINATED",new Date().toLocaleTimeString(LOC,{hour:"2-digit",minute:"2-digit"})])}
 Q.score=quiz.qs.filter((q,i)=>Q.ans[i]===q.a).length;Q.log.push(nowT()+(auto?" AUTO_SUBMITTED":" EXAM_SUBMITTED"));
 audit.unshift(nowT()+(auto?" EXAM_AUTO_SUBMITTED":" EXAM_SUBMITTED"));
 try{document.fullscreenElement&&document.exitFullscreen()}catch(_){}
 examVerified=false;stopCam();hideLock();render()}
document.addEventListener("visibilitychange",()=>{if(!Q||Q.state!=="run")return;
 if(document.visibilityState==="hidden")violate("TAB_HIDDEN");else ev("TAB_VISIBLE")});
document.addEventListener("fullscreenchange",()=>{if(!Q||Q.state!=="run"||!Q.fsOk)return;
 if(document.fullscreenElement)hideLock();else{violate("FULLSCREEN_EXIT");if(Q.state==="run"){showLock("fs");enterFs(true)}}});
["copy","paste","cut"].forEach(t=>document.addEventListener(t,e=>{if(Q&&Q.state==="run"&&secCfg.copy){e.preventDefault();ev(t.toUpperCase()+"_ATTEMPT");toast("النسخ واللصق غير مسموح أثناء الاختبار")}}));
document.addEventListener("contextmenu",e=>{if(Q&&Q.state==="run"&&secCfg.copy){e.preventDefault();ev("RIGHT_CLICK")}});
document.addEventListener("pointerdown",()=>{const l=$("#lock");if(l&&!l.hidden)relock()},true);
document.addEventListener("keydown",e=>{const l=$("#lock");if(l&&!l.hidden&&(e.key==="Enter"||e.key===" "))relock()},true);
document.addEventListener("dragover",e=>{const z=e.target.closest&&e.target.closest("#kbdrop");if(z){e.preventDefault();z.classList.add("on")}});
document.addEventListener("dragleave",e=>{const z=e.target.closest&&e.target.closest("#kbdrop");if(z)z.classList.remove("on")});
document.addEventListener("drop",async e=>{if(e.target.closest&&e.target.closest("#kbdrop")){e.preventDefault();for(const f of e.dataTransfer.files)await ingestFile(f);render()}});
document.addEventListener("click",e=>{if(!user)return;const t=e.target;if(pop&&!t.closest("#pop,[data-a^='pop:']")){pop=null;drawChrome()}if(t.classList&&t.classList.contains("ov")){closeModal()}if(sideOpen&&t.id==="scrim"){sideOpen=false;drawChrome()}});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&user){if(modal)closeModal();else if(pop){pop=null;drawChrome()}else if(sideOpen){sideOpen=false;drawChrome()}}});
document.addEventListener("input",e=>{if(!user||e.target.id!=="gs")return;srch=e.target.value;const q=srch.trim().toLowerCase(),b=$("#sres");if(!q){b.innerHTML="";return}
 const R=[...(roleTabs[user.role]||[]).map(k=>({t:NAV[k][0],go:k,i:NAV[k][1],s:"صفحة"})),...(user.role==="student"?courses.map(c=>({t:c.name+" — "+c.ar,go:"courses",i:"book",s:c.doc})):[])].filter(x=>(x.t+" "+x.s).toLowerCase().includes(q)).slice(0,6);
 b.innerHTML=R.length?R.map(x=>`<button class="sr1" data-t="${x.go}">${ic(x.i,16)}<span>${esc(x.t)}</span><small>${esc(x.s)}</small></button>`).join(""):'<div class="sr1 mut">لا نتائج</div>'});
document.addEventListener("change",e=>{if(e.target.id==="fvc"&&FV)FV.cid=e.target.value});
document.addEventListener("change",async e=>{if(e.target.id==="fup")return;const f0=e.target.files&&e.target.files[0];if(e.target.id==="kbfile"){for(const f of e.target.files)await ingestFile(f);render()}
 else if(e.target.id==="phfile"&&user&&user.role==="student"&&!getPhoto()&&f0)await cropOpen(f0,"student",user.id);
 else if(e.target.id==="phadmin"&&user&&user.role==="admin"&&f0)await cropOpen(f0,"admin",accounts.student.id);e.target.value=""});
addEventListener("beforeunload",e=>{if(Q&&Q.state==="run"&&!Q.redirected){e.preventDefault();e.returnValue=""}});
addEventListener("popstate",()=>{if(Q&&Q.state==="run"){try{history.pushState({q:1},"")}catch(_){}ev("BACK_NAVIGATION_ATTEMPT");toast("لا يمكن مغادرة الاختبار قبل تسليمه")}});
function viewLogin(){const R={student:["طالب","الرقم الجامعي"],doctor:["دكتور","اسم المستخدم"],admin:["إدارة","اسم المستخدم"]};
return `<div class="login"><section class="brand"><svg viewBox="0 0 80 96" width="84" aria-hidden="true"><path d="M40 4 74 16v34c0 22-16 38-34 44C22 88 6 72 6 50V16z" fill="#1b3a63"/><path d="M40 4 74 16v34c0 22-16 38-34 44" fill="none" stroke="#8fa3bd" stroke-width="3"/><path d="M18 36c8-3 16-2 22 3 6-5 14-6 22-3v26c-8-3-16-2-22 3-6-5-14-6-22-3z" fill="#fff"/><path d="M40 39v26" stroke="#8fa3bd" stroke-width="2"/><circle cx="40" cy="26" r="4" fill="#8fa3bd"/></svg>
<h1>جامعة UniSmart</h1><div class="rule"></div><p><b>كلية الحاسبات والذكاء الاصطناعي</b></p><p class="mut">البوابة الإلكترونية الرسمية للتسجيل والجداول والدرجات والاختبارات.</p>
<div class="ft"><div><span>١</span>تسجيل المواد وفق اللوائح الأكاديمية</div><div><span>٢</span>اختبارات إلكترونية آمنة وشفافة</div><div><span>٣</span>إرشاد أكاديمي فوري على مدار الساعة</div></div></section>
<section class="lf"><div class="langsw" role="group" aria-label="Language" data-notr>${[["ar","العربية"],["en","English"]].map(x=>`<button data-lang="${x[0]}" aria-pressed="${I18N.lang===x[0]}">${x[1]}</button>`).join("")}</div><h2>تسجيل الدخول</h2><div class="seg" role="group" aria-label="نوع الحساب">${Object.keys(R).map(k=>`<button data-lr="${k}" aria-pressed="${k===loginRole}">${R[k][0]}</button>`).join("")}</div>
<label for="sid">${R[loginRole][1]}</label><input id="sid" type="text" autocomplete="username"><label for="pw">كلمة المرور</label><input id="pw" type="password" autocomplete="current-password">
<div id="err" role="alert">${(()=>{try{if(sessionStorage.getItem("us_exp")==="1"){sessionStorage.removeItem("us_exp");return"انتهت جلستك. سجّل الدخول مرة أخرى."}}catch(_){}return""})()}</div><button class="btn" id="login">دخول</button>
<div class="mut" style="margin-top:8px">حسابات تجريبية، اضغط للتعبئة:</div><div class="mut" id="mode" style="font-size:12px"></div><div class="demo">${Object.keys(accounts).map(k=>`<button class="chip" data-fill="${k}">${R[k][0]}: ${accounts[k].id}</button>`).join("")}</div></section></div>`}
async function doLogin(){const i=$("#sid").value.trim().toLowerCase(),p=$("#pw").value,err=$("#err"),btn=$("#login");
 try{sessionStorage.removeItem("us_live")}catch(_){}
 if(btn){btn.disabled=true;btn.textContent="جارٍ التحقق…"}
 try{
  if(await UNI.ping()){
   const r=await UNI.login(i,p);if(!r.ok){err.textContent=r.msg;return}
   const role=r.data.role,nm=r.data.name;loginRole=role;
   await okLogin({id:i,name:nm,first:role==="student"?nm.split(" ")[0]:nm.replace(/^د\.\s*/,"دكتور ").split(" ").slice(0,2).join(" "),title:role==="student"?"طالب":role==="doctor"?"دكتور":"مدير النظام"});return}
  const a=accounts[loginRole];
  if(i===a.id&&p===a.pw)await okLogin(a);else err.textContent="بيانات الدخول غير صحيحة لهذا النوع من الحساب."
 }finally{const b2=$("#login");if(b2){b2.disabled=false;b2.textContent="دخول"}}}
async function okLogin(a){user={...a,role:loginRole};MY.docs=[];MY.idx=null;myLoad();chat=greeting();pending=null;ctx={};tab=roleTabs[loginRole][0];audit.unshift(new Date().toLocaleTimeString(LOC)+" USER_LOGIN");
 if(UNI.on)liveApply(await UNI.fetchAll(loginRole));
 if(PAGE){let sn=false;try{sn=localStorage.getItem("us_seen_"+a.id)==="1"}catch(_){}G.active=!sn;G.i=0;save();location.href=tab+".html";return}render();
 let seen=false;try{seen=localStorage.getItem("us_seen_"+a.id)==="1"}catch(_){}
 if(!seen)setTimeout(startGuide,500);else{$("#guide").hidden=false;dock()}}
const stepsBy={student:[
 {x:"مرحبًا بك|أنا المرشد الأكاديمي، وسأعرّفك بأهم أقسام البوابة."},
 {tab:"home",s:"#hero",x:"الصفحة الرئيسية|تعرض معدلك التراكمي وساعاتك المسجلة ومحاضراتك وآخر الإعلانات."},
 {tab:"courses",s:".crs",x:"تسجيل المواد|يتحقق النظام من السعة والمتطلبات السابقة وتعارض الجدول، ويوضح سبب أي مادة غير متاحة."},
 {tab:"schedule",s:".day",x:"الجدول الأسبوعي|يتحدّث تلقائيًا فور تسجيل المواد أو حذفها."},
 {tab:"chat",s:"#inp",x:"المرشد الأكاديمي|اكتب سؤالك بالعربية أو بلهجتك أو بالإنجليزية. جرّب سؤالًا الآن:",act:["اطرح سؤالًا",()=>send("What courses are available for me?")]},
 {tab:"quiz",s:"#start",x:"الاختبارات الآمنة|تُجرى وفق ضوابط تحددها الجهة المشرفة: المخالفة الأولى تنبيه والثانية تسليم تلقائي، وتُسجَّل الأحداث للمراجعة."}],
doctor:[{x:"مرحبًا بك|أنا المرشد الأكاديمي في لوحة عضو هيئة التدريس."},{tab:"dhome",s:".stats",x:"موادك وطلابك|عدد الطلاب المسجلين وملخص المواد وآخر التسليمات."},{tab:"dquiz",s:".card",x:"أمان الاختبارات|فعّل الضوابط أو أوقفها وحدد عدد المخالفات المسموحة. الأحداث إشارات للمراجعة وليست دليلًا تلقائيًا على المخالفة."},{tab:"chat",s:"#inp",x:"المرشد|اسأل عن إحصائيات موادك."}],
admin:[{x:"مرحبًا بك|أنا المرشد الأكاديمي في لوحة الإدارة."},{tab:"ahome",s:"#regtog",x:"التحكم في التسجيل|افتح باب التسجيل أو أغلقه، وعدّل سعة المواد، ويظهر أثر ذلك للطلاب فورًا."},{tab:"aaudit",s:".card",x:"السجلات|تُسجَّل هنا العمليات الحساسة وأحداث الأمان للمراجعة."},{tab:"chat",s:"#inp",x:"المرشد|اسأل عن الأرقام والإحصائيات."}]};
let steps=[];
let G={i:0,active:false},pos={x:-100,y:0},tk=0,fl=null;
function clearHl(){document.querySelectorAll(".hl").forEach(e=>e.classList.remove("hl"))}
function flyTo(x,y){const g=$("#guide"),red=matchMedia("(prefers-reduced-motion:reduce)").matches;
 if(!g.hidden){const c=g.getBoundingClientRect();pos={x:c.left,y:c.top}}
 if(fl)fl.cancel();g.style.setProperty("--dir",x<pos.x?-1:1);
 g.style.transform=`translate(${x}px,${y}px)`;
 if(red||g.hidden){pos={x,y};return}
 const my=Math.min(pos.y,y)-Math.min(90,Math.abs(x-pos.x)/3+30);g.classList.add("fly");
 fl=g.animate([{transform:`translate(${pos.x}px,${pos.y}px)`},{transform:`translate(${(pos.x+x)/2}px,${my}px)`,offset:.5},{transform:`translate(${x}px,${y}px)`}],{duration:1200,easing:"cubic-bezier(.45,0,.2,1)"});
 fl.onfinish=fl.oncancel=()=>g.classList.remove("fly");pos={x,y}}
function typeIn(txt,my){const el=$("#gtxt");if(my!==tk)return;if(matchMedia("(prefers-reduced-motion:reduce)").matches){el.textContent=txt;return}let i=0;(function f(){if(my!==tk)return;i+=2;el.textContent=txt.slice(0,i);if(i<txt.length)setTimeout(f,20)})()}
function spot(r){const e=$("#spot");if(!r){e.classList.remove("on");return}const f=!e.classList.contains("on"),p=6;if(f)e.style.transition="none";
 e.style.top=r.top-p+"px";e.style.left=r.left-p+"px";e.style.width=r.width+2*p+"px";e.style.height=r.height+2*p+"px";if(f){void e.offsetWidth;e.style.transition=""}e.classList.add("on")}
function startGuide(){steps=stepsBy[user.role];G.i=0;G.active=true;const g=$("#guide");g.hidden=false;g.classList.remove("dock");pos={x:-100,y:innerHeight-100};g.style.transform=`translate(${pos.x}px,${pos.y}px)`;setTimeout(place,120)}
function place(){const g=$("#guide"),st=steps[G.i],w=Math.min(330,innerWidth-16);clearHl();g.classList.remove("dock");g.style.width=w+"px";
 if(st.tab&&tab!==st.tab){if(PAGE){G.active=true;save();location.href=st.tab+".html";return}tab=st.tab;render()}
 const[h,tx]=st.x.includes("|")?st.x.split("|"):["مرحبًا بك",st.x],txt=tx.replace("{n}",user.first),t=$("#gtxt");
 $("#gh").textContent=h;t.style.minHeight="";t.textContent=txt;t.style.minHeight=t.offsetHeight+"px";t.textContent="";
 $("#gdots").innerHTML=steps.map((_,k)=>`<i class="${k===G.i?"on":""}"></i>`).join("");
 $("#gnext").textContent=G.i===steps.length-1?"ابدأ":"التالي";$("#gprev").hidden=G.i===0;
 const a=$("#gact");a.hidden=!st.act;if(st.act)a.textContent=st.act[0];
 const gb=g.querySelector(".gb");gb.style.animation="none";void gb.offsetWidth;gb.style.animation="";
 let el=st.s?$(st.s):G.i===0?$(".logo"):null;const gh=g.offsetHeight;let x,y;if(el){const q=el.getBoundingClientRect();if(!q.width||q.left>=innerWidth||q.right<=0)el=null}
 if(el){el.scrollIntoView({inline:"center",block:"nearest"});const r=el.getBoundingClientRect();spot(r);
  x=Math.min(Math.max(8,r.left+r.width/2-w/2),innerWidth-w-8);y=r.bottom+14;if(y+gh>innerHeight-8)y=r.top-gh-14;y=Math.max(8,Math.min(y,innerHeight-gh-8))}
 else{x=innerWidth-w-24;y=90;spot(null)}
 flyTo(x,y);const my=++tk;setTimeout(()=>typeIn(txt,my),520)}
function gnext(){if(G.i>=steps.length-1)return dock();G.i++;place()}
function gprev(){if(G.i>0){G.i--;place()}}
function dock(){const g=$("#guide");clearHl();tk++;G.active=false;$("#spot").classList.remove("on");try{localStorage.setItem("us_seen_"+user.id,"1")}catch(_){}
 if(!g.style.transform)g.style.transform=`translate(-100px,${innerHeight-96}px)`;g.classList.add("dock");g.style.width="64px";flyTo(16,innerHeight-96)}
function hideGuide(){G.active=false;$("#spot").classList.remove("on");$("#guide").hidden=true;clearHl()}
let rz;addEventListener("resize",()=>{clearTimeout(rz);rz=setTimeout(()=>{const g=$("#guide");if(g.hidden||!user)return;g.classList.contains("dock")?dock():place()},200)});
document.addEventListener("keydown",e=>{const g=$("#guide");if(g.hidden||g.classList.contains("dock")||["inp","sid","pw"].includes(e.target.id))return;if(e.key==="ArrowLeft")gnext();else if(e.key==="ArrowRight")gprev();else if(e.key==="Escape")dock()});
function save(){if(!PAGE)return;try{sessionStorage.setItem(SK,JSON.stringify({user,me,cs:courses.map(c=>[c.id,c.enr,c.cap]),regOpen,audit,hw,chat:chat.slice(-40),cx:ctx.course?ctx.course.id:null,sec:secCfg,mx:quiz.maxV,tour:G.active?G.i:-1,ac:autoClear,ap:appts,qs:(Q&&Q.state==="run")?Q:null}))}catch(_){}}
function load(){if(!PAGE)return;try{const d=JSON.parse(sessionStorage.getItem(SK)||"null");if(!d)return;user=d.user;if(!UNI.on){Object.assign(me,d.me);d.cs.forEach(([i,e,c])=>{const x=byId(i);if(x){x.enr=e;x.cap=c}})}regOpen=d.regOpen;audit.length=0;audit.push(...d.audit);if(!UNI.on)d.hw.forEach((h,i)=>{if(hw[i])hw[i].done=h.done});chat=d.chat;ctx=d.cx?{course:byId(d.cx)}:{};Object.assign(secCfg,d.sec);quiz.maxV=d.mx;resumeTour=d.tour;autoClear=d.ac;appts=d.ap||[];if(d.qs){Q=d.qs;if(PAGE!=="quiz"||!Q.redirected){Q.log.push(nowT()+(PAGE!=="quiz"?" PAGE_LEFT":" PAGE_REOPENED"));Q.vio++}Q.redirected=false}}catch(_){}}
// ---------- الوضع الحي: تطبيق بيانات الخادم على حالة الواجهة ----------
const LV_LVL=["الأول","الثاني","الثالث","الرابع"],daysTo=iso=>Math.round((new Date(iso+(/Z|\+/.test(iso)?"":"Z"))-addDays(0))/864e5),dueTxt=n=>n<0?"متأخر":n===0?"اليوم":n===1?"غدًا":n===2?"بعد يومين":"بعد "+n+" أيام";
function liveApply(d){if(!d)return;
 if(d.role==="student"){
  if(d.courses){courses.length=0;d.courses.forEach(c=>courses.push({id:c.code,sid:c.id,name:c.name,ar:c.name,doc:c.doctor||"—",cr:c.credits||3,cap:c.capacity,enr:c.enrolled,pre:c.prereqs||[],slot:c.slot,room:c.room||"—"}));
   me.reg=d.courses.filter(c=>c.my_status==="ACTIVE").map(c=>c.code);me.done=d.courses.filter(c=>c.my_status==="COMPLETED").map(c=>c.code)}
  if(d.grades){me.gpa=d.grades.gpa==null?0:d.grades.gpa;me.grades=d.grades.courses.map(g=>[g.code,g.grade]);PROG.earned=d.grades.credits_earned}
  if(d.dash){const s=d.dash.student;STU.dept=s.department;STU.level="المستوى "+LV_LVL[s.level-1];STU.sem=s.semester;STU.status=s.standing||STU.status;PROG.total=d.dash.courses.program_credits;PROG.n=d.dash.courses.total;
   EXAMS.length=0;d.dash.upcoming.filter(u=>u.kind==="exam"&&byId(u.code)).forEach(u=>EXAMS.push({c:u.code,kind:u.title,off:Math.max(0,daysTo(u.at)),time:new Date(u.at+"Z").toLocaleTimeString(LOC,{hour:"2-digit",minute:"2-digit"})}))}
  if(d.settings)regOpen=d.settings.registration_open;
  if(d.assignments){hw.length=0;HWD.length=0;d.assignments.filter(a=>byId(a.code)).forEach(a=>{const n=daysTo(a.due_at);hw.push({t:a.title,c:a.code,due:dueTxt(n),done:a.submitted,sid:a.id,kind:a.kind});HWD.push(Math.max(0,n))})}
  if(d.attlog){Object.keys(ATB).forEach(k=>delete ATB[k]);me.reg.forEach(k=>ATB[k]={p:0,a:0,l:0});
   d.attlog.forEach(a=>{const x=ATB[a.course]||(ATB[a.course]={p:0,a:0,l:0});if(a.status==="LATE")x.l++;else if(a.status==="ABSENT")x.a++;else x.p++});ATTLOG=[];lsSet("us_att",[])}
  Object.keys(PERF).forEach(k=>delete PERF[k]);          // مؤشرات الأداء التجريبية لا تُعرض كحقائق في الوضع الحي
 }
 if(d.audit){audit.length=0;d.audit.slice(0,120).forEach(l=>audit.push(new Date(l.at+"Z").toLocaleTimeString(LOC)+" "+l.action))}
 if(d.notifs){const CK=Object.keys(CATL),rd=nReadSet(),mine=lsGet("us_nx",[]).filter(n=>!/^sv/.test(n.id));
  const mapped=d.notifs.map(n=>({role:user?user.role:d.role,id:"sv"+n.id,cat:CK.includes(n.cat)?n.cat:"system",t:n.title,time:new Date(n.at+"Z").toLocaleDateString(LOC),prio:n.prio}));
  lsSet("us_nx",[...mapped,...mine].slice(0,60));d.notifs.forEach(n=>{if(n.read&&!n.broadcast)rd.add("sv"+n.id)});lsSet("us_nread",[...rd])}
 if(d.role==="student"&&d.dash&&d.dash.student.has_photo&&user&&!lsGet("us_photo_"+user.id,null)&&UNI.token())UNI.myPhoto().then(img=>{if(img){lsSet("us_photo_"+user.id,{img,desc:null,by:"student",at:new Date().toISOString()});render()}})}
const nReadSet=()=>new Set(lsGet("us_nread",[]));
async function liveRefresh(){UNI.invalidate();try{liveApply(await UNI.fetchAll(user.role));render()}catch(_){}}
function liveMut(m,id){if(!UNI.on||!user||user.role!=="student")return;const c=byId(id);if(!c||!c.sid)return;
 UNI.call(m,"/api/registrations/"+c.sid).then(r=>{if(!r.ok)toast(r.msg||"تعذّر تنفيذ الطلب");liveRefresh()})}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-myf]");if(!b||!user)return;const[x,id]=b.dataset.myf.split(":");if(x==="pick"){const i=$("#fup");if(i)i.click()}else if(x==="rm")myRemove(id);else if(x==="tg")myToggle(id)});
document.addEventListener("change",e=>{if(e.target&&e.target.id==="fup"){const f=[...e.target.files];e.target.value="";myAdd(f)}});
const hasFiles=e=>e.dataTransfer&&[...(e.dataTransfer.types||[])].includes("Files"),chatBox=e=>e.target.closest&&e.target.closest(".chat");
document.addEventListener("dragover",e=>{const z=chatBox(e);if(z&&user&&["student","doctor"].includes(user.role)&&hasFiles(e)){e.preventDefault();z.classList.add("drag")}});
document.addEventListener("dragleave",e=>{const z=chatBox(e);if(z&&!z.contains(e.relatedTarget))z.classList.remove("drag")});
document.addEventListener("drop",e=>{const z=chatBox(e);if(z&&user&&["student","doctor"].includes(user.role)&&hasFiles(e)){e.preventDefault();z.classList.remove("drag");myAdd(e.dataTransfer.files)}});
function boot(){
staffLoad();kbLoad();load();myLoad();skelUntil=Date.now()+500;setTimeout(()=>{if(user&&tab==="home")render()},520);
if(Q&&Q.state==="run"&&PAGE&&PAGE!=="quiz"){Q.redirected=true;save();location.replace("quiz.html")}
else{render();
 if(Q&&Q.state==="run"){if(Q.vio>quiz.maxV)submit(true);else{Q.timer=setInterval(tick,500);if(Q.proc){loadFaceApi();Q.pt=setInterval(procTick,3000)}try{history.pushState({q:1},"")}catch(_){}showLock("resume");render()}}
 else if(PAGE&&PAGE!=="login"&&user){const g=$("#guide");g.hidden=false;
  if(resumeTour>=0){G.active=true;steps=stepsBy[user.role];G.i=resumeTour;g.classList.remove("dock");pos={x:-100,y:innerHeight-100};g.style.transform=`translate(${pos.x}px,${pos.y}px)`;setTimeout(place,300)}else dock()}}
}
UNI.ready.then(async()=>{try{if(PAGE==="login")UNI.ping().then(on=>{const e=$("#mode");if(e)e.textContent=on?"متصل بخادم الجامعة":"وضع تجريبي: البيانات داخل المتصفح"});
 if(UNI.on&&UNI.token()){const sv=JSON.parse(sessionStorage.getItem(SK)||"null");if(sv&&sv.user){user=sv.user;liveApply(await UNI.fetchAll(sv.user.role));user=null}}}catch(e){}boot()});

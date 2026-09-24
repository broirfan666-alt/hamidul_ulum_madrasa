/* ---------- sound ---------- */
let audioCtx; let soundMode = "tick";
function playTick(){
  if(soundMode==="off") return;
  try{
    audioCtx = audioCtx || new (window.AudioContext||window.webkitAudioContext)();
    const t=audioCtx.currentTime; const o=audioCtx.createOscillator(); const g=audioCtx.createGain();
    if(soundMode==="pop"){ o.type="sine"; o.frequency.setValueAtTime(600,t); o.frequency.exponentialRampToValueAtTime(150,t+0.09);
      g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(0.2,t+0.01); g.gain.exponentialRampToValueAtTime(0.0001,t+0.12);
      o.connect(g); g.connect(audioCtx.destination); o.start(t); o.stop(t+0.13);
    } else if(soundMode==="soft"){ o.type="sine"; o.frequency.setValueAtTime(500,t);
      g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(0.08,t+0.02); g.gain.exponentialRampToValueAtTime(0.0001,t+0.15);
      o.connect(g); g.connect(audioCtx.destination); o.start(t); o.stop(t+0.16);
    } else { o.type="square"; o.frequency.setValueAtTime(1800,t);
      g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(0.15,t+0.003); g.gain.exponentialRampToValueAtTime(0.0001,t+0.045);
      o.connect(g); g.connect(audioCtx.destination); o.start(t); o.stop(t+0.05);
    }
  }catch(e){}
}
function setSoundMode(m){ soundMode=m; ["tick","pop","soft","off"].forEach(k=>{const el=document.getElementById("snd_"+k); if(el) el.classList.toggle("active",k===m);}); playTick(); }
function toggleDark(){ playTick(); document.body.classList.toggle("dark");
  const on=document.body.classList.contains("dark");
  document.getElementById("darkLabel").textContent = on?"হোয়াইট মোড চালু করুন":"ডার্ক মোড চালু করুন"; }
function setAccent(c){ document.documentElement.style.setProperty('--accent',c); playTick(); }
function openModal(id){ playTick(); document.getElementById(id).classList.add("show");
  if(id==="notifModal"){ const b=document.getElementById("notifBadge"); if(b) b.style.display="none"; } }
function closeModal(id){ document.getElementById(id).classList.remove("show"); }

/* ---------- supabase ---------- */
if(typeof supabase === "undefined"){
  document.addEventListener("DOMContentLoaded",()=>{
    const m=document.getElementById("authMsg"); if(m){ m.textContent="ইন্টারনেট কানেকশন চেক করুন — লাইব্রেরি লোড হয়নি।"; m.style.color="#a00"; }
  });
  throw new Error("supabase-js CDN load failed");
}
const sb = supabase.createClient(
  "https://viebdkvcnrhlogoghlnc.supabase.co",
  "sb_publishable_RFgqh8KpqTamA1ozPy0Maw_k3X2jZg3"
);
let profile=null, current="home";

async function doSignUp(){
  const full_name=document.getElementById("authName").value.trim();
  const email=document.getElementById("authEmail").value.trim();
  const password=document.getElementById("authPass").value;
  const {data,error} = await sb.auth.signUp({email,password});
  if(error){ amsg(error.message); return; }
  if(data.user && full_name){ await sb.from("profiles").update({full_name}).eq("id",data.user.id); }
  amsg("আইডি তৈরি হয়েছে। এখন লগইন করুন।");
}
async function doSignIn(){
  const email=document.getElementById("authEmail").value.trim();
  const password=document.getElementById("authPass").value;
  const {error} = await sb.auth.signInWithPassword({email,password});
  if(error){ amsg(error.message); return; }
  afterLogin();
}
function amsg(t){ const m=document.getElementById("authMsg"); if(m) m.textContent=t; }
async function doLogout(){ await sb.auth.signOut(); location.reload(); }

async function afterLogin(){
  const {data:{user}} = await sb.auth.getUser();
  const {data:p} = await sb.from("profiles").select("*").eq("id",user.id).single();
  profile = p;
  document.getElementById("loginScreen").style.display="none";
  document.getElementById("avatarBtn").textContent = profile.role==="admin" ? "🛡️" : "🕌";
  document.getElementById("profName").value = profile.full_name || "";
  document.getElementById("profContact").value = user.email;
  render();
}
async function saveProfile(){
  const full_name=document.getElementById("profName").value.trim();
  const newPass=document.getElementById("profPass").value;
  await sb.from("profiles").update({full_name}).eq("id",profile.id);
  if(newPass){ const {error}=await sb.auth.updateUser({password:newPass}); if(error){document.getElementById("profMsg").textContent=error.message; return;} }
  profile.full_name=full_name;
  document.getElementById("profMsg").textContent="সংরক্ষিত হয়েছে ✅";
  playTick();
}
sb.auth.getSession().then(({data:{session}})=>{ if(session) afterLogin(); });

/* ---------- app ---------- */
const menu = [
  {id:"rules",icon:"📜",label:"নিয়ম কানুন"}, {id:"admission",icon:"📝",label:"ভর্তি আবেদন"},
  {id:"salary",icon:"💰",label:"মাসিক বেতন"}, {id:"complaints",icon:"📢",label:"অভিযোগ কেন্দ্র"},
  {id:"total",icon:"👥",label:"মোট ছাত্র সংখ্যা"}, {id:"dept",icon:"🏫",label:"বিভাগীয় ছাত্র"},
  {id:"notice",icon:"🔔",label:"জরুরী নোটিশ"}, {id:"result",icon:"📊",label:"পরীক্ষার ফলাফল"}
];
const titles = {rules:"নিয়ম কানুন",admission:"ভর্তি আবেদন",salary:"মাসিক বেতন",complaints:"অভিযোগ কেন্দ্র",
  total:"মোট ছাত্র সংখ্যা",dept:"বিভাগীয় ছাত্র",notice:"জরুরী নোটিশ",result:"পরীক্ষার ফলাফল"};

function esc(s){ return (s||"").toString().replace(/</g,"&lt;"); }
function openScreen(id){ playTick(); current=id; render(); }
function goHome(){ playTick(); current="home"; render(); }
document.getElementById("backBtn").addEventListener("click", goHome);

async function render(){
  const c=document.getElementById("content");
  document.getElementById("backBtn").style.display = current==="home" ? "none":"flex";
  document.getElementById("titlePill").textContent = current==="home" ? "হোম" : titles[current] + (profile.role==="admin"?" (এডমিন)":"");
  c.innerHTML="লোড হচ্ছে...";
  if(current==="home") return renderHome(c);
  if(current==="rules") return renderRules(c);
  if(current==="admission") return renderAdmission(c);
  if(current==="salary") return renderSalary(c);
  if(current==="complaints") return renderComplaints(c);
  if(current==="total" || current==="dept") return renderDeptList(c);
  if(current==="notice") return renderNotice(c);
  if(current==="result") return renderResult(c);
}

async function renderHome(c){
  let html="";
  if(profile.role==="admin"){
    const {data:deps}=await sb.from("departments").select("*");
    const total=(deps||[]).reduce((a,d)=>a+d.student_count,0);
    const {data:sal}=await sb.from("salary_payments").select("status");
    const pct = sal && sal.length ? Math.round(sal.filter(s=>s.status==="approved").length/sal.length*100) : 0;
    html += `<div class="donut-wrap glass-pill"><div class="donut" style="background:conic-gradient(#4fd15f ${pct}%, rgba(255,255,255,0.15) ${pct}% 100%);"><span>${pct}%</span></div>
      <div><div style="font-weight:900;font-size:14px;">মোট ছাত্র: ${total} জন</div><div style="font-size:12.5px;margin-top:4px;">এই মাসের বেতন পরিশোধ করেছে ${pct}% ছাত্র</div></div></div>`;
  }
  html+='<div class="grid">';
  menu.forEach(m=>{ html+=`<div class="menucard" onclick="openScreen('${m.id}')"><div class="glass-icon">${m.icon}</div><div class="menulabel">${m.label}</div></div>`; });
  html+='</div>'; c.innerHTML=html;
}

async function renderRules(c){
  const {data}=await sb.from("rules").select("*").order("position");
  let html='<div class="panel">';
  (data||[]).forEach((r,i)=>{ html+=`<div class="item-row"><div class="circle-num">${i+1}</div><div style="flex:1">${esc(r.content)}</div></div>`; });
  if(profile.role==="admin"){
    html+=`<div class="admin-box"><label class="section-h">নতুন নিয়ম যোগ করুন</label>
      <input type="text" id="newRule" onkeypress="if(event.key==='Enter'){addRule();}">
      <button class="small-btn" onclick="addRule()">➕ যোগ করুন</button></div>`;
  }
  html+='</div>'; c.innerHTML=html;
}
async function addRule(){ const v=document.getElementById("newRule").value.trim(); if(!v)return; await sb.from("rules").insert({content:v}); render(); }

async function renderNotice(c){
  const {data}=await sb.from("notices").select("*").eq("id",1).single();
  if(profile.role==="admin"){
    c.innerHTML=`<div class="panel"><label class="section-h">নোটিশ সম্পাদনা করুন</label>
      <textarea rows="7" id="noticeTxt">${esc(data?.content)}</textarea>
      <button class="small-btn" onclick="saveNotice()">💾 সংরক্ষণ করুন</button></div>`;
  } else {
    c.innerHTML=`<div class="panel"><div class="item-row" style="align-items:flex-start;white-space:pre-wrap;">${esc(data?.content)}</div></div>`;
  }
}
async function saveNotice(){ const v=document.getElementById("noticeTxt").value; await sb.from("notices").update({content:v,updated_at:new Date()}).eq("id",1); render(); }

async function renderDeptList(c){
  const {data}=await sb.from("departments").select("*");
  let html='<div class="panel">';
  (data||[]).forEach(d=>{
    html+=`<div class="item-row"><div style="flex:1">${esc(d.name)} বিভাগে ছাত্র আছে
      ${profile.role==="admin" ? `<input type="number" style="width:70px;display:inline-block;margin-left:6px;" value="${d.student_count}" onchange="updDept(${d.id},this.value)">` : `<b>${d.student_count}</b>`} জন</div></div>`;
  });
  html+='</div>'; c.innerHTML=html;
}
async function updDept(id,val){ await sb.from("departments").update({student_count:parseInt(val)||0}).eq("id",id); playTick(); }

async function renderComplaints(c){
  if(profile.role==="admin"){
    const {data}=await sb.from("complaints").select("*").order("created_at",{ascending:false});
    let html='<div class="panel">';
    (data||[]).forEach(x=>{ html+=`<div class="item-row"><div style="flex:1">${esc(x.content)}</div></div>`; });
    html+='</div>'; c.innerHTML=html;
  } else {
    c.innerHTML=`<div class="panel"><div class="field"><label>আপনার অভিযোগ লিখুন</label>
      <textarea rows="4" id="compTxt"></textarea></div>
      <button class="small-btn" onclick="sendComplaint()">📩 জমা দিন</button>
      <div class="msg" id="compMsg" style="font-size:12px;margin-top:6px;"></div></div>`;
  }
}
async function sendComplaint(){
  const v=document.getElementById("compTxt").value.trim(); if(!v)return;
  await sb.from("complaints").insert({content:v,user_id:profile.id});
  document.getElementById("compMsg").textContent="জমা হয়েছে, ধন্যবাদ।"; playTick();
}

async function renderSalary(c){
  const q = profile.role==="admin" ? sb.from("salary_payments").select("*") : sb.from("salary_payments").select("*").eq("user_id",profile.id);
  const {data}=await q.order("created_at",{ascending:false});
  let html='<div class="panel">';
  (data||[]).forEach(s=>{
    const label = profile.role==="admin" ? `${esc(s.student_name||"")} — ${esc(s.month)}` : `${esc(s.month)} মাসের বেতন`;
    html+=`<div class="item-row"><div style="flex:1">${label}
      ${s.status==="approved" ? `<div class="pay-status pay-approved">পরিশোধিত</div>` : `<div class="pay-status pay-pending">অপেক্ষমাণ</div>`}</div>
      ${profile.role==="admin" && s.status!=="approved" ? `<button class="small-btn" onclick="approveSalary(${s.id})">Approve</button>` : ""}</div>`;
  });
  if(profile.role!=="admin"){
    html+=`<div class="admin-box"><div class="field"><label>ছাত্রের নাম</label><input id="salName"></div>
      <div class="field"><label>মাস</label><input id="salMonth" placeholder="যেমন: সেপ্টেম্বর"></div>
      <button class="small-btn" onclick="requestSalary()">পরিশোধ করেছি জানান</button></div>`;
  }
  html+='</div>'; c.innerHTML=html;
}
async function requestSalary(){
  const student_name=document.getElementById("salName").value.trim();
  const month=document.getElementById("salMonth").value.trim(); if(!month)return;
  await sb.from("salary_payments").insert({user_id:profile.id,student_name,month}); render();
}
async function approveSalary(id){ await sb.from("salary_payments").update({status:"approved",paid_at:new Date()}).eq("id",id); render(); }

async function renderResult(c){
  const {data:deps}=await sb.from("departments").select("name");
  let html=`<div class="panel"><div class="field"><label>বিভাগ নির্বাচন করুন</label>
    <select id="resDept" onchange="loadResult(this.value)"><option value="">বিভাগ নির্বাচন করুন</option>
    ${(deps||[]).map(d=>`<option value="${d.name}">${d.name}</option>`).join("")}</select></div>
    <div id="resultBody"></div>`;
  if(profile.role==="admin"){
    html+=`<div class="admin-box"><label class="section-h">নতুন ছাত্রের নম্বর যোগ করুন</label>
      <input type="text" id="rName" placeholder="নাম">
      <input type="number" id="rTil" placeholder="তিলাওয়াত" style="margin-top:6px;">
      <input type="number" id="rTaj" placeholder="তাজবিদ" style="margin-top:6px;">
      <button class="small-btn" onclick="addResult()">➕ যোগ করুন (নির্বাচিত বিভাগে)</button></div>`;
  }
  html+='</div>'; c.innerHTML=html;
}
async function loadResult(dept){
  const box=document.getElementById("resultBody");
  if(!dept){ box.innerHTML='<div style="text-align:center;padding:20px;opacity:0.8;">বিভাগ নির্বাচন করুন</div>'; return; }
  const {data}=await sb.from("results").select("*").eq("department",dept);
  const rows=(data||[]).map(r=>({...r,total:r.tilawat+r.tajbid})).sort((a,b)=>b.total-a.total);
  let html=`<div style="font-weight:900;margin:8px 0;">নির্বাচিত বিভাগ: ${dept}</div>
    <div style="overflow-x:auto;"><table><tr><th>নাম</th><th>তিলাওয়াত</th><th>তাজবিদ</th><th>মোট</th><th>স্থান</th></tr>`;
  rows.forEach((r,i)=>{ const rc=i===0?"rank-1":i===1?"rank-2":i===2?"rank-3":""; const suf=i===0?"ম":"য়";
    html+=`<tr><td>${esc(r.student_name)}</td><td>${r.tilawat}</td><td>${r.tajbid}</td><td>${r.total}</td><td class="${rc}">${i+1}${suf}</td></tr>`; });
  html+='</table></div>'; box.innerHTML=html;
}
async function addResult(){
  const dept=document.getElementById("resDept").value; if(!dept){alert("আগে বিভাগ নির্বাচন করুন");return;}
  const student_name=document.getElementById("rName").value.trim();
  const tilawat=parseInt(document.getElementById("rTil").value)||0;
  const tajbid=parseInt(document.getElementById("rTaj").value)||0;
  if(!student_name)return;
  await sb.from("results").insert({department:dept,student_name,tilawat,tajbid}); loadResult(dept);
}

async function renderAdmission(c){
  if(profile.role==="admin"){
    const {data}=await sb.from("admissions").select("*").eq("status","pending");
    let html='<div class="panel">';
    (data||[]).forEach(a=>{ html+=`<div class="item-row"><div style="flex:1">${esc(a.student_name)} — ${esc(a.jamat)}</div>
      <button class="small-btn" onclick="approveAdm(${a.id})">Approve</button></div>`; });
    html+='</div>'; c.innerHTML=html; return;
  }
  c.innerHTML=`<div class="panel">
    <div class="section-h">ছাত্রের তথ্য</div>
    <div class="field"><label>ছাত্রের পূর্ণ নাম</label><input id="fStudent"></div>
    <div class="field"><label>বয়স</label><input id="fAge" type="number"></div>
    <div class="field"><label>পাসপোর্ট সাইজের ছবি</label><input id="fPhoto" type="file" accept="image/*"></div>
    <div class="field"><label>জন্ম নিবন্ধন সনদ</label><input id="fBirth" type="file" accept="image/*"></div>
    <div class="section-h">পিতার তথ্য ও ঠিকানা</div>
    <div class="field"><label>পিতার নাম</label><input id="fFather"></div>
    <div class="field"><label>গ্রাম</label><input id="fVillage"></div>
    <div class="field"><label>উপজেলা/থানা</label><input id="fUpazila"></div>
    <div class="field"><label>জেলা</label><input id="fDistrict"></div>
    <div class="field"><label>অভিভাবকের মোবাইল</label><input id="fPhone"></div>
    <div class="field"><label>কোন জামাতে পড়তে ইচ্ছুক</label><input id="fJamat"></div>
    <button class="small-btn" style="width:100%;" onclick="submitAdmission()">✅ আবেদন জমা দিন</button>
    <div class="msg" id="admMsg" style="font-size:12px;margin-top:6px;"></div></div>`;
}
async function uploadFile(inputId,prefix){
  const f=document.getElementById(inputId).files[0]; if(!f)return null;
  const path=`${prefix}_${Date.now()}_${f.name}`;
  const {error}=await sb.storage.from("admission-docs").upload(path,f);
  if(error){ document.getElementById("admMsg").textContent=error.message; return null; }
  return sb.storage.from("admission-docs").getPublicUrl(path).data.publicUrl;
}
async function submitAdmission(){
  document.getElementById("admMsg").textContent="জমা হচ্ছে...";
  const passport_photo_url=await uploadFile("fPhoto","passport");
  const birth_cert_url=await uploadFile("fBirth","birth");
  const payload={ student_name:document.getElementById("fStudent").value.trim(), age:parseInt(document.getElementById("fAge").value)||null,
    father_name:document.getElementById("fFather").value.trim(), village:document.getElementById("fVillage").value.trim(),
    upazila:document.getElementById("fUpazila").value.trim(), district:document.getElementById("fDistrict").value.trim(),
    guardian_phone:document.getElementById("fPhone").value.trim(), jamat:document.getElementById("fJamat").value.trim(),
    passport_photo_url, birth_cert_url, created_by:profile.id };
  const {error}=await sb.from("admissions").insert(payload);
  document.getElementById("admMsg").textContent = error ? error.message : "আবেদন সফলভাবে জমা হয়েছে ✅";
}
async function approveAdm(id){ await sb.from("admissions").update({status:"approved"}).eq("id",id); render(); }

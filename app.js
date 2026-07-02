const KEY="workpilot2_clean_v1";
const DAYS=["월","화","수","목","금"];
const emptyChecks=()=>[[false,false],[false,false],[false,false],[false,false],[false,false]];
const defaults={view:"home",hideDone:false,closed:{todo:false,doing:false,done:true},tasks:[],schedules:[]};
let data=load(), search="", filter="all";
const $=id=>document.getElementById(id);
function clone(o){return JSON.parse(JSON.stringify(o))}
function load(){try{return JSON.parse(localStorage.getItem(KEY))||clone(defaults)}catch{return clone(defaults)}}
function save(){localStorage.setItem(KEY,JSON.stringify(data))}
function today(){return new Date().toISOString().slice(0,10)}
function esc(s){return String(s).replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]))}
function dday(d){if(!d)return"";let diff=Math.ceil((new Date(d)-new Date(today()))/86400000);return diff===0?"D-Day":diff>0?`D-${diff}`:`D+${Math.abs(diff)}`}
function progress(t){return Math.round(t.checks.flat().filter(Boolean).length/10*100)}
function addTask(){let title=$("taskInput").value.trim();if(!title)return;data.tasks.unshift({id:Date.now(),title,status:"todo",priority:$("priorityInput").value,memo:"",due:"",pin:false,open:false,checks:emptyChecks()});$("taskInput").value="";save();render()}
function addSchedule(){let title=$("scheduleTitle").value.trim();if(!title)return;data.schedules.push({id:Date.now(),title,date:$("scheduleDate").value||today(),time:$("scheduleTime").value,memo:$("scheduleMemo").value.trim()});["scheduleTitle","scheduleTime","scheduleMemo"].forEach(id=>$(id).value="");$("scheduleDate").value=today();save();render()}
function patch(id,obj){let t=data.tasks.find(x=>x.id==id);if(t)Object.assign(t,obj);save();render()}
function delTask(id){if(confirm("삭제할까요?")){data.tasks=data.tasks.filter(t=>t.id!=id);save();render()}}
function delSchedule(id){if(confirm("일정을 삭제할까요?")){data.schedules=data.schedules.filter(s=>s.id!=id);save();render()}}
function toggleCheck(id,d,k){let t=data.tasks.find(x=>x.id==id); if(t)t.checks[d][k]=!t.checks[d][k]; save(); render()}
function setView(v){data.view=v;save();render()}
function toggleSec(s){data.closed[s]=!data.closed[s];save();render()}
function tasksFiltered(){let arr=[...data.tasks].sort((a,b)=>(b.pin-a.pin)||a.id-b.id);if(search)arr=arr.filter(t=>(t.title+t.memo).toLowerCase().includes(search.toLowerCase()));if(filter!="all")arr=arr.filter(t=>t.priority==filter);if(data.hideDone)arr=arr.filter(t=>t.status!="done");return arr}
function todayTasks(){return data.tasks.filter(t=>t.status!="done"&&(t.status=="doing"||t.priority=="high"||t.pin||!t.due||t.due<=today()))}
function todaySchedules(){return data.schedules.filter(s=>s.date==today()).sort((a,b)=>(a.time||"99:99").localeCompare(b.time||"99:99"))}
function upcoming(){return data.schedules.filter(s=>s.date>=today()).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)).slice(0,5)}
function taskHTML(t){let p=progress(t);return `<div class="task"><div class="taskTop"><input class="taskTitle" value="${esc(t.title)}" onchange="patch(${t.id},{title:this.value})"><button class="sub" onclick="patch(${t.id},{open:${!t.open}})">${t.open?"상세 닫기":"상세 보기"}</button></div><div class="badges"><span class="badge ${t.priority}">${t.priority=="high"?"🔴 긴급":t.priority=="mid"?"🟡 보통":"🟢 낮음"}</span>${t.pin?'<span class="badge pin">📌 고정</span>':""}${t.due?`<span class="badge">${dday(t.due)}</span>`:""}<span class="badge">${p}%</span></div><div class="bar"><div style="width:${p}%"></div></div>${t.open?detailHTML(t):""}</div>`}
function detailHTML(t){return `<div class="detail"><textarea placeholder="메모" onchange="patch(${t.id},{memo:this.value})">${esc(t.memo)}</textarea><div class="row"><select onchange="patch(${t.id},{status:this.value})"><option value="todo" ${t.status=="todo"?"selected":""}>해야 할 일</option><option value="doing" ${t.status=="doing"?"selected":""}>진행 중</option><option value="done" ${t.status=="done"?"selected":""}>완료</option></select><select onchange="patch(${t.id},{priority:this.value})"><option value="high" ${t.priority=="high"?"selected":""}>긴급</option><option value="mid" ${t.priority=="mid"?"selected":""}>보통</option><option value="low" ${t.priority=="low"?"selected":""}>낮음</option></select><input type="date" value="${t.due}" onchange="patch(${t.id},{due:this.value})"><button class="sub" onclick="patch(${t.id},{pin:${!t.pin}})">${t.pin?"고정해제":"고정"}</button></div><div class="checks">${DAYS.map((d,i)=>`<div class="daycheck"><strong>${d}</strong><label><input type="checkbox" ${t.checks[i][0]?"checked":""} onchange="toggleCheck(${t.id},${i},0)"> 시작</label><label><input type="checkbox" ${t.checks[i][1]?"checked":""} onchange="toggleCheck(${t.id},${i},1)"> 완료</label></div>`).join("")}</div><div class="row"><button class="danger" onclick="delTask(${t.id})">삭제</button></div></div>`}
function section(status,title,tasks){return `<section class="section ${data.closed[status]?"closed":""}"><button class="sectionBtn" onclick="toggleSec('${status}')"><b>${data.closed[status]?"▸":"▾"} ${title}</b><span>${tasks.length}</span></button><div class="tasks">${tasks.length?tasks.map(taskHTML).join(""):'<div class="empty">등록된 업무가 없습니다.</div>'}</div></section>`}
function scheduleHTML(s){return `<div class="item scheduleItem"><div><b>${esc(s.title)}</b><br><span>${s.date} ${s.time||""} ${esc(s.memo||"")}</span></div><button class="danger" onclick="delSchedule(${s.id})">삭제</button></div>`}
function render(){
 ["home","tasks","schedule","report","settings"].forEach(v=>{$("view-"+v).classList.toggle("active",data.view==v)});
 document.querySelectorAll(".nav,.mnav").forEach(b=>b.classList.toggle("active",b.dataset.view==data.view));
 $("title").textContent={home:"홈",tasks:"업무",schedule:"일정",report:"리포트",settings:"설정"}[data.view];
 let done=data.tasks.filter(t=>t.status=="done").length, high=data.tasks.filter(t=>t.priority=="high"&&t.status!="done").length;
 let rate=data.tasks.length?Math.round(done/data.tasks.length*100):0;
 $("rate").textContent=rate+"%"; $("rateBar").style.width=rate+"%"; $("taskTotal").textContent=data.tasks.length; $("doneTotal").textContent=done; $("highTotal").textContent=high; $("todayScheduleTotal").textContent=todaySchedules().length;
 let next=todayTasks()[0]||todaySchedules()[0]; $("recommendTitle").textContent=next?next.title:"아직 업무가 없습니다"; $("recommendText").textContent=next?(next.date?`${next.date} ${next.time||""}`:(next.priority=="high"?"긴급 업무":"추천 업무")):"업무 또는 일정을 추가해 시작하세요.";
 $("todayScheduleLabel").textContent=todaySchedules().length+"건"; $("homeSchedules").innerHTML=todaySchedules().map(scheduleHTML).join("")||'<div class="empty">오늘 일정이 없습니다.</div>';
 $("todayTaskLabel").textContent=todayTasks().length+"건"; $("homeTasks").innerHTML=todayTasks().map(t=>`<div class="item">${esc(t.title)}</div>`).join("")||'<div class="empty">오늘 업무가 없습니다.</div>';
 let arr=tasksFiltered(), groups={todo:arr.filter(t=>t.status=="todo"),doing:arr.filter(t=>t.status=="doing"),done:arr.filter(t=>t.status=="done")};
 $("taskSections").innerHTML=section("todo","해야 할 일",groups.todo)+section("doing","진행 중",groups.doing)+section("done","완료",groups.done);
 $("scheduleDate").value=$("scheduleDate").value||today(); $("scheduleTotal").textContent=data.schedules.length+"건"; $("scheduleList").innerHTML=data.schedules.slice().sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)).map(scheduleHTML).join("")||'<div class="empty">등록된 일정이 없습니다.</div>';
 $("pinned").innerHTML=data.tasks.filter(t=>t.pin).map(t=>`<div class="item">${esc(t.title)}</div>`).join("")||'<div class="item">고정 없음</div>'; $("upcoming").innerHTML=upcoming().map(s=>`<div class="item">${esc(s.title)}<br><span>${s.date} ${s.time||""}</span></div>`).join("")||'<div class="item">다가오는 일정 없음</div>';
 $("report").innerHTML=`전체 업무: ${data.tasks.length}건<br>완료: ${done}건<br>긴급 미완료: ${high}건<br>전체 일정: ${data.schedules.length}건<br>오늘 일정: ${todaySchedules().length}건<br>진행률: ${rate}%`;
 $("hideDone").textContent=data.hideDone?"완료 보이기":"완료 숨기기";
}
function exportCSV(){let rows=[["TYPE","상태/날짜","제목","우선순위/시간","메모"],...data.tasks.map(t=>["TASK",t.status,t.title,t.priority,t.memo]),...data.schedules.map(s=>["SCHEDULE",s.date,s.title,s.time,s.memo])];let csv=rows.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(",")).join("\\n");let blob=new Blob(["\\ufeff"+csv],{type:"text/csv;charset=utf-8"});let a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="workpilot2_backup.csv";a.click()}
document.querySelectorAll(".nav,.mnav").forEach(b=>b.onclick=()=>setView(b.dataset.view)); $("addTask").onclick=addTask; $("taskInput").onkeydown=e=>{if(e.key=="Enter")addTask()}; $("addSchedule").onclick=addSchedule; $("search").oninput=e=>{search=e.target.value;render()}; $("filter").onchange=e=>{filter=e.target.value;render()}; $("hideDone").onclick=()=>{data.hideDone=!data.hideDone;save();render()}; $("exportData").onclick=exportCSV; $("resetAll").onclick=()=>{if(confirm("전체 초기화할까요?")){data=clone(defaults);save();render()}}; render();

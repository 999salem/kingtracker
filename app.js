const API_BASE="https://api-web.nhle.com/v1";
const PROXIES=[url=>`https://proxy.cors.dev/${url}`,url=>`https://corsproxy.io/?url=${encodeURIComponent(url)}`];
const TEAM="LAK";
const $=id=>document.getElementById(id);
const state={schedule:[],roster:[],standings:[],watch:new Set(JSON.parse(localStorage.getItem("kings-watchlist")||"[]"))};
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const dateFmt=s=>s?new Date(s).toLocaleString(undefined,{weekday:"short",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"}):"Time TBA";
const num=(n,d=1)=>Number.isFinite(Number(n))?Number(n).toFixed(d):"—";
const logoUrl=abbr=>`https://assets.nhle.com/logos/nhl/svg/${String(abbr||"").toUpperCase()}_dark.svg`;
const teamLogo=(abbr,name,cls="team-logo")=>`<img class="${cls}" src="${logoUrl(abbr)}" alt="${esc(name||abbr||"NHL team")} logo" loading="lazy" onerror="this.style.display='none'">`;

async function get(path){
  const target=`${API_BASE}${path}`;
  let lastError;
  for(const makeUrl of PROXIES){
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),10000);
    try{
      const r=await fetch(makeUrl(target),{headers:{Accept:"application/json"},signal:controller.signal,cache:"no-store",mode:"cors"});
      if(!r.ok)throw Error(`Feed returned ${r.status}`);
      const data=await r.json();
      if(!data||typeof data!=="object")throw Error("Unexpected NHL response");
      return data;
    }catch(e){lastError=e}
    finally{clearTimeout(timeout)}
  }
  throw lastError||Error("NHL feeds unavailable");
}
function setStatus(msg,ok=false){$("status").textContent=msg;$("connection").textContent=ok?"LIVE DATA":"DATA STATUS";$("connection").style.color=ok?"#bfc5ca":"#b7a38a"}
function go(page){document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id===`page-${page}`));document.querySelectorAll(".nav").forEach(b=>b.classList.toggle("active",b.dataset.page===page));$("mobileMenu").value=page}
document.querySelectorAll(".nav").forEach(b=>b.addEventListener("click",()=>go(b.dataset.page)));
document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>go(b.dataset.go)));
$("mobileMenu").addEventListener("change",e=>go(e.target.value));
function renderRows(el,rows){el.innerHTML=rows.length?rows.map(([a,b])=>`<div class="listrow"><span>${esc(a)}</span><span class="muted">${esc(b)}</span></div>`).join(""):'<p class="muted">No data available.</p>'}
function getTeamName(g,home){return home?(g.homeTeam?.placeName?.default||g.homeTeam?.name?.default||"Home"):(g.awayTeam?.placeName?.default||g.awayTeam?.name?.default||"Away")}
function gameStatus(g){if(g.gameState==="LIVE"||g.gameState==="CRIT")return `${g.periodDescriptor?.number?`P${g.periodDescriptor.number}`:"LIVE"} · ${g.clock?.timeRemaining||"IN PROGRESS"}`;if(g.gameState==="FINAL"||g.gameState==="OFF")return "FINAL";return dateFmt(g.startTimeUTC)}
function renderGame(g){if(!g)return;$("game-label").textContent=g.gameState==="LIVE"||g.gameState==="CRIT"?"LIVE GAME":"NEXT MATCHUP";$("game-vs").textContent=g.gameState==="LIVE"||g.gameState==="CRIT"?`${g.awayTeam?.score??0} — ${g.homeTeam?.score??0}`:"VS";const isHome=g.homeTeam?.id===LAK_ID;const opponent=isHome?g.awayTeam:g.homeTeam;const oppName=opponent?.placeName?.default||opponent?.name?.default||"OPPONENT";
$("opponent-mark").innerHTML=teamLogo(opponent?.abbrev,oppName,"opponent-logo");$("opponent-name").textContent=oppName.toUpperCase();$("opponent-record").textContent=isHome?"HOME":"AWAY";$("game-time").textContent=gameStatus(g);$("game-venue").textContent=g.venue?.default||"NHL GAME";if($("gamecenter"))$("gamecenter").innerHTML=`<div class="cardhead"><h2>${esc(g.awayTeam?.placeName?.default||"AWAY")} @ ${esc(g.homeTeam?.placeName?.default||"HOME")}</h2><span class="tag">${esc(g.gameState||"SCHEDULED")}</span></div><div class="listrow"><b>${esc(g.awayTeam?.name?.default||"Away")}</b><strong>${g.awayTeam?.score??"—"}</strong></div><div class="listrow"><b>${esc(g.homeTeam?.name?.default||"Home")}</b><strong>${g.homeTeam?.score??"—"}</strong></div><p class="muted">${esc(gameStatus(g))}</p><p class="muted">Detailed play-by-play is available from the NHL game feed when provided for this game.</p>`}
const LAK_ID=26;
async function loadScore(){try{const d=await get("/scoreboard/LAK/now");const games=d.games||[];const today=games.find(g=>g.homeTeam?.id===LAK_ID||g.awayTeam?.id===LAK_ID);if(today)renderGame(today);return !!today}catch(e){console.warn(e)}}
async function loadSchedule(){try{let d;try{d=await get("/club-schedule-season/LAK/now")}catch(e){d=await get("/club-schedule/LAK/week/now")}state.schedule=d.games||[];renderSchedule();const upcoming=state.schedule.find(g=>!["FINAL","OFF"].includes(g.gameState));if(upcoming)renderGame(upcoming);return true}catch(e){console.warn("Schedule request failed",e);$("schedule-list").innerHTML='<p class="muted">Could not load the NHL schedule from this browser right now. Tap refresh, or check the official NHL schedule.</p><p><a href="https://www.nhl.com/kings/schedule" target="_blank" rel="noopener">Open official Kings schedule ↗</a></p>';return false}}
function renderSchedule(){const games=state.schedule.slice().sort((a,b)=>new Date(a.startTimeUTC)-new Date(b.startTimeUTC));$("schedule-list").innerHTML=games.length?`<table><thead><tr><th>DATE</th><th>MATCHUP</th><th>RESULT</th><th>STATUS</th><th></th></tr></thead><tbody>${games.map(g=>{const home=g.homeTeam?.id===LAK_ID;const opp=home?g.awayTeam:g.homeTeam;return `<tr><td>${esc(dateFmt(g.startTimeUTC))}</td><td>${teamLogo("LAK","Los Angeles Kings")} LAK ${home?"vs":"@"} ${teamLogo(opp?.abbrev,opp?.placeName?.default)} ${esc(opp?.abbrev||opp?.placeName?.default||"—")}</td><td>${g.gameState==="FINAL"||g.gameState==="OFF"?`${g.homeTeam?.score??0}–${g.awayTeam?.score??0}`:"—"}</td><td>${esc(g.gameState||"Scheduled")}</td><td><button class="textbutton" data-game="${g.id}">OPEN ↗</button></td></tr>`}).join("")}</tbody></table>`:'<p class="muted">No schedule returned.</p>';document.querySelectorAll("[data-game]").forEach(b=>b.addEventListener("click",()=>{const g=state.schedule.find(x=>String(x.id)===b.dataset.game);if(g){renderGame(g);go("game")}}))}
function renderStandings(mode="conference"){
 const list=state.standings.filter(t=>mode==="league"||t.conferenceAbbrev==="W"||t.conferenceName==="Western").sort((a,b)=>(mode==="league"?(a.leagueSequence||999)-(b.leagueSequence||999):(a.conferenceSequence||999)-(b.conferenceSequence||999)));
 const rows=list.map((t,i)=>`<tr><td>${mode==="league"?(t.leagueSequence??i+1):(t.conferenceSequence??i+1)}</td><td>${teamLogo(t.teamAbbrev?.default||t.teamAbbrev,t.teamName?.default||"Team")} ${esc(t.teamName?.default||t.teamAbbrev?.default||"Team")}</td><td>${t.wins??0}</td><td>${t.losses??0}</td><td>${t.otLosses??0}</td><td><b>${t.points??0}</b></td></tr>`).join("");
 $("standings-table").innerHTML=`<table><thead><tr><th>#</th><th>TEAM</th><th>W</th><th>L</th><th>OT</th><th>PTS</th></tr></thead><tbody>${rows}</tbody></table>`;
 renderRows($("mini-standings"),list.slice(0,6).map(t=>[`${t.conferenceSequence}. ${t.teamName?.default||"Team"}`,`${t.points??0} pts`]));
}
async function loadStandings(){try{const d=await get("/standings/now");state.standings=d.standings||[];renderStandings(document.querySelector(".standings-tab.active")?.dataset.standings||"conference");const lak=state.standings.find(t=>t.teamAbbrev?.default==="LAK"||t.teamAbbrev==="LAK");if(lak){$("record").textContent=`${lak.wins}-${lak.losses}-${lak.otLosses}`;$("rank").textContent=lak.conferenceSequence??"—"}return true}catch(e){$("standings-table").textContent="Standings feed unavailable.";console.warn(e)}}
document.querySelectorAll("[data-standings]").forEach(btn=>btn.addEventListener("click",()=>{document.querySelectorAll("[data-standings]").forEach(x=>x.classList.toggle("active",x===btn));renderStandings(btn.dataset.standings)}));
async function loadRoster(){try{const d=await get("/roster/LAK/current");state.roster=[...(d.forwards||[]),...(d.defensemen||[]),...(d.goalies||[])];renderRoster();return true}catch(e){$("roster-list").innerHTML='<p class="muted">Roster feed unavailable.</p>';console.warn(e)}}
function renderRoster(){const q=($("rosterSearch").value||"").toLowerCase();const list=state.roster.filter(p=>`${p.firstName?.default||""} ${p.lastName?.default||""} ${p.positionCode||""}`.toLowerCase().includes(q));$("roster-list").innerHTML=`<table><thead><tr><th>PLAYER</th><th>POS</th><th>#</th><th>WATCH</th></tr></thead><tbody>${list.map(p=>{const id=String(p.id);const name=`${p.firstName?.default||""} ${p.lastName?.default||""}`.trim();return `<tr><td>${esc(name)}</td><td>${esc(p.positionCode||"—")}</td><td>${p.sweaterNumber??"—"}</td><td><button class="textbutton" data-watch="${id}">${state.watch.has(id)?"★ SAVED":"☆ FOLLOW"}</button></td></tr>`}).join("")}</tbody></table>`;document.querySelectorAll("[data-watch]").forEach(b=>b.addEventListener("click",()=>{const id=b.dataset.watch;state.watch.has(id)?state.watch.delete(id):state.watch.add(id);localStorage.setItem("kings-watchlist",JSON.stringify([...state.watch]));renderRoster();renderWatchlist()}))}
function renderWatchlist(){const players=state.roster.filter(p=>state.watch.has(String(p.id)));renderRows($("watchlist"),players.map(p=>[`${p.firstName?.default||""} ${p.lastName?.default||""}`,p.positionCode||"Player"]))}
async function loadClubStats(){try{const d=await get("/club-stats/LAK/now");const s=d?.skaters||[];const goals=s.reduce((a,p)=>a+(p.goals||0),0);const games=Math.max(1,...s.map(p=>p.gamesPlayed||0));$("gpg").textContent=num(goals/games);return true}catch(e){console.warn(e)}}
async function loadHeadToHead(){const ab=$("opponentSelect").value;if(!ab)return;const matches=state.schedule.filter(g=>(g.homeTeam?.abbrev===ab||g.awayTeam?.abbrev===ab)&&g.gameState==="FINAL").slice(-5).reverse();renderRows($("headtohead"),matches.map(g=>[`${dateFmt(g.startTimeUTC)} · ${g.homeTeam?.abbrev} vs ${g.awayTeam?.abbrev}`,`${g.homeTeam?.score??0}–${g.awayTeam?.score??0}`]));if(!matches.length)renderRows($("headtohead"),[["No completed matchup found in loaded schedule","—"]])}
function initOpponent(){const teams=[...new Map(state.schedule.flatMap(g=>[g.homeTeam,g.awayTeam]).filter(t=>t?.abbrev&&t.abbrev!=="LAK").map(t=>[t.abbrev,t])).values()].sort((a,b)=>a.abbrev.localeCompare(b.abbrev));$("opponentSelect").innerHTML=teams.map(t=>`<option value="${esc(t.abbrev)}">${esc(t.placeName?.default||t.name?.default||t.abbrev)}</option>`).join("");$("opponentSelect").addEventListener("change",loadHeadToHead);loadHeadToHead()}
async function boot(){setStatus("Connecting to NHL public data…");const results=await Promise.allSettled([loadSchedule(),loadStandings(),loadClubStats(),loadScore()]);const good=results.some(r=>r.status==="fulfilled"&&r.value===true);if(good){setStatus("NHL data loaded where available. Refreshes automatically every 5 minutes.",true);$("updated").textContent=new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}else setStatus("NHL data could not be reached. Use refresh or the official Kings schedule.");}
$("refreshSchedule").addEventListener("click",loadSchedule);
boot();setInterval(boot,300000);
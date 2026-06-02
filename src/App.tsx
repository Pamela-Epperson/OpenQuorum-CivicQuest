// @ts-nocheck
import { useState, useEffect, useCallback, useRef } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
const TICK_MS = 4000;
const QUORUM_MIN = 0.55;

const INITIAL_BOARDS = [
  {id:1,name:"Health & Human Services Advisory Board",domain:"health",     totalSeats:7,filledSeats:4,constituent:"City health service recipients",    importance:"high",    color:"#1D9E75",mandate:"Reviews health facility licenses, approves health program funding, and oversees city wellness initiatives."},
  {id:2,name:"Environmental Protection Commission",   domain:"environment",totalSeats:5,filledSeats:3,constituent:"All city residents",                importance:"moderate",color:"#3B6D11",mandate:"Issues environmental permits, reviews pollution complaints, and sets local air and water quality standards."},
  {id:3,name:"Public Housing Authority Board",        domain:"housing",    totalSeats:6,filledSeats:2,constituent:"Low-income housing applicants",     importance:"critical",color:"#EF9F27",mandate:"Approves housing grants, reviews applicant appeals, and sets affordable housing eligibility standards."},
  {id:4,name:"Education Standards Committee",         domain:"education",  totalSeats:7,filledSeats:5,constituent:"City students & families",          importance:"high",    color:"#185FA5",mandate:"Sets curriculum standards, reviews teacher credentialing policy, and advises on school improvement funding."},
  {id:5,name:"Public Safety Advisory Council",        domain:"justice",    totalSeats:6,filledSeats:3,constituent:"All city residents",                importance:"high",    color:"#993C1D",mandate:"Reviews police accountability policies, advises on emergency preparedness, and oversees civilian complaint processes."},
  {id:6,name:"Economic Development Commission",       domain:"economic",   totalSeats:8,filledSeats:6,constituent:"Local businesses & workers",        importance:"moderate",color:"#534AB7",mandate:"Approves small business grants, reviews development proposals, and advises on workforce training programs."},
  {id:7,name:"Technology & Innovation Council",       domain:"technology", totalSeats:6,filledSeats:1,constituent:"City tech workforce & all residents",importance:"critical",color:"#0C447C",mandate:"Governs city data systems, reviews technology contracts, and sets digital equity and AI use standards."},
  {id:8,name:"Community Services Advisory Board",     domain:"community",  totalSeats:5,filledSeats:2,constituent:"Vulnerable city residents",         importance:"high",    color:"#72243E",mandate:"Oversees social service programs, reviews nonprofit grant awards, and advocates for underserved populations."},
];

const F_NAMES=["Alex","Jordan","Morgan","Taylor","Casey","Riley","Avery","Quinn","Dana","Reese","Cameron","Skyler","Blake","Drew","Sage","Robin","Kerry","Finley","Ellis","Rowan"];
const L_NAMES=["Williams","Johnson","Brown","Garcia","Martinez","Davis","Lopez","Robinson","Clark","Lewis","Young","Hall","Allen","Wright","King","Scott","Adams","Nelson","Carter","Mitchell"];
const BKGS=["Healthcare Administrator","Environmental Scientist","Housing Policy Expert","Retired School Principal","Community Organizer","Tech Industry Veteran","Social Worker","Urban Planner","Public Health Official","Former City Council Aide","Data Governance Specialist","Nonprofit Executive","Civil Rights Attorney","Public Safety Researcher","Economic Development Director"];

function randName(){return F_NAMES[Math.floor(Math.random()*F_NAMES.length)]+" "+L_NAMES[Math.floor(Math.random()*L_NAMES.length)];}
function randBkg(){return BKGS[Math.floor(Math.random()*BKGS.length)];}

function makeCandidates(boardId){
  const oqIdx=Math.floor(Math.random()*3);
  return [0,1,2].map(i=>({
    id:`${boardId}-${i}-${Date.now()}`,
    name:randName(), background:randBkg(),
    fit:i===oqIdx?Math.floor(Math.random()*15)+82:Math.floor(Math.random()*25)+55,
    oqCertified:i===oqIdx,
  })).sort((a,b)=>b.fit-a.fit);
}

const EVENT_TEMPLATES = {
  quorum_failure: (b)=>({ type:"quorum_failure", icon:"🚫", title:"Quorum Failure", body:`The ${b.name} meeting was cancelled — not enough members present. Pending decisions have been deferred.`, impact:-6, boardId:b.id }),
  constituent_complaint: (b)=>({ type:"complaint",     icon:"📢", title:"Constituent Complaint", body:`Residents served by the ${b.name} are frustrated by ongoing delays. Approval rating falling.`, impact:-4, boardId:b.id }),
  media_coverage: (b)=>({ type:"media",          icon:"📰", title:"Press Coverage", body:`Local journalists are covering the ${b.name} vacancy. "City Hall leaves key board understaffed for months," reads the headline.`, impact:-3, boardId:b.id }),
  budget_sweep: (b)=>({ type:"budget",          icon:"💸", title:"Budget Swept", body:`Unspent per diem funds from the ${b.name}'s empty seats were quietly reprogrammed to the General Fund — $${Math.floor(Math.random()*8+4)*1000} redirected without public notice.`, impact:-2, boardId:b.id }),
  policy_delay: (b)=>({ type:"delay",           icon:"⏳", title:"Policy Delayed", body:`A critical decision pending before the ${b.name} has been deferred for the third consecutive month due to insufficient members.`, impact:-5, boardId:b.id }),
  meeting_success: (b)=>({ type:"success",       icon:"✅", title:"Board Convened", body:`The ${b.name} met successfully this week and cleared ${Math.floor(Math.random()*4+2)} pending decisions. Constituents are pleased.`, impact:+3, boardId:b.id }),
  good_appointment: (b,name)=>({ type:"appointment",   icon:"🎉", title:"Appointment Celebrated", body:`The community is praising your appointment of ${name} to the ${b.name}. "Finally — someone who understands this community," said one resident.`, impact:+5, boardId:b.id }),
};

const DOMAIN_COLORS = {
  health:"#1D9E75",environment:"#3B6D11",housing:"#EF9F27",education:"#185FA5",
  justice:"#993C1D",economic:"#534AB7",technology:"#0C447C",community:"#72243E",
};

// ─── Board Card ────────────────────────────────────────────────────────────────
function BoardCard({board,onFill,flash}){
  const vacantSeats=board.totalSeats-board.filledSeats;
  const hasQuorum=board.filledSeats/board.totalSeats>=QUORUM_MIN;
  const pct=Math.round((board.filledSeats/board.totalSeats)*100);
  const severity=!hasQuorum?"crisis":vacantSeats>1?"warn":"ok";
  const border=severity==="crisis"?"2px solid #E24B4A":severity==="warn"?"2px solid #EF9F27":"1px solid #eee";
  return(
    <div style={{border,borderLeft:`4px solid ${board.color}`,borderRadius:"0 10px 10px 0",padding:"0.85rem 1rem",background:flash?"#FFF9E6":"#fff",transition:"background 0.4s",marginBottom:8}}>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8,marginBottom:6}}>
        <div style={{flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",marginBottom:3}}>
            <span style={{fontSize:12,fontWeight:600,color:"#1a1a1a",lineHeight:1.3}}>{board.name}</span>
            {!hasQuorum&&<span style={{fontSize:10,padding:"1px 6px",borderRadius:20,background:"#FCEBEB",color:"#791F1F",fontWeight:500}}>No quorum</span>}
            {board.importance==="critical"&&hasQuorum&&<span style={{fontSize:10,padding:"1px 6px",borderRadius:20,background:"#FAEEDA",color:"#633806",fontWeight:500}}>Watch</span>}
          </div>
          <p style={{margin:0,fontSize:11,color:"#888"}}>{board.constituent}</p>
        </div>
        <div style={{textAlign:"right",flexShrink:0}}>
          <p style={{margin:"0 0 1px",fontSize:15,fontWeight:600,color:!hasQuorum?"#E24B4A":"#1a1a1a"}}>{board.filledSeats}/{board.totalSeats}</p>
          <p style={{margin:0,fontSize:10,color:"#aaa"}}>seated</p>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
        <div style={{flex:1,height:5,background:"#eee",borderRadius:3,overflow:"hidden"}}>
          <div style={{height:5,width:`${pct}%`,background:!hasQuorum?"#E24B4A":pct<70?"#EF9F27":"#1D9E75",borderRadius:3,transition:"width 0.4s"}}/>
        </div>
        <span style={{fontSize:10,color:"#888",minWidth:32}}>{pct}%</span>
      </div>
      {vacantSeats>0&&(
        <button onClick={()=>onFill(board)}
          style={{padding:"5px 12px",borderRadius:8,border:`1px solid ${board.color}`,background:"transparent",color:board.color,cursor:"pointer",fontSize:11,fontWeight:600}}>
          + Fill seat ({vacantSeats} open)
        </button>
      )}
      {vacantSeats===0&&<p style={{margin:0,fontSize:11,color:"#1D9E75",fontWeight:500}}>✓ Fully seated</p>}
    </div>
  );
}

// ─── Candidate Modal ───────────────────────────────────────────────────────────
function CandidateModal({board,onAppoint,onClose}){
  const [candidates]=useState(()=>makeCandidates(board.id));
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16}} onClick={onClose}>
      <div style={{background:"#fff",borderRadius:12,padding:"1.5rem",maxWidth:480,width:"100%"}} onClick={e=>e.stopPropagation()}>
        <div style={{marginBottom:"1rem"}}>
          <p style={{margin:"0 0 3px",fontSize:11,color:"#888",textTransform:"uppercase",letterSpacing:"0.07em"}}>Appointment to</p>
          <p style={{margin:0,fontSize:15,fontWeight:600,color:"#1a1a1a"}}>{board.name}</p>
        </div>
        <p style={{margin:"0 0 1rem",fontSize:12,color:"#888",lineHeight:1.6}}>Select a candidate. The Board Ready credential (🏅) indicates verified civic readiness training from OpenQuorum.</p>
        {candidates.map(c=>(
          <div key={c.id} style={{border:`1px solid ${c.oqCertified?"#1D9E75":"#eee"}`,borderRadius:10,padding:"0.9rem 1rem",marginBottom:8,background:c.oqCertified?"#F0FBF7":"#fff"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,marginBottom:4}}>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:13,fontWeight:600}}>{c.name}</span>
                  {c.oqCertified&&<span style={{fontSize:10,padding:"1px 7px",borderRadius:20,background:"#1D9E75",color:"#fff",fontWeight:500}}>🏅 Board Ready</span>}
                </div>
                <p style={{margin:0,fontSize:11,color:"#888"}}>{c.background}</p>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <p style={{margin:"0 0 1px",fontSize:17,fontWeight:600,color:c.fit>=80?"#1D9E75":c.fit>=65?"#EF9F27":"#E24B4A"}}>{c.fit}%</p>
                <p style={{margin:0,fontSize:10,color:"#aaa"}}>fit score</p>
              </div>
            </div>
            <button onClick={()=>onAppoint(board,c)}
              style={{width:"100%",padding:"7px 0",borderRadius:8,border:"none",background:c.oqCertified?"#1D9E75":"#1a1a1a",color:"#fff",cursor:"pointer",fontSize:12,fontWeight:600,marginTop:4}}>
              Appoint {c.name.split(" ")[0]}
            </button>
          </div>
        ))}
        <button onClick={onClose} style={{width:"100%",padding:"7px 0",borderRadius:8,border:"1px solid #ddd",background:"transparent",color:"#888",cursor:"pointer",fontSize:12,marginTop:4}}>
          Decide later
        </button>
      </div>
    </div>
  );
}

// ─── Tutorial Toast ────────────────────────────────────────────────────────────
function TutorialToast({message,onDismiss}){
  if(!message) return null;
  return(
    <div style={{position:"fixed",bottom:20,left:"50%",transform:"translateX(-50%)",background:"#0A1628",color:"#fff",borderRadius:10,padding:"0.85rem 1.25rem",maxWidth:420,width:"90%",zIndex:500,boxShadow:"0 4px 20px rgba(0,0,0,0.3)"}}>
      <p style={{margin:"0 0 6px",fontSize:13,lineHeight:1.6}}>{message}</p>
      <button onClick={onDismiss} style={{border:"none",background:"rgba(255,255,255,0.15)",color:"#fff",borderRadius:6,padding:"4px 12px",cursor:"pointer",fontSize:12}}>Got it</button>
    </div>
  );
}

// ─── End Screen ────────────────────────────────────────────────────────────────
function EndScreen({score,weeks,reason,boardsFullySeated,totalAppointments,onRestart}){
  const grade=score>=80?"A":score>=65?"B":score>=50?"C":score>=35?"D":"F";
  const gradeColor=score>=80?"#1D9E75":score>=65?"#185FA5":score>=50?"#EF9F27":score>=35?"#EF9F27":"#E24B4A";
  return(
    <div style={{maxWidth:600,margin:"2rem auto",fontFamily:"system-ui,-apple-system,sans-serif",padding:"0 16px"}}>
      <div style={{background:"#0A1628",borderRadius:14,padding:"2rem",marginBottom:16,textAlign:"center"}}>
        <p style={{margin:"0 0 6px",fontSize:12,color:"rgba(255,255,255,0.5)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Governance Report Card</p>
        <div style={{fontSize:72,fontWeight:600,color:gradeColor,lineHeight:1,margin:"0.5rem 0"}}>{grade}</div>
        <p style={{margin:"0 0 4px",fontSize:18,color:"#fff",fontWeight:500}}>{score}/100 governance score</p>
        <p style={{margin:"0 0 1.5rem",fontSize:13,color:"rgba(255,255,255,0.5)"}}>{weeks} weeks in office · {totalAppointments} appointments made</p>
        <p style={{margin:0,fontSize:13,color:"rgba(255,255,255,0.65)",lineHeight:1.7,fontStyle:"italic",borderLeft:"2px solid rgba(29,158,117,0.5)",paddingLeft:12,textAlign:"left"}}>
          {reason}
        </p>
      </div>
      <div style={{border:"1px solid #eee",borderRadius:12,padding:"1.25rem",marginBottom:12,background:"#fff"}}>
        <p style={{margin:"0 0 8px",fontSize:12,fontWeight:500,color:"#888",textTransform:"uppercase",letterSpacing:"0.07em"}}>This is real — not just a game</p>
        <p style={{margin:"0 0 12px",fontSize:13,color:"#1a1a1a",lineHeight:1.7}}>The boards you just managed exist in real cities and states. Right now, hundreds of boards like these have open seats — and no one is filling them. Qualified citizens like you have no idea the opportunity exists.</p>
        <p style={{margin:"0 0 12px",fontSize:13,color:"#1a1a1a",lineHeight:1.7}}>Check real board vacancies in your state and see if you qualify for a seat:</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:6}}>
          {[
            ["Maryland","https://govappointments.maryland.gov","#0F6E56","#E1F5EE"],
            ["Virginia","https://www.commonwealth.virginia.gov/va-government/boards-and-commissions/","#185FA5","#E6F1FB"],
            ["Washington DC","https://mota.dc.gov","#854F0B","#FAEEDA"],
            ["Delaware","https://governor.delaware.gov/boards-and-commissions/","#534AB7","#EEEDFE"],
            ["Massachusetts","https://boards.mass.gov/search","#993C1D","#FAECE7"],
            ["Minnesota","https://commissionsandappointments.sos.mn.gov","#3B6D11","#EAF3DE"],
          ].map(([state,url,color,bg])=>(
            <a key={state} href={url} target="_blank" rel="noreferrer"
              style={{padding:"7px 10px",borderRadius:8,background:bg,color,fontSize:11,fontWeight:600,textDecoration:"none",textAlign:"center",border:`1px solid ${color}40`}}>
              {state} ↗
            </a>
          ))}
        </div>
        <div style={{marginTop:12,padding:"8px 12px",borderRadius:8,background:"#f8f8f7",border:"1px solid #eee"}}>
          <p style={{margin:"0 0 4px",fontSize:11,fontWeight:500,color:"#888",textTransform:"uppercase",letterSpacing:"0.07em"}}>Find your board seat with AI matching</p>
          <a href="https://openquorum-vacancy-clock.vercel.app" target="_blank" rel="noreferrer"
            style={{fontSize:13,color:"#1D9E75",fontWeight:600,textDecoration:"none"}}>openquorum-vacancy-clock.vercel.app ↗</a>
        </div>
      </div>
      <button onClick={onRestart}
        style={{width:"100%",padding:"12px 0",borderRadius:10,border:"none",background:"#1D9E75",color:"#fff",cursor:"pointer",fontSize:14,fontWeight:600}}>
        Play again
      </button>
    </div>
  );
}

// ─── Start Screen ──────────────────────────────────────────────────────────────
function StartScreen({onStart}){
  return(
    <div style={{maxWidth:540,margin:"2rem auto",fontFamily:"system-ui,-apple-system,sans-serif",padding:"0 16px"}}>
      <div style={{background:"#0A1628",borderRadius:14,padding:"2rem",marginBottom:14,textAlign:"center"}}>
        <p style={{margin:"0 0 4px",fontSize:14,fontWeight:600,color:"#fff",letterSpacing:"-0.01em"}}>Open<span style={{color:"#1D9E75"}}>Quorum</span></p>
        <h1 style={{margin:"0.5rem 0",fontSize:32,fontWeight:600,color:"#fff",letterSpacing:"-0.02em",lineHeight:1.2}}>CivicQuest</h1>
        <p style={{margin:"0 0 1.5rem",fontSize:14,color:"rgba(255,255,255,0.6)"}}>A board governance simulation</p>
        <div style={{textAlign:"left",background:"rgba(255,255,255,0.06)",borderRadius:10,padding:"1rem",marginBottom:"1.5rem"}}>
          <p style={{margin:"0 0 8px",fontSize:12,color:"rgba(255,255,255,0.8)",lineHeight:1.7}}>You've just been sworn in as Mayor of Civic City. You inherit a city with 8 appointed boards — but nearly half the seats are empty.</p>
          <p style={{margin:"0 0 8px",fontSize:12,color:"rgba(255,255,255,0.8)",lineHeight:1.7}}>Without enough members, boards can't meet. When boards can't meet, decisions stall. When decisions stall, your constituents suffer — and your approval rating falls.</p>
          <p style={{margin:0,fontSize:12,color:"rgba(255,255,255,0.6)",lineHeight:1.7}}>Your job: fill seats. Maintain quorum. Keep the city running.</p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:"1.5rem"}}>
          {[
            {icon:"🏛️",label:"8 boards to manage"},
            {icon:"⚡",label:"Fill seats before quorum fails"},
            {icon:"📊",label:"Keep approval above 30%"},
          ].map(m=>(
            <div key={m.label} style={{background:"rgba(255,255,255,0.06)",borderRadius:8,padding:"0.75rem 0.5rem",textAlign:"center"}}>
              <div style={{fontSize:20,marginBottom:4}}>{m.icon}</div>
              <p style={{margin:0,fontSize:11,color:"rgba(255,255,255,0.65)",lineHeight:1.4}}>{m.label}</p>
            </div>
          ))}
        </div>
        <button onClick={()=>onStart("normal")}
          style={{width:"100%",padding:"13px 0",borderRadius:10,border:"none",background:"#1D9E75",color:"#fff",cursor:"pointer",fontSize:15,fontWeight:600,marginBottom:8}}>
          Take office →
        </button>
        <button onClick={()=>onStart("crisis")}
          style={{width:"100%",padding:"10px 0",borderRadius:10,border:"1px solid rgba(255,255,255,0.2)",background:"transparent",color:"rgba(255,255,255,0.7)",cursor:"pointer",fontSize:13}}>
          Crisis mode (harder)
        </button>
      </div>
      <p style={{textAlign:"center",fontSize:11,color:"#aaa",lineHeight:1.6}}>OpenQuorum · Civic education through simulation · openquorum-vacancy-clock.vercel.app</p>
    </div>
  );
}

// ─── Main Game ─────────────────────────────────────────────────────────────────
export default function CivicQuest(){
  const [screen,setScreen]=useState("start"); // start | game | end
  const [boards,setBoards]=useState([]);
  const [events,setEvents]=useState([]);
  const [score,setScore]=useState(60);
  const [approval,setApproval]=useState(68);
  const [week,setWeek]=useState(1);
  const [paused,setPaused]=useState(false);
  const [fillTarget,setFillTarget]=useState(null);
  const [flashBoards,setFlashBoards]=useState({});
  const [totalAppts,setTotalAppts]=useState(0);
  const [endReason,setEndReason]=useState("");
  const [tutorial,setTutorial]=useState(null);
  const [tutorialStep,setTutorialStep]=useState(0);
  const [oqUnlocked,setOqUnlocked]=useState(false);
  const tickRef=useRef(null);

  const TUTORIALS=[
    "Welcome, Mayor! 🏛️ You can see your city's boards below. Red border means no quorum — the board can't meet. Click '+ Fill seat' to make an appointment.",
    "Good governance tip: boards need at least 55% of seats filled to achieve quorum. Without quorum, decisions stall and constituents suffer.",
    "Look for candidates with the 🏅 Board Ready credential — they've completed civic leadership training and usually have higher fit scores.",
    "Watch your Approval Rating at the top. If it drops below 30%, your administration is in trouble. Fill critical boards first!",
  ];

  const startGame=useCallback((mode)=>{
    const b=INITIAL_BOARDS.map(board=>({
      ...board,
      filledSeats:mode==="crisis"?Math.max(1,board.filledSeats-1):board.filledSeats
    }));
    setBoards(b);
    setEvents([{id:0,icon:"🏛️",title:"Welcome to City Hall",body:"You've been sworn in as Mayor. Your city has 8 appointed boards — many with vacant seats. The work begins now.",type:"info"}]);
    setScore(60); setApproval(mode==="crisis"?52:68); setWeek(1);
    setPaused(false); setFillTarget(null); setFlashBoards({});
    setTotalAppts(0); setEndReason(""); setOqUnlocked(false);
    setTutorialStep(0); setTutorial(TUTORIALS[0]);
    setScreen("game");
  },[]);

  const addEvent=useCallback((evt)=>{
    setEvents(prev=>[{...evt,id:Date.now()+Math.random()},...prev].slice(0,20));
  },[]);

  // Game tick
  useEffect(()=>{
    if(screen!=="game"||paused) return;
    tickRef.current=setInterval(()=>{
      setWeek(w=>{
        const newWeek=w+1;
        setBoards(prevBoards=>{
          const updated=[...prevBoards];
          // Fire events based on board states
          prevBoards.forEach(board=>{
            const vRate=(board.totalSeats-board.filledSeats)/board.totalSeats;
            const hasQuorum=board.filledSeats/board.totalSeats>=QUORUM_MIN;
            const roll=Math.random();

            if(!hasQuorum){
              if(roll<0.55){
                const evtType=roll<0.25?"quorum_failure":roll<0.4?"constituent_complaint":roll<0.5?"media_coverage":"policy_delay";
                const evt=EVENT_TEMPLATES[evtType](board);
                addEvent(evt);
                setApproval(a=>Math.max(0,a+evt.impact));
                setScore(s=>Math.max(0,s+Math.floor(evt.impact*0.6)));
              }
            } else if(vRate>0&&vRate<=0.45){
              if(roll<0.15){
                const evt=EVENT_TEMPLATES.budget_sweep(board);
                addEvent(evt); setApproval(a=>Math.max(0,a+evt.impact));
                setScore(s=>Math.max(0,s+Math.floor(evt.impact*0.4)));
              }
            } else if(vRate===0){
              if(roll<0.25){
                const evt=EVENT_TEMPLATES.meeting_success(board);
                addEvent(evt); setApproval(a=>Math.min(100,a+evt.impact));
                setScore(s=>Math.min(100,s+Math.floor(evt.impact*0.5)));
              }
            }
          });

          // Check OQ unlock
          const fullySeated=prevBoards.filter(b=>b.filledSeats===b.totalSeats).length;
          if(fullySeated>=5&&!oqUnlocked){
            setOqUnlocked(true);
            addEvent({id:"oq",icon:"🏅",title:"OpenQuorum Partnership Unlocked!",body:"Your commitment to full board membership has been recognized. OpenQuorum has partnered with City Hall to build a pre-qualified civic applicant pipeline for your remaining vacancies.",type:"success"});
            setScore(s=>Math.min(100,s+8));
          }

          return updated;
        });

        // Tutorial progression
        if(newWeek===3) setTutorial(TUTORIALS[1]);
        if(newWeek===6) setTutorial(TUTORIALS[2]);
        if(newWeek===9) setTutorial(TUTORIALS[3]);

        return newWeek;
      });
    }, TICK_MS);
    return()=>clearInterval(tickRef.current);
  },[screen,paused,oqUnlocked,addEvent]);

  // Check win/lose
  useEffect(()=>{
    if(screen!=="game") return;
    if(approval<=30){
      setScreen("end");
      setEndReason("Your approval rating collapsed. Constituents couldn't wait any longer for decisions that never came. Boards without quorum don't just inconvenience people — they deny them services they're owed.");
    }
    if(week>=24){
      const finalScore=score;
      setScreen("end");
      setEndReason(finalScore>=70
        ?"You maintained functioning governance for 6 months. Not all seats are filled, but you kept the city moving. The lesson: every appointment matters — not just for the board, but for the people waiting on its decisions."
        :"Six months in office. The city survived, but the boards you left understaffed cost real people real delays. Governance isn't ceremonial. Every empty seat is a missing decision-maker.");
    }
  },[approval,week,score,screen]);

  const handleFill=useCallback((board)=>{
    if(board.filledSeats>=board.totalSeats) return;
    setFillTarget(board); setPaused(true);
  },[]);

  const handleAppoint=useCallback((board,candidate)=>{
    setBoards(prev=>prev.map(b=>b.id===board.id?{...b,filledSeats:Math.min(b.totalSeats,b.filledSeats+1)}:b));
    setFillTarget(null); setPaused(false);
    setTotalAppts(n=>n+1);
    const evt=EVENT_TEMPLATES.good_appointment(board,candidate.name);
    addEvent(evt);
    setApproval(a=>Math.min(100,a+evt.impact));
    setScore(s=>Math.min(100,s+Math.floor(evt.impact*0.6)+(candidate.oqCertified?3:0)));
    setFlashBoards(f=>({...f,[board.id]:true}));
    setTimeout(()=>setFlashBoards(f=>({...f,[board.id]:false})),600);
  },[addEvent]);

  const totalVacant=boards.reduce((s,b)=>s+b.totalSeats-b.filledSeats,0);
  const atQuorum=boards.filter(b=>b.filledSeats/b.totalSeats>=QUORUM_MIN).length;

  if(screen==="start") return <StartScreen onStart={startGame}/>;
  if(screen==="end")   return <EndScreen score={score} weeks={week} reason={endReason} boardsFullySeated={boards.filter(b=>b.filledSeats===b.totalSeats).length} totalAppointments={totalAppts} onRestart={()=>setScreen("start")}/>;

  return(
    <div style={{fontFamily:"system-ui,-apple-system,sans-serif",maxWidth:960,margin:"0 auto",padding:"0 0 2rem",color:"#1a1a1a"}}>

      {fillTarget&&<CandidateModal board={fillTarget} onAppoint={handleAppoint} onClose={()=>{setFillTarget(null);setPaused(false);}}/>}
      <TutorialToast message={tutorial&&tutorialStep<TUTORIALS.length?tutorial:null} onDismiss={()=>{setTutorial(null);setTutorialStep(s=>s+1);}}/>

      {/* Header */}
      <div style={{background:"#0A1628",borderRadius:"0 0 12px 12px",padding:"1rem 1.25rem",marginBottom:"1rem",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
        <div style={{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
          <span style={{fontSize:16,fontWeight:600,color:"#fff"}}>Open<span style={{color:"#1D9E75"}}>Quorum</span> <span style={{color:"rgba(255,255,255,0.5)",fontWeight:400}}>CivicQuest</span></span>
          <span style={{fontSize:12,color:"rgba(255,255,255,0.5)"}}>Week {week} · Month {Math.ceil(week/4)}</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
          {[
            {l:"Approval",v:`${Math.round(approval)}%`,c:approval>60?"#1D9E75":approval>40?"#EF9F27":"#E24B4A"},
            {l:"Governance",v:`${Math.round(score)}/100`,c:score>65?"#1D9E75":score>45?"#EF9F27":"#E24B4A"},
            {l:"At quorum",v:`${atQuorum}/${boards.length}`,c:atQuorum>=6?"#1D9E75":atQuorum>=4?"#EF9F27":"#E24B4A"},
            {l:"Vacant seats",v:totalVacant,c:totalVacant<8?"#1D9E75":totalVacant<15?"#EF9F27":"#E24B4A"},
          ].map(m=>(
            <div key={m.l} style={{textAlign:"center"}}>
              <p style={{margin:"0 0 1px",fontSize:16,fontWeight:600,color:m.c}}>{m.v}</p>
              <p style={{margin:0,fontSize:10,color:"rgba(255,255,255,0.45)"}}>{m.l}</p>
            </div>
          ))}
          <button onClick={()=>setPaused(p=>!p)}
            style={{padding:"5px 12px",borderRadius:8,border:"1px solid rgba(255,255,255,0.2)",background:"transparent",color:"rgba(255,255,255,0.7)",cursor:"pointer",fontSize:12}}>
            {paused?"▶ Resume":"⏸ Pause"}
          </button>
        </div>
      </div>

      {/* Approval bar */}
      <div style={{marginBottom:"1rem",padding:"0 4px"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
          <span style={{fontSize:11,color:"#888"}}>Approval Rating</span>
          <span style={{fontSize:11,color:approval>60?"#1D9E75":approval>40?"#EF9F27":"#E24B4A",fontWeight:500}}>{Math.round(approval)}% — {approval>70?"Strong":approval>55?"Moderate":approval>40?"Declining":approval>30?"Critical":"Failing"}</span>
        </div>
        <div style={{height:6,background:"#eee",borderRadius:3,overflow:"hidden"}}>
          <div style={{height:6,width:`${approval}%`,background:approval>60?"#1D9E75":approval>40?"#EF9F27":"#E24B4A",borderRadius:3,transition:"width 0.5s"}}/>
        </div>
        {approval<=35&&<p style={{margin:"4px 0 0",fontSize:11,color:"#E24B4A",fontWeight:500}}>⚠ Critical — approval below 35%. Fill vacant boards immediately.</p>}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 300px",gap:14,alignItems:"start"}}>

        {/* Boards */}
        <div>
          <p style={{margin:"0 0 10px",fontSize:11,fontWeight:500,color:"#888",textTransform:"uppercase",letterSpacing:"0.07em"}}>City boards ({boards.length})</p>
          {boards.map(b=>(
            <BoardCard key={b.id} board={b} onFill={handleFill} flash={!!flashBoards[b.id]}/>
          ))}
        </div>

        {/* Event feed */}
        <div style={{position:"sticky",top:16}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
            <p style={{margin:0,fontSize:11,fontWeight:500,color:"#888",textTransform:"uppercase",letterSpacing:"0.07em"}}>City hall feed</p>
            {oqUnlocked&&<span style={{fontSize:10,padding:"2px 7px",borderRadius:20,background:"#E1F5EE",color:"#0F6E56",fontWeight:500}}>🏅 OQ Active</span>}
          </div>
          <div style={{maxHeight:520,overflowY:"auto"}}>
            {events.map(e=>(
              <div key={e.id} style={{marginBottom:8,padding:"0.75rem",borderRadius:8,background:e.type==="success"?"#F0FBF7":e.type==="info"?"#f8f8f7":"#fff",border:`1px solid ${e.type==="success"?"#9FE1CB":e.type==="info"?"#eee":"#f0f0f0"}`}}>
                <div style={{display:"flex",gap:6,alignItems:"flex-start"}}>
                  <span style={{fontSize:14,flexShrink:0,marginTop:1}}>{e.icon}</span>
                  <div>
                    <p style={{margin:"0 0 2px",fontSize:12,fontWeight:600,color:"#1a1a1a"}}>{e.title}</p>
                    <p style={{margin:0,fontSize:11,color:"#666",lineHeight:1.5}}>{e.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

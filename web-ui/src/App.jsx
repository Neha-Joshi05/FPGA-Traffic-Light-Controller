import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Zap, Moon, User, AlertTriangle, Activity, RotateCcw } from "lucide-react"

// ─── Constants (mirrors Verilog params) ───────────────────────────────────────
const T_GREEN  = 12000   // ms
const T_YELLOW = 3000
const T_ALLRED = 1000
const T_WALK   = 8000

const STATES = {
  NS_G:      "NS_G",
  NS_Y:      "NS_Y",
  ALL_RED1:  "ALL_RED1",
  EW_G:      "EW_G",
  EW_Y:      "EW_Y",
  ALL_RED2:  "ALL_RED2",
  PED_WALK:  "PED_WALK",
  PED_CLEAR: "PED_CLEAR",
  EMERG:     "EMERG",
  NIGHT:     "NIGHT",
}

const STATE_LABELS = {
  NS_G:      "North-South GREEN",
  NS_Y:      "North-South YELLOW",
  ALL_RED1:  "All RED (interlock)",
  EW_G:      "East-West GREEN",
  EW_Y:      "East-West YELLOW",
  ALL_RED2:  "All RED (interlock)",
  PED_WALK:  "Pedestrian WALK",
  PED_CLEAR: "Pedestrian CLEAR",
  EMERG:     "⚠ EMERGENCY — All RED",
  NIGHT:     "🌙 Night Mode — Flashing",
}

// ─── Traffic Light Component ──────────────────────────────────────────────────
function TrafficLight({ label, g, y, r, ped, pedWalk, nightFlash }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
      <div style={{
        background:"#0d0d18",
        border:"2px solid #2a2a40",
        borderRadius:20,
        padding:"18px 22px",
        display:"flex",
        flexDirection:"column",
        gap:14,
        boxShadow:"0 0 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)"
      }}>
        {/* Red */}
        <motion.div animate={{
          boxShadow: r ? `0 0 30px 8px rgba(255,23,68,0.7)` : "none",
          background: r ? "#ff1744" : "#2a0a12",
          scale: r ? 1.05 : 1
        }} transition={{ duration: 0.3 }} style={{
          width:64, height:64, borderRadius:"50%",
          border: r ? "2px solid #ff1744" : "2px solid #1a0a0f"
        }}/>
        {/* Yellow */}
        <motion.div animate={{
          boxShadow: y ? `0 0 30px 8px rgba(255,214,0,0.7)` : "none",
          background: y ? "#ffd600" : "#2a2000",
          scale: y ? 1.05 : 1
        }} transition={{ duration: 0.3 }} style={{
          width:64, height:64, borderRadius:"50%",
          border: y ? "2px solid #ffd600" : "2px solid #1a1400"
        }}/>
        {/* Green */}
        <motion.div animate={{
          boxShadow: g ? `0 0 30px 8px rgba(0,230,118,0.7)` : "none",
          background: g ? "#00e676" : "#002a14",
          scale: g ? 1.05 : 1
        }} transition={{ duration: 0.3 }} style={{
          width:64, height:64, borderRadius:"50%",
          border: g ? "2px solid #00e676" : "2px solid #001a0c"
        }}/>
      </div>

      {/* Pedestrian signal */}
      {ped && (
        <motion.div animate={{
          background: pedWalk ? "#00e676" : "#ff1744",
          boxShadow: pedWalk
            ? "0 0 20px rgba(0,230,118,0.5)"
            : "0 0 20px rgba(255,23,68,0.5)"
        }} style={{
          width:48, height:48, borderRadius:10,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:22, border:"2px solid #2a2a40"
        }}>
          {pedWalk ? "🚶" : "✋"}
        </motion.div>
      )}

      <span style={{
        fontFamily:"'JetBrains Mono', monospace",
        fontSize:11, color:"#6b6b8a", letterSpacing:2,
        textTransform:"uppercase"
      }}>{label}</span>
    </div>
  )
}

// ─── Timer Bar ─────────────────────────────────────────────────────────────────
function TimerBar({ progress, color }) {
  return (
    <div style={{
      width:"100%", height:4,
      background:"#1a1a28", borderRadius:2, overflow:"hidden"
    }}>
      <motion.div
        animate={{ width: `${progress * 100}%` }}
        transition={{ ease:"linear" }}
        style={{ height:"100%", background: color, borderRadius:2,
          boxShadow:`0 0 8px ${color}` }}
      />
    </div>
  )
}

// ─── Control Button ────────────────────────────────────────────────────────────
function CtrlBtn({ icon: Icon, label, active, color, onClick, disabled }) {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.04 }}
      whileTap={{ scale: disabled ? 1 : 0.96 }}
      onClick={onClick}
      disabled={disabled}
      style={{
        display:"flex", alignItems:"center", gap:8,
        padding:"10px 16px", borderRadius:10,
        border: active ? `1px solid ${color}` : "1px solid #2a2a40",
        background: active ? `${color}18` : "#12121a",
        color: active ? color : "#6b6b8a",
        cursor: disabled ? "not-allowed" : "pointer",
        fontSize:13, fontWeight:500,
        boxShadow: active ? `0 0 16px ${color}30` : "none",
        transition:"all 0.2s", opacity: disabled ? 0.4 : 1,
        fontFamily:"'Inter', sans-serif"
      }}>
      <Icon size={15}/> {label}
    </motion.button>
  )
}

// ─── Log Entry ─────────────────────────────────────────────────────────────────
function LogEntry({ entry }) {
  const colors = { info:"#6c63ff", warn:"#ffd600", danger:"#ff1744", ok:"#00e676" }
  return (
    <motion.div initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }}
      style={{ display:"flex", gap:10, padding:"6px 0",
        borderBottom:"1px solid #1a1a28", fontSize:12 }}>
      <span style={{ color:"#6b6b8a", fontFamily:"'JetBrains Mono',monospace",
        minWidth:80 }}>{entry.time}</span>
      <span style={{ color: colors[entry.type] || "#e8e8f0" }}>{entry.msg}</span>
    </motion.div>
  )
}

// ─── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [state, setState]       = useState(STATES.NS_G)
  const [timer, setTimer]       = useState(T_GREEN)
  const [total, setTotal]       = useState(T_GREEN)
  const [pedReq, setPedReq]     = useState(false)
  const [vehEW, setVehEW]       = useState(false)
  const [vehNS, setVehNS]       = useState(false)
  const [emergency, setEmergency] = useState(false)
  const [nightMode, setNightMode] = useState(false)
  const [nightFlash, setNightFlash] = useState(false)
  const [log, setLog]           = useState([])
  const [cycles, setCycles]     = useState(0)
  const [tick, setTick]         = useState(0)
  const stateRef  = useRef(state)
  const pedRef    = useRef(pedReq)
  const emerRef   = useRef(emergency)
  const nightRef  = useRef(nightMode)
  const vehNSRef  = useRef(vehNS)
  const vehEWRef  = useRef(vehEW)

  stateRef.current  = state
  pedRef.current    = pedReq
  emerRef.current   = emergency
  nightRef.current  = nightMode
  vehNSRef.current  = vehNS
  vehEWRef.current  = vehEW

  const addLog = (msg, type="info") => {
    const now = new Date()
    const time = `${now.getHours().toString().padStart(2,"0")}:${now.getMinutes().toString().padStart(2,"0")}:${now.getSeconds().toString().padStart(2,"0")}`
    setLog(l => [{msg, type, time}, ...l].slice(0,40))
  }

  // Night flash
  useEffect(() => {
    if (!nightMode) return
    const id = setInterval(() => setNightFlash(f => !f), 600)
    return () => clearInterval(id)
  }, [nightMode])

  // FSM tick
  useEffect(() => {
    const id = setInterval(() => {
      setTick(t => t + 1)
      setTimer(t => {
        if (t <= 100) return 0
        return t - 100
      })
    }, 100)
    return () => clearInterval(id)
  }, [])

  // FSM transitions
  useEffect(() => {
    if (timer > 0) return

    const s   = stateRef.current
    const ped = pedRef.current
    const em  = emerRef.current
    const ng  = nightRef.current
    const vns = vehNSRef.current
    const vew = vehEWRef.current

    if (em)  { transition(STATES.EMERG,     T_ALLRED); return }
    if (ng)  { transition(STATES.NIGHT,     T_ALLRED); return }

    switch (s) {
      case STATES.NS_G:
        if (ped || vew) transition(STATES.NS_Y, T_YELLOW)
        else            resetTimer(T_GREEN)
        break
      case STATES.NS_Y:
        transition(STATES.ALL_RED1, T_ALLRED)
        break
      case STATES.ALL_RED1:
        transition(ped ? STATES.PED_WALK : STATES.EW_G, ped ? T_WALK : T_GREEN)
        break
      case STATES.EW_G:
        if (ped || vns) transition(STATES.EW_Y, T_YELLOW)
        else            resetTimer(T_GREEN)
        break
      case STATES.EW_Y:
        transition(STATES.ALL_RED2, T_ALLRED)
        break
      case STATES.ALL_RED2:
        transition(ped ? STATES.PED_WALK : STATES.NS_G, ped ? T_WALK : T_GREEN)
        setCycles(c => c + 1)
        break
      case STATES.PED_WALK:
        transition(STATES.PED_CLEAR, T_ALLRED)
        break
      case STATES.PED_CLEAR:
        setPedReq(false)
        transition(STATES.NS_G, T_GREEN)
        break
      case STATES.EMERG:
        if (!em && !ng) transition(STATES.NS_G, T_GREEN)
        else            resetTimer(T_ALLRED)
        break
      case STATES.NIGHT:
        if (!ng && !em) transition(STATES.NS_G, T_GREEN)
        else            resetTimer(600)
        break
      default:
        transition(STATES.NS_G, T_GREEN)
    }
  }, [timer])

  function transition(newState, duration) {
    const labels = { NS_G:"NS Green", NS_Y:"NS Yellow", ALL_RED1:"All Red",
      EW_G:"EW Green", EW_Y:"EW Yellow", ALL_RED2:"All Red",
      PED_WALK:"Ped Walk", PED_CLEAR:"Ped Clear",
      EMERG:"EMERGENCY", NIGHT:"Night Mode" }
    const types = { NS_G:"ok", EW_G:"ok", NS_Y:"warn", EW_Y:"warn",
      ALL_RED1:"info", ALL_RED2:"info", PED_WALK:"ok",
      EMERG:"danger", NIGHT:"info" }
    addLog(`→ ${labels[newState] || newState}`, types[newState] || "info")
    setState(newState)
    setTimer(duration)
    setTotal(duration)
  }

  function resetTimer(duration) {
    setTimer(duration)
    setTotal(duration)
  }

  // Derived light states
  const ns_g = state === STATES.NS_G
  const ns_y = state === STATES.NS_Y
  const ns_r = !ns_g && !ns_y
  const ew_g = state === STATES.EW_G
  const ew_y = state === STATES.EW_Y
  const ew_r = !ew_g && !ew_y
  const pedWalk = state === STATES.PED_WALK

  // Night mode overrides
  const ns_g_d = nightMode ? false  : ns_g
  const ns_y_d = nightMode ? nightFlash : ns_y
  const ns_r_d = nightMode ? !nightFlash : ns_r
  const ew_g_d = nightMode ? false  : ew_g
  const ew_y_d = nightMode ? !nightFlash : ew_y
  const ew_r_d = nightMode ? nightFlash : ew_r

  const progress = total > 0 ? timer / total : 0
  const barColor = ns_g || ew_g ? "#00e676" : ns_y || ew_y ? "#ffd600" : "#ff1744"

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", padding:"32px 20px" }}>

      {/* Header */}
      <div style={{ textAlign:"center", marginBottom:40 }}>
        <motion.h1 initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }}
          style={{ fontSize:28, fontWeight:700, letterSpacing:-0.5,
            background:"linear-gradient(135deg, #6c63ff, #a78bfa)",
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
          FPGA Traffic Light Controller
        </motion.h1>
        <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.2 }}
          style={{ color:"#6b6b8a", fontSize:13, marginTop:6, fontFamily:"'JetBrains Mono',monospace" }}>
          FSM Simulator · Verilog RTL verified · {cycles} cycles
        </motion.p>
      </div>

      {/* Main grid */}
      <div style={{ maxWidth:900, margin:"0 auto", display:"grid",
        gridTemplateColumns:"1fr auto 1fr", gap:32, alignItems:"center" }}>

        {/* NS Light */}
        <div style={{ display:"flex", justifyContent:"center" }}>
          <TrafficLight label="North – South"
            g={ns_g_d} y={ns_y_d} r={ns_r_d}
            ped pedWalk={pedWalk} nightFlash={nightFlash} />
        </div>

        {/* Center intersection */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:20 }}>
          {/* Intersection visual */}
          <div style={{ position:"relative", width:120, height:120 }}>
            <div style={{ position:"absolute", inset:0,
              background:"#1a1a28", borderRadius:12,
              border:"2px solid #2a2a40",
              display:"flex", alignItems:"center", justifyContent:"center" }}>
              <div style={{ width:2, height:"100%", background:"#ffd60030",
                position:"absolute" }}/>
              <div style={{ height:2, width:"100%", background:"#ffd60030",
                position:"absolute" }}/>
              <motion.div animate={{ scale: [1, 1.1, 1], opacity:[0.5,1,0.5] }}
                transition={{ repeat:Infinity, duration:2 }}
                style={{ width:24, height:24, borderRadius:"50%",
                  background:"#6c63ff20", border:"2px solid #6c63ff40" }}/>
            </div>
          </div>

          {/* State badge */}
          <AnimatePresence mode="wait">
            <motion.div key={state}
              initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }}
              exit={{ opacity:0, scale:0.9 }}
              style={{ padding:"8px 14px", borderRadius:8,
                background:"#1a1a28", border:"1px solid #2a2a40",
                fontSize:11, color:"#a78bfa", textAlign:"center",
                fontFamily:"'JetBrains Mono',monospace",
                maxWidth:160, lineHeight:1.5 }}>
              {STATE_LABELS[state]}
            </motion.div>
          </AnimatePresence>

          {/* Timer bar */}
          <div style={{ width:160 }}>
            <TimerBar progress={progress} color={barColor} />
            <div style={{ display:"flex", justifyContent:"space-between",
              marginTop:4, fontSize:10, color:"#6b6b8a",
              fontFamily:"'JetBrains Mono',monospace" }}>
              <span>{(timer/1000).toFixed(1)}s</span>
              <span>{(total/1000).toFixed(0)}s total</span>
            </div>
          </div>
        </div>

        {/* EW Light */}
        <div style={{ display:"flex", justifyContent:"center" }}>
          <TrafficLight label="East – West"
            g={ew_g_d} y={ew_y_d} r={ew_r_d}
            ped={false} pedWalk={false} />
        </div>
      </div>

      {/* Controls */}
      <div style={{ maxWidth:900, margin:"32px auto 0",
        background:"#12121a", borderRadius:16, border:"1px solid #2a2a40",
        padding:24 }}>
        <p style={{ fontSize:11, color:"#6b6b8a", marginBottom:16,
          fontFamily:"'JetBrains Mono',monospace", letterSpacing:1 }}>
          CONTROLS
        </p>
        <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>
          <CtrlBtn icon={User} label="Pedestrian" color="#00e676"
            active={pedReq}
            onClick={() => { setPedReq(true); addLog("Pedestrian button pressed","ok") }} />
          <CtrlBtn icon={Activity} label="Vehicle NS" color="#6c63ff"
            active={vehNS}
            onClick={() => { setVehNS(v => !v); addLog("NS vehicle sensor toggled","info") }} />
          <CtrlBtn icon={Activity} label="Vehicle EW" color="#6c63ff"
            active={vehEW}
            onClick={() => { setVehEW(v => !v); addLog("EW vehicle sensor toggled","info") }} />
          <CtrlBtn icon={AlertTriangle} label="Emergency" color="#ff1744"
            active={emergency}
            onClick={() => {
              const next = !emergency
              setEmergency(next)
              addLog(next ? "EMERGENCY activated — All RED" : "Emergency cleared", next?"danger":"ok")
              if (next) { setState(STATES.EMERG); setTimer(T_ALLRED); setTotal(T_ALLRED) }
            }} />
          <CtrlBtn icon={Moon} label="Night Mode" color="#a78bfa"
            active={nightMode}
            onClick={() => {
              const next = !nightMode
              setNightMode(next)
              addLog(next ? "Night mode ON" : "Night mode OFF", "info")
              if (next) { setState(STATES.NIGHT); setTimer(600); setTotal(600) }
            }} />
          <CtrlBtn icon={RotateCcw} label="Reset" color="#ffd600"
            onClick={() => {
              setState(STATES.NS_G); setTimer(T_GREEN); setTotal(T_GREEN)
              setPedReq(false); setVehEW(false); setVehNS(false)
              setEmergency(false); setNightMode(false); setCycles(0)
              setLog([]); addLog("System reset","warn")
            }} />
        </div>
      </div>

      {/* Stats + Log */}
      <div style={{ maxWidth:900, margin:"20px auto 0",
        display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>

        {/* Stats */}
        <div style={{ background:"#12121a", borderRadius:16,
          border:"1px solid #2a2a40", padding:24 }}>
          <p style={{ fontSize:11, color:"#6b6b8a", marginBottom:16,
            fontFamily:"'JetBrains Mono',monospace", letterSpacing:1 }}>
            FSM STATE
          </p>
          {[
            ["Current State", state],
            ["Cycles Completed", cycles],
            ["Timer", `${(timer/1000).toFixed(2)}s`],
            ["Ped Request", pedReq ? "YES" : "NO"],
            ["NS Vehicle", vehNS ? "DETECTED" : "CLEAR"],
            ["EW Vehicle", vehEW ? "DETECTED" : "CLEAR"],
            ["Emergency", emergency ? "⚠ ACTIVE" : "NONE"],
            ["Night Mode", nightMode ? "🌙 ON" : "OFF"],
          ].map(([k,v]) => (
            <div key={k} style={{ display:"flex", justifyContent:"space-between",
              padding:"6px 0", borderBottom:"1px solid #1a1a28",
              fontSize:12 }}>
              <span style={{ color:"#6b6b8a" }}>{k}</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace",
                color: v==="YES"||v==="DETECTED"||v==="⚠ ACTIVE"?"#ff1744":
                       v==="🌙 ON"?"#a78bfa":"#e8e8f0" }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Log */}
        <div style={{ background:"#12121a", borderRadius:16,
          border:"1px solid #2a2a40", padding:24, maxHeight:320, overflow:"hidden" }}>
          <p style={{ fontSize:11, color:"#6b6b8a", marginBottom:16,
            fontFamily:"'JetBrains Mono',monospace", letterSpacing:1 }}>
            EVENT LOG
          </p>
          <div style={{ overflowY:"auto", maxHeight:240 }}>
            <AnimatePresence>
              {log.map((e,i) => <LogEntry key={i} entry={e}/>)}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign:"center", marginTop:40, fontSize:11, color:"#3a3a55" }}>
        FPGA Traffic Light Controller · Verilog RTL + React Simulator · Built with ❤️
      </div>
    </div>
  )
}
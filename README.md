# FPGA-Based Traffic Light Controller

![Verilog](https://img.shields.io/badge/Verilog-RTL-blueviolet?style=flat-square)
![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react)
![Simulation](https://img.shields.io/badge/Simulation-Icarus%20Verilog-green?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)
![Status](https://img.shields.io/badge/Status-Live-brightgreen?style=flat-square)

A fully verified FPGA-based traffic light controller implemented in **Verilog RTL** with a live **React web simulator** — deployed on Render.

🔴🟡🟢 **[Live Demo →] https://fpga-traffic-light-controller.onrender.com

---

## Features

- Moore FSM with 10 states: NS Green, NS Yellow, All-Red, EW Green, EW Yellow, All-Red, Pedestrian Walk, Pedestrian Clear, Emergency, Night Mode
- Single-clock domain design — no gated clocks, synthesis-safe
- Debounced + synchronized async inputs (2-FF synchronizer)
- Tick-driven countdown timer — parameterized timing
- Pedestrian request latch with walk/clear phases
- Emergency override — instant all-red
- Night mode — alternating amber flash
- Zero conflict guarantee — NS_G and EW_G never simultaneously HIGH
- React web simulator mirrors exact FSM logic
- GTKWave verified waveforms

---

## Project Structure

```
FPGA-Traffic-Light-Controller/
├── rtl/
│ ├── params.vh # Timing parameters
│ ├── clk_en.v # Clock enable divider (50MHz → 10Hz)
│ ├── debounce_sync.v # 2-FF synchronizer + debounce
│ ├── timer.v # Countdown timer
│ ├── traffic_fsm.v # Moore FSM (10 states)
│ └── top.v # Top-level integration
├── tb/
│ └── traffic_tb.v # Testbench with stimulus + checker
├── simulation/
│ └── traffic.vcd # GTKWave waveform output
├── waveforms/
│ └── full_sim.png # Simulation screenshots
├── web-ui/ # React simulator (Vite + Framer Motion)
└── README.md
```
---

## FSM State Diagram

┌─────────────────────────────────────┐
     ▼                                     │
  NS_GREEN ──(veh_ew | ped)──► NS_YELLOW   │
     ▲                            │        │
     │                       ALL_RED1      │
     │                        /     \      │
     │                   ped_req  no_ped   │
     │                      │        │     │
     │                  PED_WALK  EW_GREEN │
     │                      │        │     │
     │                  PED_CLEAR EW_YELLOW│
     │                      │        │     │
     └──────────────────────┘   ALL_RED2   │
                                    │      │
                                    └──────┘

EMERGENCY ──► ALL_RED (hold until cleared)
NIGHT ──► Amber flash alternating NS/EW

---

## Simulation

### Prerequisites
- [Icarus Verilog v12](https://bleyer.org/icarus/)
- GTKWave (included with Icarus installer)

### Run

```bash
# Compile
iverilog -g2005-sv -I rtl -o simulation/traffic_sim.out \
  rtl/clk_en.v rtl/debounce_sync.v rtl/timer.v \
  rtl/traffic_fsm.v rtl/top.v tb/traffic_tb.v

# Simulate
vvp simulation/traffic_sim.out

# View waveforms
gtkwave simulation/traffic.vcd
```

### Expected Output

=== FPGA Traffic Light Controller Simulation ===

Reset released — Normal cycle starting
T=100 | NS[G=1 Y=0 R=0] EW[G=0 Y=0 R=1] PED_WALK=0
EW vehicle detected
Pedestrian button pressed
EMERGENCY triggered — All RED
Emergency cleared — resuming
Night mode ON
Night mode OFF — resuming normal
=== Simulation Complete — No conflicts detected ✅ ===

---

## Web Simulator

Built with React 18 + Vite + Framer Motion. Mirrors exact Verilog FSM timing.

```bash
cd web-ui
npm install
npm run dev
# Open http://localhost:5173
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| RTL Design | Verilog-2005 |
| Simulation | Icarus Verilog v12 |
| Waveform | GTKWave |
| Web UI | React 18 + Vite |
| Animation | Framer Motion |
| Deployment | Render (Static Site) |

---

## Timing Parameters

| Parameter | Value |
|-----------|-------|
| Green minimum | 12 seconds |
| Yellow | 3 seconds |
| All-Red interlock | 1 second |
| Pedestrian walk | 8 seconds |
| Night flash period | 1.2 seconds |
| Simulation clock | 50 MHz |
| Tick rate | 10 Hz |

---

## Author

**Neha** — Computer Engineering, AI & Data Science  
NVIDIA DLI Certified · IIT Delhi Certified  
[GitHub] : https://github.com/Neha-Joshi05/FPGA-Traffic-Light-Controller.git

[LinkedIn] : https://www.linkedin.com/in/neha-joshi-0851a2322?utm_source=share_via&utm_content=profile&utm_medium=member_android

---

*Built as a full-stack VLSI + Web project — Verilog RTL verified and deployed live.*
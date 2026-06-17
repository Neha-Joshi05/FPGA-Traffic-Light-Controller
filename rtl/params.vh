// ============================================
// params.vh — Centralized timing parameters
// FPGA-Based Traffic Light Controller
// ============================================
`ifndef PARAMS_VH
`define PARAMS_VH

`define T_GREEN_MIN_S   12   // Minimum green duration (seconds)
`define T_YELLOW_S       3   // Yellow light duration (seconds)
`define T_ALLRED_S       1   // All-red interlock (seconds)
`define T_WALK_S         8   // Pedestrian walk duration (seconds)
`define T_FLASH_TICKS    5   // Night mode flash half-period (ticks)

`endif
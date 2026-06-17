// ============================================
// top.v — Top-level integration module
// Wires: tick gen → debouncers → FSM → outputs
// ============================================
module top (
    input  wire clk_50m,
    input  wire rst_btn,
    input  wire veh_ns_raw,
    input  wire veh_ew_raw,
    input  wire ped_btn_raw,
    input  wire emergency_raw,
    input  wire night_raw,
    output wire NS_G, NS_Y, NS_R,
    output wire EW_G, EW_Y, EW_R,
    output wire PED_WALK, PED_DONT
);

    wire rst_n = ~rst_btn;

    // 10 Hz tick
    wire tick;
    clk_en #(.CLK_HZ(50_000_000), .TICK_HZ(10)) u_tick (
        .clk   (clk_50m),
        .rst_n (rst_n),
        .tick  (tick)
    );

    // Debounce all inputs
    wire ped_pulse, ped_level;
    wire em_level, night_level;
    wire vns_level, vew_level;

    debounce_sync #(.TICKS(3)) u_ped (
        .clk(clk_50m), .rst_n(rst_n), .tick(tick),
        .async_in(ped_btn_raw), .pulse(ped_pulse), .level(ped_level)
    );
    debounce_sync #(.TICKS(1)) u_em (
        .clk(clk_50m), .rst_n(rst_n), .tick(tick),
        .async_in(emergency_raw), .pulse(), .level(em_level)
    );
    debounce_sync #(.TICKS(1)) u_ng (
        .clk(clk_50m), .rst_n(rst_n), .tick(tick),
        .async_in(night_raw), .pulse(), .level(night_level)
    );
    debounce_sync #(.TICKS(1)) u_vns (
        .clk(clk_50m), .rst_n(rst_n), .tick(tick),
        .async_in(veh_ns_raw), .pulse(), .level(vns_level)
    );
    debounce_sync #(.TICKS(1)) u_vew (
        .clk(clk_50m), .rst_n(rst_n), .tick(tick),
        .async_in(veh_ew_raw), .pulse(), .level(vew_level)
    );

    // FSM
    traffic_fsm #(.MAIN_IS_NS(1), .TICK_HZ(10)) u_fsm (
        .clk        (clk_50m),
        .rst_n      (rst_n),
        .tick       (tick),
        .veh_ns     (vns_level),
        .veh_ew     (vew_level),
        .ped_pulse  (ped_pulse),
        .emergency  (em_level),
        .night_mode (night_level),
        .ns_g(NS_G), .ns_y(NS_Y), .ns_r(NS_R),
        .ew_g(EW_G), .ew_y(EW_Y), .ew_r(EW_R),
        .ped_walk(PED_WALK), .ped_dontwalk(PED_DONT)
    );

endmodule
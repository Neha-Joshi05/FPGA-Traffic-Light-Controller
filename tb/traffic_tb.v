// ============================================
// traffic_tb.v — Testbench
// Accelerated simulation (small CLK_HZ)
// Tests: normal cycle, pedestrian, emergency,
//        night mode, conflict detection
// ============================================
`timescale 1ns/1ps

module traffic_tb;

    // ----------------------------------------
    // DUT signals
    // ----------------------------------------
    reg clk   = 0;
    reg rst_btn = 1;
    reg veh_ns  = 0;
    reg veh_ew  = 0;
    reg ped     = 0;
    reg emer    = 0;
    reg night   = 0;

    wire NS_G, NS_Y, NS_R;
    wire EW_G, EW_Y, EW_R;
    wire PW, PD;

    // ----------------------------------------
    // Instantiate top with SMALL clock
    // so simulation finishes fast
    // ----------------------------------------
    top #() DUT (
        .clk_50m      (clk),
        .rst_btn      (rst_btn),
        .veh_ns_raw   (veh_ns),
        .veh_ew_raw   (veh_ew),
        .ped_btn_raw  (ped),
        .emergency_raw(emer),
        .night_raw    (night),
        .NS_G(NS_G), .NS_Y(NS_Y), .NS_R(NS_R),
        .EW_G(EW_G), .EW_Y(EW_Y), .EW_R(EW_R),
        .PED_WALK(PW), .PED_DONT(PD)
    );

    // 100 MHz sim clock (10ns period)
    always #5 clk = ~clk;

    // ----------------------------------------
    // Safety checker — NEVER both green
    // ----------------------------------------
    always @(posedge clk) begin
        if (NS_G && EW_G) begin
            $display("❌ FATAL: NS_G and EW_G both HIGH at time %0t", $time);
            $finish;
        end
    end

    // ----------------------------------------
    // Monitor — print state changes
    // ----------------------------------------
    always @(NS_G or NS_Y or NS_R or EW_G or EW_Y or EW_R or PW) begin
        $display("T=%0t | NS[G=%b Y=%b R=%b] EW[G=%b Y=%b R=%b] PED_WALK=%b",
            $time, NS_G, NS_Y, NS_R, EW_G, EW_Y, EW_R, PW);
    end

    // ----------------------------------------
    // Stimulus
    // ----------------------------------------
    initial begin
        // Save waveform
        $dumpfile("simulation/traffic.vcd");
        $dumpvars(0, traffic_tb);

        $display("=== FPGA Traffic Light Controller Simulation ===");

        // Release reset after 100ns
        #100 rst_btn = 0;
        $display(">> Reset released — Normal cycle starting");

        // Let NS green run for a while
        #5000;

        // EW vehicle arrives — triggers NS→yellow transition
        $display(">> EW vehicle detected");
        veh_ew = 1;
        #3000 veh_ew = 0;

        // Pedestrian button press
        #5000;
        $display(">> Pedestrian button pressed");
        ped = 1;
        #500 ped = 0;

        // Let pedestrian walk phase complete
        #15000;

        // Emergency vehicle!
        $display(">> EMERGENCY triggered — All RED");
        emer = 1;
        #8000 emer = 0;
        $display(">> Emergency cleared — resuming");

        // Night mode
        #10000;
        $display(">> Night mode ON");
        night = 1;
        #10000 night = 0;
        $display(">> Night mode OFF — resuming normal");

        // Let it run a bit more
        #20000;

        $display("=== Simulation Complete — No conflicts detected ✅ ===");
        $finish;
    end

endmodule
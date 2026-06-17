// ============================================
// traffic_fsm.v — Moore FSM Traffic Controller
// States: NS_G, NS_Y, ALL_RED1, EW_G, EW_Y,
//         ALL_RED2, PED_WALK, PED_CLEAR,
//         EMERG_ALL_RED, NIGHT_FLASH
// ============================================
`include "rtl/params.vh"

module traffic_fsm #(
    parameter MAIN_IS_NS = 1,
    parameter TICK_HZ    = 10
)(
    input  wire clk,
    input  wire rst_n,
    input  wire tick,
    input  wire veh_ns,
    input  wire veh_ew,
    input  wire ped_pulse,
    input  wire emergency,
    input  wire night_mode,
    output reg  ns_g, ns_y, ns_r,
    output reg  ew_g, ew_y, ew_r,
    output reg  ped_walk, ped_dontwalk
);

    // ----------------------------------------
    // State encoding
    // ----------------------------------------
    localparam [3:0]
        S_NS_G         = 4'd0,
        S_NS_Y         = 4'd1,
        S_ALL_RED1     = 4'd2,
        S_EW_G         = 4'd3,
        S_EW_Y         = 4'd4,
        S_ALL_RED2     = 4'd5,
        S_PED_WALK     = 4'd6,
        S_PED_CLEAR    = 4'd7,
        S_EMERG        = 4'd8,
        S_NIGHT        = 4'd9;

    reg [3:0] state, next_state;

    // ----------------------------------------
    // Timer wires
    // ----------------------------------------
    reg        start_t;
    reg [15:0] ticks_load;
    wire       busy;

    timer u_timer (
        .clk          (clk),
        .rst_n        (rst_n),
        .tick         (tick),
        .start        (start_t),
        .ticks_to_run (ticks_load),
        .busy         (busy)
    );

    // ----------------------------------------
    // Seconds → ticks conversion
    // ----------------------------------------
    function [15:0] SEC;
        input integer s;
        SEC = s * TICK_HZ;
    endfunction

    // ----------------------------------------
    // Pedestrian request latch
    // ----------------------------------------
    reg ped_req;
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n)
            ped_req <= 1'b0;
        else if (ped_pulse)
            ped_req <= 1'b1;
        else if (state == S_PED_CLEAR)
            ped_req <= 1'b0;
    end

    // ----------------------------------------
    // Night flash toggle (uses tick)
    // ----------------------------------------
    reg flash;
    reg [3:0] flash_cnt;
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            flash     <= 0;
            flash_cnt <= 0;
        end else if (tick) begin
            if (flash_cnt == `T_FLASH_TICKS - 1) begin
                flash     <= ~flash;
                flash_cnt <= 0;
            end else begin
                flash_cnt <= flash_cnt + 1;
            end
        end
    end

    // ----------------------------------------
    // State register
    // ----------------------------------------
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n)
            state <= S_NS_G;
        else if (emergency)
            state <= S_EMERG;
        else if (night_mode)
            state <= S_NIGHT;
        else
            state <= next_state;
    end

    // ----------------------------------------
    // Next-state logic + timer control
    // ----------------------------------------
    always @(*) begin
        // defaults
        next_state = state;
        start_t    = 1'b0;
        ticks_load = 16'd0;

        // output defaults — all red safe state
        ns_g = 0; ns_y = 0; ns_r = 1;
        ew_g = 0; ew_y = 0; ew_r = 1;
        ped_walk = 0; ped_dontwalk = 1;

        case (state)

            S_NS_G: begin
                ns_g = 1; ns_r = 0;
                ew_r = 1;
                if (!busy) begin
                    start_t    = 1'b1;
                    ticks_load = SEC(`T_GREEN_MIN_S);
                end
                if (!busy && (ped_req || veh_ew))
                    next_state = S_NS_Y;
            end

            S_NS_Y: begin
                ns_y = 1; ns_r = 0;
                ew_r = 1;
                if (!busy) begin
                    start_t    = 1'b1;
                    ticks_load = SEC(`T_YELLOW_S);
                end
                if (!busy && ticks_load == 0)
                    next_state = S_ALL_RED1;
            end

            S_ALL_RED1: begin
                ns_r = 1; ew_r = 1;
                if (!busy) begin
                    start_t    = 1'b1;
                    ticks_load = SEC(`T_ALLRED_S);
                end
                if (!busy && ticks_load == 0)
                    next_state = ped_req ? S_PED_WALK : S_EW_G;
            end

            S_EW_G: begin
                ew_g = 1; ew_r = 0;
                ns_r = 1;
                if (!busy) begin
                    start_t    = 1'b1;
                    ticks_load = SEC(`T_GREEN_MIN_S);
                end
                if (!busy && (ped_req || veh_ns))
                    next_state = S_EW_Y;
            end

            S_EW_Y: begin
                ew_y = 1; ew_r = 0;
                ns_r = 1;
                if (!busy) begin
                    start_t    = 1'b1;
                    ticks_load = SEC(`T_YELLOW_S);
                end
                if (!busy && ticks_load == 0)
                    next_state = S_ALL_RED2;
            end

            S_ALL_RED2: begin
                ns_r = 1; ew_r = 1;
                if (!busy) begin
                    start_t    = 1'b1;
                    ticks_load = SEC(`T_ALLRED_S);
                end
                if (!busy && ticks_load == 0)
                    next_state = ped_req ? S_PED_WALK : S_NS_G;
            end

            S_PED_WALK: begin
                ns_r = 1; ew_r = 1;
                ped_walk = 1; ped_dontwalk = 0;
                if (!busy) begin
                    start_t    = 1'b1;
                    ticks_load = SEC(`T_WALK_S);
                end
                if (!busy && ticks_load == 0)
                    next_state = S_PED_CLEAR;
            end

            S_PED_CLEAR: begin
                ns_r = 1; ew_r = 1;
                ped_dontwalk = 1;
                if (!busy) begin
                    start_t    = 1'b1;
                    ticks_load = SEC(`T_ALLRED_S);
                end
                if (!busy && ticks_load == 0)
                    next_state = S_NS_G;
            end

            S_EMERG: begin
                ns_r = 1; ew_r = 1;
                ped_dontwalk = 1;
                // hold until emergency deasserts
                // state register returns to S_NS_G on next cycle
            end

            S_NIGHT: begin
                ped_dontwalk = 1;
                if (MAIN_IS_NS) begin
                    ns_y = flash;
                    ns_r = ~flash;
                    ew_r =  flash;
                    ew_y = ~flash;
                end else begin
                    ew_y =  flash;
                    ew_r = ~flash;
                    ns_r =  flash;
                    ns_y = ~flash;
                end
            end

            default: begin
                ns_r = 1; ew_r = 1;
                next_state = S_NS_G;
            end

        endcase
    end

endmodule
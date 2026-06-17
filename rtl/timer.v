// ============================================
// timer.v — Tick-driven countdown timer
// FSM uses this to time each traffic phase
// ============================================
module timer (
    input  wire        clk,
    input  wire        rst_n,
    input  wire        tick,
    input  wire        start,
    input  wire [15:0] ticks_to_run,
    output reg         busy
);

    reg [15:0] t;

    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            t    <= 0;
            busy <= 0;
        end else if (start) begin
            t    <= ticks_to_run;
            busy <= 1;
        end else if (busy && tick) begin
            if (t == 0)
                busy <= 0;
            else
                t <= t - 1;
        end
    end

endmodule
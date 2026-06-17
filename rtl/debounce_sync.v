// ============================================
// debounce_sync.v — 2FF Synchronizer + Debounce
// Cleans async button/sensor inputs
// ============================================
module debounce_sync #(
    parameter integer TICKS = 5   // stable ticks needed
)(
    input  wire clk,
    input  wire rst_n,
    input  wire tick,
    input  wire async_in,
    output reg  pulse,            // 1-tick pulse on rising edge
    output reg  level             // debounced level
);

    // 2-FF synchronizer
    reg s1, s2;
    always @(posedge clk) begin
        s1 <= async_in;
        s2 <= s1;
    end

    // Debounce counter
    reg [$clog2(TICKS+1)-1:0] db;
    reg stable;

    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            db     <= 0;
            stable <= 0;
            level  <= 0;
            pulse  <= 0;
        end else begin
            pulse <= 0;
            if (tick) begin
                if (s2 != stable) begin
                    db <= db + 1;
                    if (db == TICKS) begin
                        stable <= s2;
                        db     <= 0;
                    end
                end else begin
                    db <= 0;
                end
                if (stable && !level) begin
                    level <= 1;
                    pulse <= 1;
                end else if (!stable) begin
                    level <= 0;
                end
            end
        end
    end

endmodule
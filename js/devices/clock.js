/**
 ** Name: Generic Clock (compatible)
 ** ID: 0x12d0b402
 ** Version: 1
 **
 ** Interrupts do different things depending on contents of the A register:
 **
 **  A | BEHAVIOR
 ** ---+----------------------------------------------------------------------------
 **  0 | The B register is read, and the clock will tick 60/B times per second.
 **    | If B is 0, the clock is turned off.
 **  1 | Store number of ticks elapsed since last call to 0 in C register
 **  2 | If register B is non-zero, turn on interrupts with message B. If B is zero,
 **    | disable interrupts
 ** ---+----------------------------------------------------------------------------

When interrupts are enabled, the clock will trigger an interrupt whenever it
ticks.
 **/

(function () {
    function Clock() {
        this.clocksPerSecond = 0;
    }
    
    this.Clock = Clock;
    
    var CLOCKS_PER_SECOND = 60;
    
    Clock.prototype.clock = function (cycles) {
        if (!this.clocksPerSecond) {
            return ;
        }

        this.countup += cycles;

        while (this.clocksPerSecond <= this.countup) {
            this.countup -= this.clocksPerSecond;
            this.count = (this.count + cycles) & 0xFFFF;
            
            if (this.interrupt) {
                this.cpu.receive(this.interrupt);
            }
        }
    };

    Clock.prototype.detach = function() {
        this.cpu.remove(this);
    }

    Clock.prototype.reset = function() {
        this.count = 0;
        this.counting = 0;
        this.interrupt = 0;
    }
    
    Clock.prototype.master = function (master) {
        this.cpu = master;
    };
    
    Clock.prototype.receive = function (message, bypass) {
        switch (message) {
        case 0: // Reset
            this.countup = 0;
            this.count = 0;
            this.clocksPerSecond = DCPU.CLOCK_SPEED * this.cpu.b / CLOCKS_PER_SECOND;
            break ;
        case 1: // Get Counter
            this.cpu.c = this.count;
            break ;
        case 2: // Interrupter
            this.interrupt = this.cpu.b;
            break ;
        }
    }
 
    Object.defineProperties(Clock.prototype, {
        'description':  { 'value': "Generic Clock", 'configurable': false }, 
        'vendorID':     { 'value': 0x1c6c8b36, 'configurable': false },
        'deviceID':     { 'value': 0x12d0b402, 'configurable': false },
        'revision':     { 'value': 0x0001, 'configurable': false }
    });
}).call(this);

/**
 ** Name: Generic Keyboard (compatible)
 ** ID: 0x30cf7406
 ** Version: 1
 **
 ** Interrupts do different things depending on contents of the A register:
 **
 **  A | BEHAVIOR
 ** ---+----------------------------------------------------------------------------
 **  0 | Clear keyboard buffer
 **  1 | Store next key typed in C register, or 0 if the buffer is empty
 **  2 | Set C register to 1 if the key specified by the B register is pressed, or
 **    | 0 if it's not pressed
 **  3 | If register B is non-zero, turn on interrupts with message B. If B is zero,
 **    | disable interrupts
 ** ---+----------------------------------------------------------------------------
 **
 ** When interrupts are enabled, the keyboard will trigger an interrupt when one or
 ** more keys have been pressed, released, or typed.
 **
 ** Key numbers are:
 **     0x10: Backspace
 **     0x11: Return
 **     0x12: Insert
 **     0x13: Delete
 **     0x20-0x7f: ASCII characters
 **     0x80: Arrow up
 **     0x81: Arrow down
 **     0x82: Arrow left
 **     0x83: Arrow right
 **     0x90: Shift
 **     0x91: Control
 **/

(function () {
    var keydown = [];

    function remap (code) {
        switch (code) {
        case 8:     return 0x10;
        case 13:    return 0x11;
        case 45:    return 0x12;
        case 46:    return 0x13;
        case 38:    return 0x80;
        case 40:    return 0x81;
        case 37:    return 0x82;
        case 39:    return 0x83;
        case 16:    return 0x90;
        case 17:    return 0x91;        
        };
        return null;
    }
    
    function Keyboard() {
        this.reset();
        
        var that = this;
        document.addEventListener('keydown', function (evt) {
            if ((evt.which >= 37 && evt.which <= 40) || evt.which == 8) {
                evt.preventDefault();
            }

            var r = remap(evt.which) ;
            keydown[r || evt.which] = 0;
            if (r) {
                that.queue.push(r);
                that.irq();
            }
        });
        
        document.addEventListener('keypress', function (evt) {
            var key = evt.which;

            if (key >= 0x20 && key < 0x7F) {
                that.queue.push(key);
                evt.preventDefault();
                that.irq();
            }
        });
        
        document.addEventListener('keyup', function (evt) {
            keydown[remap(evt.which) || evt.which] = 0;
            that.irq();
        });
    }
    this.Keyboard = Keyboard;
    
    Keyboard.prototype.irq = function () {
        if (this.interrupt) {
            this.cpu.receive(this.interrupt);
        }
    }
    
    Keyboard.prototype.clock = function (cycles) {
    };

    Keyboard.prototype.reset = function() {
        this.queue = [];
        this.interrupt = 0;
    }
    
    Keyboard.prototype.detach = function() {
        this.cpu.remove(this);
    }
    
    Keyboard.prototype.master = function (master) {
        this.cpu = master;
    };
    
    Keyboard.prototype.receive = function (message, bypass) {
        switch (message) {
        case 0: // Reset
            this.queue = [];
            break ;
        case 1:
            this.cpu.c = this.queue.length ? this.queue.shift() : 0;
            break ;
        case 2: // key down
            this.cpu.c = this.keydown[remap(this.cpu.b)] || 0;
            break ;
        case 3:
            this.interrupt = this.cpu.b;
            break ;
        }
    }
 
    Object.defineProperties(Keyboard.prototype, {
        'description':  { 'value': "Generic Keyboard", 'configurable': false },
        'vendorID':     { 'value': 0x1c6c8b36, 'configurable': false },
        'deviceID':     { 'value': 0x30cf7406, 'configurable': false },
        'revision':     { 'value': 0x0001, 'configurable': false }
    });
}).call(this);

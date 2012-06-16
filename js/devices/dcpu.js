/**
 ** DCPU-16 Specification
 ** Copyright 1985 Mojang
 ** Version 1.7
 ** 
 ** 
 ** 
 ** === SUMMARY ====================================================================
 ** 
 ** * 16 bit words
 ** * 0x10000 words of ram
 ** * 8 registers (A, B, C, X, Y, Z, I, J)
 ** * program counter (PC)
 ** * stack pointer (SP)
 ** * extra/excess (EX)
 ** * interrupt address (IA)
 ** 
 ** In this document, anything within [brackets] is shorthand for "the value of the
 ** RAM at the location of the value inside the brackets". For example, SP means
 ** stack pointer, but [SP] means the value of the RAM at the location the stack
 ** pointer is pointing at.
 ** 
 ** Whenever the CPU needs to read a word, it reads [PC], then increases PC by one.
 ** Shorthand for this is [PC++]. In some cases, the CPU will modify a value before
 ** reading it, in this case the shorthand is [++PC].
 ** 
 ** For stability and to reduce bugs, it's strongly suggested all multi-word
 ** operations use little endian in all DCPU-16 programs, wherever possible.
 ** 
 ** 
 ** 
 ** === INSTRUCTIONS ===============================================================
 ** 
 ** Instructions are 1-3 words long and are fully defined by the first word.
 ** In a basic instruction, the lower five bits of the first word of the instruction
 ** are the opcode, and the remaining eleven bits are split into a five bit value b
 ** and a six bit value a.
 ** b is always handled by the processor after a, and is the lower five bits.
 ** In bits (in LSB-0 format), a basic instruction has the format: aaaaaabbbbbooooo
 ** 
 ** In the tables below, C is the time required in cycles to look up the value, or
 ** perform the opcode, VALUE is the numerical value, NAME is the mnemonic, and
 ** DESCRIPTION is a short text that describes the opcode or value.
 ** 
 ** 
 ** 
 ** --- Values: (5/6 bits) ---------------------------------------------------------
 **  C | VALUE     | DESCRIPTION
 ** ---+-----------+----------------------------------------------------------------
 **  0 | 0x00-0x07 | register (A, B, C, X, Y, Z, I or J, in that order)
 **  0 | 0x08-0x0f | [register]
 **  1 | 0x10-0x17 | [register + next word]
 **  0 |      0x18 | (PUSH / [--SP]) if in b, or (POP / [SP++]) if in a
 **  0 |      0x19 | [SP] / PEEK
 **  1 |      0x1a | [SP + next word] / PICK n
 **  0 |      0x1b | SP
 **  0 |      0x1c | PC
 **  0 |      0x1d | EX
 **  1 |      0x1e | [next word]
 **  1 |      0x1f | next word (literal)
 **  0 | 0x20-0x3f | literal value 0xffff-0x1e (-1..30) (literal) (only for a)
 **  --+-----------+----------------------------------------------------------------
 **   
 ** * "next word" means "[PC++]". Increases the word length of the instruction by 1.
 ** * By using 0x18, 0x19, 0x1a as PEEK, POP/PUSH, and PICK there's a reverse stack
 **   starting at memory location 0xffff. Example: "SET PUSH, 10", "SET X, POP"
 ** * Attempting to write to a literal value fails silently
 ** 
 ** 
 ** 
 ** --- Basic opcodes (5 bits) ----------------------------------------------------
 **  C | VAL  | NAME     | DESCRIPTION
 ** ---+------+----------+---------------------------------------------------------
 **  - | 0x00 | n/a      | special instruction - see below
 **  1 | 0x01 | SET b, a | sets b to a
 **  2 | 0x02 | ADD b, a | sets b to b+a, sets EX to 0x0001 if there's an overflow, 
 **    |      |          | 0x0 otherwise
 **  2 | 0x03 | SUB b, a | sets b to b-a, sets EX to 0xffff if there's an underflow,
 **    |      |          | 0x0 otherwise
 **  2 | 0x04 | MUL b, a | sets b to b*a, sets EX to ((b*a)>>16)&0xffff (treats b,
 **    |      |          | a as unsigned)
 **  2 | 0x05 | MLI b, a | like MUL, but treat b, a as signed
 **  3 | 0x06 | DIV b, a | sets b to b/a, sets EX to ((b<<16)/a)&0xffff. if a==0,
 **    |      |          | sets b and EX to 0 instead. (treats b, a as unsigned)
 **  3 | 0x07 | DVI b, a | like DIV, but treat b, a as signed. Rounds towards 0
 **  3 | 0x08 | MOD b, a | sets b to b%a. if a==0, sets b to 0 instead.
 **  3 | 0x09 | MDI b, a | like MOD, but treat b, a as signed. (MDI -7, 16 == -7)
 **  1 | 0x0a | AND b, a | sets b to b&a
 **  1 | 0x0b | BOR b, a | sets b to b|a
 **  1 | 0x0c | XOR b, a | sets b to b^a
 **  1 | 0x0d | SHR b, a | sets b to b>>>a, sets EX to ((b<<16)>>a)&0xffff 
 **    |      |          | (logical shift)
 **  1 | 0x0e | ASR b, a | sets b to b>>a, sets EX to ((b<<16)>>>a)&0xffff 
 **    |      |          | (arithmetic shift) (treats b as signed)
 **  1 | 0x0f | SHL b, a | sets b to b<<a, sets EX to ((b<<a)>>16)&0xffff
 ** 
 **  2+| 0x10 | IFB b, a | performs next instruction only if (b&a)!=0
 **  2+| 0x11 | IFC b, a | performs next instruction only if (b&a)==0
 **  2+| 0x12 | IFE b, a | performs next instruction only if b==a 
 **  2+| 0x13 | IFN b, a | performs next instruction only if b!=a 
 **  2+| 0x14 | IFG b, a | performs next instruction only if b>a 
 **  2+| 0x15 | IFA b, a | performs next instruction only if b>a (signed)
 **  2+| 0x16 | IFL b, a | performs next instruction only if b<a 
 **  2+| 0x17 | IFU b, a | performs next instruction only if b<a (signed)
 **  - | 0x18 | -        |
 **  - | 0x19 | -        |
 **  3 | 0x1a | ADX b, a | sets b to b+a+EX, sets EX to 0x0001 if there is an over-
 **    |      |          | flow, 0x0 otherwise
 **  3 | 0x1b | SBX b, a | sets b to b-a+EX, sets EX to 0xFFFF if there is an under-
 **    |      |          | flow, 0x0 otherwise
 **  - | 0x1c | -        | 
 **  - | 0x1d | -        |
 **  2 | 0x1e | STI b, a | sets b to a, then increases I and J by 1
 **  2 | 0x1f | STD b, a | sets b to a, then decreases I and J by 1
 ** ---+------+----------+----------------------------------------------------------
 ** 
 ** * The branching opcodes take one cycle longer to perform if the test fails
 **   When they skip an if instruction, they will skip an additional instruction
 **   at the cost of one extra cycle. This lets you easily chain conditionals.  
 ** * Signed numbers are represented using two's complement.
 ** 
 **     
 ** Special opcodes always have their lower five bits unset, have one value and a
 ** five bit opcode. In binary, they have the format: aaaaaaooooo00000
 ** The value (a) is in the same six bit format as defined earlier.
 ** 
 ** --- Special opcodes: (5 bits) --------------------------------------------------
 **  C | VAL  | NAME  | DESCRIPTION
 ** ---+------+-------+-------------------------------------------------------------
 **  - | 0x00 | n/a   | reserved for future expansion
 **  3 | 0x01 | JSR a | pushes the address of the next instruction to the stack,
 **    |      |       | then sets PC to a
 **  - | 0x02 | -     |
 **  - | 0x03 | -     |
 **  - | 0x04 | -     |
 **  - | 0x05 | -     |
 **  - | 0x06 | -     |
 **  - | 0x07 | -     | 
 **  4 | 0x08 | INT a | triggers a software interrupt with message a
 **  1 | 0x09 | IAG a | sets a to IA 
 **  1 | 0x0a | IAS a | sets IA to a
 **  3 | 0x0b | RFI a | disables interrupt queueing, pops A from the stack, then 
 **    |      |       | pops PC from the stack
 **  2 | 0x0c | IAQ a | if a is nonzero, interrupts will be added to the queue
 **    |      |       | instead of triggered. if a is zero, interrupts will be
 **    |      |       | triggered as normal again
 **  - | 0x0d | -     |
 **  - | 0x0e | -     |
 **  - | 0x0f | -     |
 **  2 | 0x10 | HWN a | sets a to number of connected hardware devices
 **  4 | 0x11 | HWQ a | sets A, B, C, X, Y registers to information about hardware a
 **    |      |       | A+(B<<16) is a 32 bit word identifying the hardware id
 **    |      |       | C is the hardware version
 **    |      |       | X+(Y<<16) is a 32 bit word identifying the manufacturer
 **  4+| 0x12 | HWI a | sends an interrupt to hardware a
 **  - | 0x13 | -     |
 **  - | 0x14 | -     |
 **  - | 0x15 | -     |
 **  - | 0x16 | -     |
 **  - | 0x17 | -     |
 **  - | 0x18 | -     |
 **  - | 0x19 | -     |
 **  - | 0x1a | -     |
 **  - | 0x1b | -     |
 **  - | 0x1c | -     |
 **  - | 0x1d | -     |
 **  - | 0x1e | -     |
 **  - | 0x1f | -     |
 ** ---+------+-------+-------------------------------------------------------------
 ** 
 ** 
 ** 
 ** === INTERRUPTS =================================================================    
 ** 
 ** The DCPU-16 will perform at most one interrupt between each instruction. If
 ** multiple interrupts are triggered at the same time, they are added to a queue.
 ** If the queue grows longer than 256 interrupts, the DCPU-16 will catch fire. 
 ** 
 ** When IA is set to something other than 0, interrupts triggered on the DCPU-16
 ** will turn on interrupt queueing, push PC to the stack, followed by pushing A to
 ** the stack, then set the PC to IA, and A to the interrupt message.
 **  
 ** If IA is set to 0, a triggered interrupt does nothing. Software interrupts still
 ** take up four clock cycles, but immediately return, incoming hardware interrupts
 ** are ignored. Note that a queued interrupt is considered triggered when it leaves
 ** the queue, not when it enters it.
 ** 
 ** Interrupt handlers should end with RFI, which will disable interrupt queueing
 ** and pop A and PC from the stack as a single atomic instruction.
 ** IAQ is normally not needed within an interrupt handler, but is useful for time
 ** critical code.
 ** 
 ** 
 ** 
 ** 
 ** === HARDWARE ===================================================================    
 ** 
 ** The DCPU-16 supports up to 65535 connected hardware devices. These devices can
 ** be anything from additional storage, sensors, monitors or speakers.
 ** How to control the hardware is specified per hardware device, but the DCPU-16
 ** supports a standard enumeration method for detecting connected hardware via
 ** the HWN, HWQ and HWI instructions.
 ** 
 ** Interrupts sent to hardware can't contain messages, can take additional cycles,
 ** and can read or modify any registers or memory adresses on the DCPU-16. This
 ** behavior changes per hardware device and is described in the hardware's
 ** documentation.
 ** 
 ** Hardware must NOT start modifying registers or ram on the DCPU-16 before at
 ** least one HWI call has been made to the hardware.
 ** 
 ** The DPCU-16 does not support hot swapping hardware. The behavior of connecting
 ** or disconnecting hardware while the DCPU-16 is running is undefined.
 **/

(function () {
    DCPU.CLOCK_SPEED = 100000;
    function DCPU() {
        var buffer = new ArrayBuffer(0x20020);
        this.memory = new Uint16Array(buffer);
        this.signed = new Int16Array(buffer);
        this.regs   = this.memory.subarray(0x10000);
        this.devices = [];
        
        var that = this;
        
        ['a', 'b', 'c', 'x', 'y', 'z', 'i', 'j', 'sp', 'pc', 'ex'].forEach(function (name, index) {
            Object.defineProperty(that, name, {
                'get': function() {
                    return this.regs[index];
                },
                'set': function(v) {
                    this.regs[index] = v;
                },
                'configurable': false,
                'enumerable': false
            });
        });

        Object.defineProperties(this, {
            'push': {
                'get': function() {
                    return (--this.sp) & 0xFFFF;
                },
                'configurable': false,
                'enumerable': false
            },
            'next': {
                'get': function() {
                    return this.pc++;
                },
                'configurable': false,
                'enumerable': false
            },
            'pop': {
                'get': function() {
                    return this.sp++;
                },
                'configurable': false,
                'enumerable': false
            }
        });
        
        this.reset();
    }
    this.DCPU = DCPU;

    // --- Device definitions
    Object.defineProperties(DCPU.prototype, {
        'description':  { 'value': "DCPU", 'configurable': false }, 
        'vendorID':     { 'value': 0x1c6c8b36, 'configurable': false },
        'deviceID':     { 'value': 0xDC620000, 'configurable': false },
        'revision':     { 'value': 0x0107, 'configurable': false }
    });

    DCPU.prototype.load = function(data) {
        if (data.buffer !== undefined) {
            this.bios = data;
            this.reset();
            return ;
        }

        var xhr = new XMLHttpRequest(),
            that = this;
        
        xhr.onreadystatechange = function () {
            if (xhr.readyState !== 4) {
                return;
            }
            
            if (xhr.status !== 200) {
                throw Error("Failed to load " + url + ": " + xhr.statusText + "("+xhr.status +")");
            }

            var buff = xhr.response,
                data = new Uint8Array(buff),
                rom = new ArrayBuffer(buff.byteLength),
                bytes = new Uint8Array(rom);
                
            that.bios = new Uint16Array(rom);

            for (var i = 0; i < buff.byteLength; i++) {
                bytes[i^1] = data[i];
            }
            that.reset();
        }

        xhr.open('GET', data, true);
        xhr.responseType = 'arraybuffer';
        xhr.send();
    };
    
    DCPU.prototype.reset = function () {    
        for (var i = 0; i < this.memory.length; i++ ) {
            this.memory[i] = (this.bios && i < this.bios.length) ? this.bios[i] : 0;
        }
        
        this.cycles = 0;
        this.ia = 0;
        this.iaq = 0;
        this.queue = [];

        // Reset devices, but prevent stack overflow by denying circular references
        this.reset = function() {};
        this.devices.forEach(function(d) {d.reset();});
        delete this.reset;
    };
    
    DCPU.prototype.remove = function(dev) {
        this.devices = this.devices.filter(function(e) { return e !== dev; });
        this.reset();
    }
    
    DCPU.prototype.detach = function() {
        if (this.cpu) {
            this.cpu.remove(this);
        }
    };
    
    DCPU.prototype.oncrash = function (event) { };
    DCPU.prototype.onstep = function (event) { };
    
    DCPU.prototype.run = function (enable) {
        if (!enable) {
            if (this.interval) {
                clearInterval(this.interval);
                delete this.interval;
                delete this.previousTime;
            }
        } else {
            if (!this.interval) {
                var that = this;
                this.interval = setInterval( function() {
                    try {
                        that.execute();
                    } catch(e) {
                        that.oncrash(e);
                        clearInterval(that.interval);
                        delete that.interval;
                    }
                }, 20 );
            }
        }
    };
    
    DCPU.prototype.execute = function () {
        var currentTime = (new Date().getTime());
        this.cycles += (currentTime - this.previousTime) * DCPU.CLOCK_SPEED / 1000 || 0;
        this.previousTime = currentTime;

        while (this.cycles > 0) {
            this.step();
        }
        this.onstep();
    };
    
    DCPU.prototype.wait = function (cycles) {
        this.devices.forEach(function(d) { d.clock(cycles); });
        this.cycles -= cycles;
    };
    
    DCPU.prototype.clock = function (cycles) {
        // DCPU is self clocking
    };

    DCPU.prototype.master = function (master) {
        this.cpu = master;
    };
    
    DCPU.prototype.slave = function (device) {
        if (this.devices.length >= 0xFFFF) {
            throw Error("Cannot register more than 65,535 devices");
        }
    
        device.master(this);
        this.devices.push(device);
        
        // We cannot hot-swap
        this.reset();
    };
    
    DCPU.prototype.receive = function (message, bypass) {
        if (bypass) {
            // INT forcibly interrupts, disable interrupt queuing and force
            // message to the front.
            this.iaq = 0;
            this.queue.unshift(message);
        } else {
            this.queue.push(message);

            if (this.queue.length > 0x100) {
                throw Error("The DCPU has caught fire: Interrupt Overflow");
            }
        }

        this.interrupt();
    };
    
    DCPU.prototype.interrupt = function () {
        if (!this.queue.length || this.iaq) {
            return ;
        }
    
        if (this.ia) {
            this.iaq = 1;
            this.memory[this.push] = this.pc;
            this.memory[this.push] = this.a;
            this.pc = this.ia;
            this.a = this.queue.shift();
        } else {
            this.queue = [];
        }
    };
    
    // Create instruction timing    
    (function getCosts () {
        this.cycle_cost = new Array(0x10000);
        this.inst_length = new Array(0x10000);

        for (var instruction = 0; instruction < 0x10000; instruction++ ) {
            var o_field = instruction & 0x1F,
                a_field = instruction >> 10,
                b_field = (instruction >> 5) & 0x1F,
                o_cost = [0,1,2,2,2,2,3,3,3,3,1,1,1,1,1,1,2,2,2,2,2,2,2,2,0,0,3,3,0,0,2,2],
                b_cost = [0,3,0,0,0,0,0,0,4,1,1,3,2,0,0,0,2,4,4,0,0,0,0,0,0,0,0,0,0,0,0,0],
                f_cost = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,1,0,0,0,1,1]; // Doubles as instruction length
            
            if (o_field !== 0) {
                this.cycle_cost[instruction] = o_cost[o_field] + (f_cost[a_field] || 0) + (f_cost[b_field] || 0);
                this.inst_length[instruction] = (f_cost[a_field] || 0) + (f_cost[b_field] || 0);
            } else {
                this.cycle_cost[instruction] = b_cost[b_field] + (f_cost[a_field] || 0);
                this.inst_length[instruction] = (f_cost[a_field] || 0);
            }
        }
    }).call(DCPU.prototype);
    
    DCPU.prototype.skip = function () {
        do {
            var op = this.memory[this.next];
            this.pc += this.inst_length[op];
            this.wait(1);
            
            if ((op & 0x18) != 0x10) {
                return ;
            }
        } while (true);
    };
    
    DCPU.prototype.overlay = function (data, offset, length) {
        var i = 0;
        
        length = length || data.length;
        offset = offset || 0;
        
        while (length-- > 0) {
            this.memory[offset] = data[i++];
            offset = (offset + 1) & 0xFFFF;
        }
    }
    
    DCPU.prototype.step = function () {
        var o_field, a_field, b_field, a_data, b_data, result, instruction, cycles,
            that = this;
        
        function getField (field, a_field) {
            var ea;
            switch (field) {
                case 0x00: case 0x01: case 0x02: case 0x03:
                case 0x04: case 0x05: case 0x06: case 0x07:
                    ea = 0x10000 + field;
                    break ;
                case 0x08: case 0x09: case 0x0A: case 0x0B:
                case 0x0C: case 0x0D: case 0x0E: case 0x0F:
                    ea = that.memory[0x10000 - 0x08 + field];
                    break ;
                case 0x10: case 0x11: case 0x12: case 0x13:
                case 0x14: case 0x15: case 0x16: case 0x17:
                    ea = (that.memory[0x10000 - 0x10 + field] + that.memory[that.next]) & 0xFFFF;
                    break ;
                case 0x18:
                    ea = a_field ? that.pop : that.push;
                    break ;
                case 0x19:
                    ea = that.sp;
                    break ;
                case 0x1A:
                    ea = (that.sp + that.memory[that.next]) & 0xFFFF;
                    break ;
                case 0x1B:
                    ea = 0x10008;
                    break ;
                case 0x1C:
                    ea = 0x10009;
                    break ;
                case 0x1D:
                    ea = 0x1000A;
                    break ;
                case 0x1E:
                    ea = that.memory[that.next];
                    break ;
                case 0x1F:
                    ea = that.next;
                    break ;
                case 0x20:
                    return { 'value': 0xFFFF, 'signed': -1 };
                default:
                    return { 'value': field - 0x21, 'signed': field - 0x21 };
            }
            
            return { 'ea': ea, 'value': that.memory[ea], 'signed': that.signed[ea] };
        }

        function writeField (field, data) {
            if (field.ea === undefined) {
                return ;
            }
            that.memory[field.ea] = data;
        }
        
        instruction = this.memory[this.next];     
        
        // Instruction decode phase
        o_field = instruction & 0x1F;
        a_field = instruction >> 10;
        b_field = (instruction >> 5) & 0x1F;

        if (o_field !== 0) {
            a_data = getField(a_field, true);
            b_data = getField(b_field, false);
            switch (o_field) {
            case 0x01: // SET
                writeField(b_data, a_data.value);
                break ;
            case 0x02: // ADD
                result = b_data.value + a_data.value;
                writeField(b_data, result);
                this.ex = result >> 16;
                break ;
            case 0x03: // SUB
                result = b_data.value - a_data.value;
                writeField(b_data, result);
                this.ex = result >> 16;
                break ;
            case 0x04: // MUL
                result = b_data.value * a_data.value;
                writeField(b_data, result & 0xFFFF);
                this.ex = result >> 16;
                break ;
            case 0x05: // MLI
                result = b_data.signed * a_data.signed;
                writeField(b_data, result & 0xFFFF);
                this.ex = result >> 16;
                break ;
            case 0x06: // DIV
                result = (a_data.value) ? (b_data.value * 0x10000 / a_data.value) : 0
                writeField(b_data, result / 0x10000);
                this.ex = result;
                break ;
            case 0x07: // DVI
                result = (a_data.value) ? (b_data.signed * 0x10000 / a_data.signed) : 0
                writeField(b_data, result / 0x10000);
                this.ex = result;
                break ;
            case 0x08: // MOD
                result = (a_data.value) ? (b_data.value % a_data.value) : 0;
                writeField(b_data, result);
                break ;
            case 0x09: // MDI
                result = (a_data.value) ? (b_data.signed % a_data.signed) : 0;
                writeField(b_data, result);
                break ;
            case 0x0a: // AND
                writeField(b_data, b_data.value & a_data.value);
                break ;
            case 0x0b: // BOR
                writeField(b_data, b_data.value | a_data.value);
                break ;
            case 0x0c: // XOR
                writeField(b_data, b_data.value ^ a_data.value);
                break ;
            case 0x0d: // SHR
                writeField(b_data, b_data.value >> a_data.value);
                this.ex = (b_data.value << 16) >> a_data.value;
                break ;
            case 0x0e: // ASR
                result = (b_data.signed << 16) >> a_data.value;
                writeField(b_data, result >> 16);
                this.ex = result;
                break ;
            case 0x0f: // SHL
                result = b_data.value << a_data.value;
                writeField(b_data, result);
                this.ex = result >> 16;
                break ;
            case 0x10: // IFB
                if (!(b_data.value & a_data.value)) this.skip();
                break ;
            case 0x11: // IFC
                if (b_data.value & a_data.value) this.skip();
                break ;
            case 0x12: // IFE
                if (b_data.value != a_data.value) this.skip();
                break ;
            case 0x13: // IFN
                if (b_data.value == a_data.value) this.skip();
                break ;
            case 0x14: // IFG
                if (b_data.value <= a_data.value) this.skip();
                break ;
            case 0x15: // IFA
                if (b_data.signed <= a_data.signed) this.skip();
                break ;
            case 0x16: // IFL
                if (b_data.value >= a_data.value) this.skip();
                break ;
            case 0x17: // IFU
                if (b_data.signed >= a_data.signed) this.skip();
                break ;
            case 0x1a: // ADX
                result = b_data.value + a_data.value + this.ex;
                writeField(b_data, result);
                this.ex = result >> 16;
                break ;
            case 0x1b: // SBX
                result = b_data.value - a_data.value + this.ex;
                writeField(b_data, result);
                this.ex = result >> 16;
                break ;
            case 0x1e: // STI
                writeField(b_data, a_data.value);
                this.i ++;
                this.j ++;
                break ;
            case 0x1f: // STD
                writeField(b_data, a_data.value);
                this.i --;
                this.j --;
                break ;
            default:
                throw Error("DCPU has caught fire: Invalid 2OP instruction " + o_field.toString(16));
            }
        } else {
            a_data = getField(a_field, true);
            switch (b_field) {
            case 0x01: // JSR
                this.memory[this.push] = this.pc;
                this.pc = a_data.value;
                break ;
            case 0x08: // INT
                this.receive(a_data.value, true);
                break ;
            case 0x09: // IAG
                writeField(a_data, this.ia);
                break ;
            case 0x0a: // IAS
                this.ia = a_data.value;
                break ;
            case 0x0b: // RFI
                this.iaq = 0;
                
                this.a = this.memory[this.pop];
                this.pc = this.memory[this.pop];

                this.interrupt();
                break ;
            case 0x0c: // IAQ
                this.iaq = a_data.value;
                this.interrupt();
                break ;
            case 0x10: // HWN
                writeField(a_data, this.devices.length);
                break ;
            case 0x11: // HWQ
                if (a_data.value >= this.devices.length) {
                    throw new Error("DCPU caught fire: Accessed device that did not exist");
                }
                
                this.a = this.devices[a_data.value].deviceID;
                this.b = this.devices[a_data.value].deviceID >> 16;
                this.c = this.devices[a_data.value].revision;
                this.x = this.devices[a_data.value].vendorID;
                this.y = this.devices[a_data.value].vendorID >> 16;
                break ;
            case 0x12: // HWI
                if (a_data.value >= this.devices.length) {
                    throw new Error("DCPU caught fire: Accessed device that did not exist");
                }
                
                this.devices[a_data.value].receive(this.a);
                break ;
            default:
                throw Error("DCPU has caught fire: Invalid 1OP instruction " + b_field.toString(16));
            }
        }
        this.wait(this.cycle_cost[instruction]);
    };
}).call(this);

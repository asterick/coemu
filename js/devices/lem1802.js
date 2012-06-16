/** NE_LEM1802 v1.0
 **     
 **                                      \ |  ___ 
 **                                    |\ \|  ___  
 **                                    | \
 ** 
 **                                  NYA ELEKTRISKA
 **                              innovation information
 ** 
 ** 
 ** 
 ** 
 ** DCPU-16 Hardware Info:
 **     Name: LEM1802 - Low Energy Monitor
 **     ID: 0x7349f615, version: 0x1802
 **     Manufacturer: 0x1c6c8b36 (NYA_ELEKTRISKA)
 ** 
 ** 
 ** Description:
 **     The LEM1802 is a 128x96 pixel color display compatible with the DCPU-16.
 **     The display is made up of 32x12 16 bit cells. Each cell displays one
 **     monochrome 4x8 pixel character out of 128 available. Each cell has its own
 **     foreground and background color out of a palette of 16 colors.
 **     
 **     The LEM1802 is fully backwards compatible with LEM1801 (0x7349f615/0x1801),
 **     and adds support for custom palettes and fixes the double buffer color
 **     bleed bug. 
 **     
 ** 
 ** Interrupt behavior:
 **     When a HWI is received by the LEM1802, it reads the A register and does one
 **     of the following actions:
 **     
 **     0: MEM_MAP_SCREEN
 **        Reads the B register, and maps the video ram to DCPU-16 ram starting
 **        at address B. See below for a description of video ram.
 **        If B is 0, the screen is disconnected.
 **        When the screen goes from 0 to any other value, the the LEM1802 takes
 **        about one second to start up. Other interrupts sent during this time
 **        are still processed.
 **     1: MEM_MAP_FONT
 **        Reads the B register, and maps the font ram to DCPU-16 ram starting
 **        at address B. See below for a description of font ram.
 **        If B is 0, the default font is used instead.
 **     2: MEM_MAP_PALETTE
 **        Reads the B register, and maps the palette ram to DCPU-16 ram starting
 **        at address B. See below for a description of palette ram.
 **        If B is 0, the default palette is used instead.
 **     3: SET_BORDER_COLOR
 **        Reads the B register, and sets the border color to palette index B&0xF
 **     4: MEM_DUMP_FONT
 **        Reads the B register, and writes the default font data to DCPU-16 ram
 **        starting at address B.
 **        Halts the DCPU-16 for 256 cycles
 **     5: MEM_DUMP_PALETTE
 **        Reads the B register, and writes the default palette data to DCPU-16
 **        ram starting at address B.       
 **        Halts the DCPU-16 for 16 cycles
 ** 
 ** 
 ** Video ram:
 **     The LEM1802 has no internal video ram, but rather relies on being assigned
 **     an area of the DCPU-16 ram. The size of this area is 386 words, and is
 **     made up of 32x12 cells of the following bit format (in LSB-0):
 **         ffffbbbbBccccccc
 **     The lowest 7 bits (ccccccc) select define character to display.
 **     ffff and bbbb select which foreground and background color to use.
 **     If B (bit 7) is set the character color will blink slowly.
 **     
 ** 
 ** Font ram:
 **     The LEM1802 has a default built in font. If the user chooses, they may
 **     supply their own font by mapping a 256 word memory region with two words
 **     per character in the 128 character font.
 **     By setting bits in these words, different characters and graphics can be
 **     achieved. For example, the character F looks like this:
 **        word0 = 1111111100001001
 **        word1 = 0000100100000000
 **     Or, split into octets:
 **        word0 = 11111111 /
 **                00001001
 **        word1 = 00001001 /
 **                00000000
 **     
 ** 
 ** Palette ram:
 **    The LEM1802 has a default built in palette. If the user chooses, they may
 **    supply their own palette by mapping a 16 word memory region with one word
 **    per palette entry in the 16 color palette.
 **    Each color entry has the following bit format (in LSB-0):
 **        0000rrrrggggbbbb
 **    Where r, g, b are the red, green and blue channels. A higher value means a
 **    lighter color.
 **    
 **/

(function () {
    var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||  
                                window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
    var colors = new Uint32Array(0x10000);
    var styles = new Array(0x10000);
    var splash = new Image();
    splash.src = "img/boot.png";
    
    (function() {
        for (var i = 0; i < colors.length; i++) {
            var r = ((i & 0xF00)>>8) * 0x11;
                g = (i & 0xF0) * 0x110;
                b = (i & 0xF) * 0x110000;
            colors[i] = r | g | b | 0xFF000000;

            r = (i & 0xF00) * 0x1100;
            g = (i & 0xF0) * 0x110;
            b = (i & 0xF) * 0x11;
            
            styles[i] = "#" + ((0x1000000 | r | g | b).toString(16).substr(1).toUpperCase());
        }
    }).call();
    
    var RomPalette = new Uint16Array([
        0x0000, 0x000a, 0x00a0, 0x00aa, 0x0a00, 0x0a0a, 0x0a50, 0x0aaa,
        0x0555, 0x055f, 0x05f5, 0x05ff, 0x0f55, 0x0f5f, 0x0ff5, 0x0fff
    ]);
    
    var RomFont = new Uint16Array([
        0xB79E, 0x388E, 0x722C, 0x75F4, 0x19BB, 0x7F8F, 0x85F9, 0xB158,
        0x242E, 0x2400, 0x082A, 0x0800, 0x0008, 0x0000, 0x0808, 0x0808,
        0x00FF, 0x0000, 0x00F8, 0x0808, 0x08F8, 0x0000, 0x080F, 0x0000,
        0x000F, 0x0808, 0x00FF, 0x0808, 0x08F8, 0x0808, 0x08FF, 0x0000,
        0x080F, 0x0808, 0x08FF, 0x0808, 0x6633, 0x99CC, 0x9933, 0x66CC,
        0xFEF8, 0xE080, 0x7F1F, 0x0701, 0x0107, 0x1F7F, 0x80E0, 0xF8FE,
        0x5500, 0xAA00, 0x55AA, 0x55AA, 0xFFAA, 0xFF55, 0x0F0F, 0x0F0F,
        0xF0F0, 0xF0F0, 0x0000, 0xFFFF, 0xFFFF, 0x0000, 0xFFFF, 0xFFFF,
        0x0000, 0x0000, 0x005F, 0x0000, 0x0300, 0x0300, 0x3E14, 0x3E00,
        0x266B, 0x3200, 0x611C, 0x4300, 0x3629, 0x7650, 0x0002, 0x0100,
        0x1C22, 0x4100, 0x4122, 0x1C00, 0x1408, 0x1400, 0x081C, 0x0800,
        0x4020, 0x0000, 0x0808, 0x0800, 0x0040, 0x0000, 0x601C, 0x0300,
        0x3E49, 0x3E00, 0x427F, 0x4000, 0x6259, 0x4600, 0x2249, 0x3600,
        0x0F08, 0x7F00, 0x2745, 0x3900, 0x3E49, 0x3200, 0x6119, 0x0700,
        0x3649, 0x3600, 0x2649, 0x3E00, 0x0024, 0x0000, 0x4024, 0x0000,
        0x0814, 0x2200, 0x1414, 0x1400, 0x2214, 0x0800, 0x0259, 0x0600,
        0x3E59, 0x5E00, 0x7E09, 0x7E00, 0x7F49, 0x3600, 0x3E41, 0x2200,
        0x7F41, 0x3E00, 0x7F49, 0x4100, 0x7F09, 0x0100, 0x3E41, 0x7A00,
        0x7F08, 0x7F00, 0x417F, 0x4100, 0x2040, 0x3F00, 0x7F08, 0x7700,
        0x7F40, 0x4000, 0x7F06, 0x7F00, 0x7F01, 0x7E00, 0x3E41, 0x3E00,
        0x7F09, 0x0600, 0x3E61, 0x7E00, 0x7F09, 0x7600, 0x2649, 0x3200,
        0x017F, 0x0100, 0x3F40, 0x7F00, 0x1F60, 0x1F00, 0x7F30, 0x7F00,
        0x7708, 0x7700, 0x0778, 0x0700, 0x7149, 0x4700, 0x007F, 0x4100,
        0x031C, 0x6000, 0x417F, 0x0000, 0x0201, 0x0200, 0x8080, 0x8000,
        0x0001, 0x0200, 0x2454, 0x7800, 0x7F44, 0x3800, 0x3844, 0x2800,
        0x3844, 0x7F00, 0x3854, 0x5800, 0x087E, 0x0900, 0x4854, 0x3C00,
        0x7F04, 0x7800, 0x047D, 0x0000, 0x2040, 0x3D00, 0x7F10, 0x6C00,
        0x017F, 0x0000, 0x7C18, 0x7C00, 0x7C04, 0x7800, 0x3844, 0x3800,
        0x7C14, 0x0800, 0x0814, 0x7C00, 0x7C04, 0x0800, 0x4854, 0x2400,
        0x043E, 0x4400, 0x3C40, 0x7C00, 0x1C60, 0x1C00, 0x7C30, 0x7C00,
        0x6C10, 0x6C00, 0x4C50, 0x3C00, 0x6454, 0x4C00, 0x0836, 0x4100,
        0x0077, 0x0000, 0x4136, 0x0800, 0x0201, 0x0201, 0x0205, 0x0200
    ]);

    function LEM1802(canvas) {
        var that = this;
        
        this.context = canvas.getContext('2d');
        this.imgData = this.context.getImageData(0,0,128,96);
        var pxData = new ArrayBuffer(128*96*4);
        this.pixels = new Uint32Array(pxData);
        this.bytes = new Uint8Array(pxData);
    
        this.repaint = function () { LEM1802.prototype.repaint.apply(that, arguments); };
        requestAnimationFrame(this.repaint);
        
        this.reset();
    }
    this.LEM1802 = LEM1802;

    Object.defineProperties(LEM1802.prototype, {
        'description':  { 'value': "LEM-1802 Display Adapter", 'configurable': false }, 
        'vendorID':     { 'value': 0x1c6c8b36, 'configurable': false },
        'deviceID':     { 'value': 0x7349f615, 'configurable': false },
        'revision':     { 'value': 0x1802, 'configurable': false }
    });

    LEM1802.prototype.reset = function () {
        this.border = 0x1;
        this.font = RomFont;
        this.palette = RomPalette;
        this.nametable = null;
    };

    LEM1802.prototype.clock = function (cycle) {
    };

    LEM1802.prototype.detach = function() {
        this.cpu.remove(this);
    };
    
    LEM1802.prototype.master = function (master) {
        this.cpu = master;
    };
    
    LEM1802.prototype.receive = function (message) {
        var i;
        
        switch (message) {
        case 0: // MEM_MAP_SCREEN
            this.nametable = this.cpu.b ? this.cpu.memory.subarray(this.cpu.b) : null;
            break ;
        case 1: // MEM_MAP_FONT
            this.font = this.cpu.b ? this.cpu.memory.subarray(this.cpu.b) : RomFont;
            break ;
        case 2: // MEM_MAP_PALETTE
            this.palette = this.cpu.b ? this.cpu.memory.subarray(this.cpu.b) : RomPalette;
            break ;
        case 3: // SET_BORDER_COLOR
            this.border = this.cpu.b & 0xF;
            break ;
        case 4: // MEM_DUMP_FONT
            this.cpu.wait(256);
            this.cpu.overlay(RomFont, this.cpu.b);
            break ;
        case 5: // MEM_DUMP_PALETTE
            this.cpu.wait(16);
            this.cpu.overlay(RomPalette, this.cpu.b);
            break ;
        }
    };

    var prev = 0;
    LEM1802.prototype.repaint = function () {
        requestAnimationFrame(this.repaint);

        this.context.fillStyle = styles[this.palette[this.border]];
        this.context.fillRect(0, 0, this.context.canvas.clientWidth, this.context.canvas.clientHeight);
        
        if (!this.nametable) {
            this.context.drawImage(splash, 8, 8);
            return ;
        }
        
        var blink = (new Date().getTime()) & 1024;

        for (var by = 0, pi = 0, ci = 0; by < 12; by++, pi += 128 * 7) {
            for (var bx = 0; bx < 32; bx++, ci++, pi += 4) {
                var name = this.nametable[ci];
                var fg = colors[this.palette[name >> 12]],
                    bg = colors[this.palette[(name >> 8) & 0xF]],
                    flash = blink || (0x80 & ~name),
                    ch = name & 0x7F;
                
                for (var px = 0, pdi = pi; px < 4; px++, pdi++) {
                    var bits = this.font[(px>>1)+(ch<<1)];
                    for (var py = 0, p = pdi; py < 8; py++, p += 128) {
                        this.pixels[p] = (flash && ((bits >> (~px & 1)*8+py) & 1)) ? fg : bg;
                    }
                }
            }
        }

        for (var i = 0; i < this.bytes.length; i++) {
            this.imgData.data[i] = this.bytes[i];
        }
        this.context.putImageData(this.imgData, 8, 8);
    };
}).call(this);

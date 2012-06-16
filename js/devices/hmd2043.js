/** HIT_HMD2043
 ** 
 **                                __    __
 **                                 ||  ||
 **                                 ||==|| I T
 **                                _||  ||_
 ** 
 **                     Harold Innovation Technologies
 **                 "If it ain't a HIT, it's a piece of..."
 ** 
 ** 
 ** DCPU-16 Hardware Info:
 **     Name: HMD2043 - Harold Media Drive
 **     ID: 0x74fa4cae, version: 0x07c2
 **     Manufacturer: 0x21544948 (HAROLD_IT)
 **     Document version: 1.1
 **     
 **     
 ** Change history:
 **     1.1: Added command for setting interrupt message.  Fixed manufacturer id
 **          which was erroneously word-swapped.
 **     1.0: Initial release.
 **     
 **     
 ** Description:
 **     The HMD2043 is the latest effort on the part of Harold Innovation
 **     Technologies to futurise the computing landscape of tomorrow; today!
 **     It is a high-quality disk drive made from the finest materials known to 
 **     man. It supports a vast panopoly of disk formats:
 **     
 **     * HMU1440 - 1.44 MB 3.5" Harold Media Unit.
 **     
 **     Because of its amazing all-American construction, it will also support disks
 **     manufactured by other, inferior "technology" companies; YOU KNOW WHO YOU 
 **     ARE! The drive incorporates unique "quality sensing" technology to identify 
 **     low-quality disks, allowing the system to warn the user. But, I'm a big 
 **     enough man to stoop to your level and...
 **     
 **     Waitaminute; I've just had an idea for a motorised stooping machine;
 **     Angela, get the engineers in here and turn this damn recorde
 **     
 **         -- Harold Lam, Founder and Chief Innovationist.
 **     
 **     
 ** Interrupt behaviour:
 **     The HMD2043 supports a number of HWI commands based on the value of the A
 **     register:
 **     
 **     0x0000: QUERY_MEDIA_PRESENT
 **             If a supported disk is present in the drive, this sets the B
 **             register to 1.  Otherwise, it sets the B register to 0.
 **             
 **             Media should be tested with the 0xFFFF command before use.
 **             
 **     0x0001: QUERY_MEDIA_PARAMETERS
 **             Reads out the physical properties of the media.  They are placed
 **             into registers as follows:
 **             
 **             B = Number of words per sector.
 **             C = Number of sectors.
 **             X = 1 if media is write-locked, 0 otherwise.
 **             
 **     0x0002: QUERY_DEVICE_FLAGS
 **             Returns the internal device flags in the B register. The meaning 
 **             of this field is defined in the UPDATE_DEVICE_FLAGS command.
 **             
 **     0x0003: UPDATE_DEVICE_FLAGS
 **             Sets the internal device flags to the value of the B register. The
 **             available bit flags are, by bit number:
 **             
 **              0: NON_BLOCKING - if set, all slow operations will be performed in
 **                 "non-blocking" mode; that is, the hardware command will return 
 **                 control to the DCPU immediately and an interrupt will be issued 
 **                 upon completion.
 **                 
 **                 Note that other commands issued during a non-blocking operation 
 **                 will silently fail.
 **                 
 **                 Until the interrupt is raised, the device will NOT consider the
 **                 non-blocking operation "complete".
 **                 
 **                 Before issuing a non-blocking command, be sure to set an 
 **                 appropriate interrupt message with SET_INTERRUPT_MESSAGE.
 **                 
 **              1: MEDIA_STATUS_INTERRUPT - if set, the device will raise an
 **                 interrupt when the media status changes: new media is inserted 
 **                 or current media ejected.
 **                 
 **                 Before enabling media status interrupts, be sure to set an
 **                 appropriate interrupt message with SET_INTERRUPT_MESSAGE.
 **                 
 **             The default value is all bits set to zero.
 **                 
 **     0x0004: QUERY_INTERRUPT_TYPE
 **             The device will indicate the type of interrupt that it last raised 
 **             by placing one of the following values into the B register:
 **             
 **             0x0000: NONE - No interrupts have been raised yet.
 **             
 **             0x0001: MEDIA_STATUS - Media status changed.
 **             
 **             0x0002: READ_COMPLETE - Read operation completed.
 **             
 **             0x0003: WRITE_COMPLETE - Write operation completed.
 **             
 **             The value of the A register will be changed to the error status of 
 **             the event in question, not the error status of the 
 **             QUERY_INTERRUPT_TYPE command itself.
 **             
 **     0x0005: SET_INTERRUPT_MESSAGE
 **             Specifies the message the device should use for software interrupts.
 **             Takes one parameter:
 **             
 **             B = Interrupt number to use when interrupting the DCPU.
 **             
 **             If the device raises an interrupt before the message is set, it will
 **             default to using 0xFFFF.
 **             
 **     0x0010: READ_SECTORS
 **             Reads a contiguous range of sectors into memory.  The parameters
 **             are:
 **             
 **             B = Initial sector to read.
 **             C = Number of sectors to read.
 **             X = Start of in-memory buffer to read into.
 **             
 **             The length of time this command will take depends on the state of 
 **             the drive and the physical parameters of the media in use.
 **             
 **             This operation may be performed in non-blocking mode.
 **             
 **     0x0011: WRITE_SECTORS
 **             Writes a contiguous range of sectors to disk.  The parameters are:
 **             
 **             B = Initial sector to write.
 **             C = Number of sectors to write.
 **             X = Start of in-memory buffer to read from.
 **             
 **             The length of time this command will take depends on the state of 
 **             the drive and the physical parameters of the media in use.
 **             
 **             This operation may be performed in non-blocking mode.
 **             
 **     0xFFFF: QUERY_MEDIA_QUALITY
 **             Determines the quality of the media inserted into the drive.  It
 **             places this value into the B register. It has the following values:
 **             
 **             0x7FFF: Authentic HIT media.
 **             0xFFFF: Media from other companies.
 **             
 **     All commands replace the contents of the A register with a flag indicating 
 **     whether the command succeeded or failed.  The following result codes are 
 **     defined:
 **     
 **     0x0000: ERROR_NONE - The operation either completed or (for non-blocking 
 **             operations) begun successfully.
 **     0x0001: ERROR_NO_MEDIA - Operation requires media to be present.  In long 
 **             operations, this can occur if the media is ejected during the 
 **             operation.
 **     0x0002: ERROR_INVALID_SECTOR - Attempted to read or write to an invalid 
 **             sector number.
 **     0x0003: ERROR_PENDING - Attempted to perform a non-blocking operation 
 **             whilst a conflicting operation was already in progress: the most 
 **             recent operation has been aborted.
 ** 
 **             
 ** Performance:
 **     Full-stroke: 200 ms
 **     Spindle speed: 300 RPM, 5 Hz using Constant Angular Velocity
 **     Maximum data transfer speed: 768 kbit/s, 48 kw/s
 **     Head position on media insertion: innermost track
 **     Head mode: full duplex [1]
 **     
 **     Time to seek to sector =
 **         floor( abs(target sector - current sector)
 **                 / (disk sectors per track) )
 **          * full stroke time / (disk tracks - 1)
 **         
 **     Time to read/write a sector =
 **         1 / (spindle speed * disk sectors per track)
 **         
 **     Example times:
 **         1.44 MB 3.5" Disk:
 **             Time to seek to adjacent track  = 2.5 ms
 **             Time to read/write a sector     = 11 ms
 **             Time to read/write entire disk  = 16 s
 **             
 **     [1] The head is capable of reading/writing both sides of the disc at the 
 **         same time.
 **         
 ** 
 **/

(function () {
    var IRQ_NONE = 0x0000,
        IRQ_MEDIA_STATUS = 0x0001,
        IRQ_READ_COMPLETE = 0x0002,
        IRQ_WRITE_COMPLETE = 0x0003,

        FLAG_NON_BLOCKING = 0x0001,
        FLAG_MEDIA_IRQ = 0x0002,

        ERROR_NONE = 0x0000,
        ERROR_NO_MEDIA = 0x0001,
        ERROR_INVALID_SECTOR = 0x0002,
        ERROR_PENDING = 0x0003,

        SEEK_SECTOR = 250,
        READ_WRITE_SECTOR = 1100;
        
    
    function HMD2043() {
    }
    
    this.HMD2043 = HMD2043;

    HMD2043.prototype.reset = function() {
        this.flags = 0;
        this.irq_type = IRQ_NONE;
        this.irq_message = 0xFFFF;
        
        this.cycles = 0;
        this.sector = 0;
        this.jobs = [];
        this.job_time = 0;
        
        this.insert(null);
    }
    
    HMD2043.prototype.insert = function (disk) {
        if (disk !== this.disk) {
            // Cancel any jobs (possibly an angry head)
            this.jobs = [];
            this.disk = disk;

            if (this.flags & FLAG_MEDIA_IRQ) {
                this.irq_type = IRQ_MEDIA_STATUS;
                this.cpu.receive(this.irq_message);
            }
        }
    };

    HMD2043.prototype.clock = function (cycles) {
        // No jobs queued, don't actually run
        if (this.jobs.length === 0) {
            return ;
        }
        
        var job, taskLength
        
        while (this.jobs.length > 0) {
            taskLength = this.taskLength(this.jobs[0]);
            this.cycles += cycles;
            
            if (this.cycles < taskLength) {
                return ;
            }
            
            this.cycles -= taskLength;
                
            job = this.jobs.shift()
            this.sector = job.sector;
    
            if (job.direction === 'read') {
                this.cpu.overlay(this.disk[job.sector], job.address);
            } else {
                for (var i = 0; i < this.disk.SECTOR_LENGTH; i++) {
                    this.disk[job.sector][i] = this.cpu.memory[(job.address+i) & 0xFFFF];
                }
            }
        }
        this.cycles = 0;

        if (this.flags & FLAG_NON_BLOCKING) {
            this.irq_type = (job.direction === 'read') ?
                IRQ_READ_COMPLETE : IRQ_WRITE_COMPLETE;
            this.cpu.receive(this.irq_message);
        }
    };

    HMD2043.prototype.taskLength = function(job) {
        return Math.abs(job.sector - this.sector) * SEEK_SECTOR + READ_WRITE_SECTOR;
    };
    
    HMD2043.prototype.queue = function(direction, sector, address) {
        this.jobs.push( {direction: direction, sector: sector, address: address} );
    };
    
    HMD2043.prototype.flush = function() {
        // Do not block
        if (this.flags & FLAG_NON_BLOCKING) {
            return ;
        }
        
        // BLOCKING MODE
        while (this.jobs.length >= 0) {
            this.cpu.wait(this.taskLength(this.jobs[0]) - this.cycles);
        }
    };
    
    HMD2043.prototype.detach = function() {
        this.cpu.remove(this);
    };
    
    HMD2043.prototype.master = function (master) {
        this.cpu = master;
    };
    
    HMD2043.prototype.receive = function (message) {
        this.cpu.a = ERROR_NONE; // No error
        
        switch (message) {
        case 0x0000:    // QUERY_MEDIA_PRESENT    
            this.cpu.b = this.disk ? 1 : 0;
            break ;
        case 0x0001:    // QUERY_MEDIA_PARAMETERS
            if (!this.disk) {
                this.cpu.a = 0x0001; // MEDIA_NOT_PRESENT
                break ;
            }
            this.cpu.b = this.disk.SECTOR_LENGTH;
            this.cpu.c = this.disk.SECTOR_COUNT;
            this.cpu.x = 0; // We never write lock
            break ;
        case 0x0002:    // QUERY_DEVICE_FLAGS
            this.cpu.b = this.flags;
            break ;            
        case 0x0003:    // UPDATE_DEVICE_FLAGS
            this.flags = this.cpu.b;
            this.flush();
            break ;
        case 0x0004:    // QUERY_INTERRUPT_TYPE
            this.cpu.b = this.irq_type;
            break ;
        case 0x0005:    // SET_INTERRUPT_MESSAGE
            this.irq_message = this.cpu.b;
            break ;
        case 0x0010:    // READ_SECTORS (B = sector, C = count, X = addr)
        case 0x0011:    // WRITE_SECTORS (B = sector, C = count, X = addr)
            if (!this.disk) {
                this.cpu.a = ERROR_NO_MEDIA; // MEDIA_NOT_PRESENT
                break ;
            }

            if (this.jobs.length) {
                this.cpu.a = ERROR_PENDING;
                break ;
            }

            if (this.cpu.b + this.cpu.c > 1400) {
                this.cpu.a = ERROR_INVALID_SECTOR;
                break ;
            }

            for (var i = 0; i < this.cpu.c; i++) {
                this.queue(
                    (message & 1) ? 'write' : 'read',
                    this.b + i,
                    (this.x + this.disk.SECTOR_LENGTH*i) & 0xFFFF );
            }
            this.flush();
            break ;
        case 0xFFFF:    // MEDIA_QUALITY
            if (!this.disk) {
                this.cpu.a = ERROR_NO_MEDIA; // MEDIA_NOT_PRESENT
                break ;
            }
            this.cpu.b = this.disk.QUALITY_LEVEL;
            break ;
        }
    }
 
    Object.defineProperties(HMD2043.prototype, {
        'description':  { 'value': "HMD2043 Harold Media Drive", 'configurable': false }, 
        'vendorID':     { 'value': 0x21544948, 'configurable': false },
        'deviceID':     { 'value': 0x74fa4cae, 'configurable': false },
        'revision':     { 'value': 0x07c2, 'configurable': false }
    });
}).call(this);

(function () {
    var incrementer = 0,
        hash = (Math.random() * 0x100000000).toString(16),
        templates,
        devices = [
            { name: LEM1802.name, attach: addLEM1802, index: 0, regular: true },
            { name: HMD2043.name, attach: addHMD2043, index: 1, regular: false },
            { name: Clock.name, attach: addClock, index: 2, regular: true },
            { name: Keyboard.name, attach: addKeyboard, index: 3, regular: true }
        ], images = [],
        activeDevices = {},
        devNumber = 1;

    function clearDrag(evt) {
        if (evt.preventDefault) {
            evt.preventDefault();
        }
        evt.originalEvent.dataTransfer.dropEffect = 'copy';
    }
    
    this.createGUID = function (proto) {
        return [hash,
                (++incrementer).toString(16),
                (Math.random() * 0x100000000).toString(16),
                (new Date()).getTime().toString(16)].join("-");
    }
    
    function setupBinaryList() {
        var bil = $('#binary-image-list');
        
        function restore() {
            var json = window.localStorage.getItem("binary-images");
            if (!json) {
                return ;
            }
            var imgs = JSON.parse(json);
            imgs.forEach(function(o) {
                var buff = new Uint16Array(o.data.length);
                for (var i = 0; i < o.data.length; i++) {
                    buff[i] = o.data.charCodeAt(i);
                }
                
                o.data = buff;
                images.push(o);
                images[o.id] = images[o.name] = o;
            });
        }
        restore();
        
        function preserve() {
            function convert (d) {
                var str = "";
                for (var i = 0; i < d.data.length; i++ ){
                    str += String.fromCharCode(d.data[i]);
                }
                return {
                    name: d.name,
                    id: d.id,
                    data: str
                };
            }
            
            var o = [];
            images.forEach(function(k){ o.push(convert(k)); });
            window.localStorage.setItem("binary-images", JSON.stringify(o));
        }
        
        function redraw() {
            bil.html(templates.binaryList({
                binaries: images,
            }));

            $(".binary-image [draggable]").bind('dragstart', function (e) {
                e.originalEvent.dataTransfer.effectAllowed = 'copy';
                e.originalEvent.dataTransfer.setData('text/plain', JSON.stringify({
                    type: 'binary',
                    id: e.target.dataset.id
                }));
            });

            $(".binary-image .close").click(function(evt) {
                var img = images[evt.target.dataset.id]
                delete images[img.id];
                delete images[img.name];
                images.splice(images.indexOf(img), 1);
                $("#"+img.id).remove();
                preserve();
            });
        }
        redraw();
        
        function insertFile(file) {
            var fread = new FileReader();

            fread.onload = function (evt) {
                var buff = new ArrayBuffer(fread.result.length&~1),
                    bytes = new Uint8Array(buff),
                    words = new Uint16Array(buff),
                    result = fread.result;
                    
                for (var i = 0; i < buff.byteLength; i++) {
                    bytes[i^1] = result.charCodeAt(i);
                }
            
                var num = 0, name = file.name;

                while (images[name] !== undefined) {
                    name = file.name + " " + (++num);
                }
                var id = createGUID();
                var data = { id: id, name: name, data: words }
                images.push(data);
                images[name] = images[id] = data;
                redraw();
                preserve();
            };
            
            fread.readAsBinaryString(file);
        }
        
        bil.bind('dragover', clearDrag);
        
        bil.bind('drop', function(e) {
            e.preventDefault();
            e.stopPropagation(); // stops the browser from redirecting.
            
            var files = e.originalEvent.dataTransfer.files;
            for (var i = 0; i < files.length; i++) {
                insertFile(files[i]);
            }
        });
    }
    
    function addMaster(evt) {
        var id = createGUID(), machine, instance;

        $("#master-list").append(templates.dcpu({
            id: id,
            number: devNumber++
        }));

        machine = $("#"+id);
        activeDevices[id] = instance = new DCPU();
        
        function disassemble() {
            var pc = instance.pc, tbl_2 = {
                '1': 'SET', '2': 'ADD', '3': 'SUB', '4': 'MUL',
                '5': 'MLI', '6': 'DIV', '7': 'DVI', '8': 'MOD',
                '9': 'MDI', 'a': 'AND', 'b': 'BOR', 'c': 'XOR',
                'd': 'SHR', 'e': 'ASR', 'f': 'SHL', '10': 'IFB',
                '11': 'IFC', '12': 'IFE', '13': 'IFN', '14': 'IFG',
                '15': 'IFA', '16': 'IFL', '17': 'IFU', '1a': 'ADX',
                '1b': 'SBX', '1e': 'STI', '1f': 'STD'
            }, tbl_1 = {
                '1': 'JSR', '8': 'INT', '9': 'IAG', 'a': 'IAS',
                'b': 'RFI', 'c': 'IAQ', '10': 'HWN', '11': 'HWQ',
                '12': 'HWI'
            }, regs = ["a","b","c","x","y","z","i","j"], extra = [
                null,  "[SP]", null, "SP", "PC", "EX", null, null
            ];
            
            function getField(f, a) {
                switch (f) {
                case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
                    return regs[f];
                case 8: case 9: case 10: case 11: case 12: case 13: case 14: case 15:
                    return "["+regs[f&7]+"]";
                case 16: case 17: case 18: case 19: case 20: case 21: case 22: case 23:
                    return "["+regs[f&7]+"+"+instance.memory[(pc++) & 0xFFFF]+"]";
                case 24:
                    return a ? "POP" : "PUSH";
                case 25: case 27: case 28: case 29:
                    return extra[f&7];
                case 26:
                    return "[SP+"+instance.memory[(pc++) & 0xFFFF]+"]";
                case 30:
                    return "["+instance.memory[(pc++) & 0xFFFF]+"]";
                case 31:
                    return instance.memory[(pc++) & 0xFFFF];
                default:
                    return (f - 0x21).toString();
                }
            }
            
            var log = $("#"+id+" .log");
            var lines = [];

            for( var j = 0; j < 5; j++ ) {
                var i = instance.memory[(pc++) & 0xFFFF];
                var a = getField(i >> 10, true),
                    b = (i >>  5) & 0x1F,
                    o = i & 0x1F;
                
                if (o == 0) {
                    lines.push(tbl_1[b.toString(16)] + " " + a );
                } else {
                    lines.push(tbl_2[o.toString(16)] + " " + getField(b) + ", " + a );
                }
            }

            log.html(lines.join("<br/>"));
        }

        $("#"+ id +" .control-list").append(
            templates.deviceList({ "devices": devices })
        );
        $("#"+id+" .close").click(function(evt) {
            $(".slave-"+id).remove();
            $("#"+id).remove();
            
            for (var k in activeDevices) {
                if (activeDevices[k] instanceof DCPU) {
                    activeDevices[k].remove(instance);
                }
            }

            delete activeDevices[id];
        });
        $("#"+id+" .control-list a.device").click( function(evt) {
            instance.slave(devices[evt.target.dataset.index].attach(id, dcpu));
        });
        
        // --- DRAG AND DROP INTERFACE
        $("#"+id+" [draggable]").bind('dragstart', function (e) {
            e.originalEvent.dataTransfer.effectAllowed = 'copy';
            e.originalEvent.dataTransfer.setData('text/plain', JSON.stringify({
                type: 'slave-device',
                id: evt.target.dataset.id,
                number: evt.target.dataset.number
            }));
        });

        machine.bind('dragover', clearDrag);
        
        machine.bind('drop', function(e) {
            e.preventDefault();
            e.stopPropagation(); // stops the browser from redirecting.

            var data = JSON.parse(e.originalEvent.dataTransfer.getData('text/plain'));
            
            var img = images[data.id],
                dev = activeDevices[data.id];
            
            switch (data.type) {
            case 'binary':
                $("#"+id+" .image-name").html(templates.imageName({ name: img.name }));
                instance.load(img.data);
                break ;
            default:
                attachDCPU(id, data.id, instance, dev, data.number);
                break ;
            }
        });

        instance.oncrash = function (event) {
            console.log("CPU Crashed", event);

            runButton.toggleClass('btn-success');
            runButton.toggleClass('btn-danger');        
            runButton.text("Run");
        };
        
        $("#"+id+" .step-button").click(function () {
            instance.step();
        });
        
        var runButton = $("#"+id+" .run-button");
        runButton.click(function (evt) {
            runButton.toggleClass('btn-success');
            runButton.toggleClass('btn-danger');

            var running = runButton.hasClass('btn-danger');
            instance.run(running);
            runButton.text(running ? "Stop" : "Run");
        });
        $("#"+id+" .reset-button").click(function (evt) {
            instance.reset();
        });
        
        devices.forEach( function(dev) {
            if (dev.regular) instance.slave(dev.attach(id));
        });
        
        return instance;
    }
    
    function attachDCPU(masterid, slaveid, master, slave, num) {
        // Do not let a device hook more than once
        if (master.devices.indexOf(slave) >= 0) {
            return ;
        }
    
        $("#"+masterid+" .dcpu-devices").append(templates.dcpuSlave({
            id: slaveid,
            number: num
        }));
        $("#"+masterid+" .close").click(function(evt) {
            $("#"+masterid+" .slave-"+slaveid).remove();
            master.remove(slave);
        });
        
        master.slave(slave);
    }

    function addLEM1802(machine) {
        var id = createGUID(), device, instance;

        $("#"+machine+" .dcpu-devices").append(templates.lem1802({
            id: id,
            number: devNumber++
        }));
        $("#"+id+" .close").click(function(evt) {
            $("#"+id).remove();
            delete activeDevices[id];
            instance.detach();
        });
       
        device = $("#"+id);
        canvas = $("#"+id+" .lem-screen").get(0);

        activeDevices[id] = instance = new LEM1802(canvas);
        return instance;
    }
    
    // TODO: LEDS!
    function addHMD2043(machine) {
        var id = createGUID(), device, instance;

        $("#"+machine+" .dcpu-devices").append(templates.hmd2043({
            id: id,
            number: devNumber++
        }));
        $("#"+id+" .close").click(function(evt) {
            $("#"+id).remove();
            delete activeDevices[id];
            instance.detach();
        });

        device = $("#"+id);

        device.bind('dragover', clearDrag);
        
        var eject = $("#"+id+" .eject-button"),
            diskName = $("#"+id+" .disk-name"),
            readLED = $("#"+id+" .read-led"),
            writeLED = $("#"+id+" .write-led");
            
        function insert (disk, name) {
            diskName.html(name || "Drive Empty");
            eject.toggle(!!disk);
            instance.insert(disk);
        }
            
        device.bind('drop', function(e) {
            e.preventDefault();
            e.stopPropagation(); // stops the browser from redirecting.

            var data = JSON.parse(e.originalEvent.dataTransfer.getData('text/plain'));
            
            if (data.type === 'binary') {
                insert(new HMU1440(images[data.id]), img.name);
            }            
        });
        
        eject.click(function (evt) {
            insert(null);
        });
        
        activeDevices[id] = instance = new HMD2043();
        return instance;
    }
    
    function addClock(machine) {
        var id = createGUID(), device, instance;

        $("#"+machine+" .dcpu-devices").append(templates.clock({
            id: id,
            number: devNumber++
        }));
        $("#"+id+" .close").click(function(evt) {
            $("#"+id).remove();
            delete activeDevices[id];
            instance.detach();
        });

        device = $("#"+id);

        activeDevices[id] = instance = new Clock();
        return instance;
    }
    
    function addKeyboard(machine) {
        var id = createGUID(), device, instance;

        $("#"+machine+" .dcpu-devices").append(templates.keyboard({
            id: id,
            number: devNumber++
        }));
        $("#"+id+" .close").click(function(evt) {
            $("#"+id).remove();
            delete activeDevices[id];
            instance.detach();
        });

        device = $("#"+id);

        activeDevices[id] = instance = new Keyboard();
        return instance;
    }
    
    $(document).ready(function () {        
        templates = {
            imageName: Handlebars.compile($("#image-name-template").html()),
            deviceList: Handlebars.compile($("#device-list-template").html()),
            binaryList: Handlebars.compile($("#binaries-template").html()),
            dcpu: Handlebars.compile($("#dcpu-template").html()),
            dcpuSlave: Handlebars.compile($("#dcpu-slave-template").html()),
            lem1802: Handlebars.compile($("#lem1802-template").html()),
            hmd2043: Handlebars.compile($("#hmd2043-template").html()),
            clock: Handlebars.compile($("#clock-template").html()),
            keyboard: Handlebars.compile($("#keyboard-template").html())
        };
    
        $('#about').modal({'show': false});
        $('#add-machine').click(addMaster);
        
        setupBinaryList();
    });
}).call(this);
// Copyright (c) 2018 Medindex (medindex.ru)

Ext.define('PveMgr.model.Vm', {
    extend: 'Ext.data.Model',
    idProperty:'vmid',
    fields: [
        { name: 'config', defaultValue: null },
        { name: 'vmid', type: 'int' },
        'name',
        'status',
        'uptime',
        'maxcpu',
        'cpu',
        'status',
        'vmid',
        'node',
        'mem',
        'type',
        'resourse_id',
        'template',
        {name: 'pool', calculate: d => d.pool ? d.pool : 'отсутствует'}, // For groupping to work properly
        {name:
            'maxmem',
            type: 'int',
            calculate: d => Math.round(d.maxmem/1024/1024/1024),
        },
        {name: 'mem', calculate: d => Math.round(d.mem/d.maxmem*1000)/1000},
        {
            name: 'uptime',
            calculate: d => {
                let s = d.uptime;
                d = Math.floor(s / 24 / 3600);
                s %= (24 * 3600);
                h = Math.floor(s / 3600);
                s %= 3600;
                m = Math.floor(s / 60);
                return  d + ' дней, ' + h +':'+ ('0'+m).slice(-2);
            },
        },{
            name: 'ip',
            calculate: d => {
                if (d.vmid == 9001) console.log(d);
                if(!d.vmid) return; // For groupping to work properly
                if (!d.config) return;
                let dscr = d.config.description;
                return dscr ?
                    (dscr.match(/(?:^|.*\n)IP: ([^;]+);.*/, '$1') || [])[1]
                    : '';
            },
        },{
            name: 'configarray',
            calculate: function(d) {
                if(!d.vmid) return; // For groupping to work properly
                Object.assign(d, d['config']);
                let aConf = Object.keys(d).map( key => {
                    var o = {};
                    o.name = key;
                    o.value = d[key];
                    o.leaf = true;
                    return o;
                });
                return aConf;
            },
        },{
            name: 'diskarray',
            calculate: function(d) {
                if(!d['config']) return;
                let dA = Object.keys(d['config'])
                    .filter(el => el.match(/^scsi\d|^virtio\d|^ide\d|^sata\d/))
                    .filter(el => d[el].match(/^(?!none,).*/))
                    .map( key => {
                        let rest;
                        obj = {};
                        [obj.disk, ...obj.params] = d[key].split(',');
                        obj.params = obj.params.reduce((obj, str) => {
                            let k, v;
                            [k, v] = str.split('=');
                            obj[k] = v;
                            return obj;
                        }, {});
                        [obj.storage, obj.path] = obj.disk.split(':');
                        obj.node = d.node;
                        return obj;
                    });
                //~ console.log(dA);
                return dA;
            },
        },{
            name: 'storage',
            calculate: function(d) {
                if (!d.diskarray) return;
                let a = d.diskarray;
                return [...new Set(a.map(el => el.storage))].join(', ');
            },
        },{
            name: 'disks',
            calculate: function(d) {
                if (!d.diskarray) return;
                return d.diskarray.map(
                    el => el.storage + ' ' + (el.params.size || '')
                ).join(', ');
            },
        },
    ],
});

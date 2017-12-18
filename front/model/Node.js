Ext.define('PveMgr.model.Node', {
    extend: 'Ext.data.Model',
    idProperty: 'node',
    fields: [
        'id',
        'node',
        'nodeid',
        'ip',
        'cpu',
        'maxcpu',
        'disk',
        'maxdisk',
        'mem',
        {name: 'maxmem', type: 'int', calculate: d => Math.round(d.maxmem/1024/1024/1024)},
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
                //console.log( d + ' дней, ' + h +':'+ ('0'+m).slice(-2) +':'+ ('0'+s).slice(-2) );
                return  d + ' дней, ' + h +':'+ ('0'+m).slice(-2);
            },
        },{
            name: 'statusarray',
            calculate: function(d) {
                Object.assign(d, d['status']);
                Object.assign(d, d['cpuinfo'], d['rootfs'], d['swap']);
                let aStat = Object.keys(d).map( key => {
                    var o = {};
                    o.name = key;
                    o.value = d[key];
                    o.leaf = true;
                    return o;
                });
                return aStat;
            },
        },
    ],
});

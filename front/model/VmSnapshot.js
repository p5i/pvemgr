Ext.define('PveMgr.model.VmSnapshot', {
    extend: 'Ext.data.TreeModel',
    idProperty: 'name',
    fields: [

        'name',
        'description',
        'vmstate',

        {name: 'snaptime', type: 'date', dateFormat: 'timestamp'},

        {
            name: 'configarray',
            calculate: function(d) {
                if (!d['config']) return;
                const c = d['config'];
                return aConf = Object.keys(c).map( key => {
                    var o = {};
                    o.name = key;
                    o.value = c[key];
                    o.leaf = true;
                    return o;
                });
            },
        },

    ],
});

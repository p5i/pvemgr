Ext.define('PveMgr.model.VmSnapshot', {
    extend: 'Ext.data.Model',
    idProperty: 'name',
    fields: [
        'name',
        'description',
        'vmstate',
        {name: 'snaptime', type: 'date', dateFormat: 'timestamp'},
    ],
});

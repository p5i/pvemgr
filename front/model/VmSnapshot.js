Ext.define('PveMgr.model.VmSnapshot', {
    extend: 'Ext.data.TreeModel',
    idProperty: 'name',
    fields: [
        'name',
        'description',
        'vmstate',
        {name: 'snaptime', type: 'date', dateFormat: 'timestamp'},
    ],
});

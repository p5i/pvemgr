Ext.define('PveMgr.model.Storage', {
    extend: 'Ext.data.Model',
    idProperty: 'storage',
    fields: [
        'storage',
        'type',
        'content',
        'shared',
        'maxfiles',
    ],
});

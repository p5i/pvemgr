Ext.define('PveMgr.store.Storages', {
    extend: 'Ext.data.Store',
    model: 'PveMgr.model.Storage',

    proxy: {
        keepData: true, // Sets KeepRawData property in Reader
        type: 'pvemgr.proxy',
        url : 'api/storages',
    },
    sortOnLoad: false,
    singleton: true,
    storeId: 'storageStore',
    sorters: [{
        direction: "DESC",
        property: "storage",
    }],
    //~ autoLoad: true,
});

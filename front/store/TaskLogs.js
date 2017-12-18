Ext.define('PveMgr.store.TaskLogs', {
    extend: 'Ext.data.Store',
    model: 'PveMgr.model.Log',
    proxy: {
        type: 'pvemgr.proxy',
        url: 'api/tasklogs',
    },
    singleton: true,
    storeId: 'taskLogStore',
    sorters: [{
        direction: "DESC",
        property: "name",
    }],
    autoSort: true,
    //autoLoad: true,
});

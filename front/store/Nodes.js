Ext.define('PveMgr.store.Nodes', {
    extend: 'Ext.data.Store',
    model: 'PveMgr.model.Node',
    proxy: {
        keepData: true, // Sets KeepRawData property in Reader
        type: 'pvemgr.proxy',
        url: 'api/nodes',
    },
    listeners: {
        //load: () => console.log('Nodes updated'),
        //dataChanged: () => {console.log('Nodes Data Chaged 1'); },
    },
    singleton: true,
    storeId: 'nodeStore',
});

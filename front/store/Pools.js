// Copyright (c) 2018 Medindex (medindex.ru)

Ext.define('PveMgr.store.Pools', {
    extend: 'Ext.data.Store',
    model: 'PveMgr.model.Pool',
    proxy: {
        keepData: true, // Sets KeepRawData property in Reader
        type: 'pvemgr.proxy',
        url: 'api/poolresources',
    },
    //~ listeners: {
        //~ load: (store, records) => { console.log('Pools loaded', records) },
        //~ dataChanged: function() { console.log('Pools Data Chaged 1', arguments); },
    //~ },
    singleton: true,
    storeId: 'poolStore',
});

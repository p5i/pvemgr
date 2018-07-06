// Copyright (c) 2018 Medindex (medindex.ru)

Ext.define('PveMgr.store.Vms', {
    extend: 'Ext.data.Store',
    model: 'PveMgr.model.Vm',

    proxy: {
        keepData: true, // Sets KeepRawData property in Reader
        type: 'pvemgr.proxy',
        url : 'api/vms',
    },
    sortOnLoad: false,
    singleton: true,
    storeId: 'vmStore',
    //~ autoLoad: true,
    //groupField: 'node',
});

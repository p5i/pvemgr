// Copyright (c) 2018 Medindex (medindex.ru)

Ext.define('PveMgr.store.VmTemplates', {
    extend: 'Ext.data.ChainedStore',
    storeId: 'vmTemplates',
    source: 'vmStore',
    filters: {
        property: 'template',
        value: 1,
    },
    singleton: true,
});

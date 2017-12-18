Ext.define('PveMgr.store.Realms', {
    extend: 'Ext.data.Store',
    
    storeId: 'realmStore',
    
    fields: ['realm', 'type', 'comment'],
    
    proxy: {
        keepData: true, // Sets KeepRawData property in Reader
        type: 'pvemgr.proxy',
        url: 'api/realms',
    },

    //~ data: [
        //~ {name: 'pam'},
        //~ {name: 'pve'},
        //~ {name: 'SPB.HELIX.RU'},
    //~ ],
    
    singleton: true,
    sorters: [{
        direction: "DESC",
        property: "name",
    }],
});

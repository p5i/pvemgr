Ext.define('PveMgr.data.Proxy', {
    extend: 'Ext.data.AjaxProxy',
    alias : 'proxy.pvemgr.proxy',

    pageParam : null,
    startParam: null,
    limitParam: null,
    groupParam: null,
    sortParam: null,
    filterParam: null,
    noCache : false,

    constructor: function(config) {

        Ext.applyIf(config, {
            reader: {
                type: 'json',
                rootProperty: config.root || 'data',
                keepRawData: config.keepData,
            }
        });

        this.callParent([config]);
    },
});

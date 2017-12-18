Ext.define('PveMgr.view.Workspace', {
    extend: 'Ext.container.Viewport',
    xtype: 'pvemgr.mainworkspace',
    title: 'PVE Manager',
    controller: 'pvemgr.workspace', // alias
    viewModel: {
        type: 'pvemgr.ws',
    },
    //~ onRender: function(){
        //~ this.callParent(arguments);
    //~ },
    //constructor: function(config) {        
    //     return this.callParent(arguments);
    //},
    layout: {
        type: 'border',
        regionWeights: {
            west: 50,
            east: -10,
        },
    }, 
    
    defaults: {
        collapsible: true,
        split: true,
    },
    
    items:[
        {
            xtype: 'pvemgr.wsselector',
            region: 'west',
            id: 'wsSelectorWest',
        },{
            reference: 'footer',
            title: 'TMP',
            iconCls: 'x-fa fa-info-circle',
            region: 'south',
            height: 200,
            bind: {
                title: '{footerTitle}',
            },
            layout: {
                type: 'hbox',
                align: 'stretch',
            },
            tools: [
                {
                    type: 'refresh',
                    callback: 'updateTaskLogs',
                    margin: '0 0 0 5',
                },
            ],
            items: [
                {
                    scrollable: 'vertical',
                    xtype: 'grid',
                    reference: 'taskLogs',
                    store: 'taskLogStore',
                    hideHeaders: true,
                    columns: {
                        items: [
                            {dataIndex: 'name', flex: 1},
                        ],
                    },
                    listeners: {
                        selectionchange: 'onLogFileSelect',
                    },
                    width:400,
                },{
                    xtype: 'panel',
                    reference: 'taskLog',
                    scrollable: true,
                    flex: 1,
                },
            ],
        },{
            region: 'center',
            id: 'wsCenter',
            reference: 'wsCenter',
            xtype: 'container',
            layout: 'card',
            items: [
                {
                    xtype: 'pvemgr.vmgrid',
                    itemId: 'vms',
                    reference: 'vmGrid',
                    iconCls: 'x-fa fa-desktop',
                    bind: {
                        title: 'Виртуальные машины | {loggedString}',
                    },
                },{
                    xtype: 'pvemgr.nodegrid',
                    iconCls: 'x-fa fa-server',
                    itemId: 'nodes',
                    bind: {
                        title: 'Узлы кластера | {loggedString}',
                    },
                },{
                    xtype: 'pvemgr.storagegrid',
                    reference: 'storageGrid',
                    iconCls: 'x-fa fa-database',
                    itemId: 'storages',
                    title: 'Хранилища',
                    bind: {
                        title: 'Хранилища данных | {loggedString}',
                    },
                },
            ],
        },{
            region: 'east',
            id: 'eastPanel',
            title: 'Деплой',
            iconCls: 'x-fa fa-gears',
            xtype: 'tabpanel',
            width: 500,
            tabBarHeaderPosition: 1,
            collapsed: false,
            activeTab: 0,
            items: [
                {
                    xtype: 'pvemgr.vmcreator',
                    reference: 'vmCreator',
                    title: 'Машины',
                },{
                    xtype: 'pvemgr.scriptedaction',
                    reference: 'applicationClusters',
                    title: 'Сценарии',
                },{
                    xtype: 'pvemgr.vmbulkdeploy',
                    reference: 'serviceConstructor',
                    title: 'Конструктор',
                },{
                    xtype: 'pvemgr.acledit',
                    reference: 'aclEdit',
                    title: 'ACL',
                },
            ],
            bodyPadding: 5,
        },
    ],
});

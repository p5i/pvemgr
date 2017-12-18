Ext.define('PveMgr.view.WsSelector', {
    extend: 'Ext.tab.Panel',
    xtype: 'pvemgr.wsselector',
    id: 'wsSelector',
    reference: 'wsSelector',
    header: {
        items: [
            {
                xtype: 'textfield',
                emptyText: 'Фильтр',
                cls: 'pvemgr-filter-field',
                width: 70,
                margin: '0 0 0 5',
                reference: 'wsSelectorFilter',
                listeners: {
                    change: 'wsSelectorFilter',
                },
            },
        ],
        listeners: {
            dblclick: header => {
                header.lookupController()
                    .lookupReference('wsSelectorFilter')
                    .setValue('');
            },
        },
    },
    title: 'PveMgr',
    iconCls: 'x-fa fa fa-cloud fa-spin',
    width: 250,
    minWidth: 50,
    maxwidth: 500,
    activeTab: 1,
    //plugins: 'tabreorderer', // Moving tabs buggy in Chromium
    listeners: {
        tabchange: 'wsSelectMainView',
        //scope: 'controller',
    },
    items:[
        {
            title: 'Узлы',
            iconCls: 'x-fa fa-server',
            iconAlign: 'top',
            xtype: 'treepanel',
            id: 'nodestab',
            itemId: 'nodes',
            reference: 'nodesSelector',
            bind: {
                rootNode: '{formulaNodeTree}',
            },
            rootVisible: false,
        },{
            title: 'Машины',
            iconCls: 'x-fa fa-desktop',
            iconAlign: 'top',
            xtype: 'treepanel',
            itemId: 'vms',
            reference: 'vmsSelector',
            bind: {
                rootNode: '{formulaVmTree}',
            },
            listeners: {
                //rowclick: 'vmTreeClick',
                select: 'vmTreeSelect',
            },
            tbar: [
                '->', {
                    xtype: 'combobox',
                    tooltip: 'Группировать по',
                    width: 100,
                    valueField: 'value',
                    store: {
                        fields: ['text', 'value'],
                        data: [
                            {text: 'Пул', value: 'pool'},
                            {text: 'Узел', value: 'node'},
                            {text: 'Статус', value: 'status'},
                            {text: 'Нет', value: ''},
                        ],
                    },
                    bind: {
                        value: '{vmTreeGroupBy}',
                    },
                },
            ],
            //useArrows: true,
            //lines: true,
            rootVisible: false,
        },{
            title: 'Хранилища',
            xtype: 'treepanel',
            iconCls: 'x-fa fa-database',
            reference: 'storagesSelector',
            iconAlign: 'top',
            itemId: 'storages',
            bind: {
                rootNode: '{formulaStorageTree}',
            },
            tbar: [
                '->', {
                    name: 'groupStorageBy',
                    xtype: 'combobox',
                    width: 100,
                    valueField: 'value',
                    store: {
                        fields: ['text', 'value'],
                        data: [
                            {text: 'Узел', value: 'node'},
                            {text: 'Тип', value: 'type'},
                            {text: 'Содержимое', value: 'content'},
                            {text: 'Хранилище', value: 'storage'},
                            {text: 'Нет', value: ''},
                        ],
                    },
                    bind: {
                        value: '{storageTreeGroupBy}',
                    },
                },
            ],
            rootVisible: false,
        },
    ],
});

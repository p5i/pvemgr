Ext.define('PveMgr.view.VmPanel', {
    extend: 'Ext.tab.Panel',
    xtype: 'pvemgr.vmpanel',
    header: false,
    scrollable: true,
    items: [
        {
            xtype: 'grid',
            title: 'Диски',
            iconCls: 'x-fa fa-database',
            bind: {
               store: {
                    data: '{record.diskarray}',
                    autoSort: true,
                }
            },
            columns: [
                {
                    xtype:'actioncolumn',
                    width: 25,
                    items: [
                        {
                            iconCls: 'x-fa fa-database',
                            tooltip: 'Goto',
                            handler: 'onStorageFromVm',
                        },
                    ],
                },
                { text: 'Хранилище', dataIndex: 'storage', width: 100, },
                { text: 'Путь', dataIndex: 'path', flex: 3, maxWidth: 400 },
                { text: 'Узел', dataIndex: 'node', flex: 1 },
                {
                    text: 'Параметры',
                    xtype: 'templatecolumn',
                    flex: 1,
                    tpl:'<tpl foreach="params">{$}: <b>{.}</b><br></tpl>', 
                },
            ]
        },{
            xtype: 'grid',
            title: 'Конфигурация',
            iconCls: 'x-fa fa-desktop',
            bind: {
               store: {
                    data: '{record.configarray}',
                    autoSort: true,
                    sorters: [{
                        direction: "ASC",
                        property: "name",
                    }],
                }
            },
            columns: [
                { text: 'Имя', dataIndex: 'name' },
                { text: 'Значение', dataIndex: 'value', flex: 1 },
            ],
        },
    ],
    initComponent: function() {
        this.callParent(arguments);
        console.log(this.getViewModel().getData().record.data);
    },
});

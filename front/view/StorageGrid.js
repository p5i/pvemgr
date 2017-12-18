Ext.define('PveMgr.view.StorageGrid', {
    extend: 'Ext.tree.Panel',
    xtype: 'pvemgr.storagegrid',
    reference: 'storageGrid',
    plugins:[
        'gridfilters',
        {
            ptype: 'rowwidget',
            widget: {
                xtype: 'grid',
                maxHeight: 300,
                bind: {
                    title: '{record.storage}',
                    iconCls: '{record.iconCls}',
                    store: '{record.vmStore}'
                },
                columns: [
                    {
                        xtype:'actioncolumn',
                        width: 25,
                        items: [
                            {
                                iconCls: 'x-fa fa-desktop',
                                tooltip: 'Goto',
                                handler: 'onVmFromStorage',
                            },
                        ],
                    },{
                        dataIndex: 'vmid',
                        width: 70,
                        text: ' ID',
                        //flex: 2,
                    },{
                        text: 'Имя',
                        dataIndex: 'name',
                        flex: 1,
                    },{
                        text: 'Диски',
                        flex: 1,
                        dataIndex: 'disks',
                    },{
                        text: 'Статус',
                        flex: 1,
                        dataIndex: 'status',
                    },{
                        text: 'Узел',
                        flex: 1,
                        dataIndex: 'node',
                    },{
                        text: 'Адрес',
                        flex: 1,
                        dataIndex: 'ip',
                    },
                ],
            },
        },
    ],
    columns: {
        items: [
            {text: 'Имя',          dataIndex: 'storage', width: 200, xtype: 'treecolumn'},
            {text: 'Тип',          dataIndex: 'type'},
            {text: 'Использовано', dataIndex: 'disk'},
            {text: 'Размер',       dataIndex: 'maxdisk'},
            {text: 'Узел',         dataIndex: 'node',    width: 200},
            {text: 'Общий',        dataIndex: 'shared'},
            {text: 'Содержимое',   dataIndex: 'content', width: 200},
        ],
    },
    bind: {
        rootNode: '{formulaStorageTreeGrid}',
    },
    rootVisible: false,
});

Ext.define('PveMgr.view.VmPanel', {
    extend: 'Ext.tab.Panel',
    xtype: 'pvemgr.vmpanel',
    header: false,
    scrollable: true,
    items: [
        {
            xtype: 'panel',
            title: 'Консоль ОС',
            iconCls: 'x-fa fa-terminal',
            layout: 'border',
            items: [
                {
                    region: 'center',
                    xtype: 'panel',
                    autoScroll: true,
                    border: false,
                    margins: '5 5 5 5',
                    bodyCls: 'pvemgr-code',
                    html: 'shell',
                },{
                    region: 'south',
                    xtype: 'form',
                    layout: 'hbox',
                    border: false,
                    items: [
                        {
                            //~ margins:'0 5 5 5',
                            border: false,
                            xtype: 'textfield',
                            value: '',
                            fieldStyle: 'font-family: monospace;',
                            allowBlank: true,
                            listeners: {
                                specialkey: 'vmPanelShellKey',
                            },
                            flex: 1,
                        },{
                            xtype: 'button',
                            text: 'Выполнить',
                            listeners: {
                                click: 'vmPanelShellClick',
                            },
                            width: 100,
                        },
                    ],
                },
            ],
        },{
            xtype: 'panel',
            title: 'Управление',
            iconCls: 'pictos pictos-settings2',
        },{
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
        },{
            xtype: 'grid',
            title: 'Снепшоты',
            iconCls: 'x-fa fa-history',
            bind: {
               store: '{record.snapstore}',
            },
            columns: [
                { text: 'Имя', dataIndex: 'name' },
                { text: 'Описание', dataIndex: 'description', },
                { text: 'Создан', dataIndex: 'snaptime',  },
                { text: 'Состояние ВМ', dataIndex: 'vmstate' },
            ],
            listeners: {
                show: function(grid) {
                    const vModel = this.lookupViewModel();
                    const vmdata = vModel.getData().record.data;
                    PveMgr.vmSnapshots(
                        {
                            snapAction: 'get',
                            vmid: vmdata.vmid,
                            node: vmdata.node,
                        },
                        function(resp) {
                            console.log(resp.data);
                            console.log(grid);
                            var store = Ext.create( 'Ext.data.Store', {
                                model: 'PveMgr.model.VmSnapshot',
                                data: resp.data,
                            } );
                            grid.setStore(store);
                        }
                    );
                },
            },
        },
    ],
    //~ initComponent: function() {
        //~ this.callParent(arguments);
        //~ console.log(this.lookupViewModel());
        //~ console.log(this.getViewModel().getData().record.data);
    //~ },
});

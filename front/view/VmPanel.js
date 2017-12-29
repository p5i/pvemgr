Ext.define('PveMgr.view.VmPanel', {
    extend: 'Ext.tab.Panel',
    xtype: 'pvemgr.vmpanel',
    header: false,
    scrollable: true,
    items: [
        {
            xtype: 'panel',
            title: 'Запуск команд',
            iconCls: 'x-fa fa-terminal',
            layout: 'border',
            items: [
                {
                    region: 'center',
                    xtype: 'panel',
                    autoScroll: true,
                    border: true,
                    margins: '5 5 5 5',
                    bodyStyle: 'font-family: monospace; background-color: beige;',
                },{
                    region: 'south',
                    margins:'0 5 5 5',
                    border: false,
                    xtype: 'textfield',
                    name: 'cmd',
                    value: '',
                    fieldStyle: 'font-family: monospace;',
                    allowBlank: true,
                    listeners: {
                        //~ afterrender: function(f) {
                            //~ f.focus(false);
                            //~ addLine("Type 'help' for help.");
                            //~ refresh();
                        //~ },
                        specialkey: function(f, e, eOpts) {
                            console.log(f.up().prevChild(f).getEl().setHtml("Запрос отправлен"));
                            if (e.getKey() === e.ENTER) {
                                let cmd = f.getValue();
                                f.setValue('');
                                let vmrecord = f.lookupViewModel()
                                    .get('record').getData();
                                PveMgr.qagentAction(vmrecord, 'exec',
                                    {cmd}, function(resp) {f.up().prevChild(f).getEl().setHtml(resp.msg)} );
                            } else if (e.getKey() === e.PAGE_UP) {
                                textbox.scrollBy(0, -0.9*textbox.getHeight(), false);
                            } else if (e.getKey() === e.PAGE_DOWN) {
                                textbox.scrollBy(0, 0.9*textbox.getHeight(), false);
                            }
                        }
                    },
                    width: '100%',
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
        },
    ],
    //~ initComponent: function() {
        //~ this.callParent(arguments);
        //~ console.log(this.lookupViewModel());
        //~ console.log(this.getViewModel().getData().record.data);
    //~ },
});

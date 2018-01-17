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
                    border: true,
                    margins: '5 5 5 5',
                    bodyCls: 'pvemgr-code',
                    html: 'shell',
                },{
                    region: 'south',
                    margins:'0 5 5 5',
                    border: false,
                    xtype: 'textfield',
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
                            const codePalnel = f.up().prevChild(f);
                            if (e.getKey() === e.ENTER) {
                                const cmd = f.getValue();
                                const text = codePalnel.body.dom.textContent
                                           + '\nКоманда: ' + cmd + "\nЗапрос отправлен";
                                codePalnel.update(text);
                                const d = codePalnel.body.dom;
                                d.scrollTop = d.scrollHeight - d.offsetHeight;
                                f.setValue('');
                                const vmrecord = f.lookupViewModel()
                                    .get('record').getData();
                                PveMgr.qagentAction(
                                    vmrecord,
                                    'shellexec',
                                    {cmd},
                                    function(resp) {
                                        let text = codePalnel.body.dom.textContent;
                                        console.log(resp.data.return['out-data']);
                                        if (resp.data.return['out-data']) {
                                            const out = Ext.util.Base64.decode(resp.data.return['out-data']);
                                            text += '\nSTDOUT:\n' + out;
                                        }
                                        if (resp.data.return['err-data']) {
                                            const err = Ext.util.Base64.decode(resp.data.return['err-data']);
                                            text += '\nSTDERR:\n' + err;
                                        }
                                        codePalnel.update(text);
                                        d.scrollTop = d.scrollHeight - d.offsetHeight;
                                    }
                                );
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

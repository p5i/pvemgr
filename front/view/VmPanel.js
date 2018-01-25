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
            xtype: 'treepanel',
            title: 'Снэпшоты',
            rootVisible: false,
            collapsible: false,
            iconCls: 'x-fa fa-history',
            sortableColumns: false,
            columnLines: true,
            lines: true,
            columns: [
                { text: 'Имя', dataIndex: 'name', xtype: 'treecolumn', flex: 1 },
                { text: 'Описание', dataIndex: 'description', flex: 1 },
                {
                    text: 'Создан',
                    dataIndex: 'snaptime',
                    //~ xtype: 'datecolumn',
                    renderer: v => Ext.Date.format(v,'Y-m-d H:i:s'),
                    flex: 1
                },
                { text: 'Состояние ВМ', dataIndex: 'vmstate', flex: 1 },
            ],
            store: {
                model: 'PveMgr.model.VmSnapshot',
            },
            listeners: {
                show: function(panel) {
                    const vModel = this.lookupViewModel();
                    const vmdata = vModel.getData().record.data;
                    PveMgr.vmSnapshots(
                        {
                            snapAction: 'get',
                            vmid: vmdata.vmid,
                            node: vmdata.node,
                        },
                        function(resp) {
                            let snaps = resp.data;
                            console.log(panel);
                            let root = {
                                expanded: true,
                            };
                            panel.setRootNode(root);
                            
                            root.children = snaps.filter( s => !s.parent );
                            console.log(root.children);
                            
                            root.children.forEach( function maketree (p) {
                                let chldrn = [];
                                let notChldrn = [];
                                snaps.forEach( (s, i) => {
                                    if ( s && s.parent === p.name ) {
                                        chldrn.push(s);
                                    } else {
                                        notChldrn.push(s);
                                    }
                                } );
                                if (chldrn.length) {
                                    p.children = chldrn;
                                    p.expanded = true;
                                    p.expandable = false;
                                } else {
                                    p.leaf = true;
                                }
                                if (p.name === 'current') p.iconCls = 'x-fa fa-desktop';
                                else p.iconCls = 'x-fa fa-history';
                                snaps = notChldrn;
                                chldrn.forEach(maketree);
                            } );
                            console.log(root.children);
                            panel.setRootNode(root);
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

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
            //~ xtype: 'container',
            layout: {
                type: 'border',
            },
            title: 'Снэпшоты',
            //~ border: false,
            iconCls: 'x-fa fa-history',
            items: [
                {
                    xtype: 'treepanel',
                    rootVisible: false,
                    collapsible: false,
                    sortableColumns: false,
                    border: false,
                    flex: 1,
                    region: 'center',
                    columnLines: true, // doesn't work in triton theme for some reason
                    lines: true, // same here
                    plugins:[
                        {
                            ptype: 'rowexpander',
                            rowBodyTpl: new Ext.XTemplate(
                                '<p><tpl for="configarray">',
                                    '<b>{name}:</b> {value}<br/>',
                                '</tpl></p>'
                            ),
                        },
                    ],

                    tbar: [
                        {
                            itemId: 'snapshotBtn',
                            text: 'Сформировать новый Снэпшот',
                            handler: function() {
                                var win = Ext.create('Ext.window.Window');
                                win.show();
                            },
                        },
                    ],

                    columns: [
                        { text: 'Имя', dataIndex: 'name', xtype: 'treecolumn', flex: 1 },
                        { text: 'Описание', dataIndex: 'description', flex: 1 },
                        {
                            text: 'Создан',
                            dataIndex: 'snaptime',
                            renderer: v => Ext.Date.format(v,'Y-m-d H:i:s'),
                            flex: 1
                        },{
                            text: 'Память',
                            dataIndex: 'vmstate',
                            renderer: v => v == 1 ? 'Да' : 'Нет',
                            flex: 1
                        },
                    ],
                    store: {
                        model: 'PveMgr.model.VmSnapshot',
                    },
                    listeners: {
                        add: function(panel) {
                            console.log(this);
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
                                    let root = {
                                        expanded: true,
                                    };

                                    root.children = snaps.filter( s => !s.parent );

                                    // Converting list to tree
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

                                    panel.setRootNode(root);
                                }
                            );
                        },
                    },
                },{
                    region: 'east',
                    xtype: 'form',
                    title: 'Новый снэпшот',
                    collapsed: true,
                    collapsible: true,
                    items: [
                        {
                            xtype: 'textareafield',
                            fieldLabel: 'Описание',
                            fieldStyle: "{font-size: small; white-space: nowrap;}",
                            name: 'description',
                            scrollable: true,
                            height: 200,
                        },
                    ],
                },


            ],
        }, // </Snapshots tab>
    ],
    //~ initComponent: function() {
        //~ this.callParent(arguments);
        //~ console.log(this.lookupViewModel());
        //~ console.log(this.getViewModel().getData().record.data);
    //~ },
});

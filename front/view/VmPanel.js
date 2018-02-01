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
            itemId: 'snapTab',
            layout: {
                type: 'border',
            },
            title: 'Снэпшоты',
            iconCls: 'x-fa fa-history',
            listeners: {
                show: 'vmPanelGetSnaps',
            },
            defaults: {
                split: true,
            },
            items: [
                {
                    xtype: 'treepanel',
                    itemId: 'snapTree',
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
                            itemId: 'del',
                            text: 'Удалить',
                            handler: 'vmPanelSnapBtnClick',
                        },{
                            itemId: 'rollback',
                            text: 'Откатить',
                            handler: 'vmPanelSnapBtnClick',
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
                        select: function(rm, record) {
                            const snap = record.getData();
                            const treepanel = this;
                            const snappanel = treepanel.up();
                            const snapconf = snappanel.getComponent('snapCtrl');
                            snapconf.getForm().setValues( {
                                name: snap.name,
                                description: snap.description,
                                vmstate: snap.vmstate, 
                            } );
                        }
                    },
                },{
                    region: 'east',
                    itemId: 'snapCtrl',
                    xtype: 'form',
                    title: 'Управление',
                    collapsed: true,
                    collapsible: true,
                    bodyPadding: 5,
                    fieldDefaults: {
                        labelAlign: 'top',
                        width: '100%',
                    },
                    width: 300,
                    buttonAlign: 'center',
                    border: false,
                    
                    items: [
                        {
                            xtype: 'textfield',
                            fieldLabel: 'Наименование',
                            name: 'name',
                        },{
                            xtype: 'textareafield',
                            fieldLabel: 'Описание',
                            fieldStyle: "{font-size: small; white-space: nowrap;}",
                            name: 'description',
                            scrollable: true,
                            height: 100,
                        },{
                            xtype: 'checkbox',
                            boxLabel: 'Память',
                            name: 'vmstate',
                            inputValue: 1,
                            uncheckedValue: 0,
                        },
                    ],
                    buttons: [
                        {
                            text: 'Создать новый',
                            itemId: 'takenew',
                            handler: 'vmPanelSnapBtnClick',
                        },{
                            text: 'Изменить',
                            itemId: 'modify',
                            handler: 'vmPanelSnapBtnClick',
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

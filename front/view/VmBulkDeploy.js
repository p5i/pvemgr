Ext.define('PveMgr.view.VmBulkDeploy', {
    extend: 'Ext.panel.Panel',
    xtype: 'pvemgr.vmbulkdeploy',
    controller: 'pvemgr.vmbulkdeploy',
    viewModel: Ext.create('PveMgr.view.VmBulkDeployModel'),
    jsonSubmit: true,
    //url: 'api/vmdeploy',
    buttonAlign: 'center',
    border: false,
    layout: {
        type: 'accordion',
        //fill: false,
        multi: true,
    },
    fieldDefaults: {
        xtype: 'textfield',
        msgTarget: 'side',
        labelAlign: 'left',
        labelStyle: 'font-weight:bold',
        width: '100%',
    },
    items: [
        {
            xtype: 'grid',
            reference: 'bulkVmGrid',
            width: '100%',
            columns: [
                {
                    xtype:'actioncolumn',
                    width: 10*3,
                    tdCls: 'pvemgr-vm-actioncolumn',
                    items: [
                        {
                            //iconCls: 'x-fa fa-remove',
                            iconCls:  'pictos pictos-delete',
                            tooltip: 'Delete',
                            handler: function(table, rowInd){
                                table.store.removeAt(rowInd);
                            },
                        },
                    ],
                },{
                    dataIndex: 'vmid',
                    editor: {},
                    text: 'VMID',
                },{
                    dataIndex: 'hostname',
                    width: 170,
                    text: 'Сетевое имя',
                    editor: 'textfield',
                },{
                    dataIndex: 'name',
                    text: 'Имя ВМ',
                    editor: 'textfield',
                    renderer: function(val, meta, record, rowInd, colInd, store, view) {
                        if (!val) {
                            val = record.getData().hostname;
                            if (val) val = '<i>' + val.split('.')[0] + '</i>';
                        }
                        return val;
                    },
                },{
                    dataIndex: 'template',
                    width: 200,
                    text: 'Шаблон, vmid (имя)',
                    renderer: function(val, meta, record, rowInd, colInd, store, view) {
                        if (val) {
                            let store = Ext.getStore('vmStore');
                            let rec = store.findRecord('vmid', val);
                            if (rec) return val + ' (' +rec.getData().name + ')';
                            return val;
                        }
                        return '<i>Надо выбрать</i>';
                    },
                    editor: {
                        xtype: 'combobox',
                        displayField: 'name',
                        valueField: 'vmid',
                        allowBlank: false,
                        selectOnFocus: true,
                        store: 'vmTemplates',
                        autoLoadOnValue: true,
                        queryMode: 'local',
                    },
                },{
                    dataIndex: 'node',
                    text: 'Узел',
                    width: 100,
                    editor: {
                        xtype: 'combobox',
                        displayField: 'node',
                        forceSelection: true,
                        allowBlank: false,
                        store: 'nodeStore',
                        queryMode: 'local',
                    },
                },{
                    dataIndex: 'ip',
                    text: 'Адрес',
                    editor: 'textfield',
                },{
                    dataIndex: 'mask',
                    text: 'Маска сети',
                    value: '24',
                    editor: {
                        xtype: 'numberfield',
                        maxValue: 32,
                        minValue: 0,
                        displayField: 'value',
                        valueField: 'value',
                        selectOnFocus: true,
                    },
                },{
                    dataIndex: 'gateway',
                    text: 'Маршрутизатор',
                    editor: 'textfield',
                },{
                    dataIndex: 'start',
                    width: 110,
                    text: 'Старт',
                    xtype: 'checkcolumn',
                    headerCheckbox: true,
                },{
                    dataIndex: 'vlan',
                    text: 'VLAN',
                    editor: {
                        xtype: 'numberfield',
                        minValue: 0,
                        maxValue: 4095,
                    },
                },{
                    dataIndex: 'description',
                    text: 'Описание',
                    editor: {
                        xtype: 'textarea',
                    },
                },
            ],
            bind: {
                store: '{vmBulkDeploy}',
            },
            plugins: [
                {
                    ptype: 'cellediting',
                    clicksToEdit: 1,
                },
                'clipboard',
                'selectionreplicator',
            ],
            selModel: {
                type: 'spreadsheet',
                rowNumbererHeaderWidth: 25,
            },
            tbar: [
                { 
                    xtype: 'button',
                    text: 'Добавить',
                    handler: 'addRecord',
                },{
                    reference: 'pool',
                    xtype: 'combobox',
                    width: 200,
                    labelWidth: 30,
                    margin: '0 0 0 15',
                    fieldLabel: 'Пул',
                    forceSelection: true,
                    allowBlank: false,
                    queryMode: 'local',
                    displayField: 'poolid',

                    store: 'poolStore',
                },
            ],
        },{
            xtype: 'form',
            reference: 'bulkVmOptionsForm',
            title: 'Доп. параметры',
            collapsed: true,
            items: [
                {
                    xtype: 'textarea',
                    fieldLabel: 'Ключи ssh',
                    labelAlign: 'top',
                    name: 'sshkeys',
                    width: '100%',
                    fieldStyle: 'font-size: xx-small; white-space: nowrap;',
                },
                {
                    xtype: 'textarea',
                    fieldLabel: 'ACL для путей ( "/home/user1" u:user2:rwX g:100500:X )',
                    labelAlign: 'top',
                    name: 'pathacls',
                    width: '100%',
                    fieldStyle: 'font-size: xx-small; white-space: nowrap;',
                },
            ],
        },{
            xtype: 'form',
            reference: 'bulkVmUsersForm',
            title: 'Пользователи и группы',
            collapsed: true,
            items: [
                {
                    xtype: 'tagfield',
                    displayField: 'user',
                    name: 'users',
                    forceSelection: false,
                    createNewOnEnter: true,
                    createNewOnBlur: true,
                    allowBlank: true,
                    store: 'nodeStore',
                    queryMode: 'local',
                },{
                    xtype: 'textarea',
                    fieldLabel: 'Ключи ssh',
                    labelAlign: 'top',
                    name: 'sshkeys',
                    width: '100%',
                    fieldStyle: 'font-size: xx-small; white-space: nowrap;',
                    emptyText: 'Задать пользователей на основе SSH ключа.'
                        + ' Пример: \'ssh-rsa {ключ} user@medindex.corp\'',
                },
            ],
        }
    ],
    buttons: [
        {
            text: 'Пуск',
            itemId: 'btnStart',
            formBind: true,
            handler: 'bulkDeployStart',
        },{
            text: 'Очистить',
            tooltip: 'Очистить Параметры',
            itemId: 'btnClear',
            handler: 'bulkDeployClear',
        },
    ],

    afterRender: function(){
        this.callParent(arguments);
        this.getController().afterCompShow();
    },

});

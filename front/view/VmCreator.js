// Copyright (c) 2018 Medindex (medindex.ru)

Ext.define('PveMgr.view.VmCreator', {
    extend: 'Ext.form.Panel',
    xtype: 'pvemgr.vmcreator',
    alias: 'pvemgr.vmcreatoralias',
    controller: 'pvemgr.vmcreator',
    jsonSubmit: true,
    url: 'api/vmdeploy',
    buttonAlign: 'center',
    border: false,
    layout: 'vbox',
    scrollable: 'vertical',

    onShow: function() {
        this.callParent();
        this.getController().getNewId();
    },

    fieldDefaults: {
        xtype: 'textfield',
        msgTarget: 'side',
        labelAlign: 'top',
        width: 120,
    },

    items: [
        {
            reference: 'pool',
            name: 'pool',
            xtype: 'combobox',
            width: 200,
            labelWidth: 30,
            fieldLabel: 'Пул',
            forceSelection: true,
            allowBlank: false,
            queryMode: 'local',
            displayField: 'poolid',
            store: 'poolStore',
        },{
            xtype: 'fieldcontainer',
            layout: 'hbox',
            align: 'stretch',
            pack: 'center',
            defaultType: 'textfield',
            width: '100%',
            fieldDefaults: {
                labelAlign: 'top',
            },
            items: [
                {
                    fieldLabel: 'Id',
                    name: 'vmid',
                    //readOnly: true,
                    width: 75,
                },{
                    name: 'template',
                    xtype: 'combobox',
                    margin: '0 0 0 5',
                    labelStyle: 'font-weight: bold',
                    fieldLabel: 'Шаблон',
                    width: 190,
                    displayField: 'name',
                    valueField: 'vmid',
                    forceSelection: true,
                    allowBlank: false,
                    store: 'vmTemplates',
                    listeners: {change: 'vmTemplateChanged'},
                    queryMode: 'local',
                },{
                    name: 'node',
                    xtype: 'combobox',
                    width: 100,
                    margin: '0 0 0 5',
                    fieldLabel: 'Узел:',
                    forceSelection: true,
                    displayField: 'node',
                    valueField: 'node',
                    store: 'nodeStore',
                    queryMode: 'local',
                },{
                    fieldLabel: 'Кол-во',
                    name: 'num',
                    xtype: 'numberfield',
                    value: 1,
                    maxValue: 10,
                    minValue: 1,
                    margin: '0 0 0 5',
                    width: 70,
                },
            ],
        },{
            xtype: 'fieldcontainer',
            layout: 'hbox',
            defaultType: 'textfield',
            width: '100%',
            fieldDefaults: {
                labelAlign: 'top',
            },
            items: [
                {
                    xtype: 'textfield',
                    fieldLabel: 'Имя ВМ',
                    width: 130,
                    name: 'name',
                },{
                    xtype: 'textfield',
                    margin: '0 0 0 5',
                    width: 230,
                    fieldLabel: 'Сетевое Имя',
                    labelStyle: 'font-weight: bold',
                    name: 'hostname',
                    allowBlank: false,
                },{
                    fieldLabel: 'Суффикс',
                    name: 'suffix',
                    margin: '0 0 0 5',
                    width: 50,
                },
            ],
        },{
            xtype: 'fieldcontainer',
            layout: 'hbox',
            defaultType: 'textfield',
            width: '100%',
            fieldDefaults: {
                labelAlign: 'top',
            },
            items: [
                {
                    xtype: 'textfield',
                    fieldLabel: 'IP Адрес',
                    name: 'ip',
                },{
                    xtype: 'textfield',
                    width: 50,
                    margin: '0 0 0 5',
                    fieldLabel: 'Маска',
                    name: 'mask',
                },{
                    xtype: 'textfield',
                    margin: '0 0 0 5',
                    fieldLabel: 'Маршрутизатор',
                    name: 'gateway',
                },{
                    xtype: 'textfield',
                    margin: '0 0 0 5',
                    fieldLabel: 'VLAN',
                    width: 50,
                    name: 'vlan',
                },
            ],
        },{
            xtype: 'textareafield',
            fieldLabel: 'Машины (VMID, Имя ВМ, Сетевое имя, IP, маска, маршрут, vlan)',
            width: '100%',
            fieldStyle: "{font-size: small; white-space: nowrap;}",
            name: 'vms',
            scrollable: true,
            height: 200,
        },{
            xtype: 'textareafield',
            fieldLabel: 'Описание',
            width: '100%',
            name: 'description',
            fieldStyle: "{font-size: small; white-space: nowrap;}",
            grow: true,
        },{
            xtype: 'fieldcontainer',
            layout: 'hbox',
            width: '100%',
            fieldDefaults: {
                labelAlign: 'top',
            },
            items: [
                        {
                            xtype: 'checkbox',
                            boxLabel: 'Включить',
                            name: 'start',
                            inputValue: 1,
                            uncheckedValue: 0,
                        },{
                            xtype: 'checkbox',
                            boxLabel: 'Узел PVE',
                            name: 'dopve',
                            inputValue: 1,
                            uncheckedValue: 0,
                        },


            ],
        },
    ],
    buttons: [
        {
            text: 'Создать',
            itemId: 'btnCreate',
            formBind: true,
            handler: 'onCreateClick',
        },{
            text: 'Новый ID',
            tooltip: 'Запросить следующий неиспользуемый'
                   + 'идентификатор ВМ после указанного в поле ID',
            itemId: 'btnLoad',
            handler: 'getNewId',
        },{
            text: 'Обновить',
            itemId: 'btnUpdate',
            formBind: true,
            handler: 'onUpdateClick',
        },
    ],
});

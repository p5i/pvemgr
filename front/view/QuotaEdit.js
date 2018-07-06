// Copyright (c) 2018 Medindex (medindex.ru)

Ext.define('PveMgr.view.QuotaEdit', {
    extend: 'Ext.form.Panel',
    xtype: 'pvemgr.quotaedit',
    controller: 'pvemgr.quotaedit',
    jsonSubmit: true,
    url: 'api/script',
    buttonAlign: 'center',
    border: false,
    layout: 'vbox',
    scrollable: 'vertical',
    fieldDefaults: {
        xtype: 'textfield',
        msgTarget: 'side',
        labelAlign: 'top',
        labelStyle: 'font-weight:bold',
        //~ width: 120,
    },
    items: [
        {
            name: 'pool',
            xtype: 'combobox',
            width: 400,
            margin: '0 0 0 5',
            fieldLabel: 'Пул',
            forceSelection: true,
            displayField: 'poolid',
            queryMode: 'local',

            store: 'poolStore',

            listeners: {
                select: 'poolChange',
            },
        },
        {
            xtype: 'fieldcontainer',
            margin: '5 0 0 0',
            layout: 'vbox',
            defaultType: 'textfield',
            width: '100%',
            fieldDefaults: {
                labelStyle: 'font-weight: normal',
                width: '80%',
                labelWidth: 150,
                width: 300,
            },
            style: {
                padding: 5,
            },

            items: [ // <Limitations>
                {
                    xtype: 'fieldcontainer',
                    fieldLabel: 'ЦПУ',
                    labelStyle: 'font-weight:bold',
                    layout: 'hbox',
                    width: '100%',
                    fieldDefaults: {
                        labelWidth: 100,
                        width: '40%',
                        padding: '0 0 0 5',
                    },
                    items: [
                        {
                            fieldLabel: 'Максимум',
                            name: 'cpuMax',
                            xtype: 'numberfield',
                        },
                        {
                            fieldLabel: 'Выделено ВМ',
                            name: 'cpu',
                            xtype: 'displayfield',
                            padding: '0 0 0 30',
                            fieldStyle: 'margin-left: 40px',
                        },
                    ],
                },
                {
                    xtype: 'fieldcontainer',
                    fieldLabel: 'ОЗУ, ГБ',
                    labelStyle: 'font-weight:bold',
                    layout: 'hbox',
                    width: '100%',
                    fieldDefaults: {
                        labelWidth: 100,
                        width: '40%',
                        padding: '0 0 0 5',
                    },
                    items: [
                        {
                            fieldLabel: 'Максимум',
                            name: 'memMax',
                            xtype: 'numberfield',
                        },
                        {
                            fieldLabel: 'Выделено ВМ',
                            name: 'mem',
                            xtype: 'displayfield',
                            padding: '0 0 0 30',
                            fieldStyle: 'margin-left: 40px',
                        },
                    ],
                },
                {
                    xtype: 'fieldcontainer',
                    fieldLabel: 'Диск, ГБ',
                    labelStyle: 'font-weight:bold',
                    layout: 'hbox',
                    width: '100%',
                    fieldDefaults: {
                        labelWidth: 100,
                        width: '40%',
                        padding: '0 0 0 5',
                    },
                    items: [
                        {
                            fieldLabel: 'Максимум',
                            name: 'diskMax',
                            xtype: 'numberfield',
                        },
                        {
                            fieldLabel: 'Выделено ВМ',
                            name: 'disk',
                            xtype: 'displayfield',
                            padding: '0 0 0 30',
                            fieldStyle: 'margin-left: 40px',
                        },
                    ],
                },
                {
                    xtype: 'fieldcontainer',
                    fieldLabel: 'Диапазон VMID',
                    labelStyle: 'font-weight:bold',
                    layout: 'hbox',
                    defaultType: 'textfield',
                    width: '100%',
                    fieldDefaults: {
                        width: '45%',
                        padding: '0 0 0 15',
                        width: 200,
                    },
                    items: [
                        {
                            fieldLabel: 'Минимальный VMID',
                            name: 'vmidMin',
                            xtype: 'numberfield',
                        },
                        {
                            fieldLabel: 'Максимальный VMID',
                            name: 'vmidMax',
                            xtype: 'numberfield',
                        },
                    ],
                },
                {
                    xtype: 'fieldcontainer',
                    fieldLabel: 'Диапазон VLAN',
                    labelStyle: 'font-weight:bold',
                    layout: 'hbox',
                    defaultType: 'textfield',
                    width: '100%',
                    fieldDefaults: {
                        width: 200,
                        padding: '0 0 0 15',
                    },
                    items: [
                        {
                            fieldLabel: 'Минимальный VLAN',
                            name: 'vlanMin',
                            xtype: 'numberfield',
                        },
                        {
                            fieldLabel: 'Максимальный VLAN',
                            name: 'vlanMax',
                            xtype: 'numberfield',
                        },
                    ],
                },
            ], // </Limitations>
        },
        {
            xtype: 'displayfield',
            fieldLabel: 'Комментарий',
            width: '100%',
            fieldStyle: "{font-size: small; white-space: nowrap;}",
            name: 'comment',
            scrollable: true,
            height: 200,
        },

    ],
    buttons: [
        {
            text: 'Сохранить',
            formBind: true,
            handler: 'poolQuotaSave',
        },{
            text: 'Сброс',
            tooltip: 'Очистить Параметры',
            handler: 'poolQuotaReset',
            tooltip: 'Сбросить текущие значения и загрузить сохраненные с сервера',
        },
    ],

    afterRender: function(){
        this.callParent(arguments);
        this.getController().afterCompRender();
    },

});

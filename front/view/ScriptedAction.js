Ext.define('PveMgr.view.ScriptedAction', {
    extend: 'Ext.form.Panel',
    xtype: 'pvemgr.scriptedaction',
    controller: 'pvemgr.scriptedaction',
    jsonSubmit: true,
    url: 'api/script',
    buttonAlign: 'center',
    border: false,
    layout: 'vbox',
    scrollable: 'vertical',
    fieldDefaults: {
        xtype: 'textfield',
        msgTarget: 'side',
        labelAlign: 'left',
        labelStyle: 'font-weight:bold',
        width: 120,
    },
    items: [
        {
            name: 'script',
            xtype: 'combobox',
            width: 400,
            margin: '0 0 0 5',
            fieldLabel: 'Скрипт',
            forceSelection: true,
            displayField: 'description',
            valueField: 'name',
            tpl: Ext.create('Ext.XTemplate',
                '<tpl for=".">',
                '<div class="x-boundlist-item" style="border-bottom:1px solid #f0f0f0;">',
                '<div><b>Имя:</b> {name}</div>',
                '<div><b>Описание:</b> {description}</div></div>',
                '</tpl>'
            ),
            displayTpl: Ext.create('Ext.XTemplate',
                '<tpl for=".">',
                '{name} - {description}',
                '</tpl>'
            ),

            bind: {
                value: '{scriptedActionsSelected}',
                store: '{formulaScriptedActionsStore}',
            },

            listeners: {
                change: function(combo) {
                    let fcont = combo.nextSibling();
                    let recordData = combo.getSelection().getData();
                    fcont.setFieldLabel(recordData.description);
                    fcont.removeAll();
                    fcont.add(recordData.params);
                },
            },
        },
        {
            xtype: 'fieldcontainer',
            margin: '5 0 0 0',
            fieldLabel: 'Параметры',
            labelAlign: 'top',
            layout: 'vbox',
            defaultType: 'textfield',
            width: '100%',
            fieldDefaults: {
                labelAlign: 'left',
                labelStyle: 'font-weight:bold',
                width: '80%',
                labelWidth: '50%',
            },
            style: {
                padding: 5,
            },
        },
    ],
    buttons: [
        {
            text: 'Пуск',
            itemId: 'btnStart',
            formBind: true,
            handler: 'scriptedActionStart',
        },{
            text: 'Сброс',
            tooltip: 'Очистить Параметры',
            itemId: 'btnClear',
            handler: 'scriptedActionClear',
        },
    ],
});

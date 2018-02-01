Ext.define('PveMgr.view.Login', {
    extend: 'Ext.window.Window',

    requires: ['PveMgr.view.LoginController'],
    controller: 'pvemgr.login',

    width: 400,
    modal: true,
    border: false,
    draggable: true,
    closable: false,
    resizable: false,
    layout: 'auto',
    title: 'PveMgr Login',
    defaultFocus: 'usernameField',
    defaultButton: 'loginButton',

    onEsc: Ext.emptyFn, // "closable: false" is not enough for some reason

    items: [
        {
            xtype: 'form',
            layout: 'form',
            url: '/api/login',
            reference: 'loginForm',

            fieldDefaults: {
                labelAlign: 'right',
                allowBlank: false,
            },

            items: [
                {
                    xtype: 'textfield',
                    fieldLabel: 'Логин',
                    name: 'username',
                    itemId: 'usernameField',
                    reference: 'usernameField',
                    stateId: 'login-username',
                },{
                    xtype: 'textfield',
                    inputType: 'password',
                    fieldLabel: 'Пароль',
                    name: 'password',
                    reference: 'passwordField',
                },{
                    xtype: 'combobox',
                    name: 'realm',
                    fieldLabel: 'Домен авторизации',
                    store: 'realmStore',
                    displayField: 'comment',
                    tpl: Ext.create('Ext.XTemplate',
                        '<tpl for=".">',
                        '<div class="x-boundlist-item" style="border-bottom:1px solid #f0f0f0;">',
                        '<div><b>Домен:</b> {realm}</div>',
                        '<div><b>Тип:</b> {type}</div>',
                        '<div><b>Описание:</b> {comment}</div></div>',
                        '</tpl>'
                    ),
                    displayTpl: Ext.create('Ext.XTemplate',
                        '<tpl for=".">',
                        '{realm}<tpl if="comment"> - {comment}</tpl>',
                        '</tpl>'
                    ),
                    matchFieldWidth: false,
                    valueField: 'realm',
                    reference: 'realmComboBox',
                    allowBlank: true,
                    stateId: 'default-realm',
                },
            ],
            buttons: [
                {
                    xtype: 'checkbox',
                    fieldLabel: 'Save User name',
                    name: 'saveusername',
                    reference: 'saveunField',
                    stateId: 'login-saveusername',
                    labelWidth: 'auto',
                    labelAlign: 'right',
                    submitValue: false,
                },{
                    text: 'Login',
                    reference: 'loginButton',
                    handler: 'onLogon',
                },
            ],
        },
    ],
});

Ext.define('PveMgr.view.ScriptedActionController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.pvemgr.scriptedaction',
    id: 'scriptedactioncontroller',
    itemId: 'scriptedactioncontroller',

    scriptedActionStart: function(button) {
        let fPanel = this.getView();
        let vals = fPanel.getValues();

        fPanel.submit({
            waitMsg: 'Загрузка...',
            params: vals,
            success: function(form, action) {
                try {
                    var resp = Ext.decode(action.response.responseText);
                    if(resp.msg) {
                        Ext.Msg.alert('Успешно', '<pre>' + resp.msg + '</pre>');
                    }
                }
                catch (ex) {
                    Ext.Msg.alert('Status', 'Exception: ' + ex.Message);

                }
            },
            failure: function(meForm, action) {
                Ext.Msg.alert("Load failed", action.result.errorMsg);
            }
        });
    },

    scriptedActionClear: function() {
        let scriptCombo = this.getView().getForm().findField('script');
        scriptCombo.fireEvent('change', scriptCombo);
    },
})

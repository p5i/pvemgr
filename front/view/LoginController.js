Ext.define('PveMgr.view.LoginController', {

    extend: 'Ext.app.ViewController',
    alias: 'controller.pvemgr.login',

    onLogon: function() {
        var me = this;

        var form = this.lookupReference('loginForm');
        var unField = this.lookupReference('usernameField');
        var saveunField = this.lookupReference('saveunField');
        var pwField = this.lookupReference('passwordField');
        var realmCbx = form.getForm().findField('realm');
        var view = this.getView();

        if(form.isValid()){
            view.el.mask('Please wait...', 'x-mask-loading');

            // set or clear username
            var sp = Ext.state.Manager.getProvider();
            if (saveunField.getValue() === true) {
                sp.set(unField.getStateId(), unField.getValue());
            } else {
                sp.clear(unField.getStateId());
            }
            sp.set( saveunField.getStateId(), saveunField.getValue() );
            sp.set( realmCbx.getStateId(), realmCbx.getValue() )
            let values = form.getValues();
            pwField.setRawValue();
            
            PveMgr.req( form.url, values, (res) => {
                view.el.unmask();
                if (res.success) {
                    Ext.util.Cookies.set( 'pmgrLoginCookie',
                        res.data.pmgrLoginCookie);
                    view.close();
                    let vModel = view.lookupViewModel(true);
                    vModel.set('login', null);
                    let vc = PveMgr.getApplication().getMainView().getController();
                    vc.fireEvent('pmgrlogin');

                    sp.set('loggedUser', values.username + '@' + values.realm)
                } else {
                    Ext.toast("Login failed. Please try again");
                    sp.clear('loggedUser');
                }
            });
        }
    },

    control: {
        'field[name=username]': {
            specialkey: function(f, e) {
                if (e.getKey() === e.ENTER) {
                    var pf = this.lookupReference('passwordField');
                    if (pf.getValue()) {
                        this.onLogon();
                    } else {
                        pf.focus(false);
                    }
                }
            }
        },
        'field[name=password]': {
            specialkey: function(f, e) {
                if (e.getKey() === e.ENTER) {
                    this.onLogon();
                }
            },
        },
        '#' : {
            show: function() {
                var sp = Ext.state.Manager.getProvider();
                var checkboxField = this.lookupReference('saveunField');
                var unField = this.lookupReference('usernameField');
                var realmCbx = this.lookupReference('realmComboBox');

                var checked = sp.get( checkboxField.getStateId() );
                checkboxField.setValue(checked);

                if(checked === true) {
                    var username = sp.get(unField.getStateId());
                    unField.setValue(username);
                    var pwField = this.lookupReference('passwordField');
                    pwField.focus();
                }
                
                if ( !realmCbx.getValue() ) {
                    let rlmStore = realmCbx.getStore();
                    let defrealm =  sp.get( realmCbx.getStateId() );
                    console.log(defrealm);
                    rlmStore.load( (records) => {
                        if (!defrealm) {
                            Ext.each(records, (r) => {
                                if (r.data.default) defrealm = r.data.realm;
                            })
                        }
                        realmCbx.select( rlmStore.findRecord(
                            'realm', defrealm || 'pam') );
                    } );
                }
            },
        },
    },
    
});

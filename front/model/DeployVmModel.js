// Copyright (c) 2018 Medindex (medindex.ru)

/*
 *   Структура запроса на деплой ВМ 
 */
Ext.define('PveMgr.model.DeployVmModel', {
    extend: 'Ext.data.Model',
    idProperty: 'vmid',
    fields: [
        'vmid',
        'template',
        'node',
        'hostname',
        'name',
        'ip',
        'vlan',
        'storage',
        'start',
        'description',
    ],
});

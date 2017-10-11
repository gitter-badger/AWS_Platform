export const SubRolePermissionEnum = {
    name: '所有权限',
    children: [
        { code: 'board', name: '看板' },
        {
            code: 'merchant', name: '商户中心', children: [
                { code: 'merchant_manager', name: '线路商管理' },
                { code: 'merchant_merchant', name: '商户管理' },
            ]
        },
        {
            code: 'player', name: '玩家中心', children: [
                { code: 'player_list', name: '玩家列表' }
            ]
        },
        {
            code: 'game', name: '游戏中心', children: [
                { code: 'game_list', name: '游戏列表' },
                { code: 'game_background', name: '游戏后台' }
            ]
        },
        {
            code: 'operation', name: '运营中心', children: [
                { code: 'operation_notice', name: '公告管理' },
                { code: 'operation_message', name: '站内信管理' },
                { code: 'operation_seat', name: '展位管理' }
            ]
        },
        {
            code: 'risk', name: '风控中心', children: [
                { code: 'risk_video', name: '电子游戏风控' }
            ]
        },
        {
            code: 'system', name: '系统设置', children: [
                { code: 'system_loginlog', name: '登录日志' },
                { code: 'system_operatelog', name: '操作日志' },
                { code: 'system_manager', name: '管理员管理' },
                { code: 'system_msn', name: '线路号列表' }
            ]
        }
    ]
}
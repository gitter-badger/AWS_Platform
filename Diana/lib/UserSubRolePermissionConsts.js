export const SubRolePermissionEnum = [{
    name: '所有权限',
    children: [
        { code: 'board', name: '看板' },
        {
            code: 'mcenter', name: '商户中心', children: [
                {
                    code: 'mcenter_manager', name: '线路商管理', children: [
                        { code: 'mcenter_manager_list', name: '线路商列表' },
                        { code: 'mcenter_manager_new', name: '创建线路商' }
                    ]
                },
                {
                    code: 'mcenter_merchant', name: '商户管理', children: [
                        { code: 'mcenter_merchant_list', name: '商户列表' },
                        { code: 'mcenter_merchant_new', name: '创建商户' }
                    ]
                },
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
                {
                    code: 'operation_notice', name: '公告管理', children: [
                        { code: 'operation_notice_list', name: '游戏公告列表' },
                        { code: 'operation_notice_linelist', name: '跑马灯列表' }
                    ]
                },
                {
                    code: 'operation_message', name: '站内信管理', children: [
                        { code: 'operation_message_gamelist', name: '游戏邮件列表' }
                    ]
                },
                {
                    code: 'operation_seat', name: '展位管理', children: [
                        { code: 'operation_seat_list', name: '展位列表' }
                    ]
                }
            ]
        },
        {
            code: 'risk', name: '风控中心', children: [
                { code: 'risk_video', name: '电子游戏风控' }
            ]
        },
        {
            code: 'system', name: '系统设置', children: [
                {
                    code: 'system_loginlog', name: '登录日志', children: [
                        { code: 'system_loginlog_manager', name: '线路商登录日志' },
                        { code: 'system_loginlog_merchant', name: '商户登录日志' }
                    ]
                },
                {
                    code: 'system_operatelog', name: '操作日志', children: [
                        { code: 'system_operatelog_admin', name: '管理员操作日志' }
                    ]
                },
                {
                    code: 'system_manager', name: '管理员管理', children: [
                        { code: 'system_manager_list', name: '管理员列表' },
                        { code: 'system_manager_new', name: '添加管理员' }
                    ]
                },
                { code: 'system_msn', name: '线路号列表' }
            ]
        }
    ]
}]
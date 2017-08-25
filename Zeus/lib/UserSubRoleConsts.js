/**
 * 角色名称枚举
 */
export const SubRoleNameEnum = {
    'admin': { role: 'admin', name: '管理员' },
    'president': { role: 'president', name: '总裁' },
    'marketing': { role: 'marketing', name: '市场部' },
    'operation': { role: 'operation', name: '运营部' },
    'finance': { role: 'finance', name: '财务部' }
}
/**
 * 角色权限Y
 */
export const SubRolePermissionY = {
    'merchant': true,
    'player': true,
    'game': true,
    'person': true,
    'operation': true,
    'finance': true,
    'risk': true,
    'service': true,
    'system': true
}
/**
 * 角色权限N
 */
export const SubRolePermissionN = {
    'merchant': false,
    'player': false,
    'game': false,
    'person': false,
    'operation': false,
    'finance': false,
    'risk': false,
    'service': false,
    'system': false
}
/**
 * 角色权限枚举
 */
export const SubRoleEnum = {
    // 管理员，所有权限
    'admin': {
        ...SubRolePermissionY
    },
    // 总裁，所有权限
    'president': {
        ...SubRolePermissionY
    },
    // 市场部
    'marketing': {
        ...SubRolePermissionN,
        'merchant': true,
        'player': true,
        'person': true,
        'system': {
            'msn': true
        },

    },
    // 运营部
    'operation': {
        ...SubRolePermissionN,
        'merchant': true,
        'game': true,
        'service': true,
        'person': true
    },
    // 财务部
    'finance': {
        ...SubRolePermissionN,
        'finance': true,
        'risk': true,
    }
}
enum Permissions {
    GLOBAL_LOGIN = 1 << 0,
    MANAGE_COURSES = 1 << 1,
    MANAGE_BLOCKED_PWDS = 1 << 2,
    VIEW_ALL_USERS = 1 << 3,
    MANAGE_USERS_PERMISSIONS = 1 << 4,
    CREATE_STUDENT_OR_PARENT = 1 << 5,
    CREATE_TEACHER = 1 << 6,
    MANAGE_ADMIN_LEVEL_PERMISSIONS = 1 << 7,
    ASSIGN_COURSES_TO_TEACHERS = 1 << 8,
    ASSIGN_STUDENTS_TO_COURSES = 1 << 9,
    DELETE_USERS = 1 << 10,
    MANAGE_SUBJECTS = 1 << 11,
    SEND_MAIL = 1 << 12,
    CHANGE_USER_PASSWORD = 1 << 13,
    ASMSQ_HERO = 1 << 14,
}

function isAdminLevelPermission(permission: Permissions) {
    return [
        // permissions that require MANAGE_ADMIN_LEVEL_PERMISSIONS permission to grant or revoke
        Permissions.MANAGE_ADMIN_LEVEL_PERMISSIONS,
    ].includes(permission);
}

class PermissionManager {
    private _permission: number;

    /**
     * The Permission manager
     * @param permission The permissions the user this manager is for has
     */
    constructor(permission: number | Permissions = 0) {
        this._permission = permission;
    }

    /**
     * Allows a user a permission and adds it to the permission manager
     * @param permission
     */
    allow(permission: Permissions | number) {
        this._permission |= permission;
    }
    /**
     * Denys a user a permission and removes it from the permission manager
     * @param permission
     */
    deny(permission: Permissions | number) {
        this._permission &= ~permission;
    }
    /**
     * Checks if a user has a permision
     * @param permission
     * @returns Whether the user has or has not the specified permission
     */
    has(permission: Permissions | number): boolean {
        return (this._permission & permission) === permission;
    }

    get permissions(): number {
        return this._permission;
    }
}

export default PermissionManager;
export { Permissions, isAdminLevelPermission };

enum Permissions {
    GLOBAL_LOGIN = 1 << 0,
    GLOBAL_SET_OWN_NICKNAME = 1 << 1,
    GLOBAL_SET_OWN_EMAIL = 1 << 2,
    GLOBAL_SET_OWN_AVATAR = 1 << 3,
    SUPPORT_CREATE_TICKET = 1 << 4,
    MESSENGER_READ_MESSAGES = 1 << 5,
    MESSENGER_WRITE_PRIVATE_MESSAGES = 1 << 6,
    MESSENGER_CONTACT_EVERYONE = 1 << 7,
    MESSENGER_BE_CONTACTED_BY_EVERYONE = 1 << 8,
    MESSENGER_ATTACH_FILES = 1 << 9,
    MESSENGER_USE_LIST = 1 << 10,
    MESSENGER_EDIT_SENT_MESSAGES = 1 << 11,
    MESSENGER_REVOKE_SENT_MESSAGES = 1 << 12,
    MESSENGER_ARCHIVATE_MESSAGES = 1 << 13,
    CLASS_VIEW_OWN_GRADES = 1 << 14,
    CLASS_VIEW_OWN_ATTENDANCE = 1 << 15,
    CLASS_ATTENDANCE_OVER_NAT = 1 << 16,
    CLASS_LOG_LESSONS = 1 << 17,
    CLASS_ASSIGN_HOMEWORK = 1 << 18,
    CLASS_UPLOAD_DOCUMENTS_FOR_ALL = 1 << 19,
    CLASS_SEE_FULL_LIST = 1 << 20,
    SEE_ALL_USERS = 1 << 21,
    MANAGE_SUBJECTS = 1 << 22,
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
    allow(permission: Permissions) {
        this._permission |= permission;
    }
    /**
     * Denys a user a permission and removes it from the permission manager
     * @param permission
     */
    deny(permission: Permissions) {
        this._permission &= ~permission;
    }
    /**
     * Checks if a user has a permision
     * @param permission
     * @returns Whether the user has or has not the specified permission
     */
    has(permission: Permissions): boolean {
        return (this._permission & permission) === permission;
    }

    get permissions(): number {
        return this._permission;
    }
}

export default PermissionManager;
export { Permissions };

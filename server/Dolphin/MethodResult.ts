enum DolphinErrorTypes {
    FAILED = "FAILED",
    DATABASE_ERROR = "DATABASE_ERROR",
    NOT_FOUND = "NOT_FOUND",
    ALREADY_EXISTS = "ALREADY_EXISTS",
    NOT_SUPPORTED = "NOT_SUPPORTED",
    NOT_ACTIVE = "NOT_ACTIVE",
    NOT_AUTHORIZED = "NOT_AUTHORIZED",
    NOT_AUTHENTICATED = "NOT_AUTHENTICATED",
    INVALID_ARGUMENT = "INVALID_ARGUMENT",
    INVALID_TYPE = "INVALID_TYPE",
}

type MethodResult<T> = [T, null] | [undefined, DolphinErrorTypes];
export default MethodResult;
export { DolphinErrorTypes };

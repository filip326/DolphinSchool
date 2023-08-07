type CheckAuthResult =
    "/totp" | "/" |
    { username: string, fullName: string } |
    "failed";

export default async function checkAuth(): Promise<CheckAuthResult> {
    // check login status
    const loginStatus = await useFetch("/api/login-status", { method: "GET"});
    if (loginStatus.status.value === "success") {
        if (loginStatus.data.value === "Logged in") {
            // return data from /api/whoami
            const whoami = await useFetch("/api/whoami", { method: "GET"});
            if (whoami.status.value === "success") {
                return whoami.data.value ?? "failed";
            } else {
                return "failed";
            }
        }

        if (loginStatus.data.value === "2fa required") {
            return "/totp";
        }

        if (loginStatus.data.value === "Login required") {
            return "/";
        }

        return "failed";
    }

    return "failed";

}

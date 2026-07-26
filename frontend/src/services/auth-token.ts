export function normalizeAccessToken(token?: string | null) {
    return (token ?? "").replace(/^Bearer\s+/i, "").trim();
}

export function buildAuthorizationHeader(token?: string | null) {
    const normalizedToken = normalizeAccessToken(token);
    return normalizedToken ? `Bearer ${normalizedToken}` : null;
}

export function shouldClearAuthenticationForStatus(status: number | null | undefined) {
    return status === 401;
}

const NON_DIGITS = /\D/g;

export function onlyDigits(value?: string | null) {
    return (value ?? "").replace(NON_DIGITS, "");
}

export function formatCnpj(value?: string | null) {
    const digits = onlyDigits(value).slice(0, 14);
    return digits
        .replace(/^(\d{2})(\d)/, "$1.$2")
        .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1/$2")
        .replace(/(\d{4})(\d)/, "$1-$2");
}

export function formatPhone(value?: string | null) {
    const digits = onlyDigits(value).slice(0, 11);

    if (digits.length <= 10) {
        return digits
            .replace(/^(\d{2})(\d)/, "($1) $2")
            .replace(/(\d{4})(\d)/, "$1-$2");
    }

    return digits
        .replace(/^(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2");
}

export function formatZipCode(value?: string | null) {
    return onlyDigits(value).slice(0, 8).replace(/^(\d{5})(\d)/, "$1-$2");
}

export function normalizeSearch(value?: string | null) {
    return (value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

export function cityState(city?: string | null, state?: string | null) {
    const safeCity = city?.trim() || "-";
    const safeState = state?.trim().toUpperCase();
    return safeState ? `${safeCity}/${safeState}` : safeCity;
}

export function isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isValidState(value: string) {
    return /^[A-Z]{2}$/.test(value.trim().toUpperCase());
}

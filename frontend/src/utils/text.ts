export function normalizeSearch(value?: string | null) {
    return (value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

export function compactText(value?: string | null, maxLength = 72) {
    const text = value?.trim() ?? "";

    if (text.length <= maxLength) {
        return text;
    }

    return `${text.slice(0, maxLength - 3).trim()}...`;
}

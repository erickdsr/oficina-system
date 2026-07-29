export function formatCurrency(value: number) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
}

export function formatDateTime(value?: string | null) {
    if (!value) {
        return "-";
    }

    return new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
    }).format(new Date(value));
}

export function displayValue(value?: string | null) {
    return value?.trim() ? value : "Nao informado";
}

export function onlyDigits(value?: string | null) {
    return (value ?? "").replace(/\D/g, "");
}

export function formatCpf(value?: string | null) {
    const digits = onlyDigits(value);
    if (!digits) {
        return "Nao informado";
    }
    if (digits.length !== 11) {
        return value?.trim() || "Nao informado";
    }

    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

export function formatCnpj(value?: string | null) {
    const digits = onlyDigits(value);
    if (!digits) {
        return "Nao informado";
    }
    if (digits.length !== 14) {
        return value?.trim() || "Nao informado";
    }

    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}

export function formatCpfCnpj(value?: string | null) {
    const digits = onlyDigits(value);
    if (digits.length === 11) {
        return formatCpf(digits);
    }
    if (digits.length === 14) {
        return formatCnpj(digits);
    }

    return digits ? value?.trim() || digits : "Nao informado";
}

export function formatPhone(value?: string | null) {
    const digits = onlyDigits(value);
    if (digits.length === 11) {
        return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    }
    if (digits.length === 10) {
        return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    }

    return digits ? value?.trim() || digits : "Nao informado";
}

export type NumericInputValue = string;

export function parseNumericInput(value: NumericInputValue) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

export function normalizeMoney(value: NumericInputValue) {
    const parsed = parseNumericInput(value);
    if (parsed < 0) {
        return 0;
    }

    return Math.round(parsed * 100) / 100;
}

export function normalizeMoneyString(value: NumericInputValue) {
    return String(normalizeMoney(value));
}

export function normalizeQuantity(value: NumericInputValue) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        return 1;
    }

    return Math.max(1, Math.floor(parsed));
}

export function normalizeQuantityString(value: NumericInputValue) {
    return String(normalizeQuantity(value));
}

export function clampMoney(value: NumericInputValue, max?: number) {
    const normalized = normalizeMoney(value);
    return max === undefined ? normalized : Math.min(normalized, Math.max(max, 0));
}

export function toMoneyInputValue(value: number) {
    return Number.isFinite(value) && value >= 0 ? String(Math.round(value * 100) / 100) : "0";
}

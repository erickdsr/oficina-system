export const brazilianStates = [
    "AC",
    "AL",
    "AP",
    "AM",
    "BA",
    "CE",
    "DF",
    "ES",
    "GO",
    "MA",
    "MT",
    "MS",
    "MG",
    "PA",
    "PB",
    "PR",
    "PE",
    "PI",
    "RJ",
    "RN",
    "RS",
    "RO",
    "RR",
    "SC",
    "SP",
    "SE",
    "TO",
] as const;

export type BrazilianState = typeof brazilianStates[number];

export function isBrazilianState(value?: string | null): value is BrazilianState {
    return brazilianStates.includes((value ?? "").toUpperCase() as BrazilianState);
}

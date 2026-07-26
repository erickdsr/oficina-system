import type { InputHTMLAttributes } from "react";

type NumericInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "type" | "value"> & {
    value: string;
    onChange: (value: string) => void;
    selectZeroOnFocus?: boolean;
};

export function NumericInput({
    value,
    onChange,
    onFocus,
    selectZeroOnFocus = true,
    ...props
}: NumericInputProps) {
    return (
        <input
            {...props}
            type="number"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onFocus={(event) => {
                if (selectZeroOnFocus && event.currentTarget.value === "0") {
                    event.currentTarget.select();
                }
                onFocus?.(event);
            }}
        />
    );
}

export function MoneyInput(props: Omit<NumericInputProps, "min" | "step" | "placeholder">) {
    return <NumericInput min="0" step="0.01" placeholder="0,00" {...props} />;
}

export default NumericInput;

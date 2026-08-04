import type { ReactNode } from "react";
import { ChevronDown, ListFilter, RotateCcw, Search, X } from "lucide-react";

export interface FilterOption<T extends string = string> {
    value: T;
    label: string;
}

interface FilterPanelProps {
    search: string;
    searchPlaceholder: string;
    filtersOpen: boolean;
    activeFilterCount: number;
    isApplying?: boolean;
    hasActiveFilters?: boolean;
    primaryAction?: ReactNode;
    children?: ReactNode;
    chips?: ReactNode;
    onSearchChange: (value: string) => void;
    onSearchSubmit: () => void;
    onToggleFilters: () => void;
    onClearFilters: () => void;
    onApplyFilters: () => void;
}

interface FilterFieldProps {
    label: string;
    children: ReactNode;
    className?: string;
}

interface FilterSelectProps<T extends string = string> {
    label: string;
    value: T;
    options: FilterOption<T>[];
    onChange: (value: T) => void;
    className?: string;
}

interface FilterSegmentedControlProps<T extends string = string> {
    label: string;
    value: T;
    options: FilterOption<T>[];
    onChange: (value: T) => void;
    className?: string;
}

interface FilterResultSummaryProps {
    total: number;
    noun: string;
    hasActiveFilters: boolean;
}

export function FilterPanel({
    search,
    searchPlaceholder,
    filtersOpen,
    activeFilterCount,
    isApplying = false,
    hasActiveFilters = activeFilterCount > 0,
    primaryAction,
    children,
    chips,
    onSearchChange,
    onSearchSubmit,
    onToggleFilters,
    onClearFilters,
    onApplyFilters,
}: FilterPanelProps) {
    return (
        <div className={`client-filter-shell garage-filter-shell${hasActiveFilters ? " has-active-filters" : ""}`}>
            <div className="client-filter-topbar garage-filter-topbar">
                <div className="client-search-control garage-search-control">
                    <Search size={18} aria-hidden="true" />
                    <input
                        type="search"
                        value={search}
                        onChange={(event) => onSearchChange(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                onSearchSubmit();
                            }
                        }}
                        placeholder={searchPlaceholder}
                        aria-label={searchPlaceholder}
                    />
                    {search && (
                        <button type="button" aria-label="Limpar pesquisa" onClick={() => onSearchChange("")}>
                            <X size={15} aria-hidden="true" />
                        </button>
                    )}
                </div>
                <div className="client-filter-topbar__actions garage-filter-topbar__actions">
                    <button type="button" className="secondary-button client-filter-toggle" onClick={onToggleFilters} aria-expanded={filtersOpen}>
                        <ListFilter size={18} aria-hidden="true" />
                        <span>Filtros</span>
                        {activeFilterCount > 0 && <strong>{activeFilterCount}</strong>}
                        <ChevronDown className={filtersOpen ? "is-open" : undefined} size={16} aria-hidden="true" />
                    </button>
                    {primaryAction}
                </div>
            </div>

            {filtersOpen && (
                <div className="client-filter-panel garage-filter-panel">
                    {children && <div className="garage-filter-grid">{children}</div>}
                    <div className="client-filter-footer garage-filter-footer">
                        {chips}
                        <div className="client-filter-actions">
                            <button type="button" className="secondary-button client-filter-clear-button" onClick={onClearFilters} disabled={!hasActiveFilters && !search}>
                                <RotateCcw size={17} aria-hidden="true" />
                                Limpar filtros
                            </button>
                            <button type="button" className="primary-button" onClick={onApplyFilters} disabled={isApplying}>
                                <Search size={17} aria-hidden="true" />
                                {isApplying ? "Aplicando..." : "Aplicar filtros"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export function FilterField({ label, children, className }: FilterFieldProps) {
    return (
        <section className={`client-filter-group garage-filter-field${className ? ` ${className}` : ""}`}>
            <h3>{label}</h3>
            {children}
        </section>
    );
}

export function FilterSelect<T extends string = string>({ label, value, options, onChange, className }: FilterSelectProps<T>) {
    return (
        <FilterField label={label} className={className}>
            <div className="client-select-wrap garage-filter-select">
                <select value={value} onChange={(event) => onChange(event.target.value as T)}>
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>
            </div>
        </FilterField>
    );
}

export function FilterSegmentedControl<T extends string = string>({ label, value, options, onChange, className }: FilterSegmentedControlProps<T>) {
    return (
        <FilterField label={label} className={className}>
            <div className="client-segmented-control garage-filter-segmented" role="radiogroup" aria-label={label}>
                {options.map((option) => (
                    <button
                        type="button"
                        key={option.value}
                        className={value === option.value ? "active" : undefined}
                        aria-pressed={value === option.value}
                        onClick={() => onChange(option.value)}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
        </FilterField>
    );
}

export function ActiveFilterChips({ children }: { children: ReactNode }) {
    return <div className="client-active-filter-chips garage-active-filter-chips" aria-label="Filtros selecionados">{children}</div>;
}

export function FilterResultSummary({ total, noun, hasActiveFilters }: FilterResultSummaryProps) {
    return (
        <div className="client-filter-result-note garage-filter-result-note">
            Exibindo {total.toLocaleString("pt-BR")} {noun}{hasActiveFilters ? " com os filtros aplicados." : "."}
        </div>
    );
}


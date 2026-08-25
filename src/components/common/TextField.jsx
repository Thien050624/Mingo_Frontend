export default function TextField({ icon: Icon, label, className = "", ...inputProps }) {
  return (
    <label
      className={`flex items-center gap-2 border border-zm-border rounded-lg px-3 py-2.5 focus-within:border-zm-blue ${className}`}
    >
      <Icon className="text-zm-muted shrink-0" size={14} aria-hidden="true" />
      <input
        aria-label={label}
        className="outline-none text-sm flex-1 bg-transparent text-zm-text placeholder-zm-muted"
        {...inputProps}
      />
    </label>
  );
}

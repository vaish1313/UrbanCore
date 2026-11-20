import { DESIGN_TOKENS } from "@/api/types";

const ITEMS = [
  { label: "Non-built-up (open land)", color: DESIGN_TOKENS.land },
  { label: "Existing", color: DESIGN_TOKENS.existing },
  { label: "New construction", color: DESIGN_TOKENS.new },
] as const;

export function Legend() {
  return (
    <ul
      className="flex flex-wrap gap-x-6 gap-y-2 px-1"
      style={{ justifyContent: "space-evenly" }}
    >
      {ITEMS.map((item) => (
        <li key={item.label} className="flex items-center gap-2 whitespace-nowrap">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: item.color }}
            aria-hidden
          />
          <span className="text-xs leading-snug" style={{ color: "#94a3b8" }}>
            {item.label}
          </span>
        </li>
      ))}
    </ul>
  );
}

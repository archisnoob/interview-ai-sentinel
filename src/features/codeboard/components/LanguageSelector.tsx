"use client";
import { LANGUAGE_CATALOG, LanguageKey } from "../lib/languages";

type Props = {
  selected: LanguageKey;
  onChange: (key: LanguageKey) => void;
};

export default function LanguageSelector({ selected, onChange }: Props) {
  return (
    <select
      className="rounded-lg border border-border bg-background text-foreground px-3 py-2 text-sm"
      value={selected}
      onChange={(e) => onChange(e.target.value as LanguageKey)}
      title="Select language"
    >
      {LANGUAGE_CATALOG.map(l => (
        <option key={l.key} value={l.key}>{l.label}</option>
      ))}
    </select>
  );
}
import { cn } from "@/lib/cn";
import { approx, formatMm, formatVolumeMm3 } from "@/features/geometry/units";
import type { ConfigurationSnapshot } from "../snapshot";

function ConsultBadge() {
  return (
    <span className="ml-1.5 inline-block rounded-full border border-dashed border-ink-300 px-1.5 py-px text-[10px] font-medium tracking-wide text-ink-500 uppercase">
      do konsultacji
    </span>
  );
}

/** Podsumowanie konfiguracji — wspólne dla panelu parametrów i formularza zapytania. */
export function ConfigurationSummary({ snapshot, className }: { snapshot: ConfigurationSnapshot; className?: string }) {
  const m = snapshot.model;
  const rows: { label: string; value: React.ReactNode }[] = [
    { label: "Plik", value: m ? <span className="break-all">{m.fileName}</span> : <span className="text-ink-400">nie wgrano</span> },
    {
      label: "Wymiary",
      value: m ? (
        <span className="font-mono text-[11.5px]">
          {m.sizeMm.map((v) => formatMm(v).replace(" mm", "")).join(" × ")} mm
          {!m.unitConfirmed ? <span className="block font-sans text-[11px] text-[#8a5a00]">jednostki niepotwierdzone</span> : null}
        </span>
      ) : (
        <span className="text-ink-400">—</span>
      ),
    },
    ...(m?.volumeMm3 != null ? [{ label: "Objętość", value: approx(formatVolumeMm3(m.volumeMm3)) }] : []),
    {
      label: "Materiał",
      value: (
        <>
          {snapshot.material.label.replace(/ — do konsultacji$/, "")}
          {snapshot.material.requiresConsultation ? <ConsultBadge /> : null}
        </>
      ),
    },
    { label: "Liczba sztuk", value: snapshot.quantity !== null ? `${snapshot.quantity} szt.` : <span className="text-danger">niepoprawna</span> },
    {
      label: "Tolerancja",
      value: (
        <>
          {snapshot.tolerance.label}
          {snapshot.tolerance.requiresConsultation ? <ConsultBadge /> : null}
        </>
      ),
    },
    {
      label: "Wykończenie",
      value: (
        <>
          {snapshot.finish.label}
          {snapshot.finish.requiresConsultation ? <ConsultBadge /> : null}
        </>
      ),
    },
    { label: "Termin", value: snapshot.leadTime.label },
  ];

  return (
    <dl className={cn("divide-y divide-line-faint text-[12px]", className)}>
      {rows.map((r) => (
        <div key={r.label} className="grid grid-cols-[96px_minmax(0,1fr)] gap-3 py-1.5">
          <dt className="text-ink-500">{r.label}</dt>
          <dd className="font-medium text-ink-900">{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}

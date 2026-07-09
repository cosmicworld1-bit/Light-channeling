import type { UiCard } from "@/lib/types";

type Session = {
  date: string;
  time: string;
  headcount: string;
  sessionType: string;
  volunteer: string;
  presenter: string;
  areaCoordinator: string;
  registered: string;
  remarks: string;
};

export type OrgSummaryCardData = UiCard & {
  orgnId?: string;
  name?: string;
  orgType?: string;
  address?: string;
  zone?: string;
  contact1?: string;
  contact2?: string;
  latestSession?: Session | null;
};

export default function OrgSummaryCard({ card }: { card: OrgSummaryCardData }) {
  const session = card.latestSession;

  return (
    <div className="mt-2 rounded-xl border border-neutral-200 bg-white p-3 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100">
      <p className="font-semibold">{card.name}</p>
      {card.orgType && <p className="text-xs text-neutral-500">{card.orgType}</p>}
      {card.address && <p className="mt-1 text-neutral-600 dark:text-neutral-400">{card.address}</p>}
      {card.zone && <p className="text-neutral-600 dark:text-neutral-400">{card.zone}</p>}

      {(card.contact1 || card.contact2) && (
        <div className="mt-2 space-y-0.5">
          {card.contact1 && <p>👤 {card.contact1}</p>}
          {card.contact2 && <p>👤 {card.contact2}</p>}
        </div>
      )}

      {session ? (
        <div className="mt-2 rounded-lg bg-neutral-100 p-2 dark:bg-neutral-800">
          <p className="font-medium">Most recent session</p>
          <p>
            {session.date} · {session.time} · {session.headcount} people
          </p>
          <p>{session.sessionType.trim()}</p>
          <p>Volunteer: {session.volunteer}</p>
          <p>Presenter: {session.presenter}</p>
          {session.remarks && (
            <p className="mt-1 text-neutral-500 dark:text-neutral-400">{session.remarks}</p>
          )}
        </div>
      ) : (
        <p className="mt-2 text-neutral-500 dark:text-neutral-400">No sessions recorded yet.</p>
      )}
    </div>
  );
}

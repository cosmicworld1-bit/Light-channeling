import type { UiCard } from "@/lib/types";

type OrgMatch = {
  orgnId: string;
  name: string;
  address: string;
  city: string;
  pincode: string;
};

export type OrgMatchesCardData = UiCard & {
  matches?: OrgMatch[];
};

export default function OrgMatchesCard({ card }: { card: OrgMatchesCardData }) {
  const matches = card.matches ?? [];

  return (
    <div className="mt-2 rounded-xl border border-neutral-200 bg-white p-3 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100">
      <p className="font-medium">Which one did you mean?</p>
      <ul className="mt-2 space-y-2">
        {matches.map((match) => (
          <li key={match.orgnId} className="rounded-lg bg-neutral-100 p-2 dark:bg-neutral-800">
            <p className="font-semibold">{match.name}</p>
            <p className="text-neutral-600 dark:text-neutral-400">
              {match.address}
              {match.city ? `, ${match.city}` : ""}
              {match.pincode ? ` – ${match.pincode}` : ""}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

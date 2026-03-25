/** Default status when adding from browse (heart) — "Want To Go". */
export const FAVOURITE_DB_STATUS = "want" as const;

export type PickStatus = typeof FAVOURITE_DB_STATUS | "been";

/** True if the user has this track/race on either Want or Been list. */
export function isFavouritedStatus(status: string | null | undefined): boolean {
  return status === "want" || status === "been";
}

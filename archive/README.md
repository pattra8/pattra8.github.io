# Archive

Pages retired from the live site but kept in the repository.

## `pay-legacy-2026-08/`

The old `/pay/` page — a two-tab form for common fee and parking, retired in
August 2026. Nothing on the site ever linked to it.

For the common fee it duplicated `/upload-slip/` with more steps and a weaker
contract: it sent the amount up from the browser instead of letting the server
work it out, so it could not have supported installment plans without being
rewritten. `/upload-slip/` is now the single way a resident reports a payment.

Its parking tab has no replacement yet. That flow is the reason this file is
archived rather than deleted: it is the only implementation of monthly parking
fees, including the live list of houses renting a slot, and it will be the
starting point whenever parking is picked back up.

The bundle here was already ~32 kB behind the rest of the site when it was
retired, so it is a snapshot of an older build, not of current `pattra8-pay`.

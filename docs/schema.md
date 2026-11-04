# Data schema

Three collections. Dates are `YYYY-MM-DD` strings.

## plants/{id}
- `name` (nickname), `common`, `species`, `roomId`, `spot`, `catReach`: `yes` | `no` | `""`
- `pot`, `soil`, `acquired`, `source`, `notes`, `health` (flag text or null)
- `waterEvery` (days), `lastWatered`, `snoozeUntil`
- `lastFed`, `feedEvery` (days, optional), `noFeedUntil`, `feedYearRound`
- `lastInspected`, `inspectEvery`, `repotted`, `created`
- `gifted`: `{ to, date }` (gifted plants leave the schedule)
- `care`: `{ light, lightNeed: low|medium|bright indirect|direct, water, humidity, toxic, dormancy, feed: standard|succulent|orchid|none, method: top|bottom, tapWater: ""|avoid, cues[], propagate }`
- `log[]` (last 150): `{ d, at (ISO time), t: water|check|inspect|issue|repot|move|note, fed, cues[], note, prev }`; `prev` holds the fields the action changed, so it can be undone

Display name order: `name` > `common` > `species`.

## rooms/{id}
- `name`, `facing`, `light` (grade), `cats`: `everywhere` | `some` | `closed`, `notes`, `weekdaysOnly` (weekend due dates slide to Monday)

## props/{id}
- `parentId`, `species`, `taken`, `qty`, `method`, `status`: `rooting` | `potted` | `established` | `for sale` | `sold` | `gifted`, `statusSince`, `spot`, `price`, `notes`

## checkins/{id}
- `plantId`, `d` (date), `assetId` (photo in the page's asset store, never in code), `health`: `excellent` | `good` | `bad`, `tags[]`, `note`, `at` (timestamp). Photos are shrunk to 1600px JPEG before upload.

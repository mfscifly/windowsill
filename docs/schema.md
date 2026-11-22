# Data schema

Three collections. Dates are `YYYY-MM-DD` strings.

## plants/{id}
- `name` (nickname), `common`, `species`, `roomId`, `spot`, `catReach`: `yes` | `no` | `""`
- `pot` (summary text, kept in sync from `env`), `soil` (growing medium: a preset like "aroid mix (chunky)" or free text), `acquired`, `source`, `notes`, `health` (flag text or null)
- `env` (this plant's own setup, editable under Environment): `setting` indoors|outdoors, `source` window|grow|both|none, `exposure` direct|bright indirect|medium|low or full sun|partial shade|shade, `sunHours`, `growHours`, `lightValue` + `lightUnit` fc|lux|ppfd (light meter reading; older records may have a free-text `reading`), `potType`, `potSize`, `drainage` yes|no
- Schedule fields are all editable in the plant form: `waterEvery`, `lastWatered`, `lastFed`, `feedEvery`, `feedYearRound`, `noFeedUntil`, `inspectEvery`, `lastInspected`, `repotted`
- `waterEvery` (days), `lastWatered`, `snoozeUntil`
- Smart watering: `sched` ("" = plain interval, `trusted` = owner's interval that also calibrates the model, `smart` = computed), `schedSince` (date a trusted interval was set, used for its season), `waterTune` (0.5 to 2, learned from check-ins), `care.waterGroup` (succulent | semi | foliage | thirsty | orchid, blank = guessed from the species), `env.heat` (yes | no). A smart plant's interval is baseline for the group x medium x pot type x pot size x light x season x heat, scaled to agree with trusted plants (look-alikes first, then same group, then all), times `waterTune`. See `smartPlan()` in `src/app.html`.
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

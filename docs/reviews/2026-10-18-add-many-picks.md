# Review: Add screen with many picks (2026-10-18)

Change: services already tracked can't be picked again (shown as "Added"), and the picks tray shows wrapping logo chips instead of a sideways row of wide name chips. Reviewed by a second model from the diff.

## Findings

- **Medium.** The × badge's 10pt hitSlop reached into the logo, so tapping the logo's corner removed the pick.
- **Medium.** The logo's tap target was 40pt, under the 44pt minimum.
- **Low.** The logo-only chip label "Change X" can't tell apart two custom picks with the same name.
- **Low.** The disabled state of "Added" rows isn't announced beyond the label.
- No bug: `savedIds` holding `null` for custom subscriptions never matches a catalog id; the two-row height math is right.

## Resolution

- The badge's hitSlop is now 4, so it stays clear of the logo's centre.
- Logos are 44pt (`PICK` 50). Six still fit per row on a 402pt-wide phone.
- The chip label now includes the price, for example "Change Spotify, $11.99 a month".
- Kept as is: the row's label already says "already added", and it has no action to announce. The muted "Added" pill uses the secondary text color, #555555, on the canvas, which passes 4.5:1.

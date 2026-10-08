# Boklanov

Portfolio site of theatre director Roman Boklanov: productions, bio, press, in RU/EN/DE.

## Language

### Content lifecycle

**Saved**:
An edit stored in the admin. Since the Cutover a Saved edit becomes Published within seconds, without a deploy; there are no drafts and no autosave; only Save stores an edit. (Before it, under Keystatic, Saved meant committed but not yet deployed.)
_Avoid_: uploaded, published (when only saved)

**Published**:
An edit visible on boklanov.com.
_Avoid_: saved, live (when only saved)

**Content delta**:
The Keystatic edits made on `main` after the 2026-05-12 fork point (`4e7497e`) that the Payload database does not yet contain.
_Avoid_: backlog, diff

**Cutover**:
The moment production switches from Keystatic to Payload; Keystatic is frozen and the Content delta is moved into Payload.
_Avoid_: migration (overloaded with DB migrations)

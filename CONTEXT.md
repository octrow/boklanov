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

### Translation

**Main texts**:
The five texts of a Production that define whether it reads in a language: title, tagline, synopsis, body, director's note. Everything else localized (captions, venues, cities, awards, link labels) is minor.
_Avoid_: content, all fields

**Synopsis**:
The two- or three-sentence summary of a Production (about 300 characters at most) that stands in for it in cards, search results and link previews. Longer prose belongs in the body.
_Avoid_: description, annotation

**Untranslated** (per language):
A Production is Untranslated into EN (or DE) when any Main text is filled in RU and empty in that language. Counted separately for EN and DE.
_Avoid_: missing translation (when only a minor field is empty)

### Images

**Image path**:
The address of a Production or About-page image file; the site renders images only from Image paths, and the photo credit lives next to the path.
_Avoid_: media item

**Media library**:
The admin's registry of uploaded files. Not a source of truth: nothing on the site reads it, and uploads from a Production do not appear in it.
_Avoid_: gallery (a Production's photos)

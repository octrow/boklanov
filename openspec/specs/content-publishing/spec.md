# content-publishing Specification

## Purpose

How an editor's Saved change becomes Published on boklanov.com, and the build constraints that keep that path working.

## Requirements

### Requirement: Saved edits become Published

An edit Saved in the editor SHALL become visible on boklanov.com only after a successful production deploy of the branch the editor writes to. The editor's "saved" state SHALL NOT be treated as Published.

#### Scenario: Editor saves a production

- **WHEN** the editor saves a production and the resulting production deploy succeeds
- **THEN** the change is visible on the production page within the deploy time (minutes)

#### Scenario: Deploy fails after save

- **WHEN** the editor saves a production and the production deploy fails
- **THEN** the change remains Saved but not Published, and the site keeps serving the last successful deploy

### Requirement: Media is served by the CDN, never bundled into functions

Production media (images, video, PDFs) SHALL be served from the CDN or static assets. Serverless functions SHALL NOT bundle media files; only small data files they read at runtime (e.g. `lqip.json`) MAY be traced into them.

#### Scenario: Media backup grows

- **WHEN** the R2 → `public/productions` backup adds media files
- **THEN** no serverless function grows by those files and the deploy stays under the host's function size limit

#### Scenario: LQIP data stays readable

- **WHEN** a production page renders on the server
- **THEN** its `lqip.json` placeholder data is available to the function

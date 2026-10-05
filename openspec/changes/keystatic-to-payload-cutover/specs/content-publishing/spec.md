# Spec Delta

## MODIFIED Requirements

### Requirement: Saved edits become Published

An edit Saved in the Payload admin SHALL become visible on boklanov.com through on-save revalidation of the affected pages, without a production deploy. A failed revalidation SHALL NOT discard the Saved edit. Code changes still reach production through a production deploy.

#### Scenario: Editor saves a production

- **WHEN** the editor saves a production in the Payload admin
- **THEN** the production page and listings show the change on the next request after revalidation, with no deploy

#### Scenario: Revalidation fails

- **WHEN** the editor saves a production and revalidation of a page fails
- **THEN** the edit stays Saved in Payload and is Published by the next successful revalidation or deploy

#### Scenario: Deploy fails after save

- **WHEN** the editor has saved a production and a later production deploy fails
- **THEN** the site keeps serving the last successful deploy, and the edit stays Saved in Payload and Published through revalidation

# Spec Delta

## Purpose

Defines how the scrolling city ticker behaves and how any visitor, including touch and keyboard users, can stop its motion.

## ADDED Requirements

### Requirement: Ticker motion can be paused by any input

The ticker SHALL provide a visible toggle button that pauses and resumes its motion, operable by touch, mouse and keyboard, with a hit area of at least 44×44px and a localized accessible name.

#### Scenario: Touch user pauses the ticker

- **WHEN** a visitor taps the toggle on a phone
- **THEN** the ticker stops moving and the toggle reports `aria-pressed="true"`

#### Scenario: Keyboard user

- **WHEN** a keyboard user tabs to the toggle and presses Enter or Space
- **THEN** the ticker pauses, and pressing again resumes it

### Requirement: Reduced motion and focus pause the ticker

The ticker SHALL NOT animate under `prefers-reduced-motion: reduce`, and SHALL pause while hovered or while focus is inside it.

#### Scenario: Reduced motion

- **WHEN** the visitor's system requests reduced motion
- **THEN** the ticker is static and the city list is fully readable

### Requirement: City list stays available to assistive technology

The full city list SHALL remain exposed once through the region's accessible name; the duplicated marquee text SHALL stay hidden from assistive technology.

#### Scenario: Screen reader

- **WHEN** a screen reader reaches the ticker
- **THEN** it announces the label and the city list once, and the toggle is announced separately as a pressed/not-pressed button

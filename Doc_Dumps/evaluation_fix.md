# Evaluation Stability Fix Guide

## Scope
This document tracks the four production fixes to make evaluation robust and non-crashing.

## Fix 1: Minimum Effort Threshold (U pillar)
- [x] Change Usage prompt minimum from 5 to 1.
- [x] Update violation text to reflect minimum 1.
- [x] Update report metric `prompts_required` to 1.

## Fix 2: None-safe Pillar Math
- [x] Ensure judge-derived scores fallback to numeric value when `score is None`.
- [x] Apply this to:
- [x] `app/evaluation/pillar_g.py`
- [x] `app/evaluation/pillar_u.py`
- [x] `app/evaluation/pillar_e.py`

## Fix 3: None-safe Evaluation Assembly
- [x] Ensure `PillarScore.score` is never `None` when building models.
- [x] Ensure sub-metric values are coerced to numeric defaults.
- [x] Keep `available=False` + `error` for failed pillars.

## Fix 4: Duplicate Evaluation Trigger Guard
- [x] Prevent overlapping evaluation runs for the same session.
- [x] If one run is active, return latest available evaluation safely.
- [x] Avoid crashing route with duplicate trigger race.

## Validation Checklist
- [ ] `/api/evaluate/{session_id}` does not 500 when judge quota is exhausted.
- [ ] Session with 1 prompt no longer violates U minimum effort threshold.
- [ ] Evaluation returns partial scores with failed pillars marked unavailable.
- [ ] Triggering evaluation twice in quick succession does not crash.

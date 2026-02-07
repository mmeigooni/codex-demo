# Story Mode Motion Language v1

## Purpose
Define a consistent animation system for Story Mode that feels cinematic while preserving usability and performance for engineering workflows.

## Core Principles
1. Clarity before spectacle.
2. Motion communicates state transitions, not decoration.
3. Secondary animation is subtle and interruptible.
4. Motion must respect reduced-motion preferences.

## Timing Tokens
| Token | Duration | Usage |
| --- | --- | --- |
| `--motion-fast` | `120ms` | hover, focus, chip state |
| `--motion-ui` | `180ms` | button presses, compact transitions |
| `--motion-panel` | `280ms` | drawers, tab body transitions |
| `--motion-hero` | `420ms` | hero act/phase state transitions |
| `--motion-ambient` | `5.5s` | low-amplitude ambient pulse loop |

## Easing Tokens
| Token | Curve | Usage |
| --- | --- | --- |
| `--ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | generic UI transitions |
| `--ease-emphasis` | `cubic-bezier(0.16, 1, 0.3, 1)` | hero phase transitions |
| `--ease-settle` | `cubic-bezier(0.22, 1, 0.36, 1)` | follow-through settle |

## Interaction Patterns
1. Anticipation
- Primary controls can pre-shift by 1px or 1% scale before commit states.
- Keep anticipation under `120ms`.

2. Follow-through
- Salience pulse can overshoot once then settle.
- No repeated bounce on static content.

3. Secondary action
- Chips/icons may glow or rotate lightly during phase changes.
- Secondary action must never obscure text.

## Salience Visual Language
1. `low`
- Quiet gradients and no strong pulses.
- Static ring/edge styles.

2. `medium`
- Soft pulse every 4-6 seconds.
- Accent ring and mild glow.

3. `high`
- Faster pulse windows near state change.
- Clear glow and stronger contrast edge.

## Spatial and Staging Rules
1. Keep motion arcs horizontal/diagonal in dashboard lanes.
2. Preserve stable anchor points for text blocks and CTA buttons.
3. Avoid large layout shifts during run-status changes.

## Exaggeration Limits
1. Max scale for UI controls: `1.06`.
2. Max translate for micro interactions: `4px`.
3. Max glow spread for high salience: `18px`.
4. Avoid perpetual high-amplitude loops.

## Reduced Motion
When `prefers-reduced-motion: reduce`:
1. Disable ambient loops, pulses, and decorative transforms.
2. Keep instant or near-instant state change transitions (`<= 80ms`).
3. Preserve semantic feedback through color/contrast and labels.

## Implementation Notes
1. Framer Motion should use shared transition objects from `lib/motion-tokens.ts`.
2. CSS variables should be defined in `app/globals.css` for color/motion consistency.
3. Components must not hardcode custom easing values when tokenized alternatives exist.

## Validation Checklist
1. Dashboard remains readable during animations.
2. Story Mode toggle does not stall active run state updates.
3. Reduced motion eliminates non-essential animation while preserving usability.

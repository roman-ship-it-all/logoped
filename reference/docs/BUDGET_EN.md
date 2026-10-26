# Claude implementation budget — USD 8 ceiling

Budget means the subsequent coding-agent run, not hosting, human labor, audio recording, subscriptions, taxes or runtime AI charges. No Claude calls were made to create this kit.

## Pricing basis checked 2026-10-26

The official Claude Platform pricing page lists Fable 5.1 and Fable 5 base rates of USD 10 per million input tokens and USD 50 per million output tokens. Fable 5.1 cache reads are listed at USD 0.25 per million tokens; Fable 5 cache reads at USD 1. The budget below conservatively uses uncached base input pricing and assumes no cache savings.

Sources: https://platform.claude.com/docs/en/about-claude/pricing and https://www.anthropic.com/claude/fable . Verify the selected provider, model version, region, tool fees and taxes before running. The user's wording does not specify a version or provider; do not silently select a paid provider.

For planning: cost = 10 × input_tokens/1,000,000 + 50 × billable_output_tokens/1,000,000, plus other applicable fees. Billable reasoning/output and repeated tool contexts count; visible answer length alone is not a reliable spending measure.

## Suggested envelope, not a forecast

| Stage | Cumulative input added | Billable output budget | Base-rate amount |
|---|---:|---:|---:|
| First implementation | 40,000 | 25,000 | $1.65 |
| Verify and repair | 60,000 | 35,000 | $2.35 |
| Final checks and package | 20,000 | 15,000 | $0.95 |
| Remaining reserve | — | — | $3.05 |
| Maximum | — | — | $8.00 |

The three illustrative stages total 120,000 input and 75,000 output tokens, $4.95 at the quoted base rates. They are allocation examples, not a prediction that a particular agent will finish within them. Providers and agent tools may charge differently.

## Enforcement

Set a tool/provider-enforced total USD 8 limit where supported. Target $6 maximum planned spend and preserve $2 for recovery. If the tool cannot enforce a monetary ceiling, use conservative request/token limits plus visible metering; do not claim the prompt itself guarantees the cap. Stop at the available budget and report incomplete items rather than starting extra paid calls.

## Reduce unnecessary work

Read PROMPT_EN.md, SPEC_EN.md, ACCEPTANCE_EN.md, the two small JSON settings/localization files and words.json. Do not send every SVG, PNG, generator and design sheet as text context. Inspect only one or two relevant previews visually. Never regenerate the 81 supplied assets. Keep explanations short. Use one plain-JavaScript implementation pass and one focused repair pass; avoid autonomous research, subagents, architecture experiments and dependency installations. No paid audio or image generation.

## Scope order if constrained

Must keep: 60 words and assets, selection of five, complete play/restart/exit loop, adult-led mode, accessible mobile layout, audio-ready loader, safe storage and ZIP. Optional polish may be omitted: transition animation, extra category styling, decorative meadow background. Do not remove error handling or pretend that missing recordings are included.

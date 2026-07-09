---
name: humanizer
description: Rewrite AI-sounding text so it reads as if a real person wrote it — for academic essays, assignments, personal statements, emails, blog posts, or any prose the user says "sounds like AI." Use whenever the user asks to humanize, de-AI, make more natural, less robotic, avoid AI-detector flags, or paste text for a rewrite in that spirit. Preserves meaning, citations, and structure; changes voice, rhythm, and word choice.
---

# Humanizer

## When to use

Trigger on any of: "humanize this", "make this sound human", "make it less AI", "rewrite so it doesn't sound like ChatGPT", "for my assignment / essay / paper", "avoid AI detector", "make it natural", or the user pasting a block of text and asking for a rewrite in that spirit.

Do NOT use when: the user wants a summary, a translation, factual edits, or code changes. Humanizing is voice-only.

## What "AI-sounding" looks like

Most flagged text shares the same tells. Look for these and fix them:

- **Uniform sentence length.** Every sentence is 18–24 words. Real writing swings — 6 words, then 30, then 12.
- **List-of-three cadence.** "It is efficient, scalable, and robust." Break at least half of these.
- **Empty connectives.** "Furthermore," "Moreover," "In conclusion," "It is important to note that," "In today's world," "In the realm of."
- **Hedge padding.** "It could be argued that," "one might suggest," "arguably," "to some extent."
- **Signature vocabulary.** delve, tapestry, leverage, robust, seamless, navigate the landscape, plethora, myriad, testament, underscore, garnered, holistic, paradigm, multifaceted, intricate.
- **Symmetric structure.** Every paragraph opens with a topic sentence, ends with a summary sentence. Real writers wander.
- **Perfect parallelism.** "Not only X but also Y." "Both A and B." Overused.
- **Em-dash overuse** — specifically the AI habit of stacking two per sentence.
- **Smart quotes and typographic dashes** when the surrounding document uses straight ones (or vice-versa) — mismatch is a giveaway. Match what the rest of the document uses.

## Rewrite rules

1. **Vary sentence length aggressively.** Aim for a mix: at least one short (≤8 words) and one long (≥25) per paragraph. Don't make it mechanical — just don't let three same-length sentences sit in a row.
2. **Cut empty connectives.** Delete "furthermore / moreover / in conclusion / it is important to note." If a transition is needed, use plain ones: "but," "so," "then," "also," "still."
3. **Swap the signature vocabulary** for ordinary words. `delve` → look at / go into. `leverage` → use. `robust` → strong / reliable. `plethora` → a lot of / many. `underscore` → show / stress. `garnered` → got / received. `intricate` → complex / detailed. `paradigm` → model / approach.
4. **Kill the hedges.** "It could be argued that X" → "X." Say things directly. If genuine uncertainty exists, use one plain qualifier ("probably," "seems," "in most cases") — not three stacked ones.
5. **Break parallelism.** If two sentences have the same shape, rewrite one. If a paragraph is three sentences of similar length, merge two or split one.
6. **Introduce a small human tic.** A short fragment. A sentence that starts with "And" or "But." A parenthetical aside. One per paragraph is plenty — more feels like a different affectation.
7. **Prefer concrete over abstract.** "Students struggled with the material" → "Students got stuck on the proofs in chapter 4." Specificity is the strongest anti-AI signal.
8. **Contractions where register allows.** "do not" → "don't" in casual/personal writing. Leave formal academic prose uncontracted unless the user's original had contractions.
9. **Preserve meaning, citations, numbers, and quoted text exactly.** Never invent facts or sources to make prose flow better. If a claim needs a citation the source didn't support, flag it — don't paper over it.

## Register — match the user's context

Ask (or infer from context) before rewriting:

- **Academic essay / research paper.** Keep formal register. No contractions. No slang. Vary sentence length; strip signature vocabulary; cut hedges; break parallelism. This is the most common ask.
- **Personal statement / application essay.** Add voice. First person is fine. Specific anecdotes beat abstract virtues. Contractions okay.
- **Blog post / casual.** Contractions, fragments, questions to the reader, dashes — all fair game.
- **Email / message.** Short. Direct. Cut anything that sounds like a form letter.

If the user didn't say, default to the register of their original text.

## Output shape

Return the rewritten text as the main deliverable. Below it, in 2–4 short bullets, note what changed at the level of technique — "cut 6 furthermores," "broke three same-length sentences," "swapped leverage/delve/robust." Don't lecture; just show the moves. Skip the bullets if the user only pasted a sentence or two.

If the user pasted something long, don't ask permission — rewrite. If they pasted something you can't rewrite honestly (invented citations, factual claims you can't verify), rewrite the parts you can and flag the parts you can't.

## What NOT to do

- Don't add facts, examples, or citations that weren't in the source.
- Don't help evade an AI detector on work the user is submitting as their own to a class that forbids AI assistance. If the user says the assignment forbids AI, say so plainly and stop — offer to help them write it themselves instead. Detector-evasion for its own sake isn't the goal; sounding like a human writer is.
- Don't over-humanize academic prose into casual prose. Match the register the piece is written in.
- Don't use em-dashes to fix em-dash overuse. Use periods or commas instead.

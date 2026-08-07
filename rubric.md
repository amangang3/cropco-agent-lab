# Account fit rubric — 2027 row-crop trait campaign

Score each farm 0–5 on each dimension. Multiply by the weight. Total is out of 100.

| # | Dimension | Weight | What a 5 looks like | What a 0 looks like |
|---|---|---|---|---|
| 1 | **Scale** | 25% | 7,000+ addressable row-crop acres | Under 1,500 acres, or most acres not addressable |
| 2 | **Portfolio fit** | 25% | Corn, soybeans, cotton — core seed-and-trait portfolio | Organic, permanent crops, fresh-market specialty, or dairy forage |
| 3 | **Technology posture** | 20% | Runs their own trials, uses precision ag daily, asks technical questions | Paper records, explicitly rejects digital tools |
| 4 | **Switching readiness** | 20% | Contract expiring, named dissatisfaction with incumbent, asked us for a number | Just signed multi-year elsewhere, or no identified path to the buyer |
| 5 | **Relationship** | 10% | Named decision maker engaged with us, recent warm contact | No contact, unknown buyer, or a damaged relationship |

## Notes on applying it

**Addressable acres, not total acres.** A 2,400-acre dairy growing corn silage
has almost no addressable acres for this campaign. An 11,400-acre co-op unit
where purchasing is done centrally by a committee has 11,400 acres and no
addressable path. Score dimension 1 on what we could actually sell into.

**Portfolio fit is a gate, not a slider.** Anything scoring 0–1 here should not
appear in a top 5 regardless of its total, because the other dimensions are
measuring how attractive a farm is at buying something we do not sell them.

**Relationship is weighted lowest on purpose.** A warm relationship with a
static 3,300-acre account is worth less than a cold approach to a 7,900-acre
one that just opened an RFP. The rubric is deliberately biased toward
opportunity over comfort, because comfort is what the existing call list
already optimises for.

**Recency matters to scoring, not just to confidence.** A note from February
describing enthusiasm is weaker evidence than a note from July describing the
same thing.

## Confidence

Confidence is assessed separately from score and is not derived from it. See
`.claude/agents/fit-scorer.md`. A farm can score 94 and still be LOW confidence,
and in that case the 94 is not reported — the farm goes to human review instead.
That is the intended behaviour, not a failure of the rubric.

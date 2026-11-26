---
name: aes-debugging
description: Root-cause debugging inside AES. Use it on any failure before proposing a fix — a red test, red CI, a verifier FAIL cycle, a defect (BUG-NNN), a flaky test or unexpected behaviour — even if it looks simple.
---

# Root-cause debugging (AES)

A technique for the programmer (and the mechanic) in `FAIL` cycles and defects, and for the orchestrator when classifying a failure. Based on `systematic-debugging` from [obra/superpowers](https://github.com/obra/superpowers) (MIT), adapted to the AES gates.

## Rule
**No fix without a root cause.** A change that makes the symptom disappear without explaining why it happened is not a fix: it is a postponed `FAIL` cycle.

## 1. Reproduce with evidence
- Read the **whole** error: message, stack trace, CI output. Not a summary.
- Reproduce it with a command. If it is a defect, the reproduction already exists: it is the item's check with RED (test or `.verify`). If it is a failure of your task, first write the technical test that fails for that reason.
- If it does not reproduce consistently, do not guess: gather more data (more runs, more context) and say so in your report.

## 2. Investigate
- **What changed:** `git log` and `git diff` against the branch's base; dependencies, configuration, environment.
- **Backwards:** follow the wrong value to its origin, not to where it blows up.
- **At the boundaries:** if there are several components (UI → API → database), look at what goes into and out of each one until you find where it breaks. If you add diagnostic logging, it is temporary: it does not reach the commit.
- **Compare with what works:** look for similar code in the same project that does work and list the differences.

## 3. One hypothesis at a time
- Write the hypothesis: "the cause is X because Y".
- Test it with the smallest possible change, one variable at a time.
- If it fails, discard it and form another. Do not pile up changes.

## 4. Fix
- The fix attacks the root cause, in a single change, **inside the task's surface**. If the cause is outside the surface or in a protected test, stop: `BLOCKED`, with the cause and the evidence.
- The reproduction from step 1 goes from red to green, and the rest of the validations stay green.
- No changes "while you are at it", and no silencing the error (empty `catch`, retries without a cause, weakened assertions).

## 5. When to stop
- If two hypotheses in a row fail, or the fix requires touching several pieces that should not be related, **stop** and report it: it may be a design problem, and that is decided by the orchestrator (design note) or the human. Do not try "one more thing".
- Each attempt that reaches CI or the verifier counts toward the task's circuit breaker (3 `FAIL` cycles, AES 04 §9).

## Flaky tests
- A test that fails sometimes has a cause: order, shared data, time, state left by another test. Look for it like any other.
- It is not fixed with fixed waits (`sleep`): wait for the **condition** (a visible element, a response, a file).
- If the test is an acceptance test, it is protected: the programmer does not touch it. Report it as a defect; QA fixes it (AES 05 §6).

## Signs you skipped the process
"I'll try changing X and see what happens", "it must be Y", "one more attempt", fixing without having seen the error fail. Go back to step 1.

## In the report
Symptom, reproduction (command and output), root cause and evidence, fix, and the reproduction in green. If you did not find the cause, say so: what you investigated, what you ruled out and what is missing. The report is written in the project's language (`AES_LANG`).

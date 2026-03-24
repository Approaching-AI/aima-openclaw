# AIMA Doctor — Community Announcement Draft

> Use this as a template for posting to OpenClaw community channels (Discord,
> forums, social media, etc.). Adapt the tone to the platform.

---

## Short version (Discord / chat / tweet)

Shipped **AIMA Doctor** — a one-command rescue for OpenClaw when your agent is
stuck. Install from ClawHub:

```
clawhub install aima-doctor
```

Then `/aima my agent keeps failing` in any conversation. It diagnoses the
issue and walks you through the fix. Works on macOS, Linux, and Windows.

GitHub: https://github.com/Approaching-AI/aima-openclaw

---

## Long version (forum / blog / README showcase)

### AIMA Doctor: one-command diagnosis and repair for OpenClaw

Ever had your OpenClaw agent get stuck in a loop, fail silently, or refuse to
complete an install? Instead of manually digging through logs, AIMA Doctor
gives you a deterministic rescue path.

**What it does:**

- Diagnoses OpenClaw process health (hung, crashed, or unresponsive agents)
- Fixes configuration breakage (corrupted settings, missing config)
- Recovers device registration and tokens
- Runs guided repairs powered by AIMA platform diagnostics

**How it works:**

AIMA Doctor ships a packaged helper runtime that runs locally on your machine.
No opaque remote scripts — everything is versioned and auditable. It connects
to the AIMA platform API for diagnostics, then executes deterministic repair
steps on your machine.

**Install:**

```bash
clawhub install aima-doctor
```

**Use:**

```
/aima my agent keeps failing to install the package
/aima status
/aima cancel
```

When AIMA Doctor asks a follow-up question, reply with `/aima <your answer>`.

**Compatibility:** macOS, Linux, Windows — OpenClaw 2026.3.22+

**Links:**

- ClawHub: `clawhub install aima-doctor`
- GitHub: https://github.com/Approaching-AI/aima-openclaw
- Homepage: https://aimaservice.ai/doctor

Feedback welcome — open an issue or drop a message here.

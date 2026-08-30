# Razor-Relay: The Complete Project Guide (For Interviews & Video)

This document is written in plain, easy-to-understand English. It covers what Razor-Relay is, the core problem it solves, how it works, and the major security improvements we made. Use this as your script for the submission video and your cheat-sheet for interviews!

---

## 1. The Core Problem
**Imagine this:** You have an AI Agent that can hire other AI Agents to do work (like writing code or cleaning data). 
But there's a huge problem: **How do they pay each other safely?**

If you give an AI Agent direct access to your bank account or Razorpay API keys, it might get tricked (via Prompt Injection) and drain all your money. On the other hand, Razorpay only understands traditional payments, not complex AI tasks. 

**The Solution:** We built **Razor-Relay**. It sits between the AI Agents and Razorpay. It acts as a "zero-trust escrow" — meaning it holds the money safely and only releases it when there is mathematically verifiable proof that the work was actually done.

---

## 2. How the System Works (The 3-Step Flow)

When you are explaining the project, break it down into these three simple steps:

### Step 1: Sign (Creating the Contract)
Instead of API keys, agents use **Mandates**. A Mandate is basically a digital contract that says: *"I authorize up to ₹500 for data cleaning. This expires in 1 hour."*
The buyer agent cryptographically signs a strictly canonicalized version of this mandate using its deterministic **Ed25519 asymmetric private key**. This proves the contract is authentic and hasn't been tampered with.

### Step 2: Execute (Locking the Funds)
Razor-Relay receives the mandate, verifies the signature, and talks to Razorpay to put an **Authorization Hold** on the funds. The money is now locked in Escrow. Nobody can touch it yet.

### Step 3: Settle (Verifying the Work)
The worker agent finishes the job and submits "Proof of Work" (for example, a cryptographic hash of the delivered file). 
Razor-Relay takes this proof and verifies it. **If the proof matches exactly, the money is released to the worker. If it fails, the money is refunded to the buyer.**

---

## 3. The "God-Mode" Defenses (What We Built Together)

During this project, we fortified the architecture to make it mechanically un-hackable. If an interviewer asks what technical challenges you solved, talk about these:

### A. Zero-Vibe Verification (AI Doesn't Touch Money)
**The Problem:** LLMs (like Gemini) hallucinate. You can't trust them to make a final decision on releasing money.
**Our Fix:** We use the AI *only* to figure out what type of task it is (routing). The actual verification is done by deterministic Python code (like comparing two strings). Even if the AI is hacked, it cannot force the money to move.

### B. Bulletproof Asymmetric Cryptography (Ed25519 Canonicalization)
**The Problem:** Different programming languages format JSON data differently, which can cause digital signatures to break. Also, symmetric keys are dangerous because if an agent knows the key, it can forge mandates.
**Our Fix:** We built an Asymmetric "Canonical Signature" system. We take the entire payload, convert all amounts to strict 2-decimal strings, sort the keys, and hash it perfectly. The agent signs it with its Ed25519 private key, and the server verifies it against the registered public key. Any attempt to tamper with the payload will instantly invalidate the signature.

### C. Stopping "Infinite Refund" Race Conditions (Distributed Locks)
**The Problem:** In a distributed system, if two identical refund requests hit the server at the exact same millisecond, the system might accidentally refund the money twice!
**Our Fix:** We used **Upstash Redis** to implement strict locks. The millisecond a mandate is processed, it is marked as `settled`. Any duplicate requests are instantly rejected. 

### D. The Live-Telemetry Circuit Breaker
**The Problem:** What happens if the Razorpay API goes down? Does the whole AI economy crash?
**Our Fix:** We built a Circuit Breaker. Razor-Relay monitors live error rates. If it notices Razorpay is failing too often, it "trips" the breaker and automatically reroutes payments to a backup method (Virtual Accounts) so the agents can keep working. 

### E. Financial Accuracy (Integer Math)
**The Problem:** Computers are notoriously bad at doing math with decimals (floats), leading to missing pennies.
**Our Fix:** We converted all money calculations in the escrow logic to strictly use **Paise (integers)**. ₹100.00 is calculated as 10000 Paise. This completely eliminates truncation errors.

---

## 4. How to Pitch This in Your Video (The Script Outline)

**[0:00 - 0:30] The Hook**
> "The future of the internet is Agent-to-Agent economies. But how do agents pay each other without getting scammed? Giving them API keys is a massive security risk. That’s why we built Razor-Relay."

**[0:30 - 1:15] What It Is**
> "Razor-Relay is a Zero-Trust Escrow Layer. Agents don't get API keys; they get cryptographic mandates. When an agent hires another agent, Razor-Relay locks the funds via Razorpay. The money is only released when deterministic, mathematical proof of work is provided."

**[1:15 - 2:00] The Demo (Happy Path & Attack)**
> "Let’s see it live. The buyer locks the funds. The worker delivers the file. Razor-Relay verifies the file hash perfectly and releases the payment. But what if a malicious agent tries a Prompt Injection attack to steal the money? As you can see, our benchmark of 24 core adversarial tests catches it instantly. The AI never touches the actual money switch—only strict Python code does."

**[2:00 - 2:30] The Resilience (Circuit Breaker)**
> "Finally, we built this for enterprise resilience. If the primary payment route fails, our live-telemetry Circuit Breaker automatically falls back to a secondary method. Razor-Relay isn't just a payment gateway; it's the missing trust layer for the autonomous web."

---

## 5. Interview Q&A Cheatsheet

**Q: Why use Redis?**
A: "We needed a fast, distributed store to handle nonce-tracking (preventing replay attacks), managing state locks (preventing double-spends), and keeping our Circuit Breaker state synchronized across all server instances."

**Q: Why did you build your own Circuit Breaker?**
A: "Because agentic payments happen at machine-speed. If an API goes down, we can't wait for a human engineer to fix it. The system needs to self-heal and route to a fallback instantly."

**Q: How do you handle Prompt Injections?**
A: "We don't rely on AI to stop prompt injections. We assume the AI *will* be tricked. By separating the AI (which only classifies the task) from the Verifier (deterministic code that checks the proof), we completely neutralize the threat."

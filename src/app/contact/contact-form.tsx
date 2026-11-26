"use client";

import { useState, type FormEvent } from "react";

const ENDPOINT = process.env.NEXT_PUBLIC_CONTACT_ENDPOINT;

const TOPICS = [
  "General question",
  "Bug report",
  "Feature suggestion",
  "Privacy request",
  "Legal / Copyright",
] as const;

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState<string>(TOPICS[0]);
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [status, setStatus] = useState<"idle" | "submitting" | "sent" | "mailto" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Honeypot check — silently ignore automated bot submissions
    if (website.trim() !== "") {
      setStatus("sent");
      return;
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanMessage = message.trim();

    if (cleanName.length < 2) {
      setErrorMsg("Please enter your name (at least 2 characters).");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMsg("Please enter a valid email address so we can reply.");
      return;
    }
    if (cleanMessage.length < 10) {
      setErrorMsg("Please include a short message (at least 10 characters).");
      return;
    }

    if (ENDPOINT) {
      setStatus("submitting");
      try {
        const res = await fetch(ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            name: cleanName,
            email: cleanEmail,
            topic,
            message: cleanMessage,
          }),
        });
        if (!res.ok) throw new Error("Submission failed");
        setStatus("sent");
        setName("");
        setEmail("");
        setMessage("");
      } catch {
        setStatus("error");
        setErrorMsg("We could not send your message right now. Please use the email address below instead.");
      }
      return;
    }

    // Static-site fallback: open the visitor's email client with a pre-filled draft
    const recipient = "fileswow.contact@gmail.com";

    const subject = `[FilesWow] ${topic} — from ${cleanName}`;
    const body = `Name: ${cleanName}\nReply-to: ${cleanEmail}\nTopic: ${topic}\n\n${cleanMessage}`;
    window.location.href = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setStatus("mailto");
  };

  return (
    <section
      className="mb-10 p-5 sm:p-7 rounded-2xl bg-bg-surface border border-border-base"
      aria-labelledby="contact-form-heading"
    >
      <h2 id="contact-form-heading" className="heading-md text-text-primary mb-2">
        Send a message
      </h2>
      <p className="text-[13.5px] text-text-secondary mb-6">
        Fill out the form below with your question, bug report, or feedback.
      </p>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Honeypot field — hidden from human visitors */}
        <div className="hidden" aria-hidden="true">
          <label htmlFor="contact-website">Website</label>
          <input
            id="contact-website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="contact-name" className="block text-[13px] font-semibold text-text-primary mb-1.5">
              Your name
            </label>
            <input
              id="contact-name"
              name="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              className="w-full px-3.5 py-2.5 rounded-xl bg-bg-input border border-border-base text-text-primary text-[14px] placeholder:text-text-tertiary focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="contact-email" className="block text-[13px] font-semibold text-text-primary mb-1.5">
              Email address
            </label>
            <input
              id="contact-email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-bg-input border border-border-base text-text-primary text-[14px] placeholder:text-text-tertiary focus:border-accent focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label htmlFor="contact-topic" className="block text-[13px] font-semibold text-text-primary mb-1.5">
            Topic
          </label>
          <select
            id="contact-topic"
            name="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-bg-input border border-border-base text-text-primary text-[14px] focus:border-accent focus:outline-none"
          >
            {TOPICS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="contact-message" className="block text-[13px] font-semibold text-text-primary mb-1.5">
            Message
          </label>
          <textarea
            id="contact-message"
            name="message"
            rows={5}
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe your question or issue. If reporting a bug, include the tool name and browser."
            className="w-full px-3.5 py-2.5 rounded-xl bg-bg-input border border-border-base text-text-primary text-[14px] placeholder:text-text-tertiary focus:border-accent focus:outline-none resize-y"
          />
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="p-3.5 rounded-xl bg-danger/[0.06] border border-danger/25 text-[13px] text-danger"
          >
            {errorMsg}
          </div>
        )}

        <div aria-live="polite">
          {status === "sent" && (
            <div className="p-3.5 rounded-xl bg-success/[0.06] border border-success/25 text-[13px] text-success">
              Thank you — your message has been submitted. We aim to reply within 1–2 business days.
            </div>
          )}
          {status === "mailto" && (
            <div className="p-3.5 rounded-xl bg-accent/[0.06] border border-accent/25 text-[13px] text-text-secondary">
              Your email app should now open with a pre-filled message. If it didn&apos;t open, you can email{" "}
              <a href="mailto:fileswow.contact@gmail.com" className="font-semibold text-accent underline">
                fileswow.contact@gmail.com
              </a>{" "}
              directly.
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={status === "submitting"}
          className="btn-primary px-6 py-2.5 text-[14px]"
        >
          {status === "submitting" ? "Sending..." : "Send message"}
        </button>
      </form>
    </section>
  );
}

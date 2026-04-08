"use client";

import { useState } from "react";

type Props = {
  placeholder?: string;
  buttonText?: string;
  className?: string;
  inputClassName?: string;
  buttonClassName?: string;
  buttonStyle?: React.CSSProperties;
  layout?: "row" | "stack";
};

export default function NewsletterSubscribe({
  placeholder = "Your e-mail address",
  buttonText = "Subscribe",
  className = "",
  inputClassName = "",
  buttonClassName = "",
  buttonStyle,
  layout = "row",
}: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!value) return;
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "newsletter", email: value }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Failed to subscribe");
      setStatus("success");
      setEmail("");
      setMessage("Thanks for subscribing!");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      {message && (
        <p
          className={`mb-2 text-sm ${
            status === "success" ? "text-white" : "text-white/90"
          }`}
        >
          {message}
        </p>
      )}
      <div
        className={
          layout === "row"
            ? "flex flex-col gap-3 sm:flex-row sm:justify-center"
            : "space-y-2"
        }
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={placeholder}
          required
          disabled={status === "loading"}
          className={inputClassName}
          suppressHydrationWarning
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className={buttonClassName}
          style={buttonStyle}
          suppressHydrationWarning
        >
          {status === "loading" ? "…" : buttonText}
        </button>
      </div>
    </form>
  );
}

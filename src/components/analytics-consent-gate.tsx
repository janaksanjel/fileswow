"use client";

// Consent-gated Google Analytics.
//
// GA only loads after the visitor accepts cookies in the consent banner
// (EU user consent policy / GDPR-friendly default). Declining keeps the site
// fully functional with analytics disabled; the floating "Cookie settings"
// button re-opens the choice, and this component reacts to the change.

import { useEffect, useState } from "react";
import { getStoredConsent } from "@/components/cookie-consent";

const GA_ID = "G-RGZ4FLC926";

export function AnalyticsConsentGate() {
  const [consent, setConsent] = useState<string | null>(null);

  // Track the stored consent choice, including changes made later via
  // the floating "Cookie settings" button (it removes the key to re-ask).
  useEffect(() => {
    const sync = () => setConsent(getStoredConsent());
    sync();

    // The consent banner writes localStorage directly; storage events only
    // fire cross-tab, so poll lightly to catch same-tab changes.
    const interval = window.setInterval(sync, 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (consent !== "accepted") return;
    if (document.getElementById("gtag-script")) return;

    const loader = document.createElement("script");
    loader.id = "gtag-script";
    loader.async = true;
    loader.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(loader);

    const inline = document.createElement("script");
    inline.id = "gtag-init";
    inline.innerHTML = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('consent','default',{ad_storage:'denied',analytics_storage:'granted'});gtag('config','${GA_ID}',{anonymize_ip:true});`;
    document.head.appendChild(inline);
  }, [consent]);

  return null;
}

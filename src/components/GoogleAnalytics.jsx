import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
const scriptId = "google-analytics-script";

function GoogleAnalytics() {
  const location = useLocation();
  const lastPagePath = useRef("");

  useEffect(() => {
    if (!measurementId) return;

    if (!window.gtag) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function gtag() {
        window.dataLayer.push(arguments);
      };

      window.gtag("js", new Date());
      window.gtag("config", measurementId, { send_page_view: false });
    }

    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
      document.head.appendChild(script);
    }
  }, []);

  useEffect(() => {
    if (!measurementId || !window.gtag) return;

    const pagePath = `${location.pathname}${location.search}`;
    if (lastPagePath.current === pagePath) return;
    lastPagePath.current = pagePath;

    window.gtag("event", "page_view", {
      page_path: pagePath,
      page_title: document.title,
      page_location: window.location.href,
    });
  }, [location]);

  return null;
}

export default GoogleAnalytics;

console.log("Script running at:", new Date().toISOString());
const PassiveTracker = (() => {
  const data = {
    userAgent: navigator.userAgent,
    screenResolution: `${screen.width}x${screen.height}`,
    os: navigator.platform || "Unknown", // Approx OS detection
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    plugins: Array.from(navigator.plugins).map(p => p.name).join(", "),
    browserFingerprinting: "", // We'll estimate uniqueness
    canvasFingerprint: "",
    connectionSpeed: navigator.connection ? navigator.connection.downlink + " Mbps" : "Unknown",
    proxyVPNDetection: "Not Detected", // Needs backend for accuracy
    mouseMovementPatterns: [],
    clickTimings: [],
    scrollDepth: "Not Tracked Yet",
    touchPressure: "Unavailable", // JS doesn't expose pressure on most devices
    pageLoadTimes: [],
    dwellTimes: [],
    inactivityPatterns: [],
    keystrokeDynamics: [],
    smallPointerMovements: [],
    ipAddressMasked: "x.x.x.x" // Must be detected backend-side for privacy
  };

  let lastClickTime = 0;
  let dwellStart = Date.now();
  let inactivityTimer;
  let lastMouseX = null;
  let lastMouseY = null;

  const init = () => {
    console.log("Initializing PassiveTracker...");

    // Mouse movement tracking
    window.addEventListener("mousemove", e => {
      const now = Date.now();
      const dx = lastMouseX !== null ? Math.abs(e.clientX - lastMouseX) : 0;
      const dy = lastMouseY !== null ? Math.abs(e.clientY - lastMouseY) : 0;
      data.mouseMovementPatterns.push({ x: e.clientX, y: e.clientY, t: now });
      if (dx < 3 && dy < 3) {
        data.smallPointerMovements.push({ dx, dy, t: now });
      }
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
      resetInactivity();
    });

    // Click timings
    window.addEventListener("click", () => {
      const now = Date.now();
      if (lastClickTime !== 0) {
        data.clickTimings.push((now - lastClickTime) / 1000); // seconds
      }
      lastClickTime = now;
      resetInactivity();
    });

    // Keystroke dynamics
    window.addEventListener("keydown", e => {
      const now = Date.now();
      data.keystrokeDynamics.push({ key: e.key, time: now });
      resetInactivity();
    });

    // Scroll depth (simplified)
    window.addEventListener("scroll", () => {
      const scrollPosition = window.scrollY + window.innerHeight;
      const pageHeight = document.documentElement.scrollHeight;
      const percentScrolled = (scrollPosition / pageHeight) * 100;
      data.scrollDepth = percentScrolled >= 100 ? "Full Scroll" : percentScrolled >= 50 ? "Partial Scroll" : "Minimal Scroll";
      resetInactivity();
    });

    // Canvas Fingerprint
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    ctx.textBaseline = "top";
    ctx.font = "14px 'Arial'";
    ctx.fillText("Passive CAPTCHA Canvas", 2, 2);
    data.canvasFingerprint = canvas.toDataURL();
    data.browserFingerprinting = btoa(data.userAgent + data.plugins + data.language).slice(0, 12); // pseudo fingerprint

    // Page Load Time
    setTimeout(() => {
      const timing = window.performance.timing;
      const loadTime = (timing.loadEventEnd - timing.navigationStart) / 1000;
      const domLoad = (timing.domContentLoadedEventEnd - timing.domLoading) / 1000;
      data.pageLoadTimes = [loadTime, domLoad];
    }, 3000);

    // Dwell time
    window.addEventListener("beforeunload", () => {
      const now = Date.now();
      data.dwellTimes.push(((now - dwellStart) / 1000).toFixed(2));
    });

    // Send data periodically (optional)
    setInterval(sendData, 10000); // Send data every 10 seconds
  };

  function resetInactivity() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      data.inactivityPatterns.push({ start: Date.now(), duration: "5s+" });
    }, 5000);
  }

  async function sendData() {
    console.log("Sending data to the backend...");
    try {
      const response = await fetch("http://127.0.0.1:8000/api/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "e5a74d0c291f4603f99de0cf607492a6"
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        console.log("Data sent successfully:", data);
      } else {
        console.error("Failed to send data:", await response.text());
      }
    } catch (err) {
      console.error("Error sending data:", err);
    }
  }

  return { init };
})();

window.addEventListener("load", () => {
  PassiveTracker.init();
});


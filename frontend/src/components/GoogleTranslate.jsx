import React, { useEffect, useRef } from 'react';

// Define the callback function globally ONCE.
if (typeof window.googleTranslateElementInit !== 'function') {
  window.googleTranslateElementInit = function() {
    console.log("Google Translate is ready, googleTranslateElementInit CALLED."); // DEBUG
    try {
      const element = document.getElementById('google_translate_element');
      // Check if google.translate object and TranslateElement constructor exist
      const googleTranslateReady = window.google && window.google.translate && typeof window.google.translate.TranslateElement === 'function';

      // Initialize only if the element exists AND hasn't been initialized AND google translate is ready
      if (element && !element.hasChildNodes() && googleTranslateReady) {
        console.log("✅ Initializing Google Translate widget inside callback."); // DEBUG
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            // Included Indian languages
            includedLanguages: 'en,hi,bn,te,mr,ta,ur,gu,kn,or,ml,pa,as,sa,sd', 
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false
          },
          'google_translate_element' // ID of the container div
        );
        console.log("✅ Google Translate Widget Initialized."); // DEBUG
      } else if (!element) {
         console.warn("❌ Skipping GT init - element 'google_translate_element' not found."); // DEBUG
      } else if (element.hasChildNodes()) {
         console.warn("🟡 Skipping GT init - element already has children (likely initialized)."); // DEBUG
      } else if (!googleTranslateReady) {
         console.warn("❌ Skipping GT init - 'google.translate.TranslateElement' not available yet."); // DEBUG
      }
    } catch (error) {
      console.error("💥 Error executing googleTranslateElementInit:", error);
    }
  };
} else {
    console.log("🟡 googleTranslateElementInit already defined globally."); // DEBUG
}

const GoogleTranslate = () => {
  const isMounted = useRef(false); // Track if component is mounted

  useEffect(() => {
    isMounted.current = true;
    console.log("GoogleTranslate component MOUNTED."); // DEBUG

    const scriptId = 'google-translate-script';
    const existingScript = document.getElementById(scriptId);

    // Function to attempt initialization if script is already loaded
    const tryInitWidget = () => {
      console.log("Attempting direct init (tryInitWidget)..."); // DEBUG
      if (isMounted.current && typeof window.googleTranslateElementInit === 'function') {
        window.googleTranslateElementInit();
      } else {
        console.log("Skipping direct init - component unmounted or init function missing."); // DEBUG
      }
    };

    if (!existingScript) {
        console.log("💉 Injecting Google Translate script..."); // DEBUG
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        script.async = true;
        script.onerror = () => console.error("❌ Failed to load Google Translate script.");
        document.body.appendChild(script);
    } else {
        console.log("🟡 Google Translate script already exists in DOM."); // DEBUG
        tryInitWidget();
    }

    return () => {
      isMounted.current = false;
      console.log("GoogleTranslate component UNMOUNTED."); // DEBUG
    };
  }, []); 

  return (
    <div id="google_translate_element_container" className="google-translate-container inline-block align-middle">
        <div id="google_translate_element"></div>
    </div>
  );
};

export default GoogleTranslate;
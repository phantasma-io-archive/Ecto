let tabid = -1;

chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
  if (msg.uid == "plsres") {
    console.log("[content script] received plsres " + JSON.stringify(msg));
    window.postMessage(msg, "*");
  }

  if (msg.uid == "init") {
    tabid = msg.tabid;

    if (document.getElementById("phantasmaLinkDetectedScript")) return;

    const elt = document.createElement("script");
    elt.setAttribute("id", "phantasmaLinkDetectedScript");
    elt.innerHTML = "window._PhantasmaLinkDetected = true;";
    (document.head || document.documentElement).appendChild(elt);

    const s = document.createElement("script");
    s.src = chrome.extension.getURL("js/inpage.js");
    (document.head || document.documentElement).appendChild(s);
    s.onload = function() {
      s.remove();
    };
  }
});

window.addEventListener("message", (msg) => {
  if (msg.source === window) {
    if (msg.data && msg.data.uid == "pls") {
      msg.data["tabid"] = tabid;
      chrome.runtime.sendMessage(msg.data);
    }
  }
});

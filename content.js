function setPage(pageNumber) {
  if (window.PDFViewerApplication) {
    window.PDFViewerApplication.page = pageNumber;
  }
}

// Listen for message from popup to navigate to a specific page
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'goToPage') {
    setPage(msg.pageNumber);
  }
});

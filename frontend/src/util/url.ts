/** see 404.html */

/** load redirect storage items */
export const redirectPath = window.sessionStorage.redirectPath || "";
export const redirectState = JSON.parse(
  window.sessionStorage.redirectState || "null",
);

/** remove redirect storage items right after consuming */
window.sessionStorage.removeItem("redirectPath");
window.sessionStorage.removeItem("redirectState");

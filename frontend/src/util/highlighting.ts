import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";

/** register languages */
hljs.registerLanguage("bash", bash);

/** syntax highlight bash to html */
export const highlightBash = (code: string) =>
  hljs.highlight(code, { language: "bash" }).value;

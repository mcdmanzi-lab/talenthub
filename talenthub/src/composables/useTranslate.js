/**
 * useTranslate — Vue composable for AI-powered page/component translation
 *
 * Usage in any component:
 *
 *   import { useTranslate } from '@/composables/useTranslate'
 *
 *   const { t, tObj, translatePage, isTranslating } = useTranslate()
 *
 *   // Translate a reactive ref string whenever language changes:
 *   const title = ref('Find your next job')
 *   const translatedTitle = await t(title.value)
 *
 *   // Translate a job post object:
 *   const translatedJob = await tObj(job, ['title', 'description', 'requirements'])
 *
 *   // Translate all text nodes in the current page's main content:
 *   await translatePage()
 */

import { ref, watch, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useTranslationStore } from "@/stores/translation";

export function useTranslate() {
  const store = useTranslationStore();
  const { currentLanguage, autoTranslateEnabled, isTranslating } = storeToRefs(store);

  /**
   * Translate a single string
   */
  async function t(text) {
    return store.translateText(text);
  }

  /**
   * Translate specific fields of an object
   * @param {Object} obj - the object to translate
   * @param {string[]} fields - list of string field names to translate
   */
  async function tObj(obj, fields) {
    return store.translateObject(obj, fields);
  }

  /**
   * Translate a list of objects (e.g. array of job posts)
   */
  async function tList(list, fields) {
    if (!list?.length || currentLanguage.value === "en") return list;
    return Promise.all(list.map((item) => store.translateObject(item, fields)));
  }

  /**
   * Translate all visible text nodes inside a DOM element
   * Uses the data-translate-skip attribute to skip elements
   */
  async function translateDOM(rootEl) {
    if (!rootEl || currentLanguage.value === "en") return;

    const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (parent.closest("[data-translate-skip]")) return NodeFilter.FILTER_REJECT;
        if (["SCRIPT", "STYLE", "NOSCRIPT"].includes(parent.tagName)) return NodeFilter.FILTER_REJECT;
        if (!node.textContent.trim()) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    const nodes = [];
    let node;
    while ((node = walker.nextNode())) nodes.push(node);

    if (!nodes.length) return;

    // Batch translate all text nodes
    const texts = nodes.map((n) => n.textContent.trim());
    isTranslating.value = true;
    try {
      const translated = await store.translateBatch(texts);
      nodes.forEach((n, i) => {
        if (translated[i] && translated[i] !== texts[i]) {
          n.textContent = translated[i];
        }
      });
    } finally {
      isTranslating.value = false;
    }
  }

  /**
   * Auto-watch: re-translate whenever language changes (if autoTranslate is on)
   * Pass a callback that returns the texts/objects to re-translate
   */
  function watchAndTranslate(translateFn) {
    watch([currentLanguage, autoTranslateEnabled], ([lang, auto]) => {
      if (auto && lang !== "en") {
        translateFn(lang);
      }
    });
  }

  return {
    t,
    tObj,
    tList,
    translateDOM,
    watchAndTranslate,
    currentLanguage,
    autoTranslateEnabled,
    isTranslating,
    isRTL: store.isRTL,
  };
}

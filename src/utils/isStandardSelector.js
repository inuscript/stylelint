/**
 * Check whether a selector is standard
 *
 * @param {string} selector
 * @return {boolean} If `true`, the selector is standard
 */
export default function (selector) {

  // SCSS or Less interpolation
  if (/#{.+?}|@{.+?}|\$\(.+?\)/.test(selector)) { return false }

  return true
}

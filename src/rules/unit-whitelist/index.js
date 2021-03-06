import { isString } from "lodash"
import valueParser from "postcss-value-parser"

import {
  declarationValueIndex,
  isStandardValue,
  report,
  ruleMessages,
  validateOptions,
} from "../../utils"

export const ruleName = "unit-whitelist"

export const messages = ruleMessages(ruleName, {
  rejected: (u) => `Unexpected unit "${u}"`,
})

export default function (whitelistInput) {
  const whitelist = [].concat(whitelistInput)
  return (root, result) => {
    const validOptions = validateOptions(result, ruleName, {
      actual: whitelist,
      possible: [isString],
    })
    if (!validOptions) { return }

    root.walkDecls(decl => {
      const { value } = decl

      valueParser(value).walk(function (node) {
        if (node.type === "function" && node.value.toLowerCase() === "url") { return false }
        if (node.type !== "word" || !isStandardValue(node.value)) { return }

        const parsedUnit = valueParser.unit(node.value)

        if (!parsedUnit) { return }

        const unit = parsedUnit.unit

        if (!unit || (unit && whitelist.indexOf(unit.toLowerCase()) !== -1)) { return }

        report({
          message: messages.rejected(unit),
          node: decl,
          index: declarationValueIndex(decl) + node.sourceIndex,
          result,
          ruleName,
        })
      })
    })
  }
}

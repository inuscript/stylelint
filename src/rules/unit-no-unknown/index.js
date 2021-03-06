import { isString } from "lodash"
import valueParser from "postcss-value-parser"
import {
  declarationValueIndex,
  isStandardValue,
  isKnownUnit,
  report,
  ruleMessages,
  validateOptions,
} from "../../utils"

export const ruleName = "unit-no-unknown"

export const messages = ruleMessages(ruleName, {
  rejected: (u) => `Unexpected unknown unit "${u}"`,
})

export default function (actual, options) {
  return (root, result) => {
    const validOptions = validateOptions(result, ruleName, { actual }, {
      actual: options,
      possible: {
        ignoreUnits: [isString],
      },
      optional: true,
    })

    if (!validOptions) { return }

    root.walkDecls(decl => {
      const { value } = decl

      valueParser(value).walk(function (node) {
        // Ignore wrong units within `url` function
        if (node.type === "function" && node.value.toLowerCase() === "url") { return false }
        if (node.type !== "word" || !isStandardValue(node.value)) { return }

        const parsedUnit = valueParser.unit(node.value)

        if (!parsedUnit) { return }

        const unit = parsedUnit.unit

        if (!unit || (unit && isKnownUnit(unit))) { return }

        const ignoreUnits = options && options.ignoreUnits || []

        if (ignoreUnits.indexOf(unit.toLowerCase()) !== -1) { return }

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

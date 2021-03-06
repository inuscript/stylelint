import { testRule } from "../../../testUtils"

import postcss from "postcss"
import postcssImport from "postcss-import"
import path from "path"
import test from "tape"
import rule, { ruleName, messages } from ".."

testRule(rule, {
  ruleName,
  config: [null],

  accept: [ {
    code: "a {} b {} c {} d, e, f {}",
    description: "no duplicates",
  }, {
    code: "a {}\n@media print { a {} }",
    description: "duplicate inside media query",
  }, {
    code: "@keyframes a { 0% {} } @keyframes b { 0% {} }",
    description: "duplicate inside keyframes",
  }, {
    code: "a { a { a {} } }",
    description: "duplicates inside nested rules",
  }, {
    code: ".foo .bar {}\n .foo {}\n.bar {}\n.bar .foo {}",
    description: "selectors using parts of other selectors",
  }, {
    code: "a {} a, b {}",
    description: "selectors reused in other non-equivalent selector lists",
  }, {
    code: "a b { top: 0; } a { b, c { color: pink; } }",
    description: "nested resolution",
  }, {
    code: "@mixin foo { &:hover {} } @mixin bar { &:hover {} }",
  }, {
    code: "ul, ol {} ul {}",
  }, {
    code: "[disabled].foo, [disabled] .foo {}",
  } ],

  reject: [ {
    code: "a, a {}",
    description: "duplicate within one rule's selector list",
    message: messages.rejected("a"),
    line: 1,
    column: 1,
  }, {
    code: "a {} b {} a {}",
    description: "duplicate simple selectors with another rule between",
    message: messages.rejected("a"),
    line: 1,
    column: 11,
  }, {
    code: "a, b {} b, a {}",
    description: "essentially duplicate selector lists",
    message: messages.rejected("b, a"),
    line: 1,
    column: 9,
  }, {
    code: ".foo   a, b\t> .bar,\n#baz {}\n  #baz,\n\n  .foo     a,b>.bar {}",
    description: "essentially duplicate selector lists with varied spacing",
    message: messages.rejected("#baz,\n\n  .foo     a,b>.bar"),
    line: 3,
    column: 3,
  }, {
    code: "a {}\n@media print { a, a {} }",
    description: "duplicate within a media query, in the same rule",
    message: messages.rejected("a"),
    line: 2,
    column: 16,
  }, {
    code: "a {}\n@media print { a {} a {} }",
    description: "duplicate within a media query, in different rules",
    message: messages.rejected("a"),
    line: 2,
    column: 21,
  }, {
    code: "a b {} a { b {} }",
    description: "duplicate caused by nesting",
    message: messages.rejected("a b"),
    line: 1,
    column: 12,
  } ],
})

test("with postcss-import and duplicates within a file", t => {
  t.plan(1)
  postcss([ postcssImport(), rule() ])
    .process("@import 'fixtures/using-foo-twice.css';", {
      from: path.join(__dirname, "test.css"),
    })
    .then(result => {
      const warnings = result.warnings()
      t.equal(warnings.length, 1, "a warning strikes")
    })
})

test("with postcss-import and duplicates across files", t => {
  t.plan(1)
  postcss([ postcssImport(), rule() ])
    .process("@import 'fixtures/using-foo.css'; @import 'fixtures/also-using-foo.css';", {
      from: path.join(__dirname, "test.css"),
    })
    .then(result => {
      const warnings = result.warnings()
      t.equal(warnings.length, 0, "no warnings")
    })
})

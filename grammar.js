module.exports = grammar({
  name: "edge",

  rules: {
    edge: ($) => repeat($._definition),
    // !definitions
    _definition: ($) =>
      choice(
        $.keyword,
        $.js_statement,
        $.attribute,
        $._inline_directive,
        $._nested_directive,
        $.comment,
        $.text,
      ),

    comment: () => token(seq("{{--", /[^-]*-+([^}-][^-]*-+)*/, "}}")),

    // !keywords
    keyword: ($) =>
      alias(
        /@(vite|livewireStyles|livewireScripts|livewireScriptConfig|parent|inertia|inertiaHead)/,
        $.directive,
      ),
    // ! JS Statements
    js_statement: ($) => choice($._escaped, $._unescaped),
    _escaped: ($) =>
      seq(
        alias("{{", $.bracket_start),
        optional($.javascript),
        alias("}}", $.bracket_end),
      ),
    _unescaped: ($) =>
      seq(
        alias("{{{", $.bracket_start),
        optional($.javascript),
        alias("}}}", $.bracket_end),
      ),

    _js: ($) => seq(alias("@js", $.directive), $._directive_parameter),
    // ! Conditional Attributes
    attribute: ($) =>
      seq(
        alias(
          /@(class|style|checked|selected|disabled|readonly|required)/,
          $.directive,
        ),
        $._directive_parameter,
      ),
    // !inline directives
    _inline_directive: ($) =>
      choice(
        seq(
          alias(
            choice(
              /@(include|let)/,
              /@(method|inject|each|vite|livewire|aware|section|servers|import)/,
            ),
            $.directive,
          ),
          $._directive_parameter,
        ),
        $._js,
      ),
    // !nested directives
    _nested_directive: ($) => choice($.conditional, $.loop),

    // !Conditionals
    conditional: ($) =>
      choice($._if, $._unless, $._flashMessage, $._error, $._inputError),
    // used in the conditional body rules
    conditional_keyword: ($) =>
      choice(
        alias("@else", $.directive),
        seq(
          alias(/@(elseif|else[a-zA-Z]+)/, $.directive),
          optional($._directive_parameter),
        ),
      ),

    _if: ($) =>
      seq(
        alias("@if", $.directive_start),
        $._if_statement_directive_body,
        alias(/@(endif|end)/, $.directive_end),
      ),
    _unless: ($) =>
      seq(
        alias("@unless", $.directive_start),
        $._if_statement_directive_body,
        alias(/@(endunless|end)/, $.directive_end),
      ),
    _flashMessage: ($) =>
      seq(
        alias("@flashMessage", $.directive_start),
        $._if_statement_directive_body,
        alias(/@(endflashMessage|end)/, $.directive_end),
      ),
    _error: ($) =>
      seq(
        alias("@error", $.directive_start),
        $._if_statement_directive_body,
        alias(/@(enderror|end)/, $.directive_end),
      ),
    _inputError: ($) =>
      seq(
        alias("@inputError", $.directive_start),
        $._if_statement_directive_body,
        alias(/@(endinputError|end)/, $.directive_end),
      ),

    // !Loops
    loop: ($) => choice($._each),
    _each: ($) =>
      seq(
        alias("@each", $.directive_start),
        $._directive_body_with_parameter,
        alias(/@(endeach|end)/, $.directive_end),
      ),

    /* ------------------------------------
        /  Do NOT change below this line   /
        /  without running tests           /
        /  This is the engine              /
        /-----------------------------------*/

    // !normal directive body
    _directive_body: ($) => repeat1($._definition),
    _directive_body_with_parameter: ($) =>
      seq($._directive_parameter, optional($._directive_body)),
    _directive_body_with_optional_parameter: ($) =>
      seq(optional($._directive_parameter), optional($._directive_body)),
    // !if statements body
    _if_statement_directive_body: ($) =>
      seq(
        $._directive_parameter,
        optional(repeat(choice($._definition, $.conditional_keyword))),
      ),
    _if_statement_directive_body_with_optional_parameter: ($) =>
      seq(
        optional($._directive_parameter),
        repeat1(choice($._definition, $.conditional_keyword)),
      ),
    _if_statement_directive_body_with_no_parameter: ($) =>
      repeat1(choice($._definition, $.conditional_keyword)),

    // !parenthesis balancing
    parameter: ($) => choice(/[^()]+/, $._text_with_parenthesis),
    _text_with_parenthesis: ($) => seq(/[^()]+/, "(", repeat($.parameter), ")"),
    // !directive parameter
    _directive_parameter: ($) =>
      seq(
        alias(token(prec(1, "(")), $.bracket_start),
        optional(repeat($.parameter)),
        alias(token(prec(1, ")")), $.bracket_end),
      ),
    // !section parameters
    _section_parameter: ($) =>
      seq(optional(/[\"\']/), $.text, optional(/[\"\']/)),

    // !text definitions
    javascript: ($) => prec.right(repeat1($._text)),
    text: ($) => prec.right(repeat1($._text)),
    // hidden to reduce AST noise in javascript #39
    // It is selectively unhidden for other areas
    _text: ($) =>
      choice(
        token(prec(-1, /@[a-zA-Z\d]*[^\(-]/)), // custom directive conflict resolution
        token(prec(-2, /[{}!@()?,-]/)), // orphan tags
        token(
          prec(
            -1,
            /[^\s(){!}@-]([^(){!}@,?]*[^{!}()@?,-])?/, // general text
          ),
        ),
      ),
  },
});

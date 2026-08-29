/* @ds-bundle: {"format":4,"namespace":"AcePharmDesignSystem_e6252f","components":[{"name":"Card","sourcePath":"components/content/Card.jsx"},{"name":"Panel","sourcePath":"components/content/Card.jsx"},{"name":"Button","sourcePath":"components/feedback/Button.jsx"},{"name":"OptionButton","sourcePath":"components/question/OptionButton.jsx"}],"sourceHashes":{"components/content/Card.jsx":"438b724d9c78","components/feedback/Button.jsx":"22bae3c59c36","components/question/OptionButton.jsx":"78c45a53053f"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.AcePharmDesignSystem_e6252f = window.AcePharmDesignSystem_e6252f || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/content/Card.jsx
try { (() => {
/**
 * Card Component
 * Generic content container with border, shadow, and padding
 */

function Card({
  children,
  className = ''
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: `bg-surface border border-border rounded-[15px] p-6 ${className}`
  }, children);
}

/**
 * Panel Component
 * Larger page-level container with more spacing
 */
function Panel({
  children,
  className = ''
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: `bg-surface border border-border rounded-[22px] p-8 ${className}`
  }, children);
}
Object.assign(__ds_scope, { Card, Panel });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/Card.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Button Component
 * Primary action element: primary, secondary, ghost, danger variants
 * Sizes: default (44px), sm (38px), lg (52px)
 */

function Button({
  variant = 'primary',
  size = 'default',
  disabled = false,
  children,
  ...props
}) {
  const sizeClass = {
    default: 'min-h-[44px] px-5 py-[11px] text-base',
    sm: 'min-h-[38px] px-3.5 py-2 text-sm',
    lg: 'min-h-[52px] px-6.5 py-3.5 text-base'
  }[size];
  const variantClass = {
    primary: 'bg-indigo text-white hover:bg-indigo-deep',
    secondary: 'bg-surface text-ink border border-border hover:border-slate',
    ghost: 'bg-transparent text-slate hover:text-ink px-3 py-2.5',
    danger: 'bg-danger text-white hover:bg-red-700'
  }[variant];
  return /*#__PURE__*/React.createElement("button", _extends({
    disabled: disabled,
    className: `inline-flex items-center justify-center gap-2 rounded-[11px] border-0 font-medium transition-all duration-150 whitespace-nowrap ${sizeClass} ${variantClass} ${disabled ? 'opacity-45 cursor-not-allowed' : 'cursor-pointer'}`
  }, props), children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Button.jsx", error: String((e && e.message) || e) }); }

// components/question/OptionButton.jsx
try { (() => {
/**
 * Question Option Component
 * A–E choice button with border-based selection, feedback states
 */

function OptionButton({
  label,
  content,
  selected = false,
  feedback = null,
  // 'correct' | 'wrong'
  disabled = false,
  onClick
}) {
  let borderClass = 'border-border';
  let bgClass = 'bg-surface';
  let markBgClass = 'bg-canvas';
  let markTextClass = 'text-ink';
  if (selected && !feedback) {
    borderClass = 'border-indigo';
    bgClass = 'bg-indigo-wash shadow-[inset_0_0_0_1px] shadow-indigo';
    markBgClass = 'bg-indigo';
    markTextClass = 'text-white';
  }
  if (feedback === 'correct') {
    borderClass = 'border-success';
    bgClass = 'bg-success-wash';
    markBgClass = 'bg-success';
    markTextClass = 'text-white';
  }
  if (feedback === 'wrong') {
    borderClass = 'border-danger';
    bgClass = 'bg-danger-wash';
    markBgClass = 'bg-danger';
    markTextClass = 'text-white';
  }
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    disabled: disabled,
    className: `flex gap-3 w-full text-left p-[15px_17px] border border-solid rounded-[13px] ${bgClass} ${borderClass} cursor-pointer transition-all hover:border-indigo disabled:cursor-default items-start min-h-14`
  }, /*#__PURE__*/React.createElement("div", {
    className: `w-7 h-7 rounded-2 border border-border ${markBgClass} ${markTextClass} text-center text-xs font-mono font-semibold flex items-center justify-center flex-shrink-0`
  }, label), /*#__PURE__*/React.createElement("div", {
    className: "flex-1 text-sm"
  }, content));
}
Object.assign(__ds_scope, { OptionButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/question/OptionButton.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Panel = __ds_scope.Panel;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.OptionButton = __ds_scope.OptionButton;

})();

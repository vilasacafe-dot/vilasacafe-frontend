import { Link } from 'react-router-dom';
import Spinner from '../Spinner.jsx';

/**
 * Customer-facing button with a consistent set of variants and sizes.
 * Renders as <button>, <Link> (when `to` is passed) or <a> (when `href`).
 */
const VARIANTS = {
  primary: 'c-btn-primary',
  accent: 'c-btn-accent',
  outline: 'c-btn-outline',
  ghost: 'c-btn-ghost',
};

const SIZES = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-6 text-base',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  to,
  href,
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon = null,
  rightIcon = null,
  className = '',
  children,
  ...rest
}) {
  const classes = [
    VARIANTS[variant] || VARIANTS.primary,
    SIZES[size] || SIZES.md,
    fullWidth ? 'w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      {loading ? (
        <Spinner className="h-4 w-4" />
      ) : (
        leftIcon && <span className="-ml-0.5 inline-flex">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!loading && rightIcon && <span className="-mr-0.5 inline-flex">{rightIcon}</span>}
    </>
  );

  if (to && !disabled && !loading) {
    return (
      <Link to={to} className={classes} {...rest}>
        {content}
      </Link>
    );
  }
  if (href && !disabled && !loading) {
    return (
      <a href={href} className={classes} {...rest}>
        {content}
      </a>
    );
  }

  return (
    <button className={classes} disabled={disabled || loading} {...rest}>
      {content}
    </button>
  );
}

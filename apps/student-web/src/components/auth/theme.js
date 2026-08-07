/**
 * Shared style tokens for the navy/wave auth screens (login, signup).
 */

export const colors = {
  navy: '#03045E',
  navyDeep: '#020341',
  wave: 'rgba(148, 150, 214, 0.65)',
  card: '#E7E9F2',
  codeBoxBg: '#DBDFEC',
  codeText: '#12142E',
  inputBorder: '#D7DAEE',
  inputBg: '#FFFFFF',
  inputText: '#1A2332',
  placeholder: '#98A0B8',
  label: '#1B1B4D',
  cyan: '#03045E',
  cyanLight: '#48CAE4',
  cyanDeep: '#0096C8',
  linkOnDark: 'rgba(255, 255, 255, 0.85)',
  mutedOnDark: 'rgba(255, 255, 255, 0.62)',
  errorBg: '#fdecea',
  errorText: '#8a1f1f',
};

export const heroLabelStyle = {
  margin: 0,
  color: colors.mutedOnDark,
  fontSize: 14,
  fontFamily: 'system-ui, sans-serif',
};

export const heroTitleStyle = {
  margin: '2px 0 12px',
  color: '#fff',
  fontSize: 30,
  fontWeight: 800,
  letterSpacing: '0.02em',
  textTransform: 'uppercase',
  fontFamily: 'system-ui, sans-serif',
};

export const heroSubtextStyle = {
  margin: 0,
  color: colors.mutedOnDark,
  fontSize: 14,
  lineHeight: 1.5,
  fontFamily: 'system-ui, sans-serif',
};

export const cardStyle = {
  background: colors.card,
  borderRadius: 20,
  padding: '28px 24px',
  boxShadow: '0 20px 50px rgba(8, 8, 32, 0.35)',
};

export const labelStyle = {
  display: 'block',
  marginBottom: 6,
  fontSize: 13,
  fontWeight: 700,
  color: colors.label,
  fontFamily: 'system-ui, sans-serif',
};

export const fieldStyle = {
  width: '100%',
  padding: '13px 16px',
  border: `1px solid ${colors.inputBorder}`,
  borderRadius: 12,
  fontSize: 15,
  fontFamily: 'inherit',
  background: colors.inputBg,
  color: colors.inputText,
  boxSizing: 'border-box',
};

// Outlined field rendered directly on the bg.jpg backdrop (no white card).
// Background/border/placeholder color live in the `.auth-field` CSS class
// (globals.css) since inline styles can't target ::placeholder.
export const labelOnDarkStyle = {
  display: 'block',
  marginBottom: 8,
  fontSize: 14,
  fontWeight: 700,
  color: '#ffffff',
  fontFamily: 'system-ui, sans-serif',
};

export const fieldOnDarkStyle = {
  display: 'block',
  borderColor: "white",
  width: '100%',
  margin: '0 auto',
  padding: '14px 16px',
  borderRadius: 10,
  fontSize: 15,
  fontFamily: 'inherit',
  boxSizing: 'border-box',
};

export function buttonStyle(pending) {
  return {
    width: '50%',
    marginTop: 4,
    margin:"auto",
    padding: '15px 16px',
    border: 'none',
    borderRadius: 10,
    background: pending ? 'rgba(72, 202, 228, 0.55)' : colors.cyanLight,
    color: "#03045E",
    fontSize: 16,
    fontWeight: 700,
    cursor: pending ? 'wait' : 'pointer',
    fontFamily: 'system-ui, sans-serif',
    boxShadow: '0 10px 24px rgba(0, 180, 215, 0.35)',
  };
}

// Inline field error — plain red text under the input, no card/box.
export const inlineErrorStyle = {
  margin: '6px 0 0',
  fontSize: 12,
  color: '#c62828',
  fontFamily: 'system-ui, sans-serif',
};

// Same, tuned for the dark navy screens (login/signup) where #c62828 loses contrast.
export const inlineErrorOnDarkStyle = {
  margin: '6px 0 0',
  fontSize: 12,
  color: '#ff9d9d',
  fontFamily: 'system-ui, sans-serif',
};

export const linkOnDarkStyle = {
  color: '#fff',
  fontWeight: 600,
  textDecoration: 'underline',
  textUnderlineOffset: 3,
};

export const footerTextOnDarkStyle = {
  margin: '20px 0 0',
  textAlign: 'center',
  fontSize: 14,
  color: colors.mutedOnDark,
  fontFamily: 'system-ui, sans-serif',
};

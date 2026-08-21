export const colors = {
  bg: "#F3F5F4",
  surface: "#FFFFFF",
  surfaceAlt: "#EBEEED",
  border: "#DBE2E0",
  ink: "#1D2422",
  muted: "#5B6664",
  teal: "#1A6864",
  tealSoft: "#E3EEED",
  gold: "#9C6414",
  goldSoft: "#F3E6D2",
  good: "#2F7A4F",
  bad: "#B0432C",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 100,
};

export const shadow = {
  card: {
    shadowColor: "#14201E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
};

export const fonts = {
  display: "ZillaSlab_700Bold",
  displaySemiBold: "ZillaSlab_600SemiBold",
  body: "PublicSans_400Regular",
  bodyMedium: "PublicSans_500Medium",
  bodySemiBold: "PublicSans_600SemiBold",
  bodyBold: "PublicSans_700Bold",
};

export const typography = {
  h1: { fontFamily: fonts.display, fontSize: 30, color: colors.ink },
  h2: { fontFamily: fonts.display, fontSize: 22, color: colors.ink },
  h3: { fontFamily: fonts.displaySemiBold, fontSize: 17, color: colors.ink },
  body: { fontFamily: fonts.body, fontSize: 15, color: colors.ink },
  bodyMuted: { fontFamily: fonts.body, fontSize: 14, color: colors.muted },
  label: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.muted, textTransform: "uppercase", letterSpacing: 0.5 },
  button: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: "#fff" },
};

const theme = { colors, spacing, radius, shadow, fonts, typography };
export default theme;

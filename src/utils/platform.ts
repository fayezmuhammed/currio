/**
 * Windows doesn't render flag emoji (🇮🇳 shows as "IN"), so Currio falls back
 * to a symbol badge there.
 */
export function supportsFlagEmoji(): boolean {
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
  const platform = nav.userAgentData?.platform ?? nav.platform;
  return !/win/i.test(platform);
}

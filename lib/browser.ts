export function isFirefoxLikeUserAgent(userAgent: string | null | undefined) {
  return Boolean(userAgent && /Firefox|Zen/i.test(userAgent))
}

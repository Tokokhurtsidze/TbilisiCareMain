// Real TbilisiCare wordmark (public/logo.ico, also used as the site favicon).
// It's a wide logotype (~2.6:1), not a square icon mark — size sets the
// height and width follows naturally. Callers that assumed a square/circular
// icon slot (badges, avatars) have been adjusted at the call site.
export function TbilisiLogo({
  size = 32,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.ico"
      alt="TbilisiCare"
      style={{ height: size, width: "auto", display: "block" }}
      className={className}
    />
  );
}

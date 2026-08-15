// TbilisiCare emblem (public/Logo.png) — a square 1:1 circular seal mark,
// not a wordmark. size sets both height and width.
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
      src="/Logo.png"
      alt="TbilisiCare"
      style={{ height: size, width: size, display: "block" }}
      className={className}
    />
  );
}

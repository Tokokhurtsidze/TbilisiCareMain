"use client";

// Maps Tailwind spacing unit → class string (statically defined for Tailwind purge)
const SIZE_CLASS: Record<number, string> = {
  6:  "h-6 w-6",
  8:  "h-8 w-8",
  9:  "h-9 w-9",
  10: "h-10 w-10",
  12: "h-12 w-12",
  14: "h-14 w-14",
  20: "h-20 w-20",
};

type Props = {
  src?: string | null;
  size: 6 | 8 | 9 | 10 | 12 | 14 | 20;
  className?: string;
};

export function UserAvatar({ src, size, className = "" }: Props) {
  const sc = SIZE_CLASS[size];

  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt=""
        className={`${sc} rounded-full object-cover shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sc} rounded-full shrink-0 overflow-hidden flex items-end justify-center bg-[#bcc0c4] ${className}`}
      aria-hidden
    >
      <svg viewBox="0 0 36 36" fill="white" className="w-[72%]">
        <circle cx="18" cy="12" r="7" />
        <path d="M18 21 C8 21 3 27 3 36 L33 36 C33 27 28 21 18 21Z" />
      </svg>
    </div>
  );
}

export function AecLogo({ size = 34 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect width="64" height="64" rx="14" fill="#0B1F3A" />
      <rect x="4" y="4" width="56" height="56" rx="11" stroke="#2563EB" strokeOpacity="0.45" strokeWidth="1.5" />
      <path
        d="M16 21C16 19.3431 17.3431 18 19 18H28C30.2091 18 32 19.7909 32 22V45C29.8 43.4 27.2 42.6 24.4 42.6H19C17.3431 42.6 16 41.2569 16 39.6V21Z"
        fill="#FFFFFF"
      />
      <path
        d="M48 21C48 19.3431 46.6569 18 45 18H36C33.7909 18 32 19.7909 32 22V45C34.2 43.4 36.8 42.6 39.6 42.6H45C46.6569 42.6 48 41.2569 48 39.6V21Z"
        fill="#DBEAFE"
      />
      <path d="M32 10L44 15.5L32 21L20 15.5L32 10Z" fill="#3B82F6" />
      <path d="M32 21V45" stroke="#0B1F3A" strokeWidth="1.8" strokeLinecap="round" />
      <rect x="20" y="48" width="24" height="5" rx="2.5" fill="#2563EB" />
    </svg>
  );
}

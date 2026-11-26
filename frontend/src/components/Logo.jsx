// PortTrack logo: anchor + container mark as inline SVG (no emoji)
export default function Logo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="44" height="44" rx="11" fill="#0e9a8b" />
      <path
        d="M24 10v18m0 0c-6.5 0-11-4.6-11.6-10.4M24 28c6.5 0 11-4.6 11.6-10.4M13 15l-1.4 5.6L17 19M35 15l1.4 5.6L31 19"
        stroke="#fff"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="24" cy="10" r="2.6" fill="#fff" />
      <path d="M15 36h18" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  )
}

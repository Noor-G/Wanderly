export default function LocationPinIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M12 21C12 21 19 16 19 10C19 6.13401 15.866 3 12 3C8.13401 3 5 6.13401 5 10C5 16 12 21 12 21Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="10"
        r="3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

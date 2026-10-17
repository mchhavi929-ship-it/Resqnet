import type { ReactNode } from "react"
export type IconName = "arrow" | "check" | "clock" | "alert" | "pin" | "vehicle" | "route" | "play" | "plus" | "fire" | "shield" | "boat" | "helicopter" | "earthquake" | "building" | "storm" | "hazard" | "edit" | "trash"
export default function Icon({
  name,
  size = 18,
}: {
  name: IconName
  size?: number
}) {
  const paths: Record<IconName, ReactNode> = {
    arrow: (
      <>
        <path d="M4 12h15M13 6l6 6-6 6" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    alert: (
      <>
        <path d="m12 3 10 17H2L12 3Z" />
        <path d="M12 9v4m0 3v.1" />
      </>
    ),
    pin: (
      <>
        <path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" />
        <circle cx="12" cy="10" r="2" />
      </>
    ),
    vehicle: (
      <>
        <path d="M3 7h11v11H3zM14 11h4l3 4v3h-7M7 4v6m-3-3h6" />
        <circle cx="7" cy="18" r="2" />
        <circle cx="18" cy="18" r="2" />
      </>
    ),
    route: (
      <>
        <circle cx="5" cy="5" r="2" />
        <circle cx="19" cy="19" r="2" />
        <path d="M7 5h8a4 4 0 0 1 0 8H9a4 4 0 0 0 0 8h6" />
      </>
    ),
    play: <path d="m9 5 10 7-10 7V5Z" />,
    fire: (
      <path d="M12 3c1 5 6 6 6 11a6 6 0 0 1-12 0c0-3 2-5 3-6 0 3 2 4 2 4s3-4 1-9Z" />
    ),
    shield: <path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" />,
    boat: (
      <>
        <path d="m3 14 9-3 9 3-3 6H6l-3-6ZM7 12V6h10v6M12 6V3M2 22l3-1 4 1 3-1 4 1 3-1 3 1" />
      </>
    ),
    helicopter: (
      <>
        <path d="M5 4h14M12 4v5M6 9h9l5 5v3H9l-3-4H2V9h4ZM10 17v4m7-4v4M7 21h14M15 9v5h5" />
      </>
    ),
    earthquake: (
      <>
        <path d="M3 20h6l-2-5 6-4-2-7 5 6-2 5 4 5h3M4 9l3-4m10-1 3 4" />
      </>
    ),
    building: (
      <>
        <path d="M4 21V4h12v6h4v11M8 8h4M8 12h2m-2 4h4M2 21h20m-8-11-3 5 4 2-2 4" />
      </>
    ),
    storm: (
      <>
        <path d="M6 15a5 5 0 1 1 1-10 6 6 0 0 1 11 3 4 4 0 0 1 0 8M13 12l-4 6h5l-3 5" />
      </>
    ),
    hazard: (
      <>
        <path d="m12 3 10 18H2L12 3Z" />
        <path d="M12 9v5m0 3v.1" />
      </>
    ),
    edit: (
      <>
        <path d="m16 3 5 5L8 21H3v-5L16 3Zm-3 3 5 5" />
      </>
    ),
    trash: (
      <>
        <path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}

import Icon from "./Icon"
export default function Badge({
  status,
}: {
  status: "Dispatched" | "No vehicle" | "Queued" | "Available"
}) {
  return (
    <span className={`badge badge--${status.toLowerCase().replace(" ", "-")}`}>
      <Icon
        name={
          status === "Dispatched" || status === "Available"
            ? "check"
            : status === "Queued"
              ? "clock"
              : "alert"
        }
        size={12}
      />
      {status}
    </span>
  )
}

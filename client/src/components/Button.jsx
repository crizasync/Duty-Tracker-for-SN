export default function Button({
  children,
  type = "button",
  onClick,
  className = "",
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`w-full rounded-xl bg-blue-600 py-3 text-white font-medium hover:bg-blue-700 transition ${className}`}
    >
      {children}
    </button>
  );
}

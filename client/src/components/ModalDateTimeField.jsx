export default function ModalDateTimeField({ label, ...props }) {
  return (
    <label className="modal-native-field">
      <span>{label}</span>
      <input {...props} aria-label={label} />
    </label>
  );
}

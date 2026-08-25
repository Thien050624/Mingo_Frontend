export default function Avatar({ src, alt, className = "", ...rest }) {
  return (
    <img
      src={src}
      alt={alt}
      className={`rounded-full object-cover ${className}`}
      {...rest}
    />
  );
}

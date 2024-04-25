export default function useConfig() {
  const mapApiKey =
    import.meta.env.VITE_GOOGLE_MAP_API_KEY ||
    "AIzaSyDI5QiGnLxKyiUK-knZ2eQVF4j7vFk2M-k";

  return {
    mapApiKey,
  };
}

export default function useDisplayImage() {
  const apiUrl = import.meta.env.VITE_BASE_API_URL;

  const formatImageUrl = (url: string) => {
    if (!url) {
      return null;
    }

    return apiUrl + url;
  };

  return {
    formatImageUrl,
  };
}

export const getIdFromUrl = (url: string): string | null => {
    // Trim any whitespace before matching
    const trimmedUrl = url.trim();
  
    // Check for Google Meet URL format
    const meetRegex = /^(?:https?:\/\/)?meet\.google\.com\/([a-zA-Z0-9-]{3,}(?:-[a-zA-Z0-9-]{4,})?(?:-[a-zA-Z0-9-]{3,})?)/; // /^(?:http(s)?:\/\/)?meet\.google\.com\/([a-zA-Z0-9-]+)(?:\?.*)?$/;
    const meetMatch = trimmedUrl.match(meetRegex);
    if (meetMatch) {
      return meetMatch[1]; // Extract meeting ID (group 2)
    }
  
    // Check for YouTube video URL format
    // const youtubeRegex = /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&\s]+)/;
    // const youtubeMatch = trimmedUrl.match(youtubeRegex);
    // console.log({youtubeMatch});
    // if (youtubeMatch) {
    //   return youtubeMatch[1]; // Extract video ID (group 1)
    // }
  
    // No match for either format
    return null;
  };
  
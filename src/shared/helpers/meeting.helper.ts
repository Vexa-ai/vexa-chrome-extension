export const getIdFromUrl = (url: string): string | null => {
    const regex = /^(?:http(s)?:\/\/)?meet\.google\.com\/([a-zA-Z0-9-]+)(?:\?.*)?$/;

    const match = url.match(regex);
    if (match) {
        const meetingId = match[2];
        return meetingId;
    } else {
        return '';
    }
}
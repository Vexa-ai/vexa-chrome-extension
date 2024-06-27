export const isRecordablePlatform = () => {
    const recordableplatformRegex = /^(https:\/\/)?(www\.)?(youtube\.com\/watch\?v=([^&\s]+))|^(?:https?:\/\/)?meet\.google\.com\/([a-zA-Z0-9-]{3,}(?:-[a-zA-Z0-9-]{4,})?(?:-[a-zA-Z0-9-]{3,})?)/i; // (https:\/\/)?(meet\.google\.com\/([a-z]{3}-[a-z]{4}-[a-z]{3}))$/i;
    return recordableplatformRegex.test(location.href);

}

export const downloadFileInContent = (name, blob) => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = name;
    link.click();
    URL.revokeObjectURL(link.href);
}

export const getPlatform = (): Platform => {

    const meetRegex = /^(?:https?:\/\/)?meet\.google\.com\/([a-zA-Z0-9-]{3,}(?:-[a-zA-Z0-9-]{4,})?(?:-[a-zA-Z0-9-]{3,})?)/; // /^(?:http(s)?:\/\/)?meet\.google\.com\/([a-zA-Z0-9-]+)(?:\?.*)?$/;
    const meetMatch = location.href.match(meetRegex);
    const youtubeRegex = /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&\s]+)/;
    const youtubeMatch = location.href.match(youtubeRegex);
    if (meetMatch) {
        return Platform.MEET;
    }
    // console.log({youtubeMatch});
    // if (youtubeMatch) {
    //     return Platform.YOUTUBE;
    // }

    return Platform.UNSUPPORTED;
};

export enum Platform {
    MEET = 'meet',
    YOUTUBE = 'youtube',
    UNSUPPORTED = 'unsupported'
}

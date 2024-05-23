export const isRecordablePlatform = () => {
    const recordableplatformRegex = /^(https:\/\/)?(www\.)?(youtube\.com\/watch\?v=([a-zA-Z0-9]+))|(https:\/\/)?(meet\.google\.com\/([a-z]{3}-[a-z]{4}-[a-z]{3}))$/i;
    return recordableplatformRegex.test(location.href);

}

export const getPlatform = (): Platform => {

    const meetRegex = /^(?:http(s)?:\/\/)?meet\.google\.com\/([a-zA-Z0-9-]+)(?:\?.*)?$/;
    const meetMatch = location.href.match(meetRegex);
    const youtubeRegex = /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9]+)$/;
    const youtubeMatch = location.href.match(youtubeRegex);

    if (meetMatch) {
        return Platform.MEET;
    }

    if (youtubeMatch) {
        return Platform.YOUTUBE;
    }

    return Platform.UNSUPPORTED;
};

export enum Platform {
    MEET = 'meet',
    YOUTUBE = 'youtube',
    UNSUPPORTED = 'unsupported'
}

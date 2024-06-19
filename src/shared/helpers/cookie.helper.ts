export function getCookie(name: string) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        return parts.pop().split(';').shift();
    } else {
        [];
    }
}

export function getCookieValue(cookieName) {
    const name = `${cookieName}=`;
    const decodedCookies = decodeURIComponent(document.cookie);
    const cookieArray = decodedCookies.split(";");
  
    for (let i = 0; i < cookieArray.length; i++) {
      let cookie = cookieArray[i].trim();
      if (cookie.indexOf(name) === 0) {
        return cookie.substring(name.length, cookie.length);
      }
    }
    return null;
  }

export async function getBackgroundCookie(name: string, url = 'https://joby.ai') {
    return (await chrome.cookies.get({ name, url }))?.value;
}


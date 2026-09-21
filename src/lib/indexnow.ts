/**
 * IndexNow — instant indexing protocol for Bing, Yandex, Seznam, Naver.
 *
 * The key is a random string proving site ownership: the key file must be
 * reachable at /{INDEXNOW_KEY}.txt (see public/{INDEXNOW_KEY}.txt).
 * Regenerate the key (any 32-hex-char string) by also renaming that file.
 */
export const INDEXNOW_KEY = "b9d4e2f8a1c7d6e5f4a3b2c1d0e9f8a7";

export const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

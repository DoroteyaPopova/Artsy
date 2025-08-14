// parse-config.ts
import * as Parse from 'parse';

export function setParseServerURL(url: string) {
    (Parse as any).serverURL = url;
}

export { Parse };

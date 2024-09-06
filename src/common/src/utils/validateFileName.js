import { VALID_FILENAME_REGEX, WINDOWS_RESERVED_NAME_REGEX } from "../../../common/src/regex";

export function isValidFileName(fileName) {
    return VALID_FILENAME_REGEX.test(fileName) && !WINDOWS_RESERVED_NAME_REGEX.test(fileName);
}

export const capitalize = <T extends string>(str: T): Capitalize<T> => {
    return String(str).charAt(0).toUpperCase() + String(str).slice(1) as Capitalize<T>;
}

export const extractName = (email: string) => {
    return email.includes(".")
        ? capitalize(email.split(".")[0])
        : capitalize(email.split("@")[0]);
}
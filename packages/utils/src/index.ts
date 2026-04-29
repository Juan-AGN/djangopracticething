export const default_avatar = "/img/avatars/default.png";

export async function getimage(user: string, address: string, port: string) : Promise<string> {
    try {
        const png = await fetch(`${address}:${port}/api/img/${user}.png`);

        if (png.ok)
            return (`${user}.png`);

        const jpeg = await fetch(`${address}:${port}/api/img/${user}.jpeg`);

        if (jpeg.ok)
            return (`${user}.jpeg`);

        return (`/api/img/default/blank-pfp.png`);
    } catch (error) {
        return (`/api/img/default/blank-pfp.png`);
    }
}
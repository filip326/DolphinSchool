import { dolphin } from '@/server/Dolphin/Dolphin';

export default defineEventHandler((event) => {
    return {
        res: "Success",
        dolphin: dolphin
    }
});

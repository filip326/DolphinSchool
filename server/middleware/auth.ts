export default defineEventHandler((event) => {
    event.context.auth = {
        user: {
            id: 1,
            nickname: 'heeecker',
        }
    }
});

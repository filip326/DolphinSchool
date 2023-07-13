# Middleware

Middlewares between Client and Request-Handler. Should look like:

```ts
export default defineEventHandler((event) => {
  event.context.auth = { user: 123 }
})
```

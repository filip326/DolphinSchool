# API

Here are all files returning JSON. File should look  like:

```ts
export default defineEventHandler((event) => {
  return {
    hello: 'world'
  }
})
```

**/*.get.ts => Get Request handler
**server/*.post.ts  => Postb Request handler

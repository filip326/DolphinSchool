# API

Here are all files returning JSON. File should look like:

```ts
import Dolphin from "@/server/Dolphin/Dolphin";

export default eventHandler(async (event) => {
  const dolphin = Dolphin.instance ?? (await Dolphin.init());
  // find the session by the cookie "token"
  const token = parseCookies(event).token;
});
```

**/\*.get.ts => Get Request handler
**server/\*.post.ts => Postb Request handler

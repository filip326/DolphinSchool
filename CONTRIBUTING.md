# CONTRIBUTING

## Workflow

1. Fork the repo/ create a new branch
2. Create an issue & link your branch
3. Start devoloping
4. Create tests and test
5. Create a pull request

## Conventions

### ESLint

Never irgnore an ESLint-Error or Warning.
ESLint's rules were writen for cleaner and more readable code. Your Pullrequest won't be merged, if the linter fails.

### Filenames and Directories

Every directory and file, interpreted by nuxt as a page or api-route is named in **kebab-case**.
Files and directories that are not beeing interpreted by nuxt as a page or api-route follows **PascalCase**.
API-Routes filename has to be followed by the http-method, example: *login.post.ts*.

## Templates

### API

#### Default

```ts
export default defineEventHandler(async (event) => {
    // ...
});
```

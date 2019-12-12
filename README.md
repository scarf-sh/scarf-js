# scarf-js

By depending on this package, your npm library's will get automatic analytics
collection via [scarf](https://scarf.sh) any time your package is installed.

### Installing

You'll first need to create a library entry on the Scarf site. Once created, add
a dependency on this library to your own:

```bash
npm i --save @scarf/scarf
```

Once you library is published to npm with this change, Scarf will automatically
collect stats on install, no additional code is required!

Head to your package's page on Scarf to see your analytics reports when available.

### What information does Scarf provide?

- OS and system info of your users
- Company information of your users
- Dependency tree information of packages that depend on your library

# scarf-js

Like Google Analytics, but for your npm library. Scarf will report some basic details any time your library is installed 
with npm.

### Installing

You'll first need to create a library entry on [Scarf](https://scarf.sh). Once created, add
a dependency on this library to your own:

```bash
npm i --save @scarf/scarf
```

Once your library is published to npm with this change, Scarf will automatically
collect stats on install, no additional code is required!

Head to your package's dashboard on Scarf to see your reports when available.

### What information does Scarf provide?

- OS and system info of your users
- Company information of your users
- Dependency tree information of packages that depend on your library

### Future work

Future releases of scarf-js will provide a module of utility functions to collect usage analytics in addition to the 
current installation analytics. 

# scarf-js

Scarf is like Google Analytics for your npm packages. By sending some basic
details after installation, this package can help you can gain insights into how
your packages are installed and by which companies. Scarf aims to help support
open-source developers fund their work when used commercially.

### Installing

You'll first need to create a library entry on [Scarf](https://scarf.sh). Once
created, add a dependency on this library to your own:

```bash
npm i --save @scarf/scarf
```

Once your library is published to npm with this change, Scarf will automatically
collect stats on install, no additional code is required!

Head to your package's dashboard on Scarf to see your reports when available.

### What information does Scarf provide me as a package author?

- Basic system information of your users
- Company information of your users
- Dependency tree information of packages that depend on your library

### As a user of a package using Scarf, what information does Scarf send about me?

- The operating system you are using
- The version of the package you're installing that depends on Scarf
- Your IP address will be used to look up any available company information. The
  IP address itself will be subsequently deleted
  
### As a user of a package using Scarf, how can I opt out of analytics?

Scarf's analytics help support developers of the open source packages you are using, so 
and leaving the anlytics enabled is appreciated. However, if you'd like to opt out,
set this variable in your environment:

```shell
export SCARF_NO_ANALYTICS=1
```

### Future work

Future releases of scarf-js will provide a module of utility functions to
collect usage analytics in addition to the current installation analytics.

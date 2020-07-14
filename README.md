# scarf-js

![](https://github.com/scarf-sh/scarf-js/workflows/CI/badge.svg)
[![npm version](https://badge.fury.io/js/%40scarf%2Fscarf.svg)](https://badge.fury.io/js/%40scarf%2Fscarf)
<a href="https://www.npmjs.com/package/@scarf/scarf">![](https://img.shields.io/npm/dw/@scarf/scarf)</a>

Scarf is like Google Analytics for your npm packages. By sending some basic
details after installation, this package can help you can gain insights into how
your packages are used and by which companies. Scarf aims to help support
open-source developers fund their work when used commercially.

To read more about why we wrote this library, check out [this post](https://github.com/scarf-sh/scarf-js/blob/master/WHY.org) on the topic.

### Features

- No dependencies
- Fully transparent to the user. Scarf will log it's behavior to the console
  during installation. It will never silently report analytics for someone that
  hasn't explictly given permission to do so.
- Never interrupts your package installation. Reporting is done on a best effort basis.

### Installing

You'll first need to create a library entry on [Scarf](https://scarf.sh). Once
created, add a dependency on this library to your own:

```bash
npm i --save @scarf/scarf
```

Once your library is published to npm with this change, Scarf will automatically
collect stats on install, no additional code is required!

Head to your package's dashboard on Scarf to see your reports when available.

#### Configuration

Users of your package will be opted in by default and can opt out by setting the
`SCARF_ANALYTICS=false` environment variable. If you'd Scarf analytics to
instead be opt-in, you can set this by adding an entry to your `package.json`


```json5
// your-package/package.json

{
  // ...
  "scarfSettings": {
    "defaultOptIn": false
  }
  // ...
}
```

Scarf will now be opt-out by default, and users can set `SCARF_ANALYTICS=true`
to opt in.

Regardless of the default state, Scarf will log what it is doing to users who
haven't explictly opted in or out.

By default, scarf-js will only trigger analytics when your package is installed as a dependency of another package, or is being installed globally. This ensures that scarf-js analytics will not be triggered on `npm install` being run _within your project_. To change this, you can add:

```json5
// your-package/package.json

{
  // ...
  "scarfSettings": {
    "allowTopLevel": true
  }
  // ...
}
```

### FAQ

#### What information does scarf-js provide me as a package author?

- Understanding your user-base
  - Which companies are using your package?
  - Is your project growing or shrinking? Where? On which platforms?
- Which versions of your package are being used?

#### As a user of a package using scarf-js, what information does scarf-js send about me?

*Scarf does not store personally identifying information.* Scarf aims to collect information that is helpful for:
- Package maintainence 
- Identifying which companies are using a particular package, in order to set up support agreements between developers and companies. 

Specifically, scarf-js sends:

- The operating system you are using
- Your IP address will be used to look up any available company information. _Scarf does not store the actual IP address_
- Limited dependency tree information. Scarf sends the name and version of the package(s) that directly depend on scarf-js. Additionally, scarf-js will send SHA256-hashed name and version for the following packages in the dependency tree:
  - Packages that depend on a package that depends on scarf-js.
  - The root package of the dependency tree.
This allows Scarf to provide maintainers information about which public packages are using their own, without exposing identifying details of non-public packages.

You can have scarf-js print the exact JSON payload it sends by settings `SCARF_VERBOSE=true` in your environment.

#### As a user of a package using scarf-js, how can I opt out of analytics?

Scarf's analytics help support developers of the open source packages you are
using, so enabling analytics is appreciated. However, if you'd like to opt out,
you can add your preference to your project's `package.json`:


```json5
// your-package/package.json

{
  // ...
  "scarfSettings": {
    "enabled": false
  }
  // ...
}
```

Alternatively, you can set this variable in your environment:

```shell
export SCARF_ANALYTICS=false
```

Either route will disable Scarf for all packages.

#### I distribute a package on npm, and scarf-js is in our dependency tree. Can I disable the analytics for my downstream dependents?

Yes. By opting out of analytics via `package.json`, any package upstream will have analytics disbabled.

```json5
// your-package/package.json

{
  // ...
  "scarfSettings": {
    "enabled": false
  }
  // ...
}
```

Installers of your packages will have scarf-js disabled for all dependencies upstream from yours.
  

### Developing

Setting the environment variable `SCARF_LOCAL_PORT=8080` will configure Scarf to
use http://localhost:8080 as the analytics endpoint host.

### Future work

Future releases of scarf-js will provide a module of utility functions to
collect usage analytics in addition to the current installation analytics.

const path = require('path')
const os = require('os')
const exec = require('child_process').exec
const localDevPort = process.env.SCARF_LOCAL_PORT
const https = localDevPort ? require('http') : require('https')

const scarfHost = localDevPort ? 'localhost' : 'scarf.sh'
const scarfLibName = '@scarf/scarf'

const makeDefaultSettings = () => {
  return {
    defaultOptIn: true
  }
}

function logIfVerbose (toLog, stream) {
  if (process.env.SCARF_VERBOSE === 'true') {
    (stream || console.log)(toLog)
  }
}

// SCARF_NO_ANALYTICS was the orginal variable, we'll get rid of it eventually
const userHasOptedOut = (process.env.SCARF_ANALYTICS === 'false' || process.env.SCARF_NO_ANALYTICS === 'true')
const userHasOptedIn = process.env.SCARF_ANALYTICS === 'true'

function getDependencyInfo (callback) {
  const moduleSeparated = path.resolve(__dirname).split('node_modules')
  const dependentPath = moduleSeparated.slice(0, moduleSeparated.length - 1).join('node_modules')

  return exec(`cd ${dependentPath} && npm ls @scarf/scarf --json --long`, function (error, stdout, stderr) {
    if (error) {
      logIfVerbose(`Scarf received an error from npm -ls: ${error}`)
      return null
    }

    const output = JSON.parse(stdout)

    const depsToScarf = findScarfInFullDependencyTree(output)
    if (depsToScarf.length < 2) {
      return null
    }

    const dependencyInfo = {
      scarf: depsToScarf[depsToScarf.length - 1],
      parent: depsToScarf[depsToScarf.length - 2],
      grandparent: depsToScarf[depsToScarf.length - 3] // might be undefined
    }

    dependencyInfo.parent.scarfSettings = Object.assign(makeDefaultSettings(), dependencyInfo.parent.scarfSettings || {})

    return callback(dependencyInfo)
  })
}

function reportPostInstall () {
  const scarfApiToken = process.env.SCARF_API_TOKEN
  getDependencyInfo(dependencyInfo => {
    if (!dependencyInfo.parent || !dependencyInfo.parent.name) {
      return
    }

    if (dependencyInfo.parent.scarfSettings.defaultOptIn) {
      if (userHasOptedOut) {
        return
      }

      if (!userHasOptedIn) {
        console.log(`
  The dependency '${dependencyInfo.parent.name}' is tracking installation
  statistics using Scarf (https://scarf.sh), which helps open-source developers
  fund and maintain their projects. Scarf securely logs basic installation
  details when this package is installed. The Scarf npm library is open source
  and permissively licensed at https://github.com/scarf-sh/scarf-js. For more
  details about your project's dependencies, try running 'npm ls'. To opt out of
  analytics, set the environment variable 'SCARF_ANALYTICS=false'.
`)
      }
    } else {
      if (!userHasOptedIn) {
        if (!userHasOptedOut) {
          // We'll only print the 'please opt in' text if the user hasn't
          // already opted out
          console.log(`
  The dependency '${dependencyInfo.parent.name}' would like to track
  installation statistics using Scarf (https://scarf.sh), which helps
  open-source developers fund and maintain their projects. Reporting is disabled
  by default for this package. When enabled, Scarf securely logs basic
  installation details when this package is installed. The Scarf npm library is
  open source and permissively licensed at https://github.com/scarf-sh/scarf-js.
  For more details about your project's dependencies, try running 'npm ls'.

  Please consider enabling Scarf to support the maintainer(s) of
  '${dependencyInfo.parent.name}'. To opt in, set the environment variable
  'SCARF_ANALYTICS=true'.
`)
        }

        return
      }
    }

    const infoPayload = {
      libraryType: 'npm',
      rawPlatform: os.platform(),
      rawArch: os.arch(),
      dependencyInfo: dependencyInfo
    }
    const data = JSON.stringify(infoPayload)

    const reqOptions = {
      host: scarfHost,
      port: localDevPort,
      method: 'POST',
      path: '/package-event/install',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    }

    if (scarfApiToken) {
      const authToken = Buffer.from(`n/a:${scarfApiToken}`).toString('base64')
      reqOptions.headers.Authorization = `Basic ${authToken}`
    }

    const req = https.request(reqOptions, (res) => {
      logIfVerbose(`Response status: ${res.statusCode}`)
      res.on('data', d => {
        logIfVerbose(d.toString())
      })
    })

    req.on('error', error => {
      logIfVerbose(error, console.error)
    })

    req.write(data)
    req.end()
  })
}

// Find a path to Scarf from the json output of npm ls @scarf/scarf --json in
// the package that's directly including Scarf
//
// {
//   scarfPackage: {name: `@scarf/scarf`, version: '0.0.1'},
//   parentPackage: { name: 'scarfed-library', version: '1.0.0', scarfSettings: { defaultOptIn: true } },
//   grandparentPackage: { name: 'scarfed-lib-consumer', version: '1.0.0' }
// }
function findScarfInSubDepTree (pathToDep, deps) {
  const depNames = Object.keys(deps)

  if (!depNames) {
    return []
  }

  const scarfFound = depNames.find(depName => depName === scarfLibName)
  if (scarfFound) {
    return pathToDep.concat([{ name: scarfLibName, version: deps[scarfLibName].version }])
  } else {
    for (let i = 0; i < depNames.length; i++) {
      const depName = depNames[i]
      const newPathToDep = pathToDep.concat([
        { name: depName,
          version: deps[depName].version,
          scarfSettings: deps[depName].scarfSettings,
        }
      ])
      const result = findScarfInSubDepTree(newPathToDep, deps[depName].dependencies)
      if (result) {
        return result
      }
    }
  }

  return []
}

function findScarfInFullDependencyTree (tree) {
  if (tree.name === scarfLibName) {
    return [{ name: scarfLibName, version: tree.version }]
  } else {
    return findScarfInSubDepTree([{
      name: tree.name,
      version: tree.version,
      scarfSettings: tree.scarfSettings,
    }], tree.dependencies)
  }
}

if (require.main === module) {
  try {
    reportPostInstall()
  } catch (e) {
    // This is an optional, best effort attempt. If there are any errors in
    // Scarf, we must not interfere with whatever the user is doing
    logIfVerbose(e, console.error)
  }
}

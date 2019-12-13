const path = require('path')
const os = require('os')
const util = require('util')
const fs = require('fs')
const exec = require('child_process').exec
const https = require('https')
const crypto = require('crypto')
// if crypto isn't loaded in the node runtime, we'll skip
const hash = crypto ? crypto.createHash('sha256') : null

const scarfLibName = '@scarf/scarf'
const scarfHost = 'scarf.sh'

function logIfVerbose(toLog, stream) {
  if (process.env.SCARF_VERBOSE === 'true') {
    (stream || console.log)(toLog)
  }
}

function getParentPackage(callback) {
  const moduleSeparated = path.resolve(__dirname).split('node_modules')
  const dependentPath = moduleSeparated.slice(0, moduleSeparated.length-1).join('node_modules')

  return exec(`cd ${dependentPath} && npm ls @scarf/scarf --json`, function(error, stdout, stderr){
    const output = JSON.parse(stdout)

    const depsToScarf = findScarfInFullDependencyTree(output)
    if (depsToScarf.length < 2) {
      return null
    }

    const dependencyInfo = {
      scarf: depsToScarf[depsToScarf.length - 1],
      parent: depsToScarf[depsToScarf.length - 2],
      grandparent: depsToScarf[depsToScarf.length - 3], // might be undefined
    }

    return callback(dependencyInfo)
  })
}

function getMac() {
  const macRegex = /(?:[a-z0-9]{1,2}[:-]){5}[a-z0-9]{1,2}/i
  const zeroRegex = /(?:[0]{1,2}[:-]){5}[0]{1,2}/
  const ifaces = os.networkInterfaces()
  for (const iface of Object.values(ifaces)) {
    for (const part of iface) {
      if (zeroRegex.test(part.mac) === false) {
        return part.mac
      }
    }
  }
  return null
}

// To track distinct machines, we'll use a sha256 of the mac address rather than
// the actual mac address
function getMacShaSum() {
  if (!hash) {
    return null
  }

  const mac = getMac()

  if (mac) {
    hash.update(mac)
    return hash.digest('hex')
  }

  return null
}

function reportPostInstall() {
  const scarfApiToken = process.env.SCARF_API_TOKEN
  getParentPackage(json => {
    const infoPayload = {
      libraryType: 'npm',
      rawPlatform: os.platform(),
      rawArch: os.arch(),
      mac: getMacShaSum(),
      dependencyInfo: json,
    }
    const data = JSON.stringify(infoPayload)

    const reqOptions = {
      host: scarfHost,
      method: 'POST',
      path: '/package-event/install',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
      }
    }

    if (scarfApiToken) {
      const authToken = new Buffer(`n/a:${scarfApiToken}`).toString('base64')
      reqOptions.headers['Authorization'] = `Basic ${authToken}`
    }

    const req = https.request(reqOptions, (res) => {
      res.on('data', d => {
        logIfVerbose(d.toString())
      })
    });

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
//   parentPackage: { name: 'scarfed-library', version: '1.0.0' },
//   grandparentPackage: { name: 'scarfed-lib-consumer', version: '1.0.0' }
// }
function findScarfInSubDepTree(pathToDep, deps) {
  const depNames = Object.keys(deps)

  if (!depNames) {
    return []
  }

  const scarfFound = depNames.find(depName => depName === scarfLibName)
  if (scarfFound) {
    return pathToDep.concat([{name: scarfLibName, version: deps[scarfLibName].version}])
  } else {
    for (let i = 0; i < depNames.length; i++) {
      const depName = depNames[i]
      const newPathToDep = pathToDep.concat([{name: depName, version: deps[depName].version}])
      const result = findScarfInSubDepTree(newPathToDep, deps[depName].dependencies)
      if (result) {
        return result
      }
    }
  }

  return []
}

function findScarfInFullDependencyTree(tree) {
  if (tree.name === scarfLibName) {
    return [{name: scarfLibName, version: tree.version}]
  } else {
    return findScarfInSubDepTree([{name: tree.name, version: tree.version}], tree.dependencies)
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


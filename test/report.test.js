const report = require('../report')
const fs = require('fs')

const rateLimitKey = 'testKey'
const tmpFileReturnVal = './scarf-js-test-history.log'

function wipeLogHistoryIfPresent () {
  try {
    fs.unlinkSync(tmpFileReturnVal)
  } catch (e) {}
}

describe('Reporting tests', () => {
  beforeAll(() => {
    report.tmpFileName = jest.fn(() => {
      return tmpFileReturnVal
    })
    wipeLogHistoryIfPresent()
  })

  afterAll(() => {
    wipeLogHistoryIfPresent()
  })

  test('Logging rate limit check', () => {
    let history = report.getRateLimitedLogHistory()
    expect(report.hasHitRateLimit(rateLimitKey, history)).toBe(false)
    report.rateLimitedUserLog(rateLimitKey, 'A user message')
    history = report.getRateLimitedLogHistory()
    expect(report.hasHitRateLimit(rateLimitKey, history)).toBe(true)
  })

  test('Redact sensitive data', () => {
    const rootPackageName = '@org/scarfed-lib-consumer'
    const rootPackageVersion = '1.0.0'

    const depInfo = {
      scarf: { name: '@scarf/scarf', version: '0.0.1', path: '/local/directory/deeper/deeper' },
      parent: { name: 'scarfed-library', version: '1.0.0', scarfSettings: { defaultOptIn: true }, path: '/local/directory/deeper/' },
      grandparent: { name: rootPackageName, version: rootPackageVersion, path: '/local/directory/' },
      rootPackage: { name: rootPackageName, version: rootPackageVersion, packageJsonPath: '/local/directory', path: '/local/directory' }
    }

    const redacted = report.redactSensitivePackageInfo(depInfo)

    expect(redacted.scarf.path).toBeUndefined()
    expect(redacted.parent.path).toBeUndefined()
    expect(redacted.grandparent.path).toBeUndefined()
    expect(redacted.rootPackage.path).toBeUndefined()
    expect(redacted.rootPackage.packageJsonPath).toBeUndefined()

    expect(redacted.rootPackage.name).not.toContain('org')
    expect(redacted.rootPackage.name).not.toContain('scarfed-lib-consumer')
    expect(redacted.grandparent.name).not.toContain('org')
    expect(redacted.grandparent.name).not.toContain('scarfed-lib-consumer')

    expect(redacted.rootPackage.version).toBe('0')
    expect(redacted.grandparent.version).toBe('0')

    expect(redacted.scarf.name).toBe('@scarf/scarf')
    expect(redacted.scarf.version).toBe('0.0.1')

    expect(redacted.parent.name).toBe('scarfed-library')
    expect(redacted.parent.version).toBe('1.0.0')
  })
})

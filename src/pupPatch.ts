import fs from 'fs'
import path from 'path'

const fileToPatchLocations = [
  'node_modules/puppeteer-core/lib/esm/puppeteer/common/Target.js',
  'node_modules/puppeteer-core/lib/cjs/puppeteer/common/Target.js',
  'node_modules/puppeteer/lib/cjs/puppeteer/common/Target.js',
  'node_modules/puppeteer/lib/cjs/puppeteer/common/Target.js'
]

const checkExists: (file: string) => boolean = (file: string) => {
  const isWindows = process.platform === 'win32'
  return fs.existsSync(isWindows ? path.posix.resolve(file) : path.resolve(file))
}

const checkPupeteerExists: () => boolean = () => {
  return fileToPatchLocations.map((file) => checkExists(file)).some((file) => file)
}

const checkPatched: (fileContent?: string) => boolean = (fileContent: string = '') => {
  const checkFileContents: (fileContent: string) => boolean = (fileContent: string) => {
    const captureMethodRegex = /(async.*?page.*?{.*?return.*?})/gms
    const matchMethod = fileContent.match(captureMethodRegex)
    if (matchMethod != null) {
      const chekcPatchedRegex = /(if.*?other)/gms
      const matchIsPatched = matchMethod[0].match(chekcPatchedRegex)
      if (matchIsPatched == null) {
        return false
      } else {
        return true
      }
    }
    return false
  }
  if (fileContent !== '') {
    return checkFileContents(fileContent)
  }
  for (const file of fileToPatchLocations) {
    if (!checkExists(file)) continue
    const isWindows = process.platform === 'win32'
    const fileContent = fs.readFileSync(isWindows ? path.posix.resolve(file) : path.resolve(file), 'utf8')
    if (checkFileContents(fileContent)) return true
  }
  return false
}

const patch: () => void = () => {
  for (const file of fileToPatchLocations) {
    if (!checkExists(file)) continue
    const isWindows = process.platform === 'win32'
    const fileContent = fs.readFileSync(isWindows ? path.posix.resolve(file) : path.resolve(file), 'utf8')
    if (!checkPatched(fileContent)) {
      const patch = ' this._targetInfo.type === \'iframe\' || this._targetInfo.type === \'other\' ||'
      const patchContent = fileContent.replace(/(async.*?page.*?\|\|)/gms, `$1${patch}`)
      fs.writeFileSync(file, patchContent, 'utf8')
    } else {
      console.log(`[Puppeteer Ext-Interactive Plugin]: files [${fileToPatchLocations.join(', ')}] already patched`)
      return
    }
  }
  console.log('[Puppeteer Ext-Interactive Plugin]: Puppeteer was patched OK.')
}

export { patch, checkPatched, checkPupeteerExists }

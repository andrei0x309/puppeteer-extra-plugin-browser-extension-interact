import { PuppeteerExtraPlugin } from 'puppeteer-extra-plugin'
import { checkPatched as checkPatchedFn, checkPupeteerExists } from './pupPatch.js'
import { Browser, Page } from 'puppeteer-core'

declare const chrome: any

interface PluginOptions {
  checPuppeteer?: boolean
  checkPatched?: boolean
  extensionID?: string
}

interface waitResourceOptions {
  pollTime?: number
  timeout?: number
}

interface BEI {
  opts: PluginOptions
  checkandGetExtensionID: () => string | undefined
  setExtensionID: (id: string) => void
  tryGetActionPage: () => Promise<Page | undefined>
  waitForActionPage: (opts?: waitResourceOptions) => Promise<Page>
  tryGetBackgroundPage: () => Promise<Page | undefined>
  waitForBackgroundPage: (opts?: waitResourceOptions) => Promise<Page>
  openActionPage: (page: Page) => void
  openActionPageInNewTab: (extBackgroundPage: Page, popupURL: string) => Promise<Page | null>
  getManifest: (extBackgroundPage: Page) => Promise<Record<any, any>>
  closeActionPage: (page: Page) => void
}

interface BEIBrowser extends Browser {
  BEI: BEI
}

const defaultOpts: PluginOptions = { checPuppeteer: true, checkPatched: false, extensionID: '' }

export class PluginBEI extends PuppeteerExtraPlugin {
  constructor (opts: PluginOptions = defaultOpts) {
    super(opts)
    this.opts.extensionID = this.opts.extensionID ?? ''
  }

  async beforeLaunch (): Promise<void> {
    const { checPuppeteer, checkPatched }: PluginOptions = this.opts
    if ((checPuppeteer ?? false) && !checkPupeteerExists()) {
      console.log('[Puppeteer Ext-Interactive Plugin]: puppeteer or puppeteer-core not found Please install before using the plugin')
      process.exit(1)
    }

    if ((checkPatched ?? false) && !checkPatchedFn()) {
      console.error(
        '[Puppeteer Ext-Interactive Plugin]: puppeteer/puppeteer-core is not patched use "npx puppeteer-ext-interact-plugin patch" command to patch it first'
      )
      process.exit(1)
    }
  }

  get name (): string {
    return 'browser-extension-interact'
  }

  get defaults (): PluginOptions {
    return defaultOpts
  }

  async afterLaunch (browser: Browser | unknown): Promise<void> {
    this.debug('after launch', browser)
    const beiBrowser = browser as BEIBrowser
    const EXTENSION_ID_NOT_SET = "Extension ID is not set, use option 'extensionID' to set it, or method browser.BEI.setExtensionID(id)"
    beiBrowser.BEI = {} as unknown as BEI
    beiBrowser.BEI.opts = this.opts
    beiBrowser.BEI.checkandGetExtensionID = () => {
      const extId = beiBrowser.BEI.opts.extensionID ?? ''
      if (extId === '') {
        throw new Error(EXTENSION_ID_NOT_SET)
      }
      return beiBrowser.BEI.opts.extensionID
    }
    beiBrowser.BEI.setExtensionID = (id) => {
      beiBrowser.BEI.opts.extensionID = id
    }
    beiBrowser.BEI.tryGetActionPage = async () => {
      const extensionID = await beiBrowser.BEI.checkandGetExtensionID()
      const targets = await beiBrowser.targets()
      const extensionActionTarget = targets.find((t) => {
        return t.url().includes(`chrome-extension://${extensionID as string}/`) && t.type().includes('other')
      })
      if (extensionActionTarget != null) {
        const page = await extensionActionTarget.page()
        if (page != null) {
          return page
        }
      }
    }
    beiBrowser.BEI.waitForActionPage = async ({ pollTime = 50, timeout = 20000 } = { }) => {
      let timeOutCount = 0
      for (; ;) {
        const extensionActionPage = await beiBrowser.BEI.tryGetActionPage()
        if (extensionActionPage != null) {
          return extensionActionPage
        }
        await new Promise((resolve) => setTimeout(resolve, pollTime))
        timeOutCount += pollTime
        if (timeOutCount >= timeout) {
          throw new Error('Timeout waiting for action page')
        }
      }
    }
    beiBrowser.BEI.tryGetBackgroundPage = async () => {
      const extensionID = await beiBrowser.BEI.checkandGetExtensionID()
      const targets = await beiBrowser.targets()
      const extensionTarget = targets.find((t) => {
        return t.url().includes(`chrome-extension://${extensionID as string}/`) && (t.type().includes('background_page') || t.type().includes('service_worker'))
      })
      if (extensionTarget != null) {
        const page = await extensionTarget.page()
        /* @ts-expect-error */
        if (!(extensionTarget._targetInfo.attached as unknown as boolean)) {
          return undefined
        }
        if (page !== null) {
          /* @ts-expect-error */
          if (page._client._connection as unknown as boolean) {
            return page
          }
        }
      }
    }
    beiBrowser.BEI.waitForBackgroundPage = async ({ pollTime = 50, timeout = 20000 } = { }) => {
      let timeOutCount = 0
      for (; ;) {
        const extensionBackground = await beiBrowser.BEI.tryGetBackgroundPage()
        if (extensionBackground != null) {
          return extensionBackground
        }
        await new Promise((resolve) => setTimeout(resolve, pollTime))
        timeOutCount += pollTime
        if (timeOutCount >= timeout) {
          throw new Error('Timeout waiting for background page')
        }
      }
    }
    beiBrowser.BEI.openActionPage = async (extBackgroundPage) => {
      if (extBackgroundPage.target().type().includes('background_page')) {
        await extBackgroundPage.evaluate(() => {
          chrome.tabs.query({ active: true }, () => {
            chrome.browserAction.openPopup((x: any) => x)
          })
        })
      } else {
        // service worker ManifestV3
        await extBackgroundPage.evaluate(() => {
          chrome.tabs.query({ active: true }, () => {
            chrome.action.openPopup((x: any) => x)
          })
        })
      }
    }
    beiBrowser.BEI.openActionPageInNewTab = async (extBackgroundPage, popupURL) => {
      await extBackgroundPage.evaluate((popupURL) => {
        chrome.tabs.create({ url: popupURL })
      }, popupURL)
      return await (await beiBrowser.waitForTarget(
        (target) => target.url() === popupURL
      )).page()
    }
    beiBrowser.BEI.getManifest = async (extBackgroundPage) => {
      const manifest = await extBackgroundPage.evaluate(() => {
        return chrome.runtime.getManifest()
      })
      return manifest
    }
    beiBrowser.BEI.closeActionPage = async (popupContext) => {
      await popupContext.evaluate(() => {
        window.close()
      })
    }
  }
}

export default (pluginConfig: PluginOptions | undefined): PluginBEI => {
  return new PluginBEI(pluginConfig)
}

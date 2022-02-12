# puppeteer-extra-plugin-browser-extension-interact

## Description

This is a puppeteer plugin that uses `puppeteer-extra-plugin` meant to add interaction functionality with extensions.

A usage demo package resides in `demo_usage` folder.

Should work with both `puppeteer` and `puppeteer-core` packages.

If you want to interact with an`ActionPage` of an extension ( the extension Popup ) directly on the active tab you need to patch your puppeteer/ package using `npx puppeteer-ext-interact-plugin patch` you can also leave the puppeteer unpatched if you plan to interact with the `ActionPage` in a new page/tab rather then interacting with it as presented when opened by the extension button.

**Note:**

```markdown
Tested with `puppeteer v: ^13.0.0`
The plugin uses private `puppeteer` APIs and hacks may break in the future.
```

## Basic Usage

Install npm package: `puppeteer-extra-plugin-browser-extension-interact`

```javascript
import puppeteer from "puppeteer-extra";
import browserExtensionInteract from "puppeteer-extra-plugin-browser-extension-interact";

// Put Your Extension ID Here Options are optional but accessing specific methods from the BEI object without setting first an ExtensionID will throw an error. 
puppeteer.use(browserExtensionInteract({
  extensionID: "nkbihfbeogaeaoehlefnkodbefgpgknn",
  checkPatched: true,
}));

(async (_) => {
  const options = {
      // Define your puppeteer options here
  }
  const browser = await puppeteer.launch(options);
  // after this line browser.BEI will be available
  // browser.BEI will contain all methods from the PLUGIN
  // .. rest of your code
})();
```

## API

**browser.BEI Interface**:

```javascript
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
```

**waitResourceOptions Interface**:

```javascript
/* 
- pollTime is the time for debouncing between the search of resource default is 50ms can be overridden to any millisecond value

- timeout is the time to wait for a resource to be found default is 20000ms can be overridden to any millisecond value
*/
interface waitResourceOptions {
  pollTime?: number
  timeout?: number
}
```

**checkandGetExtensionID** - returns the extension ID if it is set or throws an error if it is not set.

**setExtensionID** - sets the extension ID at runtime useful if you want to use the plugin with multiple extensions.

**tryGetActionPage** - returns the action page if it is open or undefined if it is not open (this is the Action Page on opened as if the extension button was clicked)

**waitForActionPage** - waits & returns the action page if it is open or throws an error on timeout (this is the Action Page on opened as if the extension button was clicked)

**tryGetBackgroundPage** - returns the background/SW context page if it is availabe or undefined if it is not open

**waitForBackgroundPage** - waits & returns the background/SW context page if it is availabe or throws an error on timeout

**openActionPage** - try to open the action page on the given page (this is the Action Page on opened as if the extension button was clicked), needs the page parameter which is the background/SW context page

**openActionPageInNewTab** - will open the action page in a new doesn't need puppeteer to be patched (needs the background/SW context page as the first parameter and the URL of the popup as the second parameter, the URL of popup can be extracted from the manifest)

**getManifest** - returns the full manifest of the extension as a javascript object

**closeActionPage** - closes the action page if it is open works with both an action page opened in new tab or opened as if the extension button was clicked, needs the action page context to close it.

## Possible use cases

- extension testing
- extension development
- extension automation

## Visual Demo

Example of unlocking metamask extension(`demo_usage` folder from this git repo)
![MetaMask Demo](/demo_usage/res/demo.gif?raw=true "Optional Title")

## Contributing

This plugin may break anytime, it was tested on a Windows machine with Microsoft Edge on the MetaMask extension.

If you want to add a new feature or fix any issue you may find, PRs are welcome.

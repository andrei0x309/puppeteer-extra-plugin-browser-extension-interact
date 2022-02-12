import puppeteer from "puppeteer-extra";
import os from "os";
import pluginStealth from "puppeteer-extra-plugin-stealth";
import browserExtensionInteract from "puppeteer-extra-plugin-browser-extension-interact";

puppeteer.use(pluginStealth());
puppeteer.use(browserExtensionInteract({
  extensionID: "nkbihfbeogaeaoehlefnkodbefgpgknn",
  checkPatched: true,
}));


(async (_) => {
  const osType = os.type();
  let executablePath, userDataDir;
  if (osType === "Windows_NT") {
    executablePath = `${os.homedir()}\\AppData\\Local\\Microsoft\\Edge SxS\\Application\\msedge.exe`;
    userDataDir = `${os.homedir()}\\AppData\\Local\\Microsoft\\Edge SxS\\User Data`;
  } else if (osType === "Linux") {
    executablePath = "/usr/bin/microsoft-edge-dev";
    userDataDir = "~/.config/microsoft-edge-dev";
  }

  const options = {
    executablePath,
    headless: false,
    args: ["--no-sandbox", "--start-maximized"],
    userDataDir,
    defaultViewport: null,
    ignoreDefaultArgs: ["--disable-extensions", "--enable-automation", "--mute-audio"],
  };
  const browser = await puppeteer.launch(options);
  const page = await browser.newPage();
  page.setDefaultTimeout(0);

    const extBgContext = await browser.BEI.waitForBackgroundPage({ pollTime: 50, timeout: 200000 });
    // the bellow commented code will open the Popup in the current tab 
    // and may also open the dev tools for that window may be buggy and not work on all chromium derivate browsers
    // instead openActionPageInNewTab should work in all casess
    // await browser.BEI.openActionPage(extBgContext);
    // const metamaskPopup = await browser.BEI.waitForActionPage();
    const metamaskPopup = await browser.BEI.openActionPageInNewTab(extBgContext, `chrome-extension://${browser.BEI.checkandGetExtensionID()}/${(await browser.BEI.getManifest(extBgContext)).browser_action.default_popup}`)
    await metamaskPopup.waitForSelector("input", { visible: true });
    const testPass = 'TestPass5432'
    await metamaskPopup.type('input', testPass);
    await metamaskPopup.click('button');
    await page.waitForTimeout(5000);
    // works with both openActionPageInNewTab and openActionPage
    await browser.BEI.closeActionPage(metamaskPopup);
    console.log('demo done');
 
  await page.waitForTimeout(30000);
})();

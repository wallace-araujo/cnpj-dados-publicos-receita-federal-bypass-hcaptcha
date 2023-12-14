const puppeteer = require('puppeteer')
const ac = require('@antiadmin/anticaptchaofficial')
const dotenv = require ('dotenv').config();
const enterprisePayload = null
const isInvisible = false
const url = 'https://solucoes.receita.fazenda.gov.br/Servicos/cnpjreva/Cnpjreva_Solicitacao.asp'

const start = async (cnpj) => {
  const infoCnpj = []
  ac.setAPIKey(dotenv.parsed.ANTI_CAPTCHA)
  ac.setSoftId(0)
  // Clica em inspecionar o hCaptcha e pega o valor que está dentro dessa tag data-sitekey=token.
  let token = await ac.solveHCaptchaProxyless(url, 'af4fc5a3-1ac5-4e6d-819d-324d412a5e9d', '', enterprisePayload, isInvisible)

  if (!token) {
    console.log('erro no token')
    return
  }

  const browser = await puppeteer.launch({ headless: false })
  const page = await browser.newPage()
  await page.goto(url)
  // await page.setViewport({ width: 1080, height: 1024 })
  await page.type('[name="cnpj"]', cnpj)
  await page.$$eval(
    '[name="h-captcha-response"]',
    (elements, token) => {
      if (elements.length > 0) {
        elements[0].value = token
      }
    },
    token
  )
  await page.click('[type="submit"]')
  await page.waitForTimeout(2000)

  const selector = 'div.alert.alert-danger#msgErroCaptcha'
  const divPresente = await page.waitForSelector(selector, { visible: true, timeout: 3000 }).catch(() => null)

  if (divPresente) {
    console.log('A div está presente na tela.')
    // await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
    console.log('browser.close')
    await browser.close()
    start(cnpj)
  }

  const rows = await page.$$('#principal table tbody tr')
  for (const row of rows) {
    const cells = await row.$$('td')
    for (const cell of cells) {
      const text = await page.evaluate((cell) => cell.textContent, cell)
      infoCnpj.push(text.trim())
      console.log(text.trim())
    }
  }

  console.log('info cnpj:', infoCnpj)
}
start('33.000.167/0001-01')

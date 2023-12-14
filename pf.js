const puppeteer = require('puppeteer')
const ac = require('@antiadmin/anticaptchaofficial')
const dotenv = require ('dotenv').config();
const enterprisePayload = null
const isInvisible = false
const url = 'https://servicos.receita.fazenda.gov.br/Servicos/CPF/ConsultaSituacao/ConsultaPublica.asp'

const start = async (cpf, dateNasc) => {
  // token api anti captcha
  ac.setAPIKey(dotenv.parsed.ANTI_CAPTCHA)
  ac.setSoftId(0)
  // Clica em inspecionar o hCaptcha e pega o valor que está dentro dessa tag data-sitekey=token.
  let token = await ac.solveHCaptchaProxyless(url, '53be2ee7-5efc-494e-a3ba-c9258649c070', '', enterprisePayload, isInvisible)

  if (!token) {
    console.log('erro no token')
    return
  }

  const browser = await puppeteer.launch({ headless: false })
  const page = await browser.newPage()
  await page.goto(url)

  await page.type('[name="txtCPF"]', cpf)
  await page.type('[name="txtDataNascimento"]', dateNasc)

  await page.$$eval(
    '[name="h-captcha-response"]',
    (elements, token) => {
      if (elements.length > 0) {
        elements[0].value = token
      }
    },
    token
  )

  await page.click('[name="Enviar"]')
  await page.waitForTimeout(4000)
  const data = await Promise.all([
    page.$$eval('.clConteudoDados', (e) =>
      e.map((td) => {
        return td.innerText
      })
    ),
    page.$$eval('.clConteudoComp', (e) =>
      e.map((td) => {
        return td.innerText
      })
    ),
    page.$$eval('.clConteudoCompBold', (e) =>
      e.map((td) => {
        return td.innerText
      })
    )
  ])
  console.log('data ...', data)
}
start('07068093868.', '06101945')

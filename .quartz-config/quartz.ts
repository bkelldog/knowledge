// Replaces Quartz's quartz.ts at build time (see .github/workflows and dev.mjs).
//
// Adds the custom components in .quartz-config/components/ to every page:
// a home link above the site title, and the homepage-style footer.
//
// Quartz builds the page layout from quartz.config.yaml inside loadQuartzConfig()
// and hands it to its page dispatcher; the `layout` export below is not read
// back. So the layout is amended here and the dispatcher rebuilt with it.
import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader"
import { PageTypeDispatcher } from "./quartz/plugins/pageTypes/dispatcher"
import { FullPageLayout } from "./quartz/cfg"
import HomeLink from "./quartz/components/custom/HomeLink"
import SiteFooter from "./quartz/components/custom/SiteFooter"

const homeLink = HomeLink({ href: "https://willkelly.dev/", text: "Home" })

const siteFooter = SiteFooter({
  quote: [
    "Un phare ironique, infernal",
    "Flambeau des grâces sataniques,",
    "Soulagement et gloire uniques,",
    "— La conscience dans le Mal!",
  ],
  quoteLang: "fr",
  links: {
    home: "https://willkelly.dev/",
    github: "https://github.com/bkelldog",
    contact: "https://willkelly.dev/about/#contact-anchor",
  },
})

// Page-type layouts only override the slots they define, so leave undefined
// slots alone and let them fall back to the defaults.
function addCustomComponents(layout: Partial<FullPageLayout>) {
  if (layout.left) layout.left = [homeLink, ...layout.left]
  if (layout.footer) layout.footer = [siteFooter]
}

const config = await loadQuartzConfig()
export const layout = await loadQuartzLayout()
addCustomComponents(layout.defaults)
Object.values(layout.byPageType).forEach(addCustomComponents)

const dispatcher = config.plugins.emitters.findIndex((e) => e.name === "PageTypeDispatcher")
if (dispatcher === -1) {
  throw new Error("quartz.ts: PageTypeDispatcher not found. Quartz internals changed; see .quartz-config/quartz.ts")
}
config.plugins.emitters[dispatcher] = PageTypeDispatcher({
  defaults: layout.defaults,
  byPageType: layout.byPageType,
})

export default config

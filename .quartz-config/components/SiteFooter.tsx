// Copied to quartz/components/custom/ at build time. Styled in styles/custom.scss.
// Mirrors the homepage footer (HomePage/source/_includes/components/footer.njk):
// an epigraph on the left, small-caps links on the right.
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"
import { classNames } from "../../util/lang"

interface Options {
  quote: string[]
  quoteLang: string
  links: Record<string, string>
}

const defaultOptions: Options = {
  quote: [],
  quoteLang: "en",
  links: {},
}

export default ((userOpts?: Partial<Options>) => {
  const { quote, quoteLang, links } = { ...defaultOptions, ...userOpts }

  const SiteFooter: QuartzComponent = ({ displayClass }: QuartzComponentProps) => (
    <footer class={classNames(displayClass, "site-footer")}>
      <blockquote class="footer-quote" lang={quoteLang}>
        <p>
          {quote.map((line, i) => (
            <>
              {i > 0 && <br />}
              {line}
            </>
          ))}
        </p>
      </blockquote>
      <nav class="footer-links">
        {Object.entries(links).map(([text, href]) => (
          <a class="footer-link" href={href}>
            {text}
          </a>
        ))}
      </nav>
    </footer>
  )

  return SiteFooter
}) satisfies QuartzComponentConstructor<Partial<Options>>

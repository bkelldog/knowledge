// Copied to quartz/components/custom/ at build time. Styled in styles/custom.scss.
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"
import { classNames } from "../../util/lang"

interface Options {
  href: string
  text: string
}

const defaultOptions: Options = {
  href: "/",
  text: "Home",
}

export default ((userOpts?: Partial<Options>) => {
  const { href, text } = { ...defaultOptions, ...userOpts }

  const HomeLink: QuartzComponent = ({ displayClass }: QuartzComponentProps) => (
    <a class={classNames(displayClass, "home-link")} href={href}>
      <span aria-hidden="true">{"←"}</span> {text}
    </a>
  )

  return HomeLink
}) satisfies QuartzComponentConstructor<Partial<Options>>

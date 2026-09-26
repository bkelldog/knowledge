// Copied to quartz/components/custom/ at build time. Styled in styles/custom.scss.
// Replaces the page-title plugin so the title can be set in hand-made small
// caps: each word's first letter is a full capital, and the rest are marked up
// separately so they can be drawn smaller and a little heavier. (Noto Serif has
// no true small caps, and the browser's imitation shrinks capitals, which
// leaves their strokes thin.)
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"
import { classNames } from "../../util/lang"
import { pathToRoot } from "../../util/path"

export default (() => {
  const SiteTitle: QuartzComponent = ({ fileData, cfg, displayClass }: QuartzComponentProps) => {
    const words = (cfg?.pageTitle ?? "").split(" ")
    return (
      <h2 class={classNames(displayClass, "page-title")}>
        <a href={pathToRoot(fileData.slug!)} aria-label={cfg?.pageTitle}>
          {words.map((word, i) => (
            <>
              {i > 0 && " "}
              <span class="title-initial">{word.charAt(0)}</span>
              <span class="title-small">{word.slice(1)}</span>
            </>
          ))}
        </a>
      </h2>
    )
  }

  return SiteTitle
}) satisfies QuartzComponentConstructor

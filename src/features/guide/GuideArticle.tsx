import { Container } from "@/components/layout/Container";
import { ButtonLink } from "@/components/ui/Button";
import { ROUTES } from "@/constants/routes";
import { GUIDE_FAQ, GUIDE_INTRO, GUIDE_SECTIONS, GUIDE_TITLE } from "@/features/guide/originalHoneyGuide";

/** The buying guide article: real advice first, with the delivery and order details it leads to. */
export function GuideArticle() {
  return (
    <article className="pt-28 pb-24">
      <Container className="max-w-3xl">
        <header>
          <p className="text-xs font-semibold tracking-[0.3em] text-gold-400 uppercase">Honey guide</p>
          <h1 className="mt-4 font-display text-5xl text-cream-50 sm:text-6xl">{GUIDE_TITLE}</h1>
          {GUIDE_INTRO.map((paragraph) => (
            <p key={paragraph} className="mt-6 text-lg leading-relaxed text-cream-300">
              {paragraph}
            </p>
          ))}
        </header>

        {GUIDE_SECTIONS.map((section) => (
          <section key={section.id} id={section.id} aria-labelledby={`${section.id}-title`} className="mt-14">
            <h2 id={`${section.id}-title`} className="font-display text-3xl text-cream-50 sm:text-4xl">
              {section.heading}
            </h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className="mt-5 leading-relaxed text-cream-300">
                {paragraph}
              </p>
            ))}
            {section.points ? (
              <ul className="mt-5 list-disc space-y-3 pl-6 leading-relaxed text-cream-300">
                {section.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}

        <section aria-labelledby="guide-faq-title" className="mt-14">
          <h2 id="guide-faq-title" className="font-display text-3xl text-cream-50 sm:text-4xl">
            Frequently asked questions
          </h2>
          <dl className="mt-6 space-y-6">
            {GUIDE_FAQ.map((item) => (
              <div key={item.question}>
                <dt className="font-display text-2xl text-cream-50">{item.question}</dt>
                <dd className="mt-2 leading-relaxed text-cream-300">{item.answer}</dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="mt-14 flex flex-wrap gap-3">
          <ButtonLink href={ROUTES.checkout}>Send an order request</ButtonLink>
          <ButtonLink href={ROUTES.home} variant="secondary">
            Back to the hive
          </ButtonLink>
        </div>
      </Container>
    </article>
  );
}

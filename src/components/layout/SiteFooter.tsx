import { footerNav, legalNav, siteConfig, socialProfiles, type NavLink } from "@/config/site";
import { EngineeringGrid } from "@/components/engineering";
import { Container } from "@/components/ui/Container";
import { InstagramIcon, LinkedinIcon, YoutubeIcon } from "@/components/ui/icons";
import { Logo } from "./Logo";
import { NewsletterForm } from "./NewsletterForm";

const socialIcons = { instagram: InstagramIcon, youtube: YoutubeIcon, linkedin: LinkedinIcon };

/** Link lub — dla przygotowanych, jeszcze nieistniejących podstron — nieaktywny tekst. */
function FooterLink({ link, className }: { link: NavLink; className?: string }) {
  if (link.href) {
    return (
      <a href={link.href} className={`transition-colors hover:text-ink-900 ${className ?? ""}`}>
        {link.label}
      </a>
    );
  }
  return (
    <span className={`cursor-default text-ink-400 ${className ?? ""}`} title="Wkrótce" aria-disabled="true">
      {link.label}
    </span>
  );
}

export function SiteFooter() {
  return (
    <footer id="kontakt" className="relative border-t border-line bg-surface-muted">
      <EngineeringGrid cell={20} fade="bottom" className="opacity-60" />
      <Container className="relative">
        <div className="grid grid-cols-2 gap-8 py-12 sm:grid-cols-3 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1.7fr] lg:gap-10">
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <a href="#" aria-label="VEXOR — wróć na górę strony" className="inline-block">
              <Logo />
            </a>
            <p className="mt-5 text-[13px] text-ink-600">Precyzyjna produkcja. Prosty proces.</p>
          </div>

          {footerNav.map((group) => (
            <nav key={group.id} id={group.id} aria-labelledby={`${group.id}-title`}>
              <h2 id={`${group.id}-title`} className="text-[13px] font-semibold text-ink-900">
                {group.title}
              </h2>
              <ul className="mt-3 space-y-2 text-[13px] text-ink-600">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <FooterLink link={link} />
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <h2 className="text-[13px] font-semibold text-ink-900">Zapisz się do newslettera</h2>
            <p className="mt-1 text-[12.5px] text-ink-500">Nowości, porady i inspiracje.</p>
            <NewsletterForm />
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-line py-6 text-[12px] text-ink-500 md:flex-row md:items-center md:justify-between">
          <p>
            © {siteConfig.copyrightYear} {siteConfig.name}. Wszelkie prawa zastrzeżone.
          </p>
          <ul className="flex flex-wrap gap-x-8 gap-y-2">
            {legalNav.map((link) => (
              <li key={link.label}>
                <FooterLink link={link} />
              </li>
            ))}
          </ul>
          <ul className="flex items-center gap-4" aria-label="Media społecznościowe">
            {socialProfiles.map(({ id, label, href }) => {
              const Icon = socialIcons[id];
              return (
                <li key={id}>
                  {href ? (
                    <a href={href} aria-label={label} className="text-ink-800 hover:text-ink-950" rel="noopener noreferrer" target="_blank">
                      <Icon size={20} />
                    </a>
                  ) : (
                    <span className="block text-ink-800/45" title={`${label} — wkrótce`} aria-label={`${label} (wkrótce)`} role="img">
                      <Icon size={20} />
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </Container>
    </footer>
  );
}

'use client';
import Link from 'next/link';

import { useContactInfo } from '../../hooks/useContactInfo';
import ContactForm from '../ContactForm';
import SocialLinks from '../SocialLinks';

import styles from './footer.module.scss';

interface FooterProps {
    readonly hideCTA?: boolean;
}

export default function Footer({ hideCTA = false }: FooterProps) {
    const { contactInfo, loading } = useContactInfo();

    return (
        <footer className={styles['footer-container']}>
            {/* Section Contact Form - remplace la CTA */}
            {!hideCTA && <ContactForm />}

            {/* Section Info */}
            <div className={styles['info-section']}>
                <div className={styles['company-info']}>
                    <p className={styles['company-description']}>
                        <span className="primecontent-title">
                            Dali<span className="text-gray-400">films.</span>
                        </span>{' '}
                        est une agence de production basée à Paris
                    </p>

                    {/* Réseaux sociaux dynamiques */}
                    {!loading &&
                        contactInfo?.reseauxSociaux &&
                        Array.isArray(contactInfo.reseauxSociaux) &&
                        contactInfo.reseauxSociaux.length > 0 && (
                            <SocialLinks socialNetworks={contactInfo.reseauxSociaux} />
                        )}
                </div>

                <div className={styles['contact-info']}>
                    <a
                        href={`mailto:${contactInfo?.email || 'contact@primecontent.fr'}`}
                        className={styles['contact-email']}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <span className={styles['contact-icon']}>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                width="20"
                                height="20"
                            >
                                <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
                                <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
                            </svg>
                        </span>
                        {contactInfo?.email || 'contact@primecontent.fr'}
                    </a>
                    <a
                        href={`tel:${contactInfo?.telephone?.replace(/\s/g, '') || '+33649095795'}`}
                        className={styles['contact-phone']}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <span className={styles['contact-icon']}>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                width="20"
                                height="20"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </span>
                        {contactInfo?.telephone || '+33 6 49 09 57 95'}
                    </a>
                </div>
            </div>

            {/* Section Copyright */}
            <div className={styles['copyright-section']}>
                <div className={styles['copyright-content']}>
                    <div className={styles['brand-name']}>
                        <span className="primecontent-title">
                            Dali<span className="text-gray-400">films.</span>
                        </span>
                    </div>
                    <div className={styles['copyright-links']}>
                        <span className={styles['copyright-text']}>
                            © {new Date().getFullYear()} Dalifilms. Tous droits réservés.
                        </span>
                        <Link href="/mentions-legales" className={styles['legal-link']}>
                            Mentions légales
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}

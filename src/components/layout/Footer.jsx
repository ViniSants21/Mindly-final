import { Link } from "react-router-dom";
import { Mail, Phone } from "lucide-react";
import {
  FaInstagram,
  FaFacebookF,
  FaLinkedinIn,
  FaGithub,
  FaYoutube,
  FaDiscord,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

const SOCIAL_LINKS = [
  { Icon: FaInstagram,  label: "Instagram", href: "#", color: "#E1306C" },
  { Icon: FaFacebookF,  label: "Facebook",  href: "#", color: "#1877F2" },
  { Icon: FaLinkedinIn, label: "LinkedIn",  href: "#", color: "#0A66C2" },
  { Icon: FaGithub,     label: "GitHub",    href: "#", color: "#f0f0f0" },
  { Icon: FaXTwitter,   label: "X",         href: "#", color: "#f0f0f0" },
  { Icon: FaYoutube,    label: "YouTube",   href: "#", color: "#FF0000" },
  { Icon: FaDiscord,    label: "Discord",   href: "#", color: "#5865F2" },
];

const NAV_LINKS = [
  { label: "Início",              to: "/" },
  { label: "Planner",             to: "/planner" },
  { label: "Desempenho",          to: "/desempenho" },
  { label: "Desafios",            to: "/desafios" },
  { label: "Trilha de Aprendizado", to: "/trilha" },
];

const RESOURCE_LINKS = [
  { label: "Política de Privacidade", href: "#" },
  { label: "Termos de Uso",           href: "#" },
  { label: "Trocas e Devoluções",     href: "#" },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer-pro">
      <div className="footer-pro-main">

        {/* Coluna 1 — Marca */}
        <div className="footer-pro-brand">
          <img
            src="/images/mindly-logo.png"
            alt="Mindly"
            className="footer-pro-logo"
          />
          <p className="footer-pro-desc">
            Mindly é uma plataforma de estudos gamificada que transforma seu
            aprendizado em conquistas. Estude com foco, evolua com propósito.
          </p>
          <div className="footer-pro-social">
            {SOCIAL_LINKS.map(({ Icon, label, href, color }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="footer-social-btn"
                style={{ "--sc": color }}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>

        {/* Coluna 2 — Links Rápidos */}
        <div className="footer-pro-col">
          <h5 className="footer-pro-heading">Links Rápidos</h5>
          <ul className="footer-pro-list">
            {NAV_LINKS.map(({ label, to }) => (
              <li key={to}>
                <Link to={to} className="footer-pro-link">{label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Coluna 3 — Recursos */}
        <div className="footer-pro-col">
          <h5 className="footer-pro-heading">Recursos</h5>
          <ul className="footer-pro-list">
            {RESOURCE_LINKS.map(({ label, href }) => (
              <li key={label}>
                <a href={href} className="footer-pro-link">{label}</a>
              </li>
            ))}
          </ul>
        </div>

        {/* Coluna 4 — Contato */}
        <div className="footer-pro-col">
          <h5 className="footer-pro-heading">Contato</h5>
          <ul className="footer-pro-list footer-contact-list">
            <li>
              <Phone size={13} className="footer-contact-icon" />
              <span>(12) 99781-3395 — WhatsApp</span>
            </li>
            <li>
              <Mail size={13} className="footer-contact-icon" />
              <a href="mailto:contatomindly@gmail.com" className="footer-pro-link">
                contatomindly@gmail.com
              </a>
            </li>
          </ul>
        </div>

      </div>

      <div className="footer-pro-bottom">
        <p>
          © {year} Mindly — Todos os direitos reservados. Desenvolvido pela
          equipe Mindly.
        </p>
      </div>
    </footer>
  );
}

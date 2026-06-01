import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import {
  FaInstagram,
  FaFacebookF,
  FaLinkedinIn,
  FaGithub,
  FaYoutube,
  FaDiscord,
  FaWhatsapp,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

const SOCIAL_LINKS = [
  { Icon: FaInstagram,  label: "Instagram", href: "https://www.instagram.com/mindly.app", color: "#E1306C" },
  { Icon: FaFacebookF,  label: "Facebook",  href: "https://www.facebook.com/mindly.app",  color: "#1877F2" },
  { Icon: FaLinkedinIn, label: "LinkedIn",  href: "https://www.linkedin.com/company/mindly-app", color: "#0A66C2" },
  { Icon: FaGithub,     label: "GitHub",    href: "https://github.com/mindly-app",         color: "#f0f0f0" },
  { Icon: FaXTwitter,   label: "X",         href: "https://twitter.com/mindly_app",         color: "#f0f0f0" },
  { Icon: FaYoutube,    label: "YouTube",   href: "https://www.youtube.com/@mindly-app",    color: "#FF0000" },
  { Icon: FaDiscord,    label: "Discord",   href: "https://discord.gg/mindly",              color: "#5865F2" },
];

const NAV_LINKS = [
  { label: "Início",                to: "/" },
  { label: "Planner",               to: "/planner" },
  { label: "Desempenho",            to: "/desempenho" },
  { label: "Desafios",              to: "/desafios" },
  { label: "Trilha de Aprendizado", to: "/trilha" },
];

const RESOURCE_LINKS = [
  { label: "Política de Privacidade", to: "/privacidade" },
  { label: "Termos de Uso",           to: "/termos" },
  { label: "Trocas e Devoluções",     to: "/trocas" },
];

export default function Footer() {
  const year = new Date().getFullYear();
  const whatsappHref = "https://wa.me/5512997813395?text=Olá%2C%20vim%20pelo%20site%20Mindly%21";

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
            {RESOURCE_LINKS.map(({ label, to }) => (
              <li key={to}>
                <Link to={to} className="footer-pro-link">{label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Coluna 4 — Contato */}
        <div className="footer-pro-col">
          <h5 className="footer-pro-heading">Contato</h5>
          <ul className="footer-pro-list footer-contact-list">
            <li className="footer-contact-item">
              <FaWhatsapp size={15} className="footer-contact-icon footer-whatsapp-icon" />
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-pro-link footer-whatsapp-link"
              >
                (12) 99781-3395
              </a>
            </li>
            <li className="footer-contact-item">
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

import heroPortrait from "../assets/images/hero-image.webp";

/** Content and replaceable assets. The portrait is served unchanged; other paths point to public/. */
export const portfolio = {
  name: "Thiago Natale",
  email: "thiagonatale.dev@gmail.com",
  phone: "+55 (34) 98896-2692",
  phoneHref: "tel:+5534988962692",
  location: "Uberaba, MG · Brasil",
  linkedin: "https://www.linkedin.com/in/thiago-natale",
  github: "https://github.com/thiago-natale",
  description:
    "Thiago Natale, Desenvolvedor Web Full Stack em Uberaba, MG. Desenvolvo sites profissionais modernos, aplicações web, integrações e realizo automação de processos.",
  seo: {
    title: "Thiago Natale | Desenvolvedor Web Full Stack",
    jobTitle: "Desenvolvedor web Full Stack",
    image: "/images/social-preview.jpg",
    imageAlt: "Thiago Natale — Desenvolvedor Web Full Stack.",
    address: { city: "Uberaba", region: "MG", country: "BR" },
  },
  accessibility: { skip: "Pular para o conteúdo" },
  preloader: {
    preparing: "Preparando portfólio…",
    ready: "Pronto",
    skip: "PULAR ABERTURA",
  },
  assets: {
    portrait: heroPortrait,
    notebook: "/images/notebook.webp",
    notebookScreen: "/images/portfolio-screen.webp",
  },
  header: {
    name: "",
    subtitle: "",
    home: "#inicio",
    links: [
      { label: "HOME", href: "#inicio" },
      { label: "ATUAÇÃO", href: "#atuacao" },
      { label: "TRAJETÓRIA", href: "#trajetoria" },
      { label: "FORMAÇÃO & PROCESSO", href: "#formacao" },
      { label: "CURRÍCULO", href: "#curriculo" },
    ],
    contact: { label: "VAMOS CONVERSAR", href: "#contato" },
    menu: "MENU",
    close: "FECHAR",
    navigation: "NAVEGAÇÃO",
  },
  hero: {
    eyebrow: ["Desenvolvedor Web Full Stack"],
    greeting: "Olá, sou",
    nameLines: ["THIAGO", "NATALE"],
    role: ["Desenvolvedor Web Full Stack"],
    introduction:
      "Desenvolvo interfaces e aplicações web modernas e responsivas, com foco em clareza de uso, desempenho, e segurança.",
    aside: [
      "Transformando necessidades",
      "em soluções digitais",
      "funcionais e criativas.",
    ],
    stats: [
      {
        value: "04",
        label: ["ANOS", "NA ÁREA DE TI"],
        detail: "Trajetória em TI de setembro de 2022 a setembro de 2026.",
      },
      {
        value: "03",
        label: ["ÁREAS", "DE ATUAÇÃO"],
        detail: "Interfaces, integrações e automação de processos.",
      },
      {
        value: "02",
        label: ["EMPRESAS CONCEITUADAS", "NA TRAJETÓRIA"],
        detail: "Unimed Uberaba e Electric Ink.",
      },
    ],
  },
  areasOfWork: {
    heading: "ÁREAS DE ATUAÇÃO",
    eyebrow: "DA INTERFACE AOS PROCESSOS",
    areas: [
      {
        title: "INTERFACES",
        diagram: "interface" as const,
        outcome: "QUE FACILITAM",
        description:
          "Desenvolvo landing pages e aplicações web para orientar a navegação, facilitar o acesso à informação e a conclusão de tarefas. Interfaces responsivas alinhadas aos objetivos do negócio.",
      },
      {
        title: "INTEGRAÇÕES",
        diagram: "integration" as const,
        outcome: "QUE CONECTAM",
        description:
          "Integro interfaces, APIs e sistemas para conectar dados, consultas e cadastros. Fluxos de informação que dão continuidade às rotinas do negócio.",
      },
      {
        title: "AUTOMAÇÃO",
        diagram: "automation" as const,
        outcome: "QUE SIMPLIFICA",
        description:
          "Automatizo consultas, consolidação de dados e geração de relatórios para reduzir tarefas repetitivas e facilitar a análise de informações.",
      },
    ],
  },
  professionalJourney: {
    heading: "TRAJETÓRIA PROFISSIONAL",
    eyebrow: "DA BASE TÉCNICA À CONSTRUÇÃO WEB",
    introduction:
      "Minha experiência em TI corporativa sustenta o desenvolvimento de interfaces, integrações e automação.",
    experiences: [
      {
        id: "electric-ink",
        company: "ELECTRIC INK",
        companyLines: ["ELECTRIC", "INK"],
        role: "Analista de suporte e TI",
        start: { label: "SET 2024", date: "2024-09" },
        end: { label: "SET 2026", date: "2026-09" },
        location: "Uberaba, MG",
        paragraphs: [
          "ELECTRIC INK SEMPRE: Participação ativa na elaboração, desenvolvimento, implementação e manutenção do ecossistema web do Electric Ink Sempre (primeiro serviço de máquinas de tatuagem por assinatura), composto por landing page e página de abertura de chamados para assistência.",
          " Desenvolvimento e manutenção de aplicações e integrações com JavaScript, TypeScript, React, Node.js, Express.js, Astro.js e APIs REST, com utilização de PostgreSQL, Redis, SQL, Docker.",
          // "Desenvolvimento colaborativo da landing page Electric Ink Sempre e de uma aplicação em React para consultar contratos e abrir chamados via API.",
          // "Iniciativa de refatoração com geração de páginas estáticas (SSG) e design system. Automações em Node.js integradas ao SAP Business One e ao e-commerce, além da implantação do GLPI.",
        ],
        outcome: "INTERFACES, INTEGRAÇÕES E AUTOMAÇÃO",
      },
      {
        id: "unimed",
        company: "UNIMED UBERABA",
        companyLines: ["UNIMED", "UBERABA"],
        role: "Auxiliar de TI",
        start: { label: "SET 2022", date: "2022-09" },
        end: { label: "SET 2024", date: "2024-09" },
        location: "Uberaba, MG",
        paragraphs: [
          "Suporte, gestão de ativos e administração de ambientes corporativos, com Windows Server, Active Directory e GPOs.",
          "Desenvolvimento de scripts para automatizar fluxos e rotinas de TI, conectando conhecimento técnico às necessidades da operação.",
        ],
        outcome: "BASE EM AMBIENTES CORPORATIVOS",
      },
    ],
  },
  // Retained for the future return of the Projects section.
  projects: [
    {
      number: "01",
      name: "ELECTRIC INK SEMPRE",
      category: "LANDING PAGE · ASSINATURAS",
      image: null as string | null,
      href: null as string | null,
      alt: "Landing page do programa de assinatura Electric Ink Sempre.",
      detail:
        "Concepção e desenvolvimento em colaboração para viabilizar o lançamento no prazo.",
      tone: "dark",
    },
    {
      number: "02",
      name: "ASSISTÊNCIA TÉCNICA",
      category: "REACT · INTEGRAÇÃO COM API",
      image: null as string | null,
      href: null as string | null,
      alt: "Página de assistência técnica do programa Electric Ink Sempre.",
      detail:
        "Aplicação React com consulta de contratos via API e abertura de chamados de suporte.",
      tone: "light",
    },
    {
      number: "03",
      name: "REFATORAÇÃO SEMPRE",
      category: "SSG · DESIGN SYSTEM · REACT",
      image: null as string | null,
      href: null as string | null,
      alt: "Refatoração do Electric Ink Sempre com novo design system.",
      detail:
        "Iniciativa própria com SSG, GSAP, fluxo React, persistência em Redis e validação de rotas no Back-end.",
      tone: "dark",
    },
  ],
  background: {
    heading: "FORMAÇÃO & COMPETÊNCIAS",
    education: "FORMAÇÃO",
    skills: "COMPETÊNCIAS",
    process: "PROCESSO DE TRABALHO",
    invitation: ["VAMOS TIRAR", "A SUA IDEIA DO PAPEL."],
  },
  education: [
    {
      title: "Análise e Desenvolvimento de Sistemas",
      institution: "Uniube · Graduação tecnológica",
      period: "2023–2025",
      start: "2023-01",
      end: "2025-07",
    },
    // {
    //   title: "Front-end e back-end",
    //   institution: "DevQuest",
    //   period: null,
    //   start: null,
    //   end: null,
    // },
  ],
  skills: [
    ["HTML", "CSS", "JavaScript", "TypeScript", "React", "Astro"],
    ["Tailwind CSS", "GSAP", "Node.js", "APIs REST"],
    ["PostgreSQL", "Docker", "Redis", "Git"],
  ],
  process: [
    {
      number: "01",
      title: "ENTENDER",
      description: "Objetivos, contexto e requisitos do projeto.",
      icon: "search",
    },
    {
      number: "02",
      title: "PLANEJAR",
      description: "Estrutura, fluxos e decisões de implementação.",
      icon: "idea",
    },
    {
      number: "03",
      title: "CONSTRUIR",
      description: "Interfaces responsivas orientadas ao usuário.",
      icon: "edit",
    },
    {
      number: "04",
      title: "INTEGRAR",
      description: "APIs, dados e serviços conectados à solução.",
      icon: "code",
    },
    {
      number: "05",
      title: "VALIDAR",
      description: "Testes, revisão e preparação para publicação.",
      icon: "send",
    },
  ],
  statement:
    "Interfaces claras, sistemas conectados e atenção a cada etapa da experiência.",
  resume: {
    label: "CURRÍCULO",
    heading: ["MINHA EXPERIÊNCIA,", "EM DETALHES."],
    description: "Consulte minha trajetória, formação e competências no currículo completo.",
    view: "VISUALIZAR CURRÍCULO",
    download: "BAIXAR PDF",
    file: "/documents/thiago-natale-curriculo.pdf",
    filename: "Thiago_Natale_Curriculo.pdf",
  },
  contact: {
    heading: ["VAMOS TRABALHAR", "JUNTOS"],
    description:
      "Tem uma oportunidade profissional ou um projeto web em mente? Vamos conversar sobre como posso contribuir.",
    cta: "CONVERSAR POR E-MAIL",
    linkedinLabel: "Thiago Natale no LinkedIn",
    githubLabel: "Thiago Natale no GitHub",
  },
};

export type Project = (typeof portfolio.projects)[number];
export type Process = (typeof portfolio.process)[number];
export type ServiceArea = (typeof portfolio.areasOfWork.areas)[number];
export type CareerExperience =
  (typeof portfolio.professionalJourney.experiences)[number];

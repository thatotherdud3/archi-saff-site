/* Single source of truth for project pages and their PDF files.
   When Saffron's PDFs arrive, place them in assets/pdfs/ and update pdf below.
   Keep pdf: null until a file is available. */
window.ArchiSaffProjects = Object.freeze([
  {
    id: "archway-markets", number: "001", title: "Archway Markets",
    category: "CULTURAL", location: "LIVERPOOL, UK", year: "TBC",
    description: "Timber Shop is a site-responsive marketplace proposal near St Peter's Tavern on Seel Street in Liverpool. Arched timber construction echoes the existing historic facade, while flexible pop-up stalls and carefully considered natural and artificial lighting support a community market throughout the day and evening. The accompanying technical board explores the glulam structure, materials, an exploded isometric and 1:10 prototype models.",
    // The first page of this PDF is also the project grid's cover.
    pdf: "assets/pdfs/Archway_Markets_Timber_Shop_Web.pdf",
    journalPdfs: [
      { title: "DESIGN JOURNAL", path: "assets/pdfs/5123ASA-Saffron Jones-Design Journal.pdf" },
      { title: "TECHNICAL JOURNAL", path: "assets/pdfs/Tech journal.pdf" }
    ],
    // Not yet supplied as a separately identifiable photography PDF.
    modelPhotographyPdf: null,
    demo: false
  },
  {
    id: "hillside-house", number: "002", title: "Hillside House",
    category: "RESIDENTIAL", location: "MALLORCA, ES", year: "2022",
    description: "Project description and architectural documentation will appear here when the final portfolio is supplied.",
    pdf: null
  },
  {
    id: "courtyard-house", number: "003", title: "Courtyard House",
    category: "RESIDENTIAL", location: "OAXACA, MX", year: "2021",
    description: "Project description and architectural documentation will appear here when the final portfolio is supplied.",
    pdf: null
  },
  {
    id: "harris-county-office", number: "004", title: "Harris County Office",
    category: "WORKPLACE", location: "HOUSTON, US", year: "2020",
    description: "Project description and architectural documentation will appear here when the final portfolio is supplied.",
    pdf: null
  },
  {
    id: "us400-pavilion", number: "005", title: "US400 Pavilion",
    category: "CULTURAL", location: "WASHINGTON, US", year: "2026",
    description: "Project description and architectural documentation will appear here when the final portfolio is supplied.",
    pdf: null
  },
  {
    id: "concrete-terrace", number: "006", title: "Concrete Terrace",
    category: "RESIDENTIAL", location: "LOS ANGELES, US", year: "2019",
    description: "Project description and architectural documentation will appear here when the final portfolio is supplied.",
    pdf: null
  }
]);

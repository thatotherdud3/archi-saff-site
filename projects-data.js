/* Single source of truth for project pages and their PDF files.
   When Saffron's PDFs arrive, place them in assets/pdfs/ and update pdf below.
   Keep pdf: null until a file is available. */
window.ArchiSaffProjects = Object.freeze([
  {
    id: "civic-monolith", number: "001", title: "Civic Monolith",
    category: "CULTURAL", location: "LEÓN, MX", year: "2023",
    description: "Project description and architectural documentation will appear here when the final portfolio is supplied.",
    pdf: "assets/pdfs/reader-demo.pdf", demo: true
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

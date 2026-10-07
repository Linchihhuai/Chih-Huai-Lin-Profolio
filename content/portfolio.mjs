// Public content only. Edit this file, then run npm run build.
// Unknown dates, employers, project results, and contact destinations stay omitted.
export default {
  name: 'Chih-Huai Lin',
  initials: 'CHL',
  role: 'SAP ABAP Developer',
  title: 'Chih-Huai Lin — SAP ABAP Developer',
  description: 'Chih-Huai Lin is an SAP ABAP developer and computer science graduate of Institut Paul Lambin, developing practical skills in embedded systems and robotics.',
  introduction: {
    headline: ['Software.', 'Systems.', 'Curiosity.'],
    kicker: 'Software · Systems · Curiosity',
    summary: 'A computer science background, an ABAP focus, and a growing interest in how software meets hardware.',
    tags: ['SAP ABAP', 'Computer science', 'Exploring embedded systems'],
    note: 'From language to logic.\nFrom software toward hardware.'
  },
  sections: {
    about: 'About',
    experience: 'Experience',
    projects: 'Selected projects',
    education: 'Education & skills',
    contact: 'Contact'
  },
  statements: {
    about: 'From language to logic. From software toward hardware.',
    skills: 'Three connected interests. Different stages of experience.',
    skillsInstruction: 'Select an orbiting planet or a category to explore.'
  },
  about: [
    'I’m Chih-Huai Lin, an SAP ABAP developer and a computer science graduate of Institut Paul Lambin in Brussels, Belgium.',
    'My background also includes Applied English studies in Taiwan and work as an English teacher. Language and software have both been part of my path: different ways of making ideas clear and useful.',
    'Alongside my professional focus on SAP and ABAP, I’m developing practical skills in electronics, microcontrollers, embedded systems, and robotics. I’m interested in the point where code becomes something you can interact with in the physical world.'
  ],
  experience: [
    {
      label: 'Professional focus',
      title: 'SAP ABAP development',
      description: 'My professional work is in SAP ABAP development, supported by a computer science education.',
      technologies: ['SAP', 'ABAP']
    },
    {
      label: 'Earlier experience',
      title: 'English teaching',
      description: 'Before my current work in software, I worked as an English teacher. My background includes Applied English studies in Taiwan.',
      technologies: []
    }
  ],
  projectsIntroduction: 'Personal work, separate from my professional SAP ABAP experience.',
  projects: [
    {
      label: 'Personal project · Web',
      preview: 'portfolio',
      title: 'A professional home on the web',
      summary: 'A focused portfolio connecting my work in enterprise software with my background and developing engineering interests.',
      problem: 'Present a varied professional and academic background clearly, without overstating experience.',
      implementation: 'A static, responsive site with an interactive skills map, accessible motion controls, and content maintained in one data file.',
      contribution: 'Provided the background, content direction, and design brief; implementation developed with AI assistance.',
      technologies: ['HTML', 'CSS', 'JavaScript', 'Node.js'],
      status: 'Implemented',
      evidence: [{ label: 'View source on GitHub', url: 'https://github.com/Linchihhuai/Chih-Huai-Lin-Profolio' }]
    }
  ],
  education: [
    { label: 'Graduate', title: 'Computer science', institution: 'Institut Paul Lambin', location: 'Brussels, Belgium' },
    { label: 'Earlier studies', title: 'Applied English', institution: '', location: 'Taiwan' }
  ],
  skills: [
    {
      key: 'professional', title: 'Professional focus', shortTitle: 'SAP & ABAP',
      words: ['ABAP', 'SAP', 'Professional'],
      description: 'SAP ABAP development is my professional focus, supported by my computer science background.',
      items: ['SAP', 'ABAP']
    },
    {
      key: 'academic', title: 'Academic foundation', shortTitle: 'Computer science',
      words: ['Computer', 'science', 'Foundation'],
      description: 'A computer science graduate of Institut Paul Lambin in Brussels, Belgium, with earlier studies in Applied English in Taiwan.',
      items: ['Computer science']
    },
    {
      key: 'learning', title: 'Developing practical skills', shortTitle: 'Hardware learning',
      words: ['Embedded', 'robotics', 'Learning'],
      description: 'I’m developing practical skills in electronics, microcontrollers, embedded systems, and robotics. This is an area of personal learning alongside my professional software work.',
      items: ['Electronics', 'Microcontrollers', 'Embedded systems', 'Robotics']
    }
  ],
  contact: {
    heading: 'A place to start a conversation.',
    description: 'My public profile and code are on GitHub. I’m interested in connections across software development, learning, and engineering.',
    links: [{ label: 'GitHub', url: 'https://github.com/Linchihhuai', detail: 'View my public profile' }],
    resume: null
  },
  footer: 'Chih-Huai Lin · SAP ABAP Developer',
  siteUrl: 'https://linchihhuai.github.io/Chih-Huai-Lin-Profolio',
  // Editable examples. They are excluded from every public build.
  // Replace the examples with confirmed details, then move them into the
  // corresponding experience / education / projects array above.
  draftExamples: {
    experience: [{
      label: 'DRAFT EXAMPLE — replace before publishing',
      title: 'SAP ABAP Developer',
      employer: 'Example employer',
      dates: 'Add verified dates',
      description: 'Replace this with a factual summary of your role.',
      responsibilities: [
        'Example: develop and maintain ABAP programs for an identified business process.',
        'Example: investigate defects, test changes, and document your contribution.'
      ],
      technologies: ['Replace with verified technologies']
    }],
    education: [{
      label: 'DRAFT EXAMPLE — replace before publishing',
      title: 'Qualification or degree',
      institution: 'Institution name',
      location: 'City, country',
      dates: 'Add verified dates'
    }],
    projects: [{
      label: 'DRAFT EXAMPLE — personal learning project',
      title: 'Microcontroller sensor experiment',
      summary: 'Sample project structure; replace with a project you have actually worked on.',
      problem: 'Describe the practical question or constraint you wanted to investigate.',
      implementation: 'Describe the hardware, firmware, interfaces, and testing you actually used.',
      contribution: 'Describe what you personally designed, built, or tested.',
      technologies: ['Add verified hardware and languages'],
      status: 'Add the actual status; do not imply a completed result.',
      evidence: []
    }]
  }
};

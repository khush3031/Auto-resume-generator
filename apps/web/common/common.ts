export default function renderTemplate(html: string) {
  const data: Record<string, string> = {
    fullName: 'Khushboo Makwana',
    jobTitle: 'Node.js Developer',
    email: 'khush@example.com',
    phone: '+91 9876543210',
    location: 'Ahmedabad',
    summary: 'Experienced developer...',
    
    job1Title: 'Backend Developer',
    job1Company: 'ABC Tech',
    job1Location: 'Ahmedabad',
    job1Start: '2022',
    job1End: 'Present',
    job1Bullet1: 'Built APIs',
    job1Bullet2: 'Improved performance',
    job1Bullet3: 'Handled scaling',

    job2Title: 'Junior Developer',
    job2Company: 'XYZ Ltd',
    job2Location: 'Remote',
    job2Start: '2021',
    job2End: '2022',
    job2Bullet1: 'Worked on UI',
    job2Bullet2: 'Fixed bugs',

    degree: 'B.Tech Computer Science',
    university: 'GTU',
    graduationYear: '2021',

    skill1: 'Node.js',
    skill2: 'React',
    skill3: 'MongoDB',
    skill4: 'TypeScript',
    skill5: 'Docker',

    cert1: 'AWS Certified',
    cert1Issuer: 'Amazon',
    cert1Year: '2023',

    lang1: 'English',
    lang1Level: 'Fluent',
    lang2: 'Hindi',
    lang2Level: 'Native'
  };

  return html.replace(/{{(.*?)}}/g, (_, key) => data[key.trim()] || '');
}
export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
}

export const dummyServices: Service[] = [
  { id: 's1', name: 'Web Development', description: 'Full-stack web application development.', price: 50000000, category: 'Development' },
  { id: 's2', name: 'Mobile App Development', description: 'Native iOS and Android apps.', price: 75000000, category: 'Development' },
  { id: 's3', name: 'UI/UX Design', description: 'User interface and experience design.', price: 25000000, category: 'Design' },
  { id: 's4', name: 'Branding', description: 'Logo, style guide, and brand identity.', price: 30000000, category: 'Design' },
  { id: 's5', name: 'SEO & Marketing', description: 'Search engine optimization and digital marketing campaigns.', price: 20000000, category: 'Marketing' },
];
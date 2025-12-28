import { User, Resource, TeachingRequest, Message } from './types';

export const currentUser: User = {
  id: 'u1',
  name: 'Alex Rivera',
  avatar: 'https://picsum.photos/seed/alex/200/200',
  knows: ['Python', 'SQL', 'Data Visualization'],
  wants: ['Java', 'React', 'TypeScript'],
  credits: 10,
  bio: 'Computer Science student passionate about data and backend development.',
  redeemedResources: [],
  purchaseHistory: []
};

export const peers: User[] = [
  {
    id: 'u2',
    name: 'Sarah Chen',
    avatar: 'https://picsum.photos/seed/sarah/200/200',
    knows: ['Java', 'Spring Boot'],
    wants: ['Python', 'Machine Learning'],
    credits: 12,
    bio: 'Looking to transition from Java enterprise to AI.',
    redeemedResources: [],
    purchaseHistory: []
  },
  {
    id: 'u3',
    name: 'Marcus Bell',
    avatar: 'https://picsum.photos/seed/marcus/200/200',
    knows: ['React', 'CSS', 'Figma'],
    wants: ['Python', 'Node.js'],
    credits: 8,
    bio: 'UI designer diving into full-stack development.',
    redeemedResources: [],
    purchaseHistory: []
  },
  {
    id: 'u4',
    name: 'Elena Sokolov',
    avatar: 'https://picsum.photos/seed/elena/200/200',
    knows: ['Go', 'Docker', 'K8s'],
    wants: ['SQL', 'React'],
    credits: 15,
    bio: 'DevOps enthusiast wanting to learn some frontend.',
    redeemedResources: [],
    purchaseHistory: []
  }
];

export const requests: TeachingRequest[] = [
  {
    id: 'tr1',
    studentId: 'u2',
    studentName: 'Sarah Chen',
    skillNeeded: 'Python',
    reward: 3
  },
  {
    id: 'tr2',
    studentId: 'u3',
    studentName: 'Marcus Bell',
    skillNeeded: 'Node.js',
    reward: 5
  },
  {
    id: 'tr3',
    studentId: 'u4',
    studentName: 'Elena Sokolov',
    skillNeeded: 'SQL',
    reward: 2
  }
];

export const resources: Resource[] = [
  {
    id: 'r1',
    title: 'Advanced React Patterns',
    author: 'Dan Abramov',
    type: 'notes',
    cost: 3,
    category: 'Development',
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    totalRatings: 150,
    enrolled: 1240,
    content: "Mastering React components requires understanding patterns like Render Props, HOCs, and Hooks. This guide covers deep reconciliation and state management strategies..."
  },
  {
    id: 'r2',
    title: 'Deep Learning with Python',
    author: 'Sarah Chen',
    authorId: 'u2',
    type: 'video',
    cost: 5,
    category: 'Data Science',
    thumbnail: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    totalRatings: 85,
    enrolled: 850,
    content: "An introductory course to Neural Networks using TensorFlow and Keras. We build a simple image classifier from scratch using MNIST data..."
  },
  {
    id: 'r3',
    title: 'Java Concurrency Mastery',
    author: 'Tech Academy',
    type: 'guide',
    cost: 4,
    category: 'Software Engineering',
    thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
    rating: 4.7,
    totalRatings: 320,
    enrolled: 2100,
    content: "Understanding threads, executors, and the memory model in Java is critical for high-performance applications. This guide walks through lock-free structures and the Fork/Join framework..."
  },
  {
    id: 'r4',
    title: 'Modern CSS Grid & Flexbox',
    author: 'Marcus Bell',
    authorId: 'u3',
    type: 'video',
    cost: 2,
    category: 'Design',
    thumbnail: 'https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?auto=format&fit=crop&w=800&q=80',
    rating: 4.6,
    totalRatings: 410,
    enrolled: 3400,
    content: "Stop fighting with floats. This video lesson explains how to build complex, responsive layouts with just a few lines of CSS Grid and Flexbox code..."
  }
];

export const initialMessages: { [pairId: string]: Message[] } = {
  'u2': [
    { id: 'm1', senderId: 'u2', text: 'Hey Alex! I saw you know Python. I really need help with a script.', timestamp: Date.now() - 3600000 },
    { id: 'm2', senderId: 'u1', text: "Sure, Sarah! I'm actually looking to learn Java, which I see you're an expert in.", timestamp: Date.now() - 1800000 }
  ]
};
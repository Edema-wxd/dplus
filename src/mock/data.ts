interface Project {
  id: string;
  name: string;
  description: string;
  image: string;
  projectQuote: {
    quote: string;
    role: string;
    company: string;
  };
}

const projects: Project[] = [
  {
    id: "1",
    name: "Project 1",
    description: "Description 1",
    image: "image1.jpg",
    projectQuote: {
      quote: "Quote 1",
      role: "John Doe",
      company: "ABC Company",
    },
  },
];

export default projects;

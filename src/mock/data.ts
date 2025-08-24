type Project = {
  id: string;
  subTitle: string;
  title: string;
  description: string;
  image: string;
  projectTags: string[];
  projectCost: string;
  projectTimeline: string;
  projectQuantity: string;
  client: string;
  outcome: string;
  piecesCreated: string;

  challenge: {
    description: string;
    quote: {
      quote: string;
      role: string;
    };
  };

  projectQuote: {
    quote: string;
    role: string;
    company: string;
  };
};

const projectsData: Project[] = [
  {
    id: "1",
    subTitle: "Project 1",
    title: "Project 1",
    projectTags: ["Tag 1", "Tag 2", "Tag 3"],
    projectCost: "100,000",
    projectTimeline: "10 days",
    projectQuantity: "100",
    description: "Description 1",
    image: "/image1.jpg",

    client: "Fortune 500 Energy Corporation",
    outcome: "₦1.2B Partnership Secured",
    piecesCreated: "25 Unique Items",

    challenge: {
      description:
        "Our client, Nigeria's largest energy corporation, was entering critical negotiations for a ₦1.2 billion joint venture with South African partners. The stakes were enormous, and traditional corporate gifts simply wouldn't suffice for such a momentous occasion. <br/><br/> The challenge was multifaceted: create gifts that would honor South African heritage while representing Nigerian business excellence, demonstrate deep cultural understanding, and position our client as a thoughtful, sophisticated partner worthy of such a significant collaboration. <br/> <br/> With only 8 weeks to execute, we needed to source authentic pieces, ensure cultural accuracy, and deliver an experience that would resonate deeply with South African executives while showcasing the refined taste and serious intentions of our Nigerian client.",
      quote: {
        quote:
          "We needed something extraordinary—gifts that would speak to the soul of South African culture while demonstrating our commitment to this partnership. Failure was not an option.",
        role: "Chief Executive Officer, Client Company",
      },
    },

    projectQuote: {
      quote:
        "We've been working with DSP for over a year now, and we've seen a significant increase in our sales. The team at DSP is always willing to go the extra mile to help us achieve our goals.",
      role: "John Doe",
      company: "ABC Company",
    },
  },
];

export { projectsData };
export type { Project };

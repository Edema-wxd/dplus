import React from "react";
import SubHero from "@/components/portfolio/SubHero";
import CTA from "@/components/portfolio/CTA";
import Quote from "@/components/portfolio/Quote";
import projects from "@/mock/data";
 
import { notFound } from "next/navigation";

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

function page({ params }: { params: { id: string } }) {
  const project = projects.find((project) => project.id === params.id);

  
  if (!project) {
 
  return notFound();
  }


  return (
    <div>
      <SubHero />
      <Quote
        quote="We've been working with DSP for over a year now, and we've seen a
            significant increase in our sales. The team at DSP is always willing
            to go the extra mile to help us achieve our goals."
        role="John Doe"
        company="ABC Company"
      />
      <CTA />
    </div>
  );
}

export default page;

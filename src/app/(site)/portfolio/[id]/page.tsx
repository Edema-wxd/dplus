import React from "react";
import SubHero from "@/components/portfolio/SubHero";
import CTA from "@/components/portfolio/CTA";
import Quote from "@/components/portfolio/Quote";
import Challenge from "@/components/portfolio/Challenge";

import { projectsData } from "@/mock/data";

import { notFound } from "next/navigation";

async function page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = projectsData.find((project) => project.id === id);

  if (!project) {
    return notFound();
  }

  return (
    <div>
      <SubHero
        subTitle={project.subTitle}
        title={project.title}
        description={project.description}
        image={project.image}
        projectTags={project.projectTags}
        projectCost={project.projectCost}
        projectTimeline={project.projectTimeline}
        projectQuantity={project.projectQuantity}
        client={project.client}
        outcome={project.outcome}
        piecesCreated={project.piecesCreated}
      />
      <Challenge challenge={project.challenge} />
      <Quote
        quote={project.projectQuote.quote}
        role={project.projectQuote.role}
        company={project.projectQuote.company}
      />
      <CTA />
    </div>
  );
}

export default page;

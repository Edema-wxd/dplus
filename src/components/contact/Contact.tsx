"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  GiPaperPlane,
  GiMailbox,
  GiOfficeChair,
  GiAlarmClock,
} from "react-icons/gi";
import { FaWhatsapp } from "react-icons/fa";
import { motion } from "framer-motion";

interface ContactFormData {
  firstName: string;
  lastName: string;
  company: string;
  position: string;
  email: string;
  phone: string;
  service: string;
  budget: string;
  timeline: string;
  location: string;
  objectives: string;
  inspiration: string;
}

interface FieldErrors {
  name?: string;
  email?: string;
  message?: string;
}

const EMPTY_FORM: ContactFormData = {
  firstName: "",
  lastName: "",
  company: "",
  position: "",
  email: "",
  phone: "",
  service: "",
  budget: "",
  timeline: "",
  location: "",
  objectives: "",
  inspiration: "",
};

function Contact() {
  const [formData, setFormData] = useState<ContactFormData>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear the relevant server error when the user starts typing
    if (name === "firstName" || name === "lastName") {
      setFieldErrors((prev) => ({ ...prev, name: undefined }));
    } else if (name === "email") {
      setFieldErrors((prev) => ({ ...prev, email: undefined }));
    } else if (name === "objectives") {
      setFieldErrors((prev) => ({ ...prev, message: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFieldErrors({});

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim(),
          email: formData.email,
          phone: formData.phone || undefined,
          company: formData.company || undefined,
          message: formData.objectives,
          position: formData.position || undefined,
          service: formData.service || undefined,
          budget: formData.budget || undefined,
          timeline: formData.timeline || undefined,
          location: formData.location || undefined,
          inspiration: formData.inspiration || undefined,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
        return;
      }

      const data = await res.json().catch(() => ({}));

      if (res.status === 400 && data.errors) {
        setFieldErrors(data.errors as FieldErrors);
        toast.message("Please fix the highlighted fields", { duration: 4000 });
      } else {
        toast.message("Submission Failed", {
          description: "There was an error submitting your form. Please try again.",
          duration: 5000,
        });
      }
    } catch {
      toast.message("Submission Failed", {
        description: "There was an error submitting your form. Please try again.",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <section id="contact-form" className="py-30 bg-background">
        <div className="container mx-auto px-4 flex flex-col items-center justify-center min-h-[40vh] text-center gap-6">
          <div className="w-16 h-16 rounded-full bg-cyan-200 flex items-center justify-center text-3xl">
            <GiPaperPlane className="text-black" />
          </div>
          <h2 className="font-sarlotte text-4xl text-foreground font-normal tracking-tight">
            Thank you — we&apos;ll be in touch
          </h2>
          <p className="text-muted-foreground font-raleway font-light max-w-md leading-relaxed">
            Your inquiry has been received. Our team will review your requirements
            and respond within 24 hours.
          </p>
        </div>
      </section>
    );
  }

  const contactItems = [
    {
      icon: <GiMailbox className=" text-2xl text-dsp-green" />,
      label: "Email",
      value: "hello@de-signplus.com",
      bgColor: "bg-blue-400",
    },
    {
      icon: <FaWhatsapp className=" text-2xl text-black" />,
      label: "WhatsApp",
      value: "+234 812 345 6789",
      bgColor: "bg-green-400",
    },
    {
      icon: <GiOfficeChair className=" text-2xl text-dsp-green" />,
      label: "Office",
      value: "Victoria Island, Lagos, Nigeria",
      bgColor: "bg-red-400",
    },
    {
      icon: <GiAlarmClock className=" text-2xl text-dsp-green" />,
      label: "Response Time",
      value: "Within 24 Hours",
      bgColor: "bg-yellow-400",
    },
  ];

  const budgetOptions = [
    { id: "budget1", value: "15-25M", label: "₦15-25M" },
    { id: "budget2", value: "25-50M", label: "₦25-50M" },
    { id: "budget3", value: "50-100M", label: "₦50-100M" },
    { id: "budget4", value: "100M+", label: "₦100M+" },
  ];

  return (
    <section id="contact-form" className="py-30 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-25 items-start">
          {/* Contact Information */}
          <div className="lg:col-span-1">
            <h2 className="font-sarlotte text-foreground text-4xl lg:text-5xl font-normal mb-8 tracking-tight">
              Share Your Vision
            </h2>
            <p className="text-muted-foreground font-raleway leading-relaxed font-light mb-10">
              Tell us about your objectives, timeline, and the impact you want
              to create. Our team will review your requirements and respond
              within 24 hours with a tailored approach and initial
              recommendations.
            </p>

            <div className="space-y-8">
              {contactItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-5 py-5 border-b border-border"
                >
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center text-lg text-black",
                      item.bgColor
                    )}
                  >
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <div className="text-muted-foreground font-raleway text-xs uppercase tracking-wider mb-1 font-light">
                      {item.label}
                    </div>
                    <div className="text-foreground text-base font-normal">
                      {item.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <form
              onSubmit={handleSubmit}
              className="bg-card p-15 border border-border"
            >
              <div className="text-center mb-12">
                <h3 className="font-sarlotte text-3xl text-foreground font-normal mb-4 tracking-tight">
                  Project Inquiry Form
                </h3>
                <p className="text-muted-foreground font-raleway text-sm font-light">
                  All information provided is strictly confidential
                </p>
              </div>

              {/* Name Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <label
                    htmlFor="firstName"
                    className="block mb-3 text-muted-foreground font-raleway font-light text-sm uppercase tracking-wider"
                  >
                    First Name *
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    className={`w-full font-raleway py-5 bg-transparent border-b text-foreground font-light text-base focus:outline-none transition-colors ${fieldErrors.name ? "border-red-400 focus:border-red-400" : "border-border focus:border-cyan-400"}`}
                  />
                  {fieldErrors.name && (
                    <p className="mt-1.5 text-xs text-red-400 font-raleway">{fieldErrors.name}</p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="lastName"
                    className="block mb-3 text-muted-foreground font-light text-sm uppercase tracking-wider"
                  >
                    Last Name *
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    className={`w-full font-raleway py-5 bg-transparent border-b text-foreground font-light text-base focus:outline-none transition-colors ${fieldErrors.name ? "border-red-400 focus:border-red-400" : "border-border focus:border-cyan-400"}`}
                  />
                </div>
              </div>

              {/* Company Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <label
                    htmlFor="company"
                    className="block mb-3 text-muted-foreground font-light text-sm uppercase tracking-wider"
                  >
                    Company *
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    required
                    className="w-full font-raleway py-5 bg-transparent border-b border-border text-foreground font-light text-base focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                </div>
                <div>
                  <label
                    htmlFor="position"
                    className="block mb-3 text-muted-foreground font-light text-sm uppercase tracking-wider"
                  >
                    Your Position *
                  </label>
                  <input
                    type="text"
                    id="position"
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    required
                    className="w-full font-raleway py-5 bg-transparent border-b border-border text-foreground font-light text-base focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                </div>
              </div>

              {/* Contact Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <label
                    htmlFor="email"
                    className="block mb-3 text-muted-foreground font-light text-sm uppercase tracking-wider"
                  >
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className={`w-full font-raleway py-5 bg-transparent border-b text-foreground font-light text-base focus:outline-none transition-colors ${fieldErrors.email ? "border-red-400 focus:border-red-400" : "border-border focus:border-cyan-400"}`}
                  />
                  {fieldErrors.email && (
                    <p className="mt-1.5 text-xs text-red-400 font-raleway">{fieldErrors.email}</p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="phone"
                    className="block mb-3 text-muted-foreground font-light text-sm uppercase tracking-wider"
                  >
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full font-raleway py-5 bg-transparent border-b border-border text-foreground font-light text-base focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                </div>
              </div>

              {/* Service Interest */}
              <div className="mb-8">
                <label
                  htmlFor="service"
                  className="block mb-3 text-muted-foreground font-light text-sm uppercase tracking-wider"
                >
                  Service Interest *
                </label>
                <select
                  id="service"
                  name="service"
                  value={formData.service}
                  onChange={handleInputChange}
                  required
                  className="w-full font-raleway py-5 bg-transparent border-b border-border text-foreground font-light text-base focus:outline-none focus:border-cyan-400 transition-colors cursor-pointer"
                >
                  <option className="text-black" value="">
                    Select a service...
                  </option>
                  <option className="text-black" value="bespoke-gifts">
                    Bespoke Gift Curation
                  </option>
                  <option className="text-black" value="brand-development">
                    Premium Brand Development
                  </option>
                  <option className="text-black" value="executive-merchandise">
                    Executive Merchandise
                  </option>
                  <option className="text-black" value="strategic-partnerships">
                    Strategic Partnership Gifts
                  </option>
                  <option className="text-black" value="multiple">
                    Multiple Services
                  </option>
                  <option className="text-black" value="consultation">
                    General Consultation
                  </option>
                </select>
              </div>

              {/* Budget Range */}
              <div className="mb-8">
                <label className="block mb-3 text-muted-foreground font-light text-sm uppercase tracking-wider">
                  Project Budget Range (₦) *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  {budgetOptions.map((option) => (
                    <div key={option.id} className="relative">
                      <input
                        type="radio"
                        id={option.id}
                        name="budget"
                        value={option.value}
                        checked={formData.budget === option.value}
                        onChange={handleInputChange}
                        required
                        className="absolute font-raleway opacity-0 w-full h-full cursor-pointer"
                      />
                      <label
                        htmlFor={option.id}
                        className={cn(
                          "block rounded-xl  py-4 px-3 font-raleway bg-transparent border border-border text-center text-xs uppercase tracking-wider cursor-pointer transition-all text-foreground",
                          formData.budget === option.value &&
                            "border-cyan-400 bg-cyan-200 text-black"
                        )}
                      >
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Timeline and Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <label
                    htmlFor="timeline"
                    className="block font-raleway mb-3 text-muted-foreground font-light text-sm uppercase tracking-wider"
                  >
                    Desired Timeline *
                  </label>
                  <select
                    id="timeline"
                    name="timeline"
                    value={formData.timeline}
                    onChange={handleInputChange}
                    required
                    className="w-full font-raleway py-5 bg-transparent border-b border-border text-foreground font-light text-base focus:outline-none focus:border-cyan-400 transition-colors cursor-pointer"
                  >
                    <option className="text-black" value="">
                      Select timeline...
                    </option>
                    <option className="text-black" value="urgent">
                      Urgent (2-4 weeks)
                    </option>
                    <option className="text-black" value="standard">
                      Standard (6-8 weeks)
                    </option>
                    <option className="text-black" value="extended">
                      Extended (3+ months)
                    </option>
                    <option className="text-black" value="flexible">
                      Flexible Timeline
                    </option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="location"
                    className="block mb-3 font-raleway text-muted-foreground font-light text-sm uppercase tracking-wider"
                  >
                    Project Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="e.g. Lagos, Abuja, International"
                    className="w-full font-raleway py-5 bg-transparent border-b border-border text-foreground font-light text-base focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                </div>
              </div>

              {/* Project Objectives */}
              <div className="mb-8">
                <label
                  htmlFor="objectives"
                  className="block mb-3 font-raleway text-muted-foreground font-light text-sm uppercase tracking-wider"
                >
                  Project Objectives & Vision *
                </label>
                <textarea
                  id="objectives"
                  name="objectives"
                  value={formData.objectives}
                  onChange={handleInputChange}
                  placeholder="Please describe your project goals, target audience, cultural considerations, and any specific requirements..."
                  required
                  rows={4}
                  className={`w-full py-5 font-raleway pt-5 bg-transparent border-b text-foreground font-light text-base focus:outline-none transition-colors resize-none ${fieldErrors.message ? "border-red-400 focus:border-red-400" : "border-border focus:border-cyan-400"}`}
                />
                {fieldErrors.message && (
                  <p className="mt-1.5 text-xs text-red-400 font-raleway">{fieldErrors.message}</p>
                )}
              </div>

              {/* Inspiration */}
              <div className="mb-8">
                <label
                  htmlFor="inspiration"
                  className="block mb-3 font-raleway text-muted-foreground font-light text-sm uppercase tracking-wider"
                >
                  Inspiration & References
                </label>
                <textarea
                  id="inspiration"
                  name="inspiration"
                  value={formData.inspiration}
                  onChange={handleInputChange}
                  placeholder="Share any inspiration, previous work you admire, or specific cultural elements you'd like incorporated..."
                  rows={4}
                  className="w-full py-5 font-raleway pt-5 bg-transparent border-b border-border text-foreground font-light text-base focus:outline-none focus:border-cyan-400 transition-colors resize-none"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-cyan-200 text-black py-4 px-12 text-sm font-normal uppercase tracking-wider hover:bg-cyan-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-400/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center space-x-2">
                    <span>Submitting...</span>
                    <motion.div
                      animate={{
                        x: [0, 20, 40, 60, 80],
                        y: [0, -10, -20, -30, -40],
                        rotate: [0, 15, 30, 45, 60],
                        opacity: [1, 0.8, 0.6, 0.4, 0],
                      }}
                      transition={{
                        duration: 2,
                        ease: "easeInOut",
                        repeat: Infinity,
                        repeatType: "loop",
                      }}
                    >
                      <GiPaperPlane className="text-lg" />
                    </motion.div>
                  </div>
                ) : (
                  <>
                    <span>Submit Confidential Inquiry</span> <GiPaperPlane />
                  </>
                )}
              </Button>

              <p className="text-muted-foreground text-xs text-center mt-5 leading-relaxed">
                By submitting this form, you agree to our confidentiality terms.
                We treat all client information with absolute discretion and
                will never share your details without explicit consent.
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Contact;

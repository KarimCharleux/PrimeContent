'use client';

import { motion } from 'framer-motion';

import { useTeamData } from '../hooks/useTeamData';

import TeamCard from './TeamCard';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.2,
            delayChildren: 0.1,
        },
    },
};

export default function AboutUsSection() {
    const { teamMembers, loading, error } = useTeamData();

    if (error) {
        console.error("Erreur lors du chargement de l'équipe:", error);
        return null;
    }

    if (loading) {
        return (
            <section className="py-16 bg-black about-us-section">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 underline-title">
                            À PROPOS DE NOUS
                        </h2>
                    </div>
                    <div className="flex justify-center items-center py-16">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
                    </div>
                </div>
            </section>
        );
    }

    if (!teamMembers || teamMembers.length === 0) {
        return null;
    }

    return (
        <section className="py-16 bg-black about-us-section">
            <div className="max-w-7xl mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4 underline-title">
                        À PROPOS DE NOUS
                    </h2>
                    <p className="text-gray-300 max-w-3xl mx-auto text-lg">
                        Découvrez l&apos;équipe passionnée qui donne vie à vos projets créatifs
                    </p>
                </div>

                <motion.div
                    className="grid grid-cols-2 md:grid-cols-2 gap-4 md:gap-8 max-w-4xl mx-auto"
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-50px' }}
                >
                    {teamMembers.map((member, index) => (
                        <TeamCard
                            key={member.id}
                            imageSrc={member.imagePath}
                            name={member.name}
                            title={member.title}
                            description={member.description}
                            index={index}
                        />
                    ))}
                </motion.div>
            </div>
        </section>
    );
}

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TextPlugin } from 'gsap/TextPlugin';

// Enregistrer les plugins GSAP
if (typeof window !== 'undefined') {
    // S'assurer que les plugins ne sont enregistrés qu'une seule fois
    if (!gsap.plugins?.text) {
        gsap.registerPlugin(ScrollTrigger, TextPlugin);
    }
}

export default gsap;

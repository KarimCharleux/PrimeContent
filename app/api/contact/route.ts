import { Timestamp } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';

import { adminFirestore } from '../../backoffice/lib/firebase';

// Interface pour les données du formulaire de contact
interface ContactFormData {
    nom: string;
    prenom: string;
    email: string;
    telephone?: string;
    message: string;
}

// Fonction de validation des données
function validateContactData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validation du nom
    if (!data.nom || typeof data.nom !== 'string' || data.nom.trim().length < 2) {
        errors.push('Le nom est requis et doit contenir au moins 2 caractères');
    }

    // Validation du prénom
    if (!data.prenom || typeof data.prenom !== 'string' || data.prenom.trim().length < 2) {
        errors.push('Le prénom est requis et doit contenir au moins 2 caractères');
    }

    // Validation de l'email
    if (!data.email || typeof data.email !== 'string') {
        errors.push("L'email est requis");
    } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            errors.push('Veuillez entrer un email valide');
        }
    }

    // Validation du téléphone (optionnel)
    if (data.telephone && typeof data.telephone === 'string' && data.telephone.trim()) {
        const numbersOnly = data.telephone.replace(/\D/g, '');
        if (numbersOnly.length !== 10 || !numbersOnly.startsWith('0')) {
            errors.push('Le numéro de téléphone doit contenir 10 chiffres et commencer par 0');
        }
    }

    // Validation du message
    if (!data.message || typeof data.message !== 'string' || data.message.trim().length < 10) {
        errors.push('Le message est requis et doit contenir au moins 10 caractères');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

export async function POST(request: NextRequest) {
    try {
        // Récupérer les données JSON du formulaire
        const formData: ContactFormData = await request.json();

        // Validation des données
        const { isValid, errors } = validateContactData(formData);

        if (!isValid) {
            return NextResponse.json(
                {
                    error: 'Données invalides',
                    details: errors,
                },
                { status: 400 },
            );
        }

        // Nettoyer et formater les données avec un timestamp sécurisé
        const cleanedData = {
            nom: formData.nom.trim(),
            prenom: formData.prenom.trim(),
            email: formData.email.trim().toLowerCase(),
            telephone: formData.telephone?.trim() || '',
            message: formData.message.trim(),
            status: 'nouveau',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            userAgent: request.headers.get('user-agent') || '',
            ipAddress:
                request.headers.get('x-forwarded-for') ||
                request.headers.get('x-real-ip') ||
                'unknown',
        };

        // Ajouter le message à la collection Firestore avec Firebase Admin
        const docRef = await adminFirestore.collection('contacts').add(cleanedData);

        console.log('✅ Message de contact enregistré:', {
            id: docRef.id,
            nom: cleanedData.nom,
            prenom: cleanedData.prenom,
            email: cleanedData.email,
            timestamp: new Date().toISOString(),
        });

        return NextResponse.json({
            success: true,
            message: 'Votre message a été envoyé avec succès. Nous vous contacterons bientôt.',
            messageId: docRef.id,
        });
    } catch (error: any) {
        console.error("❌ Erreur lors de l'envoi du message de contact:", error);
        console.error("❌ Détails de l'erreur:", {
            code: error.code,
            message: error.message,
            stack: error.stack,
            name: error.name,
        });

        // Gérer différents types d'erreurs
        let errorMessage = "Une erreur est survenue lors de l'envoi du message.";
        let statusCode = 500;

        if (error.code) {
            // Erreurs Firestore spécifiques
            switch (error.code) {
                case 'permission-denied':
                    errorMessage = 'Accès refusé. Veuillez réessayer.';
                    statusCode = 403;
                    break;
                case 'unavailable':
                    errorMessage =
                        'Service temporairement indisponible. Veuillez réessayer plus tard.';
                    statusCode = 503;
                    break;
                case 'deadline-exceeded':
                    errorMessage = "Délai d'attente dépassé. Veuillez réessayer.";
                    statusCode = 408;
                    break;
                case 'invalid-argument':
                    errorMessage = 'Données invalides. Veuillez vérifier votre saisie.';
                    statusCode = 400;
                    break;
                default:
                    errorMessage = 'Erreur technique. Veuillez réessayer.';
            }
        }

        return NextResponse.json(
            {
                error: errorMessage,
                code: error.code || 'unknown',
                message: error.message || 'Aucun détail disponible',
                timestamp: new Date().toISOString(),
            },
            { status: statusCode },
        );
    }
}

// Méthode GET pour tester que l'API fonctionne
export async function GET() {
    return NextResponse.json({
        status: 'API Contact opérationnelle',
        endpoint: '/api/contact',
        methods: ['POST'],
        timestamp: new Date().toISOString(),
    });
}
